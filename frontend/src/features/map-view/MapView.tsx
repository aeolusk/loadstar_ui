import { useMemo, useCallback, useState, useEffect, useRef, memo } from 'react';
import {
  Diamond, Folder, ArrowBendDownRight, ArrowRight, ArrowUp, ArrowDown,
  CaretDown, X, Package, Minus,
} from '@phosphor-icons/react';
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
import { fetchMapView, updateMap, addToMap, addChildToWayPoint, removeFromMap, removeChildFromWayPoint, createSubMap, deleteMap, deleteWayPoint, type MapViewResponse, type MapViewItem } from '../../api/client';
import WayPointEditor from '../waypoint-editor/WayPointEditor';
import DataWayPointEditor from '../dwp-editor/DataWayPointEditor';


interface MapViewProps {
  projectRoot: string;
  address: string;
  onOpenTab: (tab: Tab) => void;
  onStructureChange?: () => void;
}

interface DetailPanel {
  type: 'waypoint' | 'dwp' | 'map';
  address: string;
}

import { getStatusLabel, getStatusColor } from '../../data/status-labels';

// ===== Custom Nodes =====

function WayPointNode({ data }: { data: {
  label: string; status: string; summary: string; goal?: string | null; address: string;
  selected?: boolean;
  childCount?: number;
  refCount?: number;
  isDwp?: boolean;
  onNodeSelect: (type: 'waypoint', addr: string) => void;
} }) {
  const color = getStatusColor(data.status);
  const isSelected = data.selected === true;
  const hasChildren = (data.childCount ?? 0) > 0;
  const hasRefs = (data.refCount ?? 0) > 0;
  const isDwp = data.isDwp === true;

  return (
    <div
      onMouseDownCapture={(e) => { if (e.button !== 0) return; data.onNodeSelect('waypoint', data.address); }}
      style={{
        background: isSelected ? '#eef5fb' : '#ffffff',
        border: isSelected ? '2px solid #3a7ca5' : isDwp ? '2px dashed #5a8ab0' : `2px solid ${color}`,
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
        <Diamond size={14} weight={isDwp ? 'fill' : 'regular'} color="#3a7ca5" />
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
      {data.goal && (
        <div style={{ fontSize: 9, color: '#0550ae', marginTop: 3, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: 'italic' }}>
          🎯 {data.goal}
        </div>
      )}

      {(hasChildren || hasRefs) && (
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          {hasChildren && (
            <span style={{ fontSize: 9, padding: '1px 5px', background: '#e8f0fe', color: '#3a7ca5', borderRadius: 3, fontWeight: 600 }}>
              <ArrowBendDownRight size={9} style={{verticalAlign:'middle'}} /> {data.childCount}
            </span>
          )}
          {hasRefs && (
            <span style={{ fontSize: 9, padding: '1px 5px', background: '#f5f0e8', color: '#9b8e7e', borderRadius: 3, fontWeight: 600 }}>
              <ArrowRight size={9} style={{verticalAlign:'middle'}} /> {data.refCount}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function MapNode({ data }: { data: { label: string; status: string; address: string; selected?: boolean; onNodeSelect: (type: 'map', addr: string) => void } }) {
  const color = getStatusColor(data.status);
  const isSelected = data.selected === true;
  return (
    <div
      onMouseDownCapture={(e) => { if (e.button !== 0) return; data.onNodeSelect('map', data.address); }}
      style={{
        background: isSelected ? 'rgba(230, 133, 26, 0.12)' : '#faf8f5',
        border: isSelected ? '2px solid #e6851a' : `2px solid ${color}`,
        borderRadius: 8,
        padding: '12px 18px', minWidth: 160,
        boxShadow: isSelected ? '0 0 0 3px rgba(230, 133, 26, 0.2), 0 2px 8px rgba(44, 36, 23, 0.08)' : '0 2px 8px rgba(44, 36, 23, 0.06)',
        cursor: 'pointer',
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: color, width: 8, height: 8 }} />
      <Handle type="source" position={Position.Right} style={{ background: color, width: 8, height: 8 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Folder size={15} color={isSelected ? '#e6851a' : undefined} />
        <span style={{ fontSize: 13, fontWeight: 600, color: isSelected ? '#e6851a' : '#2c2417' }}>{data.label}</span>
      </div>
      <div style={{ fontSize: 10, color: '#9b8e7e', marginTop: 4 }}>Map (double-click)</div>
    </div>
  );
}

const GROUP_ITEM_W = 155;
const GROUP_ITEM_GAP = 5;

function GroupItemWP({ addr, label, status, summary, selected, onSelect }: {
  addr: string; label: string; status: string; summary: string; selected: boolean;
  onSelect: (addr: string) => void;
}) {
  const color = getStatusColor(status);
  return (
    <div
      onMouseDownCapture={(e) => { if (e.button !== 0) return; onSelect(addr); }}
      style={{
        width: GROUP_ITEM_W, padding: '7px 10px', borderRadius: 6, cursor: 'pointer',
        border: selected ? '1.5px solid #3a7ca5' : `1.5px solid ${color}`,
        background: selected ? '#eef5fb' : '#fff',
        boxShadow: selected ? '0 0 0 2px rgba(58,124,165,0.18)' : '0 1px 3px rgba(44,36,23,0.06)',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
        <Diamond size={10} color="#3a7ca5" />
        <span style={{ fontSize: 11, fontWeight: 600, color: '#2c2417', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: GROUP_ITEM_W - 30 }}>{label}</span>
      </div>
      <span style={{ fontSize: 9, padding: '1px 5px', background: color + '20', color, borderRadius: 3, fontWeight: 600 }}>
        {getStatusLabel(status)}
      </span>
      {summary && (
        <div style={{ fontSize: 9, color: '#6b5d4d', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: GROUP_ITEM_W - 20 }}>
          {summary}
        </div>
      )}
    </div>
  );
}

function GroupBoxNode({ data }: { data: {
  children: Array<{ addr: string; label: string; status: string; summary: string; selected: boolean }>;
  refs: Array<{ addr: string; label: string; status: string }>;
  onNodeSelect: (type: 'waypoint' | 'map', addr: string) => void;
} }) {
  const hasChildren = data.children.length > 0;
  const hasRefs = data.refs.length > 0;
  return (
    <div style={{
      border: '1.5px solid #d5cdc0', borderRadius: 10, background: '#fdfcfb',
      padding: 12, boxShadow: '0 2px 10px rgba(44,36,23,0.07)',
    }}>
      {hasChildren && (
        <>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#9b8e7e', marginBottom: 6, letterSpacing: '0.8px', textTransform: 'uppercase' as const }}>Children</div>
          <div style={{ display: 'flex', gap: GROUP_ITEM_GAP }}>
            {data.children.map(c => (
              <GroupItemWP key={c.addr} {...c} onSelect={(a) => data.onNodeSelect('waypoint', a)} />
            ))}
          </div>
        </>
      )}
      {hasChildren && hasRefs && <div style={{ borderTop: '1px solid #e5ddd0', margin: '10px 0' }} />}
      {hasRefs && (
        <>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#9b8e7e', marginBottom: 6, letterSpacing: '0.8px', textTransform: 'uppercase' as const }}>References</div>
          <div style={{ display: 'flex', gap: GROUP_ITEM_GAP }}>
            {data.refs.map(r => (
              <GroupItemWP key={r.addr} addr={r.addr} label={r.label} status={r.status} summary="" selected={false}
                onSelect={(a) => data.onNodeSelect('waypoint', a)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const nodeTypes = { waypoint: WayPointNode, mapNode: MapNode, groupBox: GroupBoxNode };

// ===== Map GOAL panel (shown in bottom panel when a sub-map node is selected) =====
function MapGoalPanel({ projectRoot, address, onSaved, showToast }: {
  projectRoot: string; address: string;
  onSaved: () => void; showToast: (msg: string) => void;
}) {
  const [mapInfo, setMapInfo] = useState<{ summary: string; goal: string | null } | null>(null);
  const [editGoal, setEditGoal] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMapView(projectRoot, address)
      .then(res => {
        setMapInfo({ summary: res.map.summary, goal: res.map.goal ?? null });
        setEditGoal(res.map.goal ?? '');
        setEditSummary(res.map.summary ?? '');
      })
      .catch(() => setMapInfo(null));
  }, [projectRoot, address]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateMap(projectRoot, address, editSummary, editGoal || null);
      setMapInfo({ summary: editSummary, goal: editGoal || null });
      setEditing(false);
      onSaved();
      showToast('Map 정보 저장 완료');
    } catch (e) {
      showToast('저장 실패: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setSaving(false);
    }
  };

  const s2 = {
    label: { fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 } as React.CSSProperties,
    value: { fontSize: 13, color: 'var(--text-primary)', marginBottom: 8 } as React.CSSProperties,
    input: { width: '100%', padding: '4px 8px', border: '1px solid var(--border-medium)', borderRadius: 4, fontSize: 13, fontFamily: 'inherit', background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none' } as React.CSSProperties,
    textarea: { width: '100%', padding: '6px 8px', border: '1px solid var(--border-medium)', borderRadius: 4, fontSize: 13, fontFamily: 'inherit', background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical' as const, minHeight: 60 } as React.CSSProperties,
    btn: { padding: '2px 8px', border: '1px solid var(--border-medium)', borderRadius: 3, background: 'var(--bg-surface)', fontSize: 11, cursor: 'pointer', color: 'var(--text-secondary)' } as React.CSSProperties,
    btnPrimary: { padding: '2px 8px', border: '1px solid var(--accent-primary)', borderRadius: 3, background: 'var(--accent-bg)', fontSize: 11, cursor: 'pointer', color: 'var(--accent-primary)', fontWeight: 600 } as React.CSSProperties,
  };

  if (!mapInfo) return <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Loading...</div>;

  return (
    <div style={{ fontSize: 13 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, borderBottom: '1px solid var(--border-light)', paddingBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>MAP IDENTITY</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {editing ? (
            <>
              <button style={s2.btnPrimary} onClick={handleSave} disabled={saving}>Save</button>
              <button style={s2.btn} onClick={() => { setEditing(false); setEditGoal(mapInfo.goal ?? ''); setEditSummary(mapInfo.summary ?? ''); }}>Cancel</button>
            </>
          ) : (
            <button style={s2.btn} onClick={() => setEditing(true)}>Edit</button>
          )}
        </div>
      </div>
      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <div style={s2.label}>Summary</div>
            <input style={s2.input} value={editSummary} onChange={e => setEditSummary(e.target.value)} />
          </div>
          <div>
            <div style={s2.label}>Goal</div>
            <textarea style={s2.textarea} value={editGoal} onChange={e => setEditGoal(e.target.value)} placeholder="이 Map이 달성해야 할 의도 (선택)" />
          </div>
        </div>
      ) : (
        <>
          <div style={s2.label}>Summary</div>
          <div style={s2.value}>{mapInfo.summary || '-'}</div>
          <div style={s2.label}>Goal</div>
          <div style={{ fontSize: 13, color: mapInfo.goal ? '#0550ae' : 'var(--text-muted)', fontStyle: 'italic' }}>
            {mapInfo.goal || '(미지정)'}
          </div>
        </>
      )}
    </div>
  );
}

function buildGraph(
  items: MapViewItem[],
  onNodeSelect: (type: 'waypoint' | 'map', addr: string) => void,
  selectedNode?: string | null,
  selectedDetail?: string | null,
  childDetails?: Record<string, { status: string; summary: string }>,
): { nodes: Node[]; edges: Edge[] } {
  const ns: Node[] = [];
  const es: Edge[] = [];

  const X_GAP = 240;
  const Y_MAP_ROW = 20;
  const Y_WP_ROW = 140;
  const Y_DWP_ROW = 300;

  const maps = items.filter(it => it.type === 'MAP');
  const waypoints = items.filter(it => it.type === 'WAYPOINT');
  const dwps = items.filter(it => it.type === 'DWP');
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
      data: { label: id.split('/').pop() || id, status: item.status, address: item.address, selected: selectedNode === id, onNodeSelect },
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
        goal: item.goal,
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

  // Selected node: show children + refs in a single GroupBox
  if (selectedNode) {
    const selected = itemMap.get(selectedNode);
    if (selected) {
      const parentX = addressXMap[selectedNode] ?? 0;
      const parentCenterX = parentX + 90;

      const children = selected.children ?? [];
      const refs = selected.references ?? [];

      if (children.length > 0 || refs.length > 0) {
        const childRowW = children.length > 0 ? GROUP_ITEM_W * children.length + GROUP_ITEM_GAP * (children.length - 1) : 0;
        const refRowW = refs.length > 0 ? GROUP_ITEM_W * refs.length + GROUP_ITEM_GAP * (refs.length - 1) : 0;
        const boxW = Math.max(childRowW, refRowW, 180) + 24;

        const childrenData = children.map(addr => ({
          addr,
          label: addr.split('/').pop() || addr,
          status: childDetails?.[addr]?.status ?? 'S_IDL',
          summary: childDetails?.[addr]?.summary ?? '',
          selected: selectedDetail === addr,
        }));

        const refsData = refs.map(addr => ({
          addr,
          label: addr.split('/').pop() || addr,
          status: 'S_IDL',
        }));

        ns.push({
          id: `groupbox-${selectedNode}`,
          type: 'groupBox',
          position: { x: parentCenterX - boxW / 2, y: Y_WP_ROW + 130 },
          data: { children: childrenData, refs: refsData, onNodeSelect },
          draggable: false,
        });
      }
    }
  }

  // Row 3: DWP items
  dwps.forEach((item, i) => {
    const id = item.address;
    addressXMap[id] = i * X_GAP;
    ns.push({
      id, type: 'waypoint',
      position: { x: i * X_GAP, y: Y_DWP_ROW },
      data: {
        label: id.split('/').pop() || id,
        status: item.status,
        summary: item.summary || '',
        address: item.address,
        selected: selectedNode === id,
        isDwp: true,
        onNodeSelect,
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    });
  });

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
      nodeDragThreshold={5}
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

  // GOAL inline edit for current map
  const [editingGoal, setEditingGoal] = useState<string | null>(null); // null = not editing, string = editing
  const [goalSaving, setGoalSaving] = useState(false);

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

  const handleNodeSelect = useCallback((type: 'waypoint' | 'map', addr: string) => {
    if (type === 'waypoint') {
      const detailType: 'waypoint' | 'dwp' = addr.startsWith('D://') ? 'dwp' : 'waypoint';
      setDetail({ type: detailType, address: addr });
    } else if (type === 'map') {
      setDetail({ type: 'map', address: addr });
    }
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
    } else if (node.type === 'waypoint') {
      const data = node.data as { address?: string };
      const addr = data.address || node.id;
      if (addr.startsWith('D://')) {
        onOpenTab({ id: addr, title: addr.split('/').pop() || addr, type: 'dwp', address: addr });
      } else {
        onOpenTab({ id: addr, title: addr.split('/').pop() || addr, type: 'waypoint', address: addr });
      }
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
    const nodeType = mapData?.items.find(it => it.address === selectedNode)?.type;
    const isWp = nodeType === 'WAYPOINT';
    if (!confirm(`"${selectedNode}"를 ${isWp ? '삭제' : '이 Map에서 제거'}하시겠습니까?`)) return;
    setSaving(true);
    try {
      if (isWp) {
        const result = await deleteWayPoint(projectRoot, selectedNode);
        if (!result.success) throw new Error(result.error || '삭제 실패');
        reloadMap();
      } else {
        const updated = await removeFromMap(projectRoot, address, selectedNode);
        setMapData(updated);
      }
      setSelectedNode(null);
      setDetail(null);
      showToast(`"${selectedNode}" ${isWp ? '삭제' : '제거'} 완료.`);
      onStructureChange?.();
    } catch (e) {
      showToast('실패: ' + (e instanceof Error ? e.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const saveGoal = async (addr: string, newGoal: string) => {
    setGoalSaving(true);
    try {
      await updateMap(projectRoot, addr, undefined, newGoal || null);
      // Refresh map data so GOAL is reflected
      const updated = await fetchMapView(projectRoot, address);
      setMapData(updated);
      showToast('GOAL 저장 완료');
    } catch (e) {
      showToast('GOAL 저장 실패: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setGoalSaving(false);
      setEditingGoal(null);
    }
  };

  const handleDeleteMap = async () => {
    const targetMap = selectedNode && mapData?.items.find(it => it.address === selectedNode && it.type === 'MAP');
    const targetAddr = targetMap ? selectedNode! : address;

    // WP 존재 여부 먼저 확인
    let wpCount: number;
    if (targetAddr === address) {
      wpCount = mapData?.map.waypoints?.length ?? 0;
    } else {
      try {
        const targetData = await fetchMapView(projectRoot, targetAddr);
        wpCount = targetData.map.waypoints?.length ?? 0;
      } catch {
        wpCount = 0;
      }
    }
    if (wpCount > 0) {
      showToast(`삭제 불가: WayPoint ${wpCount}개가 존재합니다. 먼저 제거하세요.`);
      return;
    }

    if (!confirm(`"${targetAddr}" MAP을 삭제하시겠습니까?`)) return;
    setSaving(true);
    try {
      const result = await deleteMap(projectRoot, targetAddr);
      if (result.success) {
        onStructureChange?.();
        if (targetAddr === address) {
          window.location.reload();
        } else {
          reloadMap();
          setSelectedNode(null);
        }
      } else {
        showToast(result.error || '삭제 실패');
      }
    } catch (e) {
      showToast('삭제 실패: ' + (e instanceof Error ? e.message : String(e)));
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
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Folder size={15} />
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
              + WayPoint {selectedNode && !isChildSelected ? <CaretDown size={10} style={{verticalAlign:'middle'}} /> : ''}
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
                    {mode === 'before' ? <><ArrowUp size={11} style={{verticalAlign:'middle'}} /> 앞에 추가</> : mode === 'after' ? <><ArrowDown size={11} style={{verticalAlign:'middle'}} /> 뒤에 추가</> : <><ArrowBendDownRight size={11} style={{verticalAlign:'middle'}} /> 하위(child) 추가</>}
                  </div>
                ))}
              </div>
            )}
          </div>
          {isChildSelected ? (
            <button style={btnDangerStyle} onClick={handleRemoveChild} disabled={saving}>
              <Minus size={11} style={{verticalAlign:'middle'}} /> child 제거
            </button>
          ) : (
            <button style={btnDangerStyle} onClick={handleRemoveSelected} disabled={!selectedNode || saving}>
              <Minus size={11} style={{verticalAlign:'middle'}} /> 제거
            </button>
          )}
          <button style={{ ...btnDangerStyle, opacity: 0.85 }} onClick={handleDeleteMap} disabled={saving} title="MAP 물리 삭제">
            MAP 삭제
          </button>
          <span style={{ fontSize: 11, color: '#6b5d4d', marginLeft: 8 }}>
            {wpCount} WP, {mapCount} Maps
          </span>
        </div>
        </div>

        {/* GOAL row for current map */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginTop: 5 }}>
          <span style={{ fontSize: 10, color: '#9b8e7e', whiteSpace: 'nowrap', paddingTop: 2 }}>🎯 GOAL</span>
          {editingGoal !== null ? (
            <>
              <input
                autoFocus
                value={editingGoal}
                onChange={e => setEditingGoal(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') saveGoal(address, editingGoal);
                  if (e.key === 'Escape') setEditingGoal(null);
                }}
                style={{ flex: 1, fontSize: 12, padding: '1px 6px', border: '1px solid #d5cdc0', borderRadius: 4, fontFamily: 'inherit' }}
              />
              <button onClick={() => saveGoal(address, editingGoal)} disabled={goalSaving}
                style={{ ...btnStyle, fontSize: 10, padding: '1px 8px' }}>저장</button>
              <button onClick={() => setEditingGoal(null)}
                style={{ ...btnStyle, fontSize: 10, padding: '1px 8px' }}>취소</button>
            </>
          ) : (
            <span
              onClick={() => setEditingGoal(mapData?.map.goal ?? '')}
              style={{ fontSize: 12, color: mapData?.map.goal ? '#0550ae' : '#c0b8b0', fontStyle: 'italic', cursor: 'pointer', flex: 1 }}
              title="클릭하여 편집"
            >
              {mapData?.map.goal || '(미지정) — 클릭하여 입력'}
            </span>
          )}
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
                {addMode === 'before' ? <><ArrowUp size={10} style={{verticalAlign:'middle'}} /> 앞</> : addMode === 'after' ? <><ArrowDown size={10} style={{verticalAlign:'middle'}} /> 뒤</> : <><ArrowBendDownRight size={10} style={{verticalAlign:'middle'}} /> child</>}
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
                    {detail.type === 'dwp' ? <Diamond size={12} weight="fill" style={{verticalAlign:'middle'}} /> : detail.type === 'waypoint' ? <Diamond size={12} style={{verticalAlign:'middle'}} /> : <Package size={12} style={{verticalAlign:'middle'}} />} {detail.address}
                  </span>
                  <button
                    onClick={() => setDetail(null)}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text-muted)' }}
                  ><X size={14} /></button>
                </div>
                <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px' }}>
                  {detail.type === 'dwp'
                    ? <DataWayPointEditor projectRoot={projectRoot} address={detail.address} onOpenTab={onOpenTab} />
                    : detail.type === 'map'
                    ? <MapGoalPanel projectRoot={projectRoot} address={detail.address} onSaved={reloadMap} showToast={showToast} />
                    : <WayPointEditor projectRoot={projectRoot} address={detail.address} onOpenTab={onOpenTab} />
                  }
                </div>
              </div>
            ) : (
              <div style={{
                height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-muted)', fontSize: 13, background: 'var(--bg-surface)',
              }}>
                WayPoint 또는 Map을 클릭하면 상세 정보가 표시됩니다.
              </div>
            )}
          </Panel>
        </Group>
      </div>

    </div>
  );
}
