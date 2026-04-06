import { useState, useEffect } from 'react';
import { fetchBlackBox, type BlackBoxDetail } from '../../api/client';

interface BlackBoxEditorProps {
  projectRoot: string;
  address: string;
}

const statusColors: Record<string, string> = {
  S_IDL: '#9b8e7e', S_PRG: '#3a7ca5', S_STB: '#5a8a5e', S_ERR: '#b54a3f', S_REV: '#c47f17',
};

const s = {
  section: { marginBottom: 16 } as React.CSSProperties,
  sectionTitle: { fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8, borderBottom: '1px solid var(--border-light)', paddingBottom: 4 } as React.CSSProperties,
  label: { fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 } as React.CSSProperties,
  value: { fontSize: 13, color: 'var(--text-primary)', marginBottom: 8 } as React.CSSProperties,
  link: { fontSize: 13, color: 'var(--accent-primary)', cursor: 'pointer', textDecoration: 'underline' } as React.CSSProperties,
  badge: (color: string) => ({ fontSize: 11, padding: '1px 8px', background: color + '20', color, borderRadius: 3, fontWeight: 600, display: 'inline-block' }) as React.CSSProperties,
  codeFile: { fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', padding: '6px 0 2px', fontFamily: 'monospace' } as React.CSSProperties,
  codeItem: { fontSize: 12, color: 'var(--text-secondary)', padding: '2px 0 2px 16px', fontFamily: 'monospace' } as React.CSSProperties,
  warningBanner: { background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 6, padding: '8px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as React.CSSProperties,
};

function isDriftExpired(syncedAt: string | null): boolean {
  if (!syncedAt) return false;
  const synced = new Date(syncedAt);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - synced.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays > 30;
}

function daysSince(syncedAt: string | null): number {
  if (!syncedAt) return 0;
  const synced = new Date(syncedAt);
  const now = new Date();
  return Math.floor((now.getTime() - synced.getTime()) / (1000 * 60 * 60 * 24));
}

export default function BlackBoxEditor({ projectRoot, address }: BlackBoxEditorProps) {
  const [data, setData] = useState<BlackBoxDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchBlackBox(projectRoot, address)
      .then(setData)
      .catch(e => setError(e.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [address]);

  if (loading) return <div style={{ color: 'var(--text-muted)', padding: 12 }}>Loading...</div>;
  if (error || !data) return <div style={{ color: 'var(--status-error)', padding: 12 }}>Error: {error}</div>;

  const color = statusColors[data.status] || statusColors.S_IDL;
  const driftExpired = isDriftExpired(data.syncedAt);
  const days = daysSince(data.syncedAt);

  return (
    <div style={{ fontSize: 13 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 16 }}>&#128230;</span>
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{address.split('/').pop()}</span>
        <span style={s.badge(color)}>{data.status}</span>
        {data.syncedAt && (
          <span style={{ fontSize: 11, color: driftExpired ? '#b54a3f' : 'var(--text-muted)' }}>
            SYNCED_AT: {data.syncedAt} ({days}d ago)
          </span>
        )}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>{address}</div>

      {/* Drift Warning */}
      {driftExpired && (
        <div style={s.warningBanner}>
          <span style={{ fontSize: 12, color: '#856404' }}>
            SYNCED_AT {days}일 경과 - CODE_MAP 신뢰도 경고
          </span>
          <button style={{
            fontSize: 11, padding: '3px 10px', background: '#ffc107', border: 'none',
            borderRadius: 4, cursor: 'pointer', fontWeight: 600, color: '#856404',
          }}>
            조정 세션 시작
          </button>
        </div>
      )}

      {/* DESCRIPTION */}
      <div style={s.section}>
        <div style={s.sectionTitle}>DESCRIPTION</div>
        <div style={s.label}>Summary</div>
        <div style={s.value}>{data.summary || '-'}</div>
        {data.linkedWp && (
          <div><span style={s.label}>Linked WP: </span><span style={s.link}>{data.linkedWp}</span></div>
        )}
      </div>

      {/* CODE_MAP */}
      {data.codeMap.length > 0 && (
        <div style={s.section}>
          <div style={s.sectionTitle}>
            CODE_MAP
            <span style={{ ...s.badge(data.codeMapPhase === 'actual' ? '#5a8a5e' : '#9b8e7e'), marginLeft: 8 }}>
              {data.codeMapPhase === 'actual' ? '실측' : '계획'}
            </span>
          </div>
          {data.codeMap.map((entry, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <div style={s.codeFile}>{entry.file}</div>
              {entry.items.map((item, j) => (
                <div key={j} style={s.codeItem}>
                  <span style={{ color: 'var(--accent-primary)' }}>{item.name}</span>
                  {item.description && <span> - {item.description}</span>}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* TODO */}
      {data.todos.length > 0 && (
        <div style={s.section}>
          <div style={s.sectionTitle}>TODO</div>
          {data.todos.map((item, i) => (
            <div key={i} style={{ padding: '3px 0', display: 'flex', alignItems: 'flex-start' }}>
              <input type="checkbox" checked={item.done} readOnly style={{ marginRight: 6 }} />
              <span style={{ color: item.done ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: item.done ? 'line-through' : 'none' }}>
                {item.text}
              </span>
              {item.wpRef > 0 && (
                <span style={{ fontSize: 10, color: 'var(--accent-primary)', marginLeft: 6 }}>[WP_REF:{item.wpRef}]</span>
              )}
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
