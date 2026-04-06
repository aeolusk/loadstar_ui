import { useState } from 'react';
import type { CSSProperties } from 'react';
import { sampleTodos, sampleTodoHistory } from '../../data/sampleData';

type TabType = 'list' | 'history';
type StatusFilter = 'ALL' | 'ACTIVE' | 'PENDING' | 'BLOCKED';

const statusBadgeColors: Record<string, { bg: string; color: string }> = {
  ACTIVE: { bg: 'var(--status-progress)', color: '#fff' },
  PENDING: { bg: 'var(--status-idle)', color: '#fff' },
  BLOCKED: { bg: 'var(--status-error)', color: '#fff' },
  DONE: { bg: 'var(--status-stable)', color: '#fff' },
};

const styles: Record<string, CSSProperties> = {
  container: {
    padding: 24,
    overflowY: 'auto',
    height: '100%',
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: 16,
  },
  tabBar: {
    display: 'flex',
    gap: 0,
    marginBottom: 16,
    borderBottom: '1px solid var(--border-light)',
  },
  tab: {
    padding: '8px 20px',
    fontSize: 'var(--font-sm)',
    fontWeight: 500,
    cursor: 'pointer',
    color: 'var(--text-muted)',
    borderBottom: '2px solid transparent',
    transition: 'all 0.15s',
  },
  tabActive: {
    color: 'var(--accent-primary)',
    borderBottomColor: 'var(--accent-primary)',
  },
  filterBar: {
    display: 'flex',
    gap: 8,
    marginBottom: 16,
  },
  filterBtn: {
    padding: '4px 12px',
    fontSize: 'var(--font-sm)',
    border: '1px solid var(--border-medium)',
    borderRadius: 'var(--radius-md)',
    background: 'var(--bg-surface)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontWeight: 500,
  },
  filterBtnActive: {
    background: 'var(--accent-bg)',
    borderColor: 'var(--accent-primary)',
    color: 'var(--accent-primary)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  th: {
    textAlign: 'left' as const,
    padding: '8px 12px',
    fontSize: 'var(--font-sm)',
    color: 'var(--text-muted)',
    borderBottom: '2px solid var(--border-light)',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  td: {
    padding: '10px 12px',
    fontSize: 'var(--font-base)',
    borderBottom: '1px solid var(--border-light)',
    color: 'var(--text-primary)',
  },
  badge: {
    display: 'inline-block',
    fontSize: 'var(--font-xs)',
    padding: '2px 8px',
    borderRadius: 10,
    fontWeight: 600,
  },
  addressCell: {
    fontFamily: 'monospace',
    fontSize: 'var(--font-sm)',
    color: 'var(--text-secondary)',
  },
};

export default function TodoView() {
  const [tab, setTab] = useState<TabType>('list');
  const [filter, setFilter] = useState<StatusFilter>('ALL');

  const filteredTodos = filter === 'ALL'
    ? sampleTodos
    : sampleTodos.filter((t) => t.status === filter);

  const filters: StatusFilter[] = ['ALL', 'ACTIVE', 'PENDING', 'BLOCKED'];

  return (
    <div style={styles.container}>
      <div style={styles.title}>TODO</div>

      {/* Tab Bar */}
      <div style={styles.tabBar}>
        <div
          style={{ ...styles.tab, ...(tab === 'list' ? styles.tabActive : {}) }}
          onClick={() => setTab('list')}
        >
          List
        </div>
        <div
          style={{ ...styles.tab, ...(tab === 'history' ? styles.tabActive : {}) }}
          onClick={() => setTab('history')}
        >
          History
        </div>
      </div>

      {tab === 'list' && (
        <>
          {/* Filter Buttons */}
          <div style={styles.filterBar}>
            {filters.map((f) => (
              <button
                key={f}
                style={{ ...styles.filterBtn, ...(filter === f ? styles.filterBtnActive : {}) }}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>

          {/* List Table */}
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Summary</th>
                <th style={styles.th}>Address</th>
                <th style={styles.th}>Time</th>
                <th style={styles.th}>Depends On</th>
              </tr>
            </thead>
            <tbody>
              {filteredTodos.map((t, i) => {
                const badgeStyle = statusBadgeColors[t.status] || statusBadgeColors.PENDING;
                return (
                  <tr key={i}>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, background: badgeStyle.bg, color: badgeStyle.color }}>
                        {t.status}
                      </span>
                    </td>
                    <td style={styles.td}>{t.summary}</td>
                    <td style={{ ...styles.td, ...styles.addressCell }}>{t.address}</td>
                    <td style={{ ...styles.td, fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>{t.time}</td>
                    <td style={{ ...styles.td, ...styles.addressCell }}>{t.dependsOn}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}

      {tab === 'history' && (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Action</th>
              <th style={styles.th}>Summary</th>
              <th style={styles.th}>Address</th>
              <th style={styles.th}>Time</th>
              <th style={styles.th}>Completed At</th>
            </tr>
          </thead>
          <tbody>
            {sampleTodoHistory.map((h, i) => {
              const badgeStyle = statusBadgeColors[h.action] || statusBadgeColors.DONE;
              return (
                <tr key={i}>
                  <td style={styles.td}>
                    <span style={{ ...styles.badge, background: badgeStyle.bg, color: badgeStyle.color }}>
                      {h.action}
                    </span>
                  </td>
                  <td style={styles.td}>{h.summary}</td>
                  <td style={{ ...styles.td, ...styles.addressCell }}>{h.address}</td>
                  <td style={{ ...styles.td, fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>{h.time}</td>
                  <td style={{ ...styles.td, fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>{h.at}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
