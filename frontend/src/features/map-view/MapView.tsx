import { useMemo, useCallback, useState, useEffect } from 'react';
import {
  ReactFlow,
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
import { fetchMapView, type MapViewResponse, type MapViewItem } from '../../api/client';
import WayPointEditor from '../waypoint-editor/WayPointEditor';
import BlackBoxEditor from '../blackbox-editor/BlackBoxEditor';

interface MapViewProps {
  projectRoot: string;
  address: string;
  onOpenTab: (tab: Tab) => void;
}

interface DetailPanel {
  type: 'waypoint' | 'blackbox';
  address: string;
}

const statusColors: Record<string, string> = {
  S_IDL: '#9b8e7e', S_PRG: '#3a7ca5', S_STB: '#5a8a5e', S_ERR: '#b54a3f', S_REV: '#c47f17',
};
const statusLabels: Record<string, string> = {
  S_IDL: 'Idle', S_PRG: 'In Progress', S_STB: 'Stable', S_ERR: 'Error', S_REV: 'Review',
};

// ===== Custom Nodes =====

function WayPointNode({ data }: { data: {
  label: string; status: string; summary: string;
  hasBlackbox: boolean; blackboxAddr: string;
  onBlackboxClick: (addr: string) => void;
} }) {
  const color = statusColors[data.status] || statusColors.S_IDL;

  return (
    <div style={{
      background: '#ffffff', border: `2px solid ${color}`, borderRadius: 8,
      padding: '14px 18px', minWidth: 180,
      boxShadow: '0 2px 8px rgba(44, 36, 23, 0.08)', cursor: 'pointer', position: 'relative',
    }}>
      <Handle type="target" position={Position.Left} style={{ background: color, width: 8, height: 8 }} />
      <Handle type="source" position={Position.Right} style={{ background: color, width: 8, height: 8 }} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ background: '#9b8e7e', width: 6, height: 6 }} />

      {data.hasBlackbox && (
        <div
          onClick={(e) => { e.stopPropagation(); data.onBlackboxClick(data.blackboxAddr); }}
          title={`BlackBox: ${data.blackboxAddr}`}
          style={{
            position: 'absolute', top: -8, right: -8,
            width: 22, height: 22, background: '#f3efe8', border: '1px solid #bfb19c',
            borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#e8e0d4'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#f3efe8'; }}
        >&#128230;</div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 14, color: '#3a7ca5' }}>&#9670;</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#2c2417' }}>{data.label}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span style={{
          fontSize: 10, padding: '1px 6px', background: color + '20', color: color,
          borderRadius: 3, fontWeight: 600,
        }}>
          {statusLabels[data.status] || data.status}
        </span>
      </div>

      {data.summary && (
        <div style={{ fontSize: 10, color: '#6b5d4d', marginTop: 4, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {data.summary}
        </div>
      )}
    </div>
  );
}

function MapNode({ data }: { data: { label: string; status: string } }) {
  const color = statusColors[data.status] || statusColors.S_IDL;
  return (
    <div style={{
      background: '#faf8f5', border: `2px solid ${color}`, borderRadius: 8,
      padding: '12px 18px', minWidth: 160,
      boxShadow: '0 2px 8px rgba(44, 36, 23, 0.06)', cursor: 'pointer',
    }}>
      <Handle type="target" position={Position.Left} style={{ background: color, width: 8, height: 8 }} />
      <Handle type="source" position={Position.Right} style={{ background: color, width: 8, height: 8 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 15 }}>&#128193;</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#2c2417' }}>{data.label}</span>
      </div>
      <div style={{ fontSize: 10, color: '#9b8e7e', marginTop: 4 }}>Map (double-click)</div>
    </div>
  );
}

function RefWayPointNode({ data }: { data: { label: string; status: string } }) {
  const color = statusColors[data.status] || statusColors.S_IDL;
  return (
    <div style={{
      background: '#faf8f5', border: `1px dashed ${color}`, borderRadius: 6,
      padding: '8px 14px', minWidth: 140, fontSize: 12,
      color: '#6b5d4d', textAlign: 'center', cursor: 'pointer', opacity: 0.85,
    }}>
      <Handle type="target" position={Position.Top} style={{ background: color, width: 6, height: 6 }} />
      <span style={{ marginRight: 4, color: '#3a7ca5' }}>&#9670;</span>
      {data.label}
      <div style={{ fontSize: 9, color: '#9b8e7e', marginTop: 2 }}>ref (external)</div>
    </div>
  );
}

const nodeTypes = { waypoint: WayPointNode, mapNode: MapNode, refWaypoint: RefWayPointNode };

function buildGraph(
  items: MapViewItem[],
  handleBlackboxClick: (addr: string) => void,
): { nodes: Node[]; edges: Edge[] } {
  const ns: Node[] = [];
  const es: Edge[] = [];

  const X_GAP = 240;
  const Y_CHAIN = 50;
  const Y_REF = 230;

  const addressXMap: Record<string, number> = {};
  const refNodeSet = new Set<string>();
  const allAddresses = new Set(items.map(it => it.address));

  items.forEach((item, i) => {
    const xPos = i * X_GAP;
    const id = item.address;
    const label = id.split('/').pop() || id;
    addressXMap[id] = xPos;

    if (item.type === 'MAP') {
      ns.push({
        id, type: 'mapNode',
        position: { x: xPos, y: Y_CHAIN },
        data: { label, status: item.status, address: item.address },
      });
    } else {
      ns.push({
        id, type: 'waypoint',
        position: { x: xPos, y: Y_CHAIN },
        data: {
          label, status: item.status, summary: item.summary || '',
          address: item.address,
          hasBlackbox: !!item.blackbox,
          blackboxAddr: item.blackbox || '',
          onBlackboxClick: handleBlackboxClick,
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      });
    }

    // Chain edges
    if (i > 0) {
      es.push({
        id: `e-chain-${items[i - 1].address}-${id}`,
        source: items[i - 1].address, target: id,
        markerEnd: { type: MarkerType.ArrowClosed, color: '#bfb19c' },
        style: { stroke: '#bfb19c', strokeWidth: 2 },
      });
    }
  });

  // Reference edges
  items.forEach((item) => {
    if (item.type !== 'WAYPOINT' || !item.references) return;

    item.references.forEach((refAddr) => {
      if (allAddresses.has(refAddr)) {
        // Same map: direct edge
        es.push({
          id: `e-ref-${item.address}-${refAddr}`,
          source: item.address, sourceHandle: 'bottom', target: refAddr,
          type: 'default',
          markerEnd: { type: MarkerType.ArrowClosed, color: '#3a7ca5' },
          style: { stroke: '#3a7ca5', strokeWidth: 1.5, strokeDasharray: '6 3' },
          animated: true,
        });
      } else {
        // External ref node
        if (!refNodeSet.has(refAddr)) {
          const refLabel = refAddr.split('/').pop() || refAddr;
          const sourceX = addressXMap[item.address] ?? 0;
          ns.push({
            id: `ref-${refAddr}`, type: 'refWaypoint',
            position: { x: sourceX + 15, y: Y_REF },
            data: { label: refLabel, status: 'S_IDL', address: refAddr },
          });
          refNodeSet.add(refAddr);
        }
        es.push({
          id: `e-ref-${item.address}-${refAddr}`,
          source: item.address, sourceHandle: 'bottom', target: `ref-${refAddr}`,
          type: 'straight',
          markerEnd: { type: MarkerType.ArrowClosed, color: '#3a7ca5' },
          style: { stroke: '#3a7ca5', strokeDasharray: '6 3', opacity: 0.7 },
        });
      }
    });
  });

  return { nodes: ns, edges: es };
}

export default function MapView({ projectRoot, address, onOpenTab }: MapViewProps) {
  const [detail, setDetail] = useState<DetailPanel | null>(null);
  const [mapData, setMapData] = useState<MapViewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchMapView(projectRoot, address)
      .then(setMapData)
      .catch((err) => setError(err.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [address]);

  const handleBlackboxClick = useCallback((bbAddr: string) => {
    setDetail({ type: 'blackbox', address: bbAddr });
  }, []);

  const { nodes, edges } = useMemo(() => {
    if (!mapData) return { nodes: [] as Node[], edges: [] as Edge[] };
    return buildGraph(mapData.items, handleBlackboxClick);
  }, [mapData, handleBlackboxClick]);

  const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    if (node.type === 'mapNode') return;
    const data = node.data as { address?: string };
    const addr = data.address || node.id;
    setDetail({ type: 'waypoint', address: addr });
  }, []);

  const onNodeDoubleClick: NodeMouseHandler = useCallback((_event, node) => {
    if (node.type === 'mapNode') {
      const data = node.data as { address?: string };
      const addr = data.address || node.id;
      onOpenTab({ id: addr, title: addr, type: 'map', address: addr });
    }
  }, [onOpenTab]);

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9b8e7e' }}>Loading...</div>;
  }
  if (error || !mapData) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#b54a3f' }}>Error: {error || 'No data'}</div>;
  }

  const mapLabel = address.split('/').pop() || address;
  const wpCount = mapData.items.filter(it => it.type === 'WAYPOINT').length;
  const mapCount = mapData.items.filter(it => it.type === 'MAP').length;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '8px 16px', borderBottom: '1px solid #e5ddd0', background: '#faf8f5',
        display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
      }}>
        <span style={{ fontSize: 15 }}>&#128193;</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#2c2417' }}>{mapLabel}</span>
        <span style={{ fontSize: 12, color: '#9b8e7e' }}>{address}</span>
        <span style={{ fontSize: 11, color: '#6b5d4d', marginLeft: 'auto' }}>
          {wpCount} WayPoints, {mapCount} Maps
        </span>
      </div>
      <div style={{ flex: 1 }}>
        <Group orientation="vertical">
          <Panel defaultSize="55%" minSize="20%">
            <div style={{ width: '100%', height: '100%' }}>
              <ReactFlow
                nodes={nodes} edges={edges} nodeTypes={nodeTypes}
                onNodeClick={onNodeClick} onNodeDoubleClick={onNodeDoubleClick}
                fitView fitViewOptions={{ padding: 0.3 }}
                proOptions={{ hideAttribution: true }}
                style={{ background: '#faf8f5' }}
                minZoom={0.3} maxZoom={2}
              />
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
                  {detail.type === 'waypoint'
                    ? <WayPointEditor projectRoot={projectRoot} address={detail.address} />
                    : <BlackBoxEditor projectRoot={projectRoot} address={detail.address} />
                  }
                </div>
              </div>
            ) : (
              <div style={{
                height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-muted)', fontSize: 13, background: 'var(--bg-surface)',
              }}>
                WayPoint를 클릭하면 상세 정보가 표시됩니다. BlackBox는 노드 우상단 📦 아이콘을 클릭하세요.
              </div>
            )}
          </Panel>
        </Group>
      </div>
    </div>
  );
}
