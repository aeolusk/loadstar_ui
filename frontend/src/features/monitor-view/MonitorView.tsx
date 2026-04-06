import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import { sampleBlackbox } from '../../data/sampleData';

interface SyncEntry {
  address: string;
  syncedAt: string;
  daysSince: number;
  status: 'ok' | 'warn' | 'expired';
}

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
    marginBottom: 20,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
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
  cardValueWarn: {
    fontSize: 28,
    fontWeight: 700,
    color: 'var(--status-error)',
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
  addressCell: {
    fontFamily: 'monospace',
    fontSize: 'var(--font-sm)',
    color: 'var(--text-secondary)',
  },
  statusDot: {
    display: 'inline-block',
    width: 10,
    height: 10,
    borderRadius: '50%',
  },
  snapshotPlaceholder: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
    color: 'var(--text-muted)',
    fontSize: 'var(--font-sm)',
    border: '1px dashed var(--border-medium)',
    borderRadius: 'var(--radius-md)',
    background: 'var(--bg-secondary)',
  },
};

const statusColorMap: Record<string, string> = {
  ok: 'var(--status-stable)',
  warn: 'var(--status-review)',
  expired: 'var(--status-error)',
};

export default function MonitorView() {
  const syncEntries = useMemo<SyncEntry[]>(() => {
    const now = new Date();

    // Only the BlackBox has a known syncedAt from sample data
    const entries: SyncEntry[] = [];

    // Add the known blackbox
    const bbDate = new Date(sampleBlackbox.syncedAt);
    const bbDays = Math.floor((now.getTime() - bbDate.getTime()) / (1000 * 60 * 60 * 24));
    entries.push({
      address: sampleBlackbox.address,
      syncedAt: sampleBlackbox.syncedAt,
      daysSince: bbDays,
      status: bbDays > 30 ? 'expired' : bbDays > 20 ? 'warn' : 'ok',
    });

    // Add some sample WP entries
    const sampleSyncDates: Record<string, string> = {
      'W://root/backend/element_service': '2026-04-06',
      'W://root/backend/project_config': '2026-04-05',
      'W://root/frontend/app_shell': '2026-04-06',
      'W://root/frontend/map_view': '2026-03-15',
    };

    for (const [addr, dateStr] of Object.entries(sampleSyncDates)) {
      const d = new Date(dateStr);
      const days = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
      entries.push({
        address: addr,
        syncedAt: dateStr,
        daysSince: days,
        status: days > 30 ? 'expired' : days > 20 ? 'warn' : 'ok',
      });
    }

    return entries;
  }, []);

  const totalElements = syncEntries.length;
  const expiredCount = syncEntries.filter((e) => e.status === 'expired').length;

  return (
    <div style={styles.container}>
      <div style={styles.title}>Monitor / Drift Status</div>

      {/* Drift Summary */}
      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.cardLabel}>Tracked Elements</div>
          <div style={styles.cardValue}>{totalElements}</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>Expired (&gt;30d)</div>
          <div style={expiredCount > 0 ? styles.cardValueWarn : styles.cardValue}>{expiredCount}</div>
        </div>
      </div>

      {/* SYNCED_AT Table */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>SYNCED_AT Overview</div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Address</th>
              <th style={styles.th}>Synced At</th>
              <th style={styles.th}>Days Since</th>
            </tr>
          </thead>
          <tbody>
            {syncEntries.map((entry, i) => (
              <tr key={i}>
                <td style={styles.td}>
                  <span style={{ ...styles.statusDot, background: statusColorMap[entry.status] }} />
                </td>
                <td style={{ ...styles.td, ...styles.addressCell }}>{entry.address}</td>
                <td style={{ ...styles.td, fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>{entry.syncedAt}</td>
                <td style={{ ...styles.td, fontWeight: entry.status === 'expired' ? 700 : 400, color: entry.status === 'expired' ? 'var(--status-error)' : 'var(--text-primary)' }}>
                  {entry.daysSince}d
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Snapshot Placeholder */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Snapshot</div>
        <div style={styles.snapshotPlaceholder}>
          Snapshot feature coming soon
        </div>
      </div>
    </div>
  );
}
