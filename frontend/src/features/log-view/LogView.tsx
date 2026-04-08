import { useState } from 'react';
import { fetchLog, type LogEntry } from '../../api/client';

type TimeRange = 'none' | '1h' | '6h' | '1d' | '3d' | '7d';
type KindFilter = '' | 'NOTE' | 'DECISION' | 'ISSUE' | 'RESOLVED' | 'PROGRESS' | 'MODIFIED';

const timeRangeLabels: Record<TimeRange, string> = {
  none: '기한 없음', '1h': '1시간 전', '6h': '6시간 전', '1d': '1일 전', '3d': '3일 전', '7d': '7일 전',
};

const kindColors: Record<string, { bg: string; color: string }> = {
  NOTE: { bg: '#9b8e7e', color: '#fff' },
  DECISION: { bg: '#3a7ca5', color: '#fff' },
  ISSUE: { bg: '#b54a3f', color: '#fff' },
  RESOLVED: { bg: '#5a8a5e', color: '#fff' },
  PROGRESS: { bg: '#c47f17', color: '#fff' },
  MODIFIED: { bg: '#8b6914', color: '#fff' },
};

function getTimeRangeCutoff(range: TimeRange): Date | null {
  if (range === 'none') return null;
  const now = new Date();
  const ms = { '1h': 3600000, '6h': 21600000, '1d': 86400000, '3d': 259200000, '7d': 604800000 };
  return new Date(now.getTime() - ms[range]);
}

function isWithinRange(timestamp: string, range: TimeRange): boolean {
  const cutoff = getTimeRangeCutoff(range);
  if (!cutoff) return true;
  const d = new Date(timestamp);
  return !isNaN(d.getTime()) && d >= cutoff;
}

const PAGE_SIZE = 20;

interface LogViewProps {
  projectRoot: string;
}

export default function LogView({ projectRoot }: LogViewProps) {
  const [addressFilter, setAddressFilter] = useState('');
  const [kindFilter, setKindFilter] = useState<KindFilter>('');
  const [timeRange, setTimeRange] = useState<TimeRange>('none');
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (pageNum = 0) => {
    if (!projectRoot) return;
    setLoading(true);
    try {
      const result = await fetchLog(
        projectRoot,
        pageNum * PAGE_SIZE,
        PAGE_SIZE,
        addressFilter.trim() || undefined,
        kindFilter || undefined,
      );
      // Client-side time filter
      const filtered = result.entries.filter(e => isWithinRange(e.timestamp, timeRange));
      setEntries(filtered);
      setHasMore(result.hasMore);
      setPage(pageNum);
      setSearched(true);
    } catch (e) {
      console.error('Failed to fetch log', e);
      setEntries([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setAddressFilter('');
    setKindFilter('');
    setTimeRange('none');
    setEntries([]);
    setPage(0);
    setHasMore(false);
    setSearched(false);
  };

  return (
    <div style={s.container}>
      {/* Filter */}
      <div style={s.filterSection}>
        <div style={s.filterRow}>
          <div style={s.filterGroup}>
            <span style={s.filterLabel}>KIND</span>
            <select style={s.select} value={kindFilter} onChange={e => setKindFilter(e.target.value as KindFilter)}>
              <option value="">ALL</option>
              <option value="NOTE">NOTE</option>
              <option value="DECISION">DECISION</option>
              <option value="ISSUE">ISSUE</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="PROGRESS">PROGRESS</option>
              <option value="MODIFIED">MODIFIED</option>
            </select>
          </div>
          <div style={{ ...s.filterGroup, flex: 1 }}>
            <span style={s.filterLabel}>Address</span>
            <input style={s.input} value={addressFilter} onChange={e => setAddressFilter(e.target.value)}
              placeholder="W://..." spellCheck={false} />
          </div>
          <div style={s.filterGroup}>
            <span style={s.filterLabel}>기간</span>
            <select style={s.select} value={timeRange} onChange={e => setTimeRange(e.target.value as TimeRange)}>
              {Object.entries(timeRangeLabels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div style={{ ...s.filterGroup, alignSelf: 'flex-end' }}>
            <button style={s.btnPrimary} onClick={() => handleSearch(0)} disabled={loading}>
              {loading ? '...' : '조회'}
            </button>
            <button style={s.btn} onClick={handleClear}>초기화</button>
          </div>
        </div>
      </div>

      {/* Results */}
      {!searched ? (
        <div style={s.empty}>필터 조건을 설정하고 [조회] 버튼을 클릭하세요.</div>
      ) : entries.length === 0 ? (
        <div style={s.empty}>조건에 맞는 로그가 없습니다.</div>
      ) : (
        <>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Time</th>
                <th style={s.th}>KIND</th>
                <th style={s.th}>Content</th>
                <th style={s.th}>Address</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => {
                const badge = kindColors[entry.kind] || kindColors.NOTE;
                return (
                  <tr key={i} style={i % 2 === 0 ? {} : { background: 'var(--bg-secondary)' }}>
                    <td style={{ ...s.td, ...s.muted, whiteSpace: 'nowrap' }}>{entry.timestamp}</td>
                    <td style={s.td}>
                      <span style={{ ...s.badge, background: badge.bg, color: badge.color }}>{entry.kind}</span>
                    </td>
                    <td style={s.td}>{entry.content}</td>
                    <td style={{ ...s.td, ...s.mono }}>{entry.address}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Paging */}
          <div style={s.paging}>
            <button style={s.pageBtn} onClick={() => handleSearch(page - 1)} disabled={page === 0 || loading}>
              ◀ 이전
            </button>
            <span style={s.pageInfo}>페이지 {page + 1}</span>
            <button style={s.pageBtn} onClick={() => handleSearch(page + 1)} disabled={!hasMore || loading}>
              다음 ▶
            </button>
            <span style={s.resultCount}>{entries.length}건 표시</span>
          </div>
        </>
      )}
    </div>
  );
}

const s = {
  container: { height: '100%', overflow: 'auto', fontSize: 13 } as React.CSSProperties,
  filterSection: {
    padding: '12px 16px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-secondary)',
    position: 'sticky' as const, top: 0, zIndex: 1,
  } as React.CSSProperties,
  filterRow: {
    display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' as const,
  } as React.CSSProperties,
  filterGroup: {
    display: 'flex', flexDirection: 'column' as const, gap: 3,
  } as React.CSSProperties,
  filterLabel: {
    fontSize: 11, color: 'var(--text-muted)', fontWeight: 600,
  } as React.CSSProperties,
  select: {
    padding: '5px 8px', border: '1px solid var(--border-medium)', borderRadius: 4,
    fontSize: 12, background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none',
  } as React.CSSProperties,
  input: {
    padding: '5px 8px', border: '1px solid var(--border-medium)', borderRadius: 4,
    fontSize: 12, fontFamily: 'monospace', background: 'var(--bg-surface)', color: 'var(--text-primary)',
    outline: 'none', minWidth: 150,
  } as React.CSSProperties,
  btnPrimary: {
    padding: '5px 14px', border: '1px solid var(--accent-primary)', borderRadius: 4,
    background: 'var(--accent-primary)', color: '#fff', fontSize: 12, fontWeight: 600,
    cursor: 'pointer', marginRight: 4,
  } as React.CSSProperties,
  btn: {
    padding: '5px 12px', border: '1px solid var(--border-medium)', borderRadius: 4,
    background: 'var(--bg-surface)', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer',
  } as React.CSSProperties,
  empty: {
    padding: '40px 16px', textAlign: 'center' as const, color: 'var(--text-muted)', fontSize: 13,
  } as React.CSSProperties,
  table: {
    width: '100%', borderCollapse: 'collapse' as const,
  } as React.CSSProperties,
  th: {
    textAlign: 'left' as const, padding: '8px 12px', fontSize: 11,
    color: 'var(--text-muted)', borderBottom: '2px solid var(--border-light)',
    fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 0.5,
    position: 'sticky' as const, top: 52, background: 'var(--bg-surface)',
  } as React.CSSProperties,
  td: {
    padding: '8px 12px', borderBottom: '1px solid var(--border-light)', color: 'var(--text-primary)',
  } as React.CSSProperties,
  badge: {
    display: 'inline-block', fontSize: 10, padding: '2px 8px', borderRadius: 10, fontWeight: 600,
  } as React.CSSProperties,
  mono: {
    fontFamily: 'monospace', fontSize: 11, color: 'var(--text-secondary)',
  } as React.CSSProperties,
  muted: {
    fontSize: 12, color: 'var(--text-muted)',
  } as React.CSSProperties,
  paging: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
    borderTop: '1px solid var(--border-light)', background: 'var(--bg-secondary)',
  } as React.CSSProperties,
  pageBtn: {
    padding: '4px 12px', border: '1px solid var(--border-medium)', borderRadius: 4,
    background: 'var(--bg-surface)', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer',
  } as React.CSSProperties,
  pageInfo: {
    fontSize: 12, color: 'var(--text-primary)', fontWeight: 600,
  } as React.CSSProperties,
  resultCount: {
    fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto',
  } as React.CSSProperties,
};
