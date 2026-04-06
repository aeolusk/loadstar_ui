import type { CSSProperties } from 'react';
import { sampleWaypoint } from '../../data/sampleData';

interface WayPointEditorProps {
  address: string;
}

const styles: Record<string, CSSProperties> = {
  container: {
    padding: 24,
    overflowY: 'auto',
    height: '100%',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
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
    fontSize: 'var(--font-base)',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    background: 'var(--bg-tertiary)',
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    background: 'var(--accent-primary)',
  },
  checkItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 0',
    fontSize: 'var(--font-base)',
    color: 'var(--text-primary)',
    borderBottom: '1px solid var(--border-light)',
  },
  questionItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    padding: '8px 0',
    fontSize: 'var(--font-base)',
    borderBottom: '1px solid var(--border-light)',
  },
  qBadge: {
    fontSize: 'var(--font-xs)',
    padding: '1px 6px',
    borderRadius: 'var(--radius-sm)',
    fontWeight: 600,
    flexShrink: 0,
  },
  emptyText: {
    color: 'var(--text-muted)',
    fontSize: 'var(--font-sm)',
    fontStyle: 'italic',
  },
};

const statusColors: Record<string, string> = {
  S_IDL: 'var(--status-idle)',
  S_PRG: 'var(--status-progress)',
  S_STB: 'var(--status-stable)',
  S_ERR: 'var(--status-error)',
  S_REV: 'var(--status-review)',
};

export default function WayPointEditor({ address }: WayPointEditorProps) {
  const wp = sampleWaypoint; // In real app, fetch by address
  const doneCount = wp.techSpec.filter((t) => t.done).length;
  const totalSpec = wp.techSpec.length;
  const progress = totalSpec > 0 ? Math.round((doneCount / totalSpec) * 100) : 0;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <span style={{ ...styles.statusBadge, background: statusColors[wp.status] }}>{wp.status}</span>
        <span style={styles.address}>{address}</span>
      </div>

      {/* IDENTITY */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>Identity</div>
        <div style={styles.sectionBody}>
          <div style={styles.row}>
            <span style={styles.label}>Summary</span>
            <span style={styles.value}>{wp.identity.summary}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>Version</span>
            <span style={styles.value}>{wp.identity.metadata.version}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>Created</span>
            <span style={styles.value}>{wp.identity.metadata.created}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>Priority</span>
            <span style={styles.value}>{wp.identity.metadata.priority}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>Synced At</span>
            <span style={styles.value}>{wp.identity.syncedAt}</span>
          </div>
        </div>
      </div>

      {/* CONNECTIONS */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>Connections</div>
        <div style={styles.sectionBody}>
          <div style={styles.row}>
            <span style={styles.label}>Parent</span>
            <span style={styles.link}>{wp.connections.parent}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>Children</span>
            {wp.connections.children.length > 0 ? (
              <span>{wp.connections.children.map((c, i) => <span key={i} style={styles.link}>{c} </span>)}</span>
            ) : (
              <span style={styles.emptyText}>None</span>
            )}
          </div>
          <div style={styles.row}>
            <span style={styles.label}>Reference</span>
            <span>{wp.connections.reference.map((r, i) => <span key={i} style={styles.link}>{r} </span>)}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>BlackBox</span>
            <span style={styles.link}>{wp.connections.blackbox}</span>
          </div>
        </div>
      </div>

      {/* TECH_SPEC */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>Tech Spec ({doneCount}/{totalSpec})</div>
        <div style={styles.sectionBody}>
          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${progress}%` }} />
          </div>
          {wp.techSpec.map((spec, i) => (
            <div key={i} style={styles.checkItem}>
              <input type="checkbox" checked={spec.done} readOnly style={{ accentColor: 'var(--accent-primary)' }} />
              <span style={{ textDecoration: spec.done ? 'line-through' : 'none', color: spec.done ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                {spec.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* OPEN_QUESTIONS */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>Open Questions</div>
        <div style={styles.sectionBody}>
          {wp.openQuestions.map((q) => (
            <div key={q.id} style={styles.questionItem}>
              <span
                style={{
                  ...styles.qBadge,
                  background: q.resolved ? 'var(--status-stable)' : 'var(--status-review)',
                  color: '#fff',
                }}
              >
                {q.resolved ? 'RESOLVED' : 'OPEN'}
              </span>
              <span style={{ color: 'var(--text-primary)' }}>{q.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ISSUES */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>Issues</div>
        <div style={styles.sectionBody}>
          {wp.issues.length === 0 ? (
            <span style={styles.emptyText}>No issues</span>
          ) : (
            wp.issues.map((issue, i) => (
              <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid var(--border-light)' }}>{issue}</div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
