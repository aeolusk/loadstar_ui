import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import { sampleBlackbox } from '../../data/sampleData';

interface BlackBoxEditorProps {
  address: string;
}

const styles: Record<string, CSSProperties> = {
  container: {
    padding: 24,
    overflowY: 'auto',
    height: '100%',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  address: {
    fontFamily: 'monospace',
    fontSize: 'var(--font-md)',
    color: 'var(--text-secondary)',
  },
  statusBadge: {
    fontSize: 'var(--font-xs)',
    padding: '2px 10px',
    borderRadius: 10,
    fontWeight: 600,
    color: '#fff',
  },
  syncedAt: {
    fontSize: 'var(--font-sm)',
    color: 'var(--text-muted)',
    marginBottom: 16,
  },
  driftBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderRadius: 'var(--radius-md)',
    background: '#fef3e0',
    border: '1px solid var(--status-review)',
    marginBottom: 16,
    fontSize: 'var(--font-sm)',
    color: 'var(--text-primary)',
  },
  driftBtn: {
    padding: '4px 12px',
    background: 'var(--status-review)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--font-sm)',
    cursor: 'pointer',
    fontWeight: 600,
  },
  section: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-light)',
    borderRadius: 'var(--radius-lg)',
    marginBottom: 16,
    boxShadow: 'var(--shadow-sm)',
    overflow: 'hidden',
  },
  sectionHeader: {
    padding: '10px 16px',
    background: 'var(--bg-secondary)',
    borderBottom: '1px solid var(--border-light)',
    fontSize: 'var(--font-sm)',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  sectionBody: {
    padding: 16,
  },
  row: {
    display: 'flex',
    gap: 8,
    marginBottom: 8,
    fontSize: 'var(--font-base)',
  },
  label: {
    width: 100,
    color: 'var(--text-muted)',
    fontSize: 'var(--font-sm)',
    flexShrink: 0,
  },
  value: {
    color: 'var(--text-primary)',
  },
  link: {
    color: 'var(--accent-primary)',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  fileGroup: {
    marginBottom: 12,
  },
  fileName: {
    fontFamily: 'monospace',
    fontSize: 'var(--font-sm)',
    color: 'var(--accent-primary)',
    fontWeight: 600,
    marginBottom: 4,
  },
  codeEntry: {
    display: 'grid',
    gridTemplateColumns: '200px 1fr',
    gap: 8,
    padding: '4px 0 4px 16px',
    fontSize: 'var(--font-sm)',
    borderBottom: '1px solid var(--border-light)',
  },
  codeName: {
    fontFamily: 'monospace',
    color: 'var(--text-primary)',
  },
  codeDesc: {
    color: 'var(--text-secondary)',
  },
  checkItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 0',
    fontSize: 'var(--font-base)',
    borderBottom: '1px solid var(--border-light)',
  },
  wpRefTag: {
    fontSize: 'var(--font-xs)',
    padding: '1px 6px',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--accent-bg)',
    color: 'var(--accent-primary)',
    fontFamily: 'monospace',
    fontWeight: 600,
  },
  issueItem: {
    padding: '8px 0',
    fontSize: 'var(--font-base)',
    color: 'var(--text-primary)',
    borderBottom: '1px solid var(--border-light)',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
  },
  issueDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: 'var(--status-error)',
    marginTop: 6,
    flexShrink: 0,
  },
};

const statusColors: Record<string, string> = {
  S_IDL: 'var(--status-idle)',
  S_PRG: 'var(--status-progress)',
  S_STB: 'var(--status-stable)',
  S_ERR: 'var(--status-error)',
  S_REV: 'var(--status-review)',
};

export default function BlackBoxEditor({ address }: BlackBoxEditorProps) {
  const bb = sampleBlackbox; // In real app, fetch by address

  const isDrifted = useMemo(() => {
    const synced = new Date(bb.syncedAt);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - synced.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 30;
  }, [bb.syncedAt]);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.headerRow}>
        <span style={{ ...styles.statusBadge, background: statusColors[bb.status] }}>{bb.status}</span>
        <span style={styles.address}>{address}</span>
      </div>
      <div style={styles.syncedAt}>SYNCED_AT: {bb.syncedAt}</div>

      {/* Drift Warning */}
      {isDrifted && (
        <div style={styles.driftBanner}>
          <span>&#9888; SYNCED_AT expired (&gt;30 days). BlackBox may be out of sync with actual code.</span>
          <button style={styles.driftBtn}>조정 세션 시작</button>
        </div>
      )}

      {/* DESCRIPTION */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>Description</div>
        <div style={styles.sectionBody}>
          <div style={styles.row}>
            <span style={styles.label}>Summary</span>
            <span style={styles.value}>{bb.description.summary}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>Linked WP</span>
            <span style={styles.link}>{bb.description.linkedWp}</span>
          </div>
        </div>
      </div>

      {/* CODE_MAP */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>Code Map (phase: {bb.codeMap.phase})</div>
        <div style={styles.sectionBody}>
          {bb.codeMap.entries.map((entry, fi) => (
            <div key={fi} style={styles.fileGroup}>
              <div style={styles.fileName}>{entry.file}</div>
              {entry.items.map((item, ii) => (
                <div key={ii} style={styles.codeEntry}>
                  <span style={styles.codeName}>{item.name}</span>
                  <span style={styles.codeDesc}>{item.desc}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* TODO */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>TODO</div>
        <div style={styles.sectionBody}>
          {bb.todos.map((todo, i) => (
            <div key={i} style={styles.checkItem}>
              <input type="checkbox" checked={todo.done} readOnly style={{ accentColor: 'var(--accent-primary)' }} />
              <span style={{ flex: 1, textDecoration: todo.done ? 'line-through' : 'none', color: todo.done ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                {todo.text}
              </span>
              <span style={styles.wpRefTag}>[WP_REF:{todo.wpRef}]</span>
            </div>
          ))}
        </div>
      </div>

      {/* ISSUES */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>Issues</div>
        <div style={styles.sectionBody}>
          {bb.issues.map((issue, i) => (
            <div key={i} style={styles.issueItem}>
              <span style={styles.issueDot} />
              <span>{issue}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
