import { useState, useEffect } from 'react';
import { fetchWayPoint, type WayPointDetail } from '../../api/client';

interface WayPointEditorProps {
  address: string;
}

const statusColors: Record<string, string> = {
  S_IDL: '#9b8e7e', S_PRG: '#3a7ca5', S_STB: '#5a8a5e', S_ERR: '#b54a3f', S_REV: '#c47f17',
};
const statusLabels: Record<string, string> = {
  S_IDL: 'Idle', S_PRG: 'In Progress', S_STB: 'Stable', S_ERR: 'Error', S_REV: 'Review',
};

const s = {
  section: { marginBottom: 16 } as React.CSSProperties,
  sectionTitle: { fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8, borderBottom: '1px solid var(--border-light)', paddingBottom: 4 } as React.CSSProperties,
  label: { fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 } as React.CSSProperties,
  value: { fontSize: 13, color: 'var(--text-primary)', marginBottom: 8 } as React.CSSProperties,
  link: { fontSize: 13, color: 'var(--accent-primary)', cursor: 'pointer', textDecoration: 'underline' } as React.CSSProperties,
  badge: (color: string) => ({ fontSize: 11, padding: '1px 8px', background: color + '20', color, borderRadius: 3, fontWeight: 600, display: 'inline-block' }) as React.CSSProperties,
  progressBar: { height: 6, borderRadius: 3, background: 'var(--bg-tertiary)', overflow: 'hidden', marginBottom: 8 } as React.CSSProperties,
  progressFill: (pct: number) => ({ height: '100%', width: `${pct}%`, background: pct === 100 ? 'var(--status-stable)' : 'var(--accent-primary)', borderRadius: 3 }) as React.CSSProperties,
};

export default function WayPointEditor({ address }: WayPointEditorProps) {
  const [data, setData] = useState<WayPointDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchWayPoint(address)
      .then(setData)
      .catch(e => setError(e.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [address]);

  if (loading) return <div style={{ color: 'var(--text-muted)', padding: 12 }}>Loading...</div>;
  if (error || !data) return <div style={{ color: 'var(--status-error)', padding: 12 }}>Error: {error}</div>;

  const done = data.techSpec.filter(t => t.done).length;
  const total = data.techSpec.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const color = statusColors[data.status] || statusColors.S_IDL;

  return (
    <div style={{ fontSize: 13 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 16, color: '#3a7ca5' }}>&#9670;</span>
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{address.split('/').pop()}</span>
        <span style={s.badge(color)}>{statusLabels[data.status] || data.status}</span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>{address}</div>

      {/* IDENTITY */}
      <div style={s.section}>
        <div style={s.sectionTitle}>IDENTITY</div>
        <div style={s.label}>Summary</div>
        <div style={s.value}>{data.summary || '-'}</div>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {data.version && <div><span style={s.label}>Version: </span><span style={{ fontSize: 12 }}>{data.version}</span></div>}
          {data.created && <div><span style={s.label}>Created: </span><span style={{ fontSize: 12 }}>{data.created}</span></div>}
          {data.priority && <div><span style={s.label}>Priority: </span><span style={{ fontSize: 12 }}>{data.priority}</span></div>}
          {data.syncedAt && <div><span style={s.label}>SYNCED_AT: </span><span style={{ fontSize: 12 }}>{data.syncedAt}</span></div>}
        </div>
      </div>

      {/* CONNECTIONS */}
      <div style={s.section}>
        <div style={s.sectionTitle}>CONNECTIONS</div>
        {data.parent && <div style={{ marginBottom: 4 }}><span style={s.label}>Parent: </span><span style={s.link}>{data.parent}</span></div>}
        {data.children.length > 0 && (
          <div style={{ marginBottom: 4 }}>
            <span style={s.label}>Children: </span>
            {data.children.map(c => <span key={c} style={{ ...s.link, marginRight: 8 }}>{c}</span>)}
          </div>
        )}
        {data.references.length > 0 && (
          <div style={{ marginBottom: 4 }}>
            <span style={s.label}>Reference: </span>
            {data.references.map(r => <span key={r} style={{ ...s.link, marginRight: 8 }}>{r}</span>)}
          </div>
        )}
        {data.blackbox && <div><span style={s.label}>BlackBox: </span><span style={s.link}>{data.blackbox}</span></div>}
      </div>

      {/* TECH_SPEC */}
      {total > 0 && (
        <div style={s.section}>
          <div style={s.sectionTitle}>TECH_SPEC ({done}/{total})</div>
          <div style={s.progressBar}><div style={s.progressFill(pct)} /></div>
          {data.techSpec.map((item, i) => (
            <div key={i} style={{ padding: '3px 0', display: 'flex', alignItems: 'flex-start' }}>
              <input type="checkbox" checked={item.done} readOnly style={{ marginRight: 6 }} />
              <span style={{ color: item.done ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: item.done ? 'line-through' : 'none' }}>
                {item.text}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* OPEN_QUESTIONS */}
      {data.openQuestions.length > 0 && (
        <div style={s.section}>
          <div style={s.sectionTitle}>OPEN_QUESTIONS</div>
          {data.openQuestions.map(q => (
            <div key={q.id} style={{ padding: '4px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={s.badge(q.resolved ? '#5a8a5e' : '#c47f17')}>
                {q.resolved ? 'RESOLVED' : 'OPEN'}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>[{q.id}]</span>
              <span>{q.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* ISSUES */}
      {data.issues.length > 0 && (
        <div style={s.section}>
          <div style={s.sectionTitle}>ISSUE</div>
          {data.issues.map((issue, i) => (
            <div key={i} style={{ padding: '2px 0', color: 'var(--text-secondary)' }}>- {issue}</div>
          ))}
        </div>
      )}

      {/* COMMENT */}
      {data.comment && (
        <div style={s.section}>
          <div style={s.sectionTitle}>COMMENT</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{data.comment}</div>
        </div>
      )}
    </div>
  );
}
