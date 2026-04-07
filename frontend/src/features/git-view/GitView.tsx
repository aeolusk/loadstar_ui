import { useState, useEffect, type CSSProperties } from 'react';
import { fetchProjectGitLog, fetchGitDetail, type GitCommitEntry, type GitCommitDetailEntry } from '../../api/client';

interface GitViewProps {
  projectRoot: string;
}

const changeTypeLabel: Record<string, { text: string; color: string }> = {
  A: { text: 'Added', color: '#5a8a5e' },
  M: { text: 'Modified', color: '#3a7ca5' },
  D: { text: 'Deleted', color: '#b54a3f' },
};

const s: Record<string, CSSProperties> = {
  container: { padding: 20, overflowY: 'auto', height: '100%' },
  title: { fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 },
  list: { display: 'flex', flexDirection: 'column', gap: 4 },
  row: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px',
    borderBottom: '1px solid var(--border-light)', cursor: 'pointer',
    fontSize: 13,
  },
  rowSelected: { background: 'var(--accent-bg)' },
  hash: {
    fontFamily: 'monospace', fontSize: 11, color: 'var(--accent-primary)',
    background: 'var(--accent-bg)', padding: '1px 6px', borderRadius: 3, fontWeight: 600, flexShrink: 0,
  },
  message: { flex: 1, color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  meta: { fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' },
  author: { fontWeight: 500, color: 'var(--text-secondary)' },
  detailPanel: {
    marginTop: 12, background: 'var(--bg-surface)', border: '1px solid var(--border-light)',
    borderRadius: 6, padding: 16,
  },
  detailHeader: { fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 },
  detailMeta: { fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 },
  fileRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', fontSize: 12, fontFamily: 'monospace' },
  badge: (color: string) => ({
    fontSize: 10, padding: '1px 6px', background: color + '20', color, borderRadius: 3, fontWeight: 600,
  }),
  empty: { fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px 0' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  countBadge: { fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 },
};

export default function GitView({ projectRoot }: GitViewProps) {
  const [commits, setCommits] = useState<GitCommitEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHash, setSelectedHash] = useState<string | null>(null);
  const [detail, setDetail] = useState<GitCommitDetailEntry | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!projectRoot) return;
    setLoading(true);
    fetchProjectGitLog(projectRoot, 100)
      .then(setCommits)
      .catch(() => setCommits([]))
      .finally(() => setLoading(false));
  }, [projectRoot]);

  const selectCommit = async (hash: string) => {
    if (selectedHash === hash) {
      setSelectedHash(null);
      setDetail(null);
      return;
    }
    setSelectedHash(hash);
    setDetailLoading(true);
    try {
      const d = await fetchGitDetail(projectRoot, hash);
      setDetail(d);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  if (!projectRoot) return <div style={{ color: 'var(--text-muted)', padding: 20 }}>프로젝트를 선택해주세요</div>;
  if (loading) return <div style={{ color: 'var(--text-muted)', padding: 20 }}>Loading...</div>;

  return (
    <div style={s.container}>
      <div style={s.header}>
        <span style={s.title}>Git History</span>
        <span style={s.countBadge}>{commits.length}건</span>
      </div>

      <div style={s.list}>
        {commits.map(c => (
          <div key={c.hash}>
            <div
              style={{ ...s.row, ...(selectedHash === c.hash ? s.rowSelected : {}) }}
              onClick={() => selectCommit(c.hash)}
            >
              <span style={s.hash}>{c.hash.substring(0, 7)}</span>
              <span style={s.message}>{c.message}</span>
              <span style={{ ...s.meta, ...s.author }}>{c.author}</span>
              <span style={s.meta}>{c.date.substring(0, 19)}</span>
            </div>

            {selectedHash === c.hash && (
              <div style={s.detailPanel}>
                {detailLoading ? (
                  <div style={s.empty}>Loading...</div>
                ) : detail ? (
                  <>
                    <div style={s.detailHeader}>{detail.message}</div>
                    <div style={s.detailMeta}>
                      {detail.author} | {detail.date?.substring(0, 19)} | {detail.hash.substring(0, 7)}
                    </div>
                    {detail.files.length > 0 ? (
                      <>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                          변경 파일 ({detail.files.length})
                        </div>
                        {detail.files.map((f, i) => {
                          const ct = changeTypeLabel[f.changeType] || { text: f.changeType, color: '#9b8e7e' };
                          return (
                            <div key={i} style={s.fileRow}>
                              <span style={s.badge(ct.color)}>{ct.text}</span>
                              <span style={{ color: 'var(--text-primary)' }}>{f.filePath}</span>
                            </div>
                          );
                        })}
                      </>
                    ) : (
                      <div style={s.empty}>변경 파일 없음</div>
                    )}
                  </>
                ) : (
                  <div style={s.empty}>상세 정보를 불러올 수 없습니다</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {commits.length === 0 && <div style={s.empty}>커밋 이력이 없습니다</div>}
    </div>
  );
}
