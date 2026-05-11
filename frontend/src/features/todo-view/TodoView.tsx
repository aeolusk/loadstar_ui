import { useState } from 'react';
import {
  fetchTodoList, fetchTodoHistory, syncTodo,
  type ApiTodoItem, type ApiTodoHistoryItem,
} from '../../api/client';

type TabType = 'list' | 'history';
type StatusFilter = 'ALL' | 'ACTIVE' | 'PENDING' | 'BLOCKED';

const statusBadgeColors: Record<string, { bg: string; color: string }> = {
  ACTIVE: { bg: '#3a7ca5', color: '#fff' },
  PENDING: { bg: '#9b8e7e', color: '#fff' },
  BLOCKED: { bg: '#b54a3f', color: '#fff' },
};

interface TodoViewProps {
  projectRoot: string;
}

export default function TodoView({ projectRoot }: TodoViewProps) {
  const [tab, setTab] = useState<TabType>('list');
  const [loading, setLoading] = useState(false);

  // List state
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [addressFilter, setAddressFilter] = useState('');
  const [listResult, setListResult] = useState<ApiTodoItem[] | null>(null);

  // History state
  const [histMapFilter, setHistMapFilter] = useState('');
  const [histResult, setHistResult] = useState<ApiTodoHistoryItem[] | null>(null);

  // Sync state
  const [syncing, setSyncing] = useState(false);
  const [showSyncConfirm, setShowSyncConfirm] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const handleListSearch = async () => {
    if (!projectRoot) return;
    setLoading(true);
    try {
      let items = await fetchTodoList(projectRoot);
      if (statusFilter !== 'ALL') items = items.filter(t => t.status === statusFilter);
      if (addressFilter.trim()) items = items.filter(t => t.address.toLowerCase().includes(addressFilter.toLowerCase()));
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
      const items = await fetchTodoHistory(projectRoot, histMapFilter.trim() || undefined);
      setHistResult(items);
    } catch (e) {
      console.error('Failed to fetch todo history', e);
      setHistResult([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setShowSyncConfirm(false);
    setSyncing(true);
    setSyncMessage(null);
    try {
      const result = await syncTodo(projectRoot);
      setSyncMessage(`동기화 완료: ${result.added} 추가, ${result.updated} 갱신, ${result.removed} 제거 (총 ${result.total}건)`);
      // Refresh list
      handleListSearch();
    } catch (e) {
      setSyncMessage('동기화 실패: ' + (e instanceof Error ? e.message : 'Unknown error'));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div style={s.container}>
      {/* Sync Confirm Popup */}
      {showSyncConfirm && (
        <div style={s.overlay}>
          <div style={s.popup}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>TODO 동기화</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
              전체 WayPoint를 스캔하여 TODO 목록을 갱신합니다.<br/>
              대규모 프로젝트의 경우 시간이 걸릴 수 있습니다.
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button style={s.btn} onClick={() => setShowSyncConfirm(false)}>취소</button>
              <button style={s.btnPrimary} onClick={handleSync}>동기화 실행</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {syncMessage && (
        <div style={s.toast} onClick={() => setSyncMessage(null)}>
          {syncMessage}
        </div>
      )}

      {/* Tab Bar */}
      <div style={s.tabBar}>
        <div style={{ ...s.tab, ...(tab === 'list' ? s.tabActive : {}) }} onClick={() => setTab('list')}>
          TODO List
        </div>
        <div style={{ ...s.tab, ...(tab === 'history' ? s.tabActive : {}) }} onClick={() => setTab('history')}>
          History
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', paddingRight: 12 }}>
          <button
            style={{ ...s.btnPrimary, fontSize: 11, padding: '4px 12px' }}
            onClick={() => setShowSyncConfirm(true)}
            disabled={syncing || !projectRoot}
          >
            {syncing ? '동기화 중...' : '⟳ Sync'}
          </button>
        </div>
      </div>

      {/* ===== LIST TAB ===== */}
      {tab === 'list' && (
        <>
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
              <div style={{ ...s.filterGroup, alignSelf: 'flex-end' }}>
                <button style={s.btnPrimary} onClick={handleListSearch} disabled={loading}>{loading ? '...' : '조회'}</button>
                <button style={s.btn} onClick={() => { setStatusFilter('ALL'); setAddressFilter(''); setListResult(null); }}>초기화</button>
              </div>
            </div>
          </div>

          {listResult === null ? (
            <div style={s.empty}>필터 조건을 설정하고 [조회] 버튼을 클릭하세요.</div>
          ) : listResult.length === 0 ? (
            <div style={s.empty}>조건에 맞는 항목이 없습니다.</div>
          ) : (
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Status</th>
                  <th style={s.th}>Address</th>
                  <th style={s.th}>Summary</th>
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
                      <td style={{ ...s.td, ...s.mono }}>{t.address}</td>
                      <td style={s.td}>{t.summary}</td>
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
              <div style={{ ...s.filterGroup, flex: 1 }}>
                <span style={s.filterLabel}>Map 필터</span>
                <input style={s.input} value={histMapFilter} onChange={e => setHistMapFilter(e.target.value)}
                  placeholder="M://root/cli (비우면 전체)" spellCheck={false} />
              </div>
              <div style={{ ...s.filterGroup, alignSelf: 'flex-end' }}>
                <button style={s.btnPrimary} onClick={handleHistorySearch} disabled={loading}>{loading ? '...' : '조회'}</button>
                <button style={s.btn} onClick={() => { setHistMapFilter(''); setHistResult(null); }}>초기화</button>
              </div>
            </div>
          </div>

          {histResult === null ? (
            <div style={s.empty}>[조회] 버튼을 클릭하면 WayPoint TODO의 완료 항목을 수집합니다.</div>
          ) : histResult.length === 0 ? (
            <div style={s.empty}>완료된 항목이 없습니다.</div>
          ) : (
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Date</th>
                  <th style={s.th}>Address</th>
                  <th style={s.th}>Item</th>
                </tr>
              </thead>
              <tbody>
                {histResult.map((h, i) => (
                  <tr key={i} style={i % 2 === 0 ? {} : { background: 'var(--bg-secondary)' }}>
                    <td style={{ ...s.td, ...s.muted, whiteSpace: 'nowrap' }}>{h.date}</td>
                    <td style={{ ...s.td, ...s.mono }}>{h.address}</td>
                    <td style={s.td}>{h.item}</td>
                  </tr>
                ))}
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
  container: { height: '100%', overflow: 'auto', fontSize: 13, position: 'relative' as const } as React.CSSProperties,
  tabBar: {
    display: 'flex', gap: 0, borderBottom: '1px solid var(--border-light)',
    position: 'sticky' as const, top: 0, background: 'var(--bg-surface)', zIndex: 2,
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
    outline: 'none', minWidth: 200,
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
  overlay: {
    position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000,
  } as React.CSSProperties,
  popup: {
    background: 'var(--bg-surface)', borderRadius: 8, padding: '24px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)', maxWidth: 400, width: '90%',
  } as React.CSSProperties,
  toast: {
    position: 'absolute' as const, top: 48, left: '50%', transform: 'translateX(-50%)', zIndex: 50,
    background: '#2c2417', color: '#fff', padding: '8px 20px', borderRadius: 6,
    fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.2)', cursor: 'pointer',
  } as React.CSSProperties,
};
