import { useMemo } from 'react';
import { ReactFlow, type Node, type Edge, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { TreeNode } from '../../types/loadstar';
import { sampleTree } from '../../data/sampleData';

interface MapViewProps {
  address: string;
}

function findNode(nodes: TreeNode[], addr: string): TreeNode | null {
  for (const n of nodes) {
    if (n.address === addr) return n;
    const found = findNode(n.children, addr);
    if (found) return found;
  }
  return null;
}

const statusColors: Record<string, string> = {
  S_IDL: 'var(--status-idle)',
  S_PRG: 'var(--status-progress)',
  S_STB: 'var(--status-stable)',
  S_ERR: 'var(--status-error)',
  S_REV: 'var(--status-review)',
};

function WayPointNode({ data }: { data: { label: string; status: string; progress: number } }) {
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 16px',
        minWidth: 160,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: statusColors[data.status] || 'var(--status-idle)',
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 'var(--font-base)', fontWeight: 600, color: 'var(--text-primary)' }}>
          {data.label}
        </span>
      </div>
      <div
        style={{
          height: 4,
          borderRadius: 2,
          background: 'var(--bg-tertiary)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${data.progress}%`,
            background: 'var(--accent-primary)',
            borderRadius: 2,
          }}
        />
      </div>
      <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: 4, textAlign: 'right' }}>
        {data.progress}%
      </div>
    </div>
  );
}

function BlackBoxNode({ data }: { data: { label: string; status: string } }) {
  return (
    <div
      style={{
        background: 'var(--bg-tertiary)',
        border: '1px dashed var(--border-strong)',
        borderRadius: 'var(--radius-md)',
        padding: '8px 14px',
        minWidth: 140,
        fontSize: 'var(--font-sm)',
        color: 'var(--text-secondary)',
        textAlign: 'center',
      }}
    >
      <span style={{ marginRight: 4 }}>&#9635;</span>
      {data.label}
    </div>
  );
}

const nodeTypes = {
  waypoint: WayPointNode,
  blackbox: BlackBoxNode,
};

const styles: Record<string, React.CSSProperties> = {
  container: { width: '100%', height: '100%' },
  empty: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: 'var(--text-muted)',
    fontSize: 'var(--font-md)',
  },
};

export default function MapView({ address }: MapViewProps) {
  const mapNode = useMemo(() => findNode(sampleTree, address), [address]);

  const { nodes, edges } = useMemo(() => {
    if (!mapNode) return { nodes: [] as Node[], edges: [] as Edge[] };

    const ns: Node[] = [];
    const es: Edge[] = [];
    const children = mapNode.children || [];

    const wpChildren = children.filter((c) => c.type === 'WAYPOINT');

    wpChildren.forEach((wp, i) => {
      const xPos = i * 220;
      const wpId = wp.address;

      ns.push({
        id: wpId,
        type: 'waypoint',
        position: { x: xPos, y: 40 },
        data: { label: wp.summary, status: wp.status, progress: 0 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      });

      // Connect WPs in a chain
      if (i > 0) {
        es.push({
          id: `e-${wpChildren[i - 1].address}-${wpId}`,
          source: wpChildren[i - 1].address,
          target: wpId,
        });
      }

      // BlackBox child below
      const bb = wp.children.find((c) => c.type === 'BLACKBOX');
      if (bb) {
        ns.push({
          id: bb.address,
          type: 'blackbox',
          position: { x: xPos + 10, y: 150 },
          data: { label: bb.summary, status: bb.status },
        });
        es.push({
          id: `e-${wpId}-${bb.address}`,
          source: wpId,
          target: bb.address,
          style: { strokeDasharray: '4 2' },
        });
      }
    });

    return { nodes: ns, edges: es };
  }, [mapNode]);

  if (!mapNode) {
    return <div style={styles.empty}>Map not found: {address}</div>;
  }

  return (
    <div style={styles.container}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
        style={{ background: 'var(--bg-primary)' }}
      />
    </div>
  );
}
