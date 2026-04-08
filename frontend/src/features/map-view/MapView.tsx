import { useMemo, useCallback, useState, useEffect, useRef, memo } from 'react';
import {
  ReactFlow,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type Edge,
  type NodeMouseHandler,
  Position,
  MarkerType,
  Handle,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Group, Panel, Separator } from 'react-resizable-panels';
import type { Tab } from '../../App';
import { fetchMapView, addToMap, addChildToWayPoint, removeFromMap, removeChildFromWayPoint, createSubMap, type MapViewResponse, type MapViewItem } from '../../api/client';
import WayPointEditor from '../waypoint-editor/WayPointEditor';


interface MapViewProps {
  projectRoot: string;
  address: string;
  onOpenTab: (tab: Tab) => void;
  onStructureChange?: () => void;
}

interface DetailPanel {
  type: 'waypoint';
  address: string;
}

import { getStatusLabel, getStatusColor } from '../../data/status-labels';

// ===== Custom Nodes =====

function WayPointNode({ data }: { data: {
  label: string; status: string; summary: string; address: string;
  selected?: boolean;
  childCount?: number;
  refCount?: number;
  onNodeSelect: (type: 'waypoint', addr: string) => void;
} }) {
  const color = getStatusColor(data.status);
  const isSelected = data.selected === true;
  const hasChildren = (data.childCount ?? 0) > 0;
  const hasRefs = (data.refCount ?? 0) > 0;

  return (
    <div
      onClick={() => data.onNodeSelect('waypoint', data.address)}
      style={{
        background: isSelected ? '#eef5fb' : '#ffffff',
        border: isSelected ? '2px solid #3a7ca5' : `2px solid ${color}`,
        borderRadius: 8,
        padding: '14px 18px', minWidth: 180,
        boxShadow: isSelected ? '0 0 0 3px rgba(58, 124, 165, 0.25), 0 2px 8px rgba(44, 36, 23, 0.08)' : '0 2px 8px rgba(44, 36, 23, 0.08)',
        cursor: 'pointer', position: 'relative',
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: color, width: 8, height: 8 }} />
      <Handle type="source" position={Position.Right} style={{ background: color, width: 8, height: 8 }} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ background: '#9b8e7e', width: 6, height: 6 }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 14, color: '#3a7ca5' }}>◆</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#2c2417' }}>{data.label}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span style={{
          fontSize: 10, padding: '1px 6px', background: color + '20', color: color,
          borderRadius: 3, fontWeight: 600,
        }}>
          {getStatusLabel(data.status)}
        </span>
      </div>

      {data.summary && (
        <div style={{ fontSize: 10, color: '#6b5d4d', marginTop: 4, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {data.summary}
        </div>
      )}

      {(hasChildren || hasRefs) && (
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          {hasChildren && (
            <span style={{ fontSize: 9, padding: '1px 5px', background: '#e8f0fe', color: '#3a7ca5', borderRadius: 3, fontWeight: 600 }}>
              ↳ {data.childCount}
            </span>
          )}
          {hasRefs && (
            <span style={{ fontSize: 9, padding: '1px 5px', background: '#f5f0e8', color: '#9b8e7e', borderRadius: 3, fontWeight: 600 }}>
              → {data.refCount}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function MapNode({ data }: { data: { label: string; status: string } }) {
  const color = getStatusColor(data.status);
  return (
    <div style={{
      background: '#faf8f5', border: `2px solid ${color}`, borderRadius: 8,
      padding: '12px 18px', minWidth: 160,
      boxShadow: '0 2px 8px rgba(44, 36, 23, 0.06)', cursor: 'pointer',
    }}>
      <Handle type="target" position={Position.Left} style={{ background: color, width: 8, height: 8 }} />
      <Handle type="source" position={Position.Right} style={{ background: color, width: 8, height: 8 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 15 }}>📁</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#2c2417' }}>{data.label}</span>
      </div>
      <div style={{ fontSize: 10, color: '#9b8e7e', marginTop: 4 }}>Map (double-click)</div>
    </div>
  );
}

function RefWayPointNode({ data }: { data: { label: string; status: string; address: string; onNodeSelect: (type: 'waypoint', addr: string) => void } }) {
  const color = getStatusColor(data.status);
  return (
    <div
      onClick={() => data.onNodeSelect('waypoint', data.address)}
      style={{
        background: '#faf8f5', border: `1px dashed ${color}`, borderRadius: 6,
        padding: '8px 14px', minWidth: 140, fontSize: 12,
        color: '#6b5d4d', textAlign: 'center', cursor: 'pointer', opacity: 0.85,
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: color, width: 6, height: 6 }} />
      <span style={{ marginRight: 4, color: '#3a7ca5' }}>◆</span>
      {data.label}
      <div style={{ fontSize: 9, color: '#9b8e7e', marginTop: 2 }}>ref (external)</div>
    </div>
  );
}

function ChildWayPointNode({ data }: { data: { label: string; status: string; summary?: string; address: string; selected?: boolean; onNodeSelect: (type: 'waypoint', addr: string) => void } }) {
  const color = getStatusColor(data.status);
  const isSelected = data.selected === true;
  return (
    <div
      onClick={() => data.onNodeSelect('waypoint', data.address)}
      style={{
        background: isSelected ? '#eef5fb' : '#fff',
        border: isSelected ? '1.5px solid #3a7ca5' : `1.5px solid ${color}`,
        borderRadius: 6,
        padding: '8px 14px', minWidth: 150, fontSize: 11,
        boxShadow: isSelected ? '0 0 0 2px rgba(58, 124, 165, 0.2), 0 1px 4px rgba(44, 36, 23, 0.06)' : '0 1px 4px rgba(44, 36, 23, 0.06)',
        cursor: 'pointer',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: color, width: 6, height: 6 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
        <span style={{ color: '#3a7ca5', fontSize: 10 }}>◆</span>
        <span style={{ fontWeight: 600, color: '#2c2417' }}>{data.label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
        <span style={{ fontSize: 9, padding: '1px 5px', background: color + '20', color, borderRadius: 3, fontWeight: 600 }}>
          {getStatusLabel(data.status)}
        </span>
        <span style={{ fontSize: 9, padding: '1px 5px', background: '#f5f0e8', color: '#9b8e7e', borderRadius: 3 }}>child</span>
      </div>
      {data.summary && (
        <div style={{ fontSize: 9, color: '#6b5d4d', marginTop: 2, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {data.summary}
        </div>
      )}
    </div>
  );
}

const nodeTypes = { waypoint: WayPointNode, mapNode: MapNode, refWaypoint: RefWayPointNode, childWaypoint: ChildWayPointNode };

function buildGraph(
  items: MapViewItem[],
  onNodeSelect: (type: 'waypoint', addr: string) => void,
  selectedNode?: string | null,
  selectedDetail?: string | null,
  childDetails?: Record<string, { status: string; summary: string }>,
): { nodes: Node[]; edges: Edge[] } {
  const ns: Node[] = [];
  const es: Edge[] = [];

  const X_GAP = 240;
  const Y_MAP_ROW = 20;
  const Y_WP_ROW = 140;
  const Y_CHILD_L1 = 300;
  const Y_REF = 300;
  const CHILD_X_GAP = 180;
  const REF_X_GAP = 160;

  const maps = items.filter(it => it.type === 'MAP');
  const waypoints = items.filter(it => it.type === 'WAYPOINT');
  const itemMap = new Map(items.map(it => [it.address, it]));
  const addressXMap: Record<string, number> = {};

  // Row 1: Maps
  maps.forEach((item, i) => {
    const xPos = i * X_GAP;
    const id = item.address;
    addressXMap[id] = xPos;
    ns.push({
      id, type: 'mapNode',
      position: { x: xPos, y: Y_MAP_ROW },
      data: { label: id.split('/').pop() || id, status: item.status, address: item.address },
    });
    if (i > 0) {
      es.push({
        id: `e-map-${maps[i - 1].address}-${id}`,
        source: maps[i - 1].address, target: id,
        markerEnd: { type: MarkerType.ArrowClosed, color: '#d5cdc0' },
        style: { stroke: '#d5cdc0', strokeWidth: 1.5, strokeDasharray: '4 4' },
      });
    }
  });

  // Row 2: WayPoints with child/ref badges
  waypoints.forEach((item, i) => {
    const xPos = i * X_GAP;
    const id = item.address;
    addressXMap[id] = xPos;
    ns.push({
      id, type: 'waypoint',
      position: { x: xPos, y: Y_WP_ROW },
      data: {
        label: id.split('/').pop() || id,
        status: item.status,
        summary: item.summary || '',
        address: item.address,
        selected: selectedNode === item.address,
        childCount: item.children?.length ?? 0,
        refCount: item.references?.length ?? 0,
        onNodeSelect,
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    });
    if (i > 0) {
      es.push({
        id: `e-chain-${waypoints[i - 1].address}-${id}`,
        source: waypoints[i - 1].address, target: id,
        markerEnd: { type: MarkerType.ArrowClosed, color: '#bfb19c' },
        style: { stroke: '#bfb19c', strokeWidth: 2 },
      });
    }
  });

  // Selected node: expand children (max 2 levels) and refs
  if (selectedNode) {
    const selected = itemMap.get(selectedNode);
    if (selected) {
      const parentX = addressXMap[selectedNode] ?? 0;
      const parentCenterX = parentX + 90;

      // Children L1
      const children = selected.children ?? [];
      if (children.length > 0) {
        const startX = parentCenterX - ((children.length - 1) * CHILD_X_GAP) / 2 - 65;
        children.forEach((childAddr, ci) => {
          const childId = `child-${childAddr}`;
          const childLabel = childAddr.split('/').pop() || childAddr;
          const childX = startX + ci * CHILD_X_GAP;

          ns.push({
            id: childId, type: 'childWaypoint',
            position: { x: childX, y: Y_CHILD_L1 },
            data: {
              label: childLabel,
              status: childDetails?.[childAddr]?.status ?? 'S_IDL',
              summary: childDetails?.[childAddr]?.summary ?? '',
              address: childAddr,
              selected: selectedDetail === childAddr,
              onNodeSelect,
            },
          });
          es.push({
            id: `e-child-${selectedNode}-${childAddr}`,
            source: selectedNode, sourceHandle: 'bottom', target: childId,
            type: 'straight',
            markerEnd: { type: MarkerType.ArrowClosed, color: '#3a7ca5' },
            style: { stroke: '#3a7ca5', strokeWidth: 1.5 },
          });
        });
      }

      // References (only for selected, shown beside/below children)
      const refs = selected.references ?? [];
      if (refs.length > 0) {
        const refStartX = parentCenterX + ((children.length > 0 ? children.length : 0) * CHILD_X_GAP) / 2 + 60;
        refs.forEach((refAddr, ri) => {
          const refId = `ref-${refAddr}`;
          const refLabel = refAddr.split('/').pop() || refAddr;
          ns.push({
            id: refId, type: 'refWaypoint',
            position: { x: refStartX + ri * REF_X_GAP, y: Y_REF },
            data: { label: refLabel, status: 'S_IDL', address: refAddr, onNodeSelect },
          });
          es.push({
            id: `e-ref-${selectedNode}-${refAddr}`,
            source: selectedNode, sourceHandle: 'bottom', target: refId,
            type: 'straight',
            markerEnd: { type: MarkerType.ArrowClosed, color: '#3a7ca5' },
            style: { stroke: '#3a7ca5', strokeDasharray: '6 3', opacity: 0.7 },
          });
        });
      }
    }
  }

  return { nodes: ns, edges: es };
}

// Memoized flow chart - preserves viewport on data updates
const FlowChart = memo(({ nodes, edges, onNodeDoubleClick }: {
  nodes: Node[];
  edges: Edge[];
  onNodeDoubleClick: NodeMouseHandler;
}) => {
  const { fitView, getViewport, setViewport } = useReactFlow();
  const initialFit = useRef(false);
  const savedViewport = useRef<{ x: number; y: number; zoom: number } | null>(null);

  useEffect(() => {
    if (nodes.length === 0) return;
    if (!initialFit.current) {
      setTimeout(() => fitView({ padding: 0.3 }), 50);
      initialFit.current = true;
    } else if (savedViewport.current) {
      // Restore viewport after data update
      setTimeout(() => setViewport(savedViewport.current!), 10);
    }
  }, [nodes, fitView, setViewport]);

  // Save viewport before nodes change
  useEffect(() => {
    return () => {
      try { savedViewport.current = getViewport(); } catch { /* noop */ }
    };
  });

  return (
    <ReactFlow
      nodes={nodes} edges={edges} nodeTypes={nodeTypes}
      onNodeDoubleClick={onNodeDoubleClick}
      proOptions={{ hideAttribution: true }}
      style={{ background: '#faf8f5' }}
      minZoom={0.3} maxZoom={2}
    />
  );
});

type AddMode = 'before' | 'after' | 'child';
type DialogMode = 'none' | 'addWaypoint' | 'createSubMap' | 'wpDropdown';

export default function MapView({ projectRoot, address, onOpenTab, onStructureChange }: MapViewProps) {
  const [detail, setDetail] = useState<DetailPanel | null>(null);
  const [mapData, setMapData] = useState<MapViewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [dialogMode, setDialogMode] = useState<DialogMode>('none');
  const [addMode, setAddMode] = useState<AddMode>('after');
  const [inputId, setInputId] = useState('');
  const [inputSummary, setInputSummary] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 5000);
  };

  const reloadMap = useCallback(() => {
    fetchMapView(projectRoot, address)
      .then(setMapData)
      .catch((err) => setError(err.message || 'Failed to load'));
  }, [projectRoot, address]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchMapView(projectRoot, address)
      .then(setMapData)
      .catch((err) => setError(err.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [address]);

  const handleNodeSelect = useCallback((type: 'waypoint', addr: string) => {
    setDetail({ type, address: addr });
    // Only change selectedNode (which controls child/ref expansion) if it's a main-row item
    const isMainItem = mapData?.items.some(it => it.address === addr);
    if (isMainItem) {
      setSelectedNode(addr);
    }
  }, [mapData]);

  const { nodes, edges } = useMemo(() => {
    if (!mapData) return { nodes: [] as Node[], edges: [] as Edge[] };
    return buildGraph(mapData.items, handleNodeSelect, selectedNode, detail?.address, mapData.childDetails);
  }, [mapData, handleNodeSelect, selectedNode, detail?.address]);

  const onNodeDoubleClick: NodeMouseHandler = useCallback((_event, node) => {
    if (node.type === 'mapNode') {
      const data = node.data as { address?: string };
      const addr = data.address || node.id;
      onOpenTab({ id: addr, title: addr, type: 'map', address: addr });
    }
  }, [onOpenTab]);

  const handleAddWaypoint = async () => {
    if (!inputId.trim()) return;
    setSaving(true);
    try {
      let updated: MapViewResponse;

      const summaryVal = inputSummary.trim() || undefined;
      if (addMode === 'child' && selectedNode) {
        updated = await addChildToWayPoint(projectRoot, selectedNode, inputId.trim(), address, summaryVal);
        const childAddr = selectedNode + '/' + inputId.trim();
        showToast(`WayPoint "${childAddr}" 하위 추가 완료. AI에게 내용 작성을 요청하세요.`);
      } else {
        const parentPath = address.substring(4);
        const childAddress = 'W://' + parentPath + '/' + inputId.trim();
        let position: string | undefined;
        if (selectedNode && addMode === 'before') {
          position = 'before:' + selectedNode;
        } else if (selectedNode && addMode === 'after') {
          position = 'after:' + selectedNode;
        }
        updated = await addToMap(projectRoot, address, childAddress, position, summaryVal);
        showToast(`WayPoint "${childAddress}" 생성 완료. AI에게 내용 작성을 요청하세요.`);
      }

      setMapData(updated);
      setDialogMode('none');
      setInputId('');
      setInputSummary('');
      onStructureChange?.();
    } catch (e) {
      showToast('추가 실패: ' + (e instanceof Error ? e.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSubMap = async () => {
    if (!inputId.trim()) return;
    setSaving(true);
    try {
      const updated = await createSubMap(projectRoot, address, inputId.trim(), inputSummary.trim() || undefined);
      setMapData(updated);
      setDialogMode('none');
      setInputId('');
      setInputSummary('');
      const parentPath = address.substring(4);
      showToast(`Map "M://${parentPath}/${inputId.trim()}" 생성 완료. AI에게 내용 작성을 요청하세요.`);
      onStructureChange?.();
    } catch (e) {
      showToast('생성 실패: ' + (e instanceof Error ? e.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveSelected = async () => {
    if (!selectedNode) return;
    if (!confirm(`"${selectedNode}"를 이 Map에서 제거하시겠습니까?`)) return;
    setSaving(true);
    try {
      const updated = await removeFromMap(projectRoot, address, selectedNode);
      setMapData(updated);
      setSelectedNode(null);
      setDetail(null);
      showToast(`"${selectedNode}" 제거 완료.`);
      onStructureChange?.();
    } catch (e) {
      showToast('제거 실패: ' + (e instanceof Error ? e.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveChild = async () => {
    if (!detailAddr || !childParentWp) return;
    if (!confirm(`"${detailAddr}"를 "${childParentWp}"의 하위에서 제거하시겠습니까?`)) return;
    setSaving(true);
    try {
      const updated = await removeChildFromWayPoint(projectRoot, childParentWp, detailAddr, address);
      setMapData(updated);
      setDetail(null);
      showToast(`"${detailAddr}" 하위 제거 완료.`);
      onStructureChange?.();
    } catch (e) {
      showToast('제거 실패: ' + (e instanceof Error ? e.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9b8e7e' }}>Loading...</div>;
  }
  if (error || !mapData) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#b54a3f' }}>Error: {error || 'No data'}</div>;
  }

  const mapLabel = address.split('/').pop() || address;
  const wpCount = mapData.items.filter(it => it.type === 'WAYPOINT').length;
  const mapCount = mapData.items.filter(it => it.type === 'MAP').length;

  // Determine if detail selection is a child (not a main-row item)
  const detailAddr = detail?.address ?? null;
  const isMainItem = detailAddr ? mapData.items.some(it => it.address === detailAddr) : false;
  const isChildSelected = detailAddr != null && !isMainItem;
  // Find parent WP of the selected child
  const childParentWp = isChildSelected && selectedNode ? selectedNode : null;

  const btnStyle: React.CSSProperties = {
    fontSize: 11, padding: '3px 10px', border: '1px solid #d5cdc0', borderRadius: 4,
    background: '#fff', cursor: 'pointer', color: '#2c2417',
  };
  const btnDangerStyle: React.CSSProperties = { ...btnStyle, color: '#b54a3f', borderColor: '#e0b0a8' };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'absolute', top: 48, left: '50%', transform: 'translateX(-50%)', zIndex: 100,
          background: '#2c2417', color: '#fff', padding: '8px 20px', borderRadius: 6,
          fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.2)', maxWidth: '80%', textAlign: 'center',
        }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{
        padding: '8px 16px', borderBottom: '1px solid #e5ddd0', background: '#faf8f5',
        display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
      }}>
        <span style={{ fontSize: 15 }}>📁</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#2c2417' }}>{mapLabel}</span>
        <span style={{ fontSize: 12, color: '#9b8e7e' }}>{address}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <button style={{...btnStyle, opacity: isChildSelected ? 0.4 : 1 }} onClick={() => {
              if (isChildSelected) return;
              if (!selectedNode) {
                setAddMode('after');
                setDialogMode('addWaypoint');
                setInputId('');
                setInputSummary('');
              } else {
                setDialogMode(dialogMode === 'wpDropdown' ? 'none' : 'wpDropdown');
              }
            }} disabled={saving || isChildSelected}>
              + WayPoint {selectedNode && !isChildSelected ? '▾' : ''}
            </button>
            {dialogMode === 'wpDropdown' && selectedNode && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, zIndex: 50,
                background: '#fff', border: '1px solid #d5cdc0', borderRadius: 4,
                boxShadow: '0 4px 12px rgba(0,0,0,0.12)', minWidth: 160,
              }}>
                {(['before', 'after', 'child'] as AddMode[]).map(mode => (
                  <div
                    key={mode}
                    onClick={() => { setAddMode(mode); setDialogMode('addWaypoint'); setInputId(''); setInputSummary(''); }}
                    style={{
                      padding: '6px 12px', fontSize: 12, cursor: 'pointer', color: '#2c2417',
                      borderBottom: mode !== 'child' ? '1px solid #f0ebe3' : 'none',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f5f0e8')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                  >
                    {mode === 'before' ? '↑ 앞에 추가' : mode === 'after' ? '↓ 뒤에 추가' : '↳ 하위(child) 추가'}
                  </div>
                ))}
              </div>
            )}
          </div>
          {isChildSelected ? (
            <button style={btnDangerStyle} onClick={handleRemoveChild} disabled={saving}>
              − child 제거
            </button>
          ) : (
            <button style={btnDangerStyle} onClick={handleRemoveSelected} disabled={!selectedNode || saving}>
              − 제거
            </button>
          )}
          <span style={{ fontSize: 11, color: '#6b5d4d', marginLeft: 8 }}>
            {wpCount} WP, {mapCount} Maps
          </span>
        </div>
      </div>

      {/* Inline Dialog */}
      {dialogMode !== 'none' && (
        <div style={{
          padding: '10px 16px', borderBottom: '1px solid #e5ddd0', background: '#f5f0e8',
          display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
        }}>
          {dialogMode === 'addWaypoint' && (
            <>
              <span style={{
                fontSize: 10, padding: '2px 6px', borderRadius: 3, fontWeight: 600,
                background: addMode === 'child' ? '#e8f0fe' : '#f5f0e8',
                color: addMode === 'child' ? '#3a7ca5' : '#6b5d4d',
              }}>
                {addMode === 'before' ? '↑ 앞' : addMode === 'after' ? '↓ 뒤' : '↳ child'}
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#2c2417' }}>ID:</span>
              <input
                value={inputId} onChange={e => setInputId(e.target.value)}
                placeholder="예: new_feature"
                style={{ width: 140, padding: '4px 8px', border: '1px solid #d5cdc0', borderRadius: 4, fontSize: 12 }}
                autoFocus
              />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#2c2417' }}>설명:</span>
              <input
                value={inputSummary} onChange={e => setInputSummary(e.target.value)}
                placeholder="간단한 설명"
                onKeyDown={e => e.key === 'Enter' && handleAddWaypoint()}
                style={{ flex: 1, maxWidth: 250, padding: '4px 8px', border: '1px solid #d5cdc0', borderRadius: 4, fontSize: 12 }}
              />
              <button style={btnStyle} onClick={handleAddWaypoint} disabled={saving || !inputId.trim()}>확인</button>
              <button style={btnStyle} onClick={() => setDialogMode('none')}>취소</button>
            </>
          )}
          {dialogMode === 'createSubMap' && (
            <>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#2c2417' }}>Map ID:</span>
              <input
                value={inputId} onChange={e => setInputId(e.target.value)}
                placeholder="예: components"
                onKeyDown={e => e.key === 'Enter' && handleCreateSubMap()}
                style={{ width: 150, padding: '4px 8px', border: '1px solid #d5cdc0', borderRadius: 4, fontSize: 12 }}
                autoFocus
              />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#2c2417' }}>Summary:</span>
              <input
                value={inputSummary} onChange={e => setInputSummary(e.target.value)}
                placeholder="간단한 설명"
                onKeyDown={e => e.key === 'Enter' && handleCreateSubMap()}
                style={{ flex: 1, maxWidth: 300, padding: '4px 8px', border: '1px solid #d5cdc0', borderRadius: 4, fontSize: 12 }}
              />
              <button style={btnStyle} onClick={handleCreateSubMap} disabled={saving || !inputId.trim()}>생성</button>
              <button style={btnStyle} onClick={() => setDialogMode('none')}>취소</button>
            </>
          )}
        </div>
      )}
      <div style={{ flex: 1 }}>
        <Group orientation="vertical">
          <Panel defaultSize="55%" minSize="20%">
            <div style={{ width: '100%', height: '100%' }}>
              <ReactFlowProvider>
                <FlowChart
                  nodes={nodes} edges={edges}
                  onNodeDoubleClick={onNodeDoubleClick}
                />
              </ReactFlowProvider>
            </div>
          </Panel>
          <Separator className="resize-handle-h" />
          <Panel defaultSize="45%" minSize="15%">
            {detail ? (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '6px 12px', borderBottom: '1px solid var(--border-light)',
                  background: 'var(--bg-secondary)', flexShrink: 0,
                }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {detail.type === 'waypoint' ? '◆' : '📦'} {detail.address}
                  </span>
                  <button
                    onClick={() => setDetail(null)}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text-muted)' }}
                  >×</button>
                </div>
                <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px' }}>
                  <WayPointEditor projectRoot={projectRoot} address={detail.address} onOpenTab={onOpenTab} />
                </div>
              </div>
            ) : (
              <div style={{
                height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-muted)', fontSize: 13, background: 'var(--bg-surface)',
              }}>
                WayPoint를 클릭하면 상세 정보가 표시됩니다.
              </div>
            )}
          </Panel>
        </Group>
      </div>
    </div>
  );
}
