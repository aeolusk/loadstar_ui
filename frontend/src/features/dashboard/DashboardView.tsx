import { useMemo } from 'react';
import type { TreeNode } from '../../types/loadstar';
import { sampleTree } from '../../data/sampleData';

function flattenTree(nodes: TreeNode[]): TreeNode[] {
  const result: TreeNode[] = [];
  const walk = (list: TreeNode[]) => {
    for (const n of list) {
      result.push(n);
      if (n.children.length) walk(n.children);
    }
  };
  walk(nodes);
  return result;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: 24,
    overflowY: 'auto',
    height: '100%',
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: 20,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 16,
    marginBottom: 24,
  },
  card: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-light)',
    borderRadius: 'var(--radius-lg)',
    padding: 20,
    boxShadow: 'var(--shadow-sm)',
  },
  cardLabel: {
    fontSize: 'var(--font-sm)',
    color: 'var(--text-muted)',
    marginBottom: 4,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  sectionTitle: {
    fontSize: 'var(--font-md)',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: 12,
  },
  section: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-light)',
    borderRadius: 'var(--radius-lg)',
    padding: 20,
    boxShadow: 'var(--shadow-sm)',
    marginBottom: 16,
  },
  statusBar: {
    display: 'flex',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  statusLegend: {
    display: 'flex',
    gap: 16,
    fontSize: 'var(--font-sm)',
    color: 'var(--text-secondary)',
  },
  legendDot: {
    display: 'inline-block',
    width: 8,
    height: 8,
    borderRadius: '50%',
    marginRight: 4,
    verticalAlign: 'middle',
  },
  todoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 0',
    borderBottom: '1px solid var(--border-light)',
    fontSize: 'var(--font-base)',
  },
  badge: {
    fontSize: 'var(--font-xs)',
    padding: '2px 8px',
    borderRadius: 10,
    fontWeight: 600,
  },
  warningCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    background: '#fef3e0',
    border: '1px solid var(--status-review)',
    color: 'var(--text-primary)',
    fontSize: 'var(--font-sm)',
    marginBottom: 8,
  },
};

export default function DashboardView() {
  const allNodes = useMemo(() => flattenTree(sampleTree), []);

  const maps = allNodes.filter((n) => n.type === 'MAP');
  const waypoints = allNodes.filter((n) => n.type === 'WAYPOINT');

  const statusCounts = useMemo(() => {
    const counts = { S_IDL: 0, S_PRG: 0, S_STB: 0, S_ERR: 0, S_REV: 0 };
    for (const n of allNodes) {
      if (n.status in counts) counts[n.status as keyof typeof counts]++;
    }
    return counts;
  }, [allNodes]);

  const activeTodos: { summary: string }[] = [];

  const expiredSyncCount = 0;
  const openQuestionCount = 1;

  return (
    <div style={styles.container}>
      <div style={styles.title}>Dashboard</div>

      {/* Stats Cards */}
      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.cardLabel}>Maps</div>
          <div style={styles.cardValue}>{maps.length}</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>WayPoints</div>
          <div style={styles.cardValue}>{waypoints.length}</div>
        </div>
      </div>

      {/* Status Distribution */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Status Distribution</div>
        <div style={styles.statusBar}>
          <div style={{ flex: statusCounts.S_IDL, background: 'var(--status-idle)' }} />
          <div style={{ flex: statusCounts.S_PRG, background: 'var(--status-progress)' }} />
          <div style={{ flex: statusCounts.S_STB, background: 'var(--status-stable)' }} />
          <div style={{ flex: statusCounts.S_ERR, background: 'var(--status-error)' }} />
          <div style={{ flex: statusCounts.S_REV, background: 'var(--status-review)' }} />
        </div>
        <div style={styles.statusLegend}>
          <span><span style={{ ...styles.legendDot, background: 'var(--status-idle)' }} />IDL {statusCounts.S_IDL}</span>
          <span><span style={{ ...styles.legendDot, background: 'var(--status-progress)' }} />PRG {statusCounts.S_PRG}</span>
          <span><span style={{ ...styles.legendDot, background: 'var(--status-stable)' }} />STB {statusCounts.S_STB}</span>
          <span><span style={{ ...styles.legendDot, background: 'var(--status-error)' }} />ERR {statusCounts.S_ERR}</span>
          <span><span style={{ ...styles.legendDot, background: 'var(--status-review)' }} />REV {statusCounts.S_REV}</span>
        </div>
      </div>

      {/* Active Tasks */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Active Tasks ({activeTodos.length})</div>
        {activeTodos.map((t, i) => (
          <div key={i} style={styles.todoRow}>
            <span style={{ ...styles.badge, background: 'var(--status-progress)', color: '#fff' }}>ACTIVE</span>
            <span style={{ flex: 1 }}>{t.summary}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>{t.address}</span>
          </div>
        ))}
      </div>

      {/* Health Warnings */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Health Warnings</div>
        {expiredSyncCount > 0 && (
          <div style={styles.warningCard}>
            <span style={{ fontSize: 16 }}>&#9888;</span>
            <span>{expiredSyncCount} element(s) with expired SYNCED_AT (&gt;30 days)</span>
          </div>
        )}
        {openQuestionCount > 0 && (
          <div style={styles.warningCard}>
            <span style={{ fontSize: 16 }}>&#10068;</span>
            <span>{openQuestionCount} open question(s) unresolved</span>
          </div>
        )}
      </div>
    </div>
  );
}
