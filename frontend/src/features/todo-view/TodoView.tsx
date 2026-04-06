import { useState } from 'react';
import {
  fetchTodoList, fetchTodoHistory,
  type ApiTodoItem, type ApiTodoHistoryItem,
} from '../../api/client';

type TabType = 'list' | 'history';
type StatusFilter = 'ALL' | 'ACTIVE' | 'PENDING' | 'BLOCKED';

const statusBadgeColors: Record<string, { bg: string; color: string }> = {
  ACTIVE: { bg: '#3a7ca5', color: '#fff' },
  PENDING: { bg: '#9b8e7e', color: '#fff' },
  BLOCKED: { bg: '#b54a3f', color: '#fff' },
  DONE: { bg: '#5a8a5e', color: '#fff' },
  UPDATED: { bg: '#c47f17', color: '#fff' },
  DELETED: { bg: '#b54a3f', color: '#fff' },
};

type TimeRange = 'none' | '1h' | '6h' | '1d' | '3d' | '7d';

const timeRangeLabels: Record<TimeRange, string> = {
  none: '기한 없음',
  '1h': '1시간 전',
  '6h': '6시간 전',
  '1d': '1일 전',
  '3d': '3일 전',
  '7d': '7일 전',
};

function getTimeRangeCutoff(range: TimeRange): Date | null {
  if (range === 'none') return null;
  const now = new Date();
  switch (range) {
    case '1h': return new Date(now.getTime() - 1 * 60 * 60 * 1000);
    case '6h': return new Date(now.getTime() - 6 * 60 * 60 * 1000);
    case '1d': return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '3d': return new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
}

function isWithinRange(dateStr: string, range: TimeRange): boolean {
  const cutoff = getTimeRangeCutoff(range);
  if (!cutoff) return true; // no filter
  const d = dateStr ? new Date(dateStr.replace(' ', 'T')) : null;
  if (!d || isNaN(d.getTime())) return true;
  return d >= cutoff;
}

interface TodoViewProps {
  projectRoot: string;
}

export default function TodoView({ projectRoot }: TodoViewProps) {
  const [tab, setTab] = useState<TabType>('list');
  const [loading, setLoading] = useState(false);

  // List filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [addressFilter, setAddressFilter] = useState('');
  const [timeRange, setTimeRange] = useState<TimeRange>('none');
  const [listResult, setListResult] = useState<ApiTodoItem[] | null>(null);

  // History filters
  const [histAddressFilter, setHistAddressFilter] = useState('');
  const [histActionFilter, setHistActionFilter] = useState('ALL');
  const [histTimeRange, setHistTimeRange] = useState<TimeRange>('none');
  const [histResult, setHistResult] = useState<ApiTodoHistoryItem[] | null>(null);

  const handleListSearch = async () => {
    if (!projectRoot) return;
    setLoading(true);
    try {
      let items = await fetchTodoList(projectRoot);
      if (statusFilter !== 'ALL') items = items.filter(t => t.status === statusFilter);
      if (addressFilter.trim()) items = items.filter(t => t.address.toLowerCase().includes(addressFilter.toLowerCase()));
      items = items.filter(t => isWithinRange(t.time, timeRange));
      setListResult(items);
    } catch (e) {
      console.error('Failed to fetch todo list', e);
      setListResult([]);
    } finally {
      setLoading(false);
    }
  };

  const handleHistorySearch = async () => {
    if (!projectRoot) return;
    setLoading(true);
    try {
      let items = await fetchTodoHistory(projectRoot, histAddressFilter.trim() || undefined);
      if (histActionFilter !== 'ALL') items = items.filter(h => h.action === histActionFilter);
      items = items.filter(h => isWithinRange(h.at || h.time, histTimeRange));
      setHistResult(items);
    } catch (e) {
      console.error('Failed to fetch todo history', e);
      setHistResult([]);
    } finally {
      setLoading(false);
    }
  };

  const handleListClear = () => {
    setStatusFilter('ALL');
    setAddressFilter('');
    setTimeRange('none');
    setListResult(null);
  };

  const handleHistoryClear = () => {
    setHistActionFilter('ALL');
    setHistAddressFilter('');
    setHistTimeRange('none');
    setHistResult(null);
  };

  return (
    <div style={s.container}>
      {/* Tab Bar */}
      <div style={s.tabBar}>
        <div style={{ ...s.tab, ...(tab === 'list' ? s.tabActive : {}) }} onClick={() => setTab('list')}>
          TODO List
        </div>
        <div style={{ ...s.tab, ...(tab === 'history' ? s.tabActive : {}) }} onClick={() => setTab('history')}>
          History
        </div>
      </div>

      {/* ===== LIST TAB ===== */}
      {tab === 'list' && (
        <>
          {/* Filter Bar */}
          <div style={s.filterSection}>
            <div style={s.filterRow}>
              <div style={s.filterGroup}>
                <span style={s.filterLabel}>Status</span>
                <select style={s.select} value={statusFilter} onChange={e => setStatusFilter(e.target.value as StatusFilter)}>
                  <option value="ALL">ALL</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="PENDING">PENDING</option>
                  <option value="BLOCKED">BLOCKED</option>
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
                <button style={s.btnPrimary} onClick={handleListSearch} disabled={loading}>{loading ? '...' : '조회'}</button>
                <button style={s.btn} onClick={handleListClear}>초기화</button>
              </div>
            </div>
          </div>

          {/* Results */}
          {listResult === null ? (
            <div style={s.empty}>필터 조건을 설정하고 [조회] 버튼을 클릭하세요.</div>
          ) : listResult.length === 0 ? (
            <div style={s.empty}>조건에 맞는 항목이 없습니다.</div>
          ) : (
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Status</th>
                  <th style={s.th}>Summary</th>
                  <th style={s.th}>Address</th>
                  <th style={s.th}>Time</th>
                  <th style={s.th}>Depends On</th>
                </tr>
              </thead>
              <tbody>
                {listResult.map((t, i) => {
                  const badge = statusBadgeColors[t.status] || statusBadgeColors.PENDING;
                  return (
                    <tr key={i} style={i % 2 === 0 ? {} : { background: 'var(--bg-secondary)' }}>
                      <td style={s.td}>
                        <span style={{ ...s.badge, background: badge.bg, color: badge.color }}>{t.status}</span>
                      </td>
                      <td style={s.td}>{t.summary}</td>
                      <td style={{ ...s.td, ...s.mono }}>{t.address}</td>
                      <td style={{ ...s.td, ...s.muted }}>{t.time}</td>
                      <td style={{ ...s.td, ...s.mono }}>{t.dependsOn !== '-' ? t.dependsOn : ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {listResult && <div style={s.resultCount}>{listResult.length}건</div>}
        </>
      )}

      {/* ===== HISTORY TAB ===== */}
      {tab === 'history' && (
        <>
          <div style={s.filterSection}>
            <div style={s.filterRow}>
              <div style={s.filterGroup}>
                <span style={s.filterLabel}>Action</span>
                <select style={s.select} value={histActionFilter} onChange={e => setHistActionFilter(e.target.value)}>
                  <option value="ALL">ALL</option>
                  <option value="DONE">DONE</option>
                  <option value="UPDATED">UPDATED</option>
                  <option value="DELETED">DELETED</option>
                </select>
              </div>
              <div style={{ ...s.filterGroup, flex: 1 }}>
                <span style={s.filterLabel}>Address</span>
                <input style={s.input} value={histAddressFilter} onChange={e => setHistAddressFilter(e.target.value)}
                  placeholder="W://..." spellCheck={false} />
              </div>
              <div style={s.filterGroup}>
                <span style={s.filterLabel}>기간</span>
                <select style={s.select} value={histTimeRange} onChange={e => setHistTimeRange(e.target.value as TimeRange)}>
                  {Object.entries(timeRangeLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div style={{ ...s.filterGroup, alignSelf: 'flex-end' }}>
                <button style={s.btnPrimary} onClick={handleHistorySearch} disabled={loading}>{loading ? '...' : '조회'}</button>
                <button style={s.btn} onClick={handleHistoryClear}>초기화</button>
              </div>
            </div>
          </div>

          {histResult === null ? (
            <div style={s.empty}>필터 조건을 설정하고 [조회] 버튼을 클릭하세요.</div>
          ) : histResult.length === 0 ? (
            <div style={s.empty}>조건에 맞는 항목이 없습니다.</div>
          ) : (
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Action</th>
                  <th style={s.th}>Summary</th>
                  <th style={s.th}>Address</th>
                  <th style={s.th}>Time</th>
                  <th style={s.th}>Completed At</th>
                  <th style={s.th}>Depends On</th>
                </tr>
              </thead>
              <tbody>
                {histResult.map((h, i) => {
                  const badge = statusBadgeColors[h.action] || statusBadgeColors.DONE;
                  return (
                    <tr key={i} style={i % 2 === 0 ? {} : { background: 'var(--bg-secondary)' }}>
                      <td style={s.td}>
                        <span style={{ ...s.badge, background: badge.bg, color: badge.color }}>{h.action}</span>
                      </td>
                      <td style={s.td}>{h.summary}</td>
                      <td style={{ ...s.td, ...s.mono }}>{h.address}</td>
                      <td style={{ ...s.td, ...s.muted }}>{h.time}</td>
                      <td style={{ ...s.td, ...s.muted }}>{h.at}</td>
                      <td style={{ ...s.td, ...s.mono }}>{h.dependsOn !== '-' ? h.dependsOn : ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {histResult && <div style={s.resultCount}>{histResult.length}건</div>}
        </>
      )}
    </div>
  );
}

const s = {
  container: { height: '100%', overflow: 'auto', fontSize: 13 } as React.CSSProperties,
  tabBar: {
    display: 'flex', gap: 0, borderBottom: '1px solid var(--border-light)',
    position: 'sticky' as const, top: 0, background: 'var(--bg-surface)', zIndex: 1,
  } as React.CSSProperties,
  tab: {
    padding: '10px 24px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
    color: 'var(--text-muted)', borderBottom: '2px solid transparent',
  } as React.CSSProperties,
  tabActive: {
    color: 'var(--accent-primary)', borderBottomColor: 'var(--accent-primary)',
  } as React.CSSProperties,
  filterSection: {
    padding: '12px 16px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-secondary)',
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
    position: 'sticky' as const, top: 42, background: 'var(--bg-surface)',
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
  resultCount: {
    padding: '8px 16px', fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' as const,
  } as React.CSSProperties,
};
