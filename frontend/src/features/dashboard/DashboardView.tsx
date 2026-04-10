import { useEffect, useState, useRef, useCallback, type CSSProperties, type MouseEvent as RMouseEvent } from 'react';
import {
  fetchDashboardSummary, fetchNotices, createNotice, updateNotice, deleteNotice,
  type DashboardSummary, type NoticeItem, type BlockedItem,
} from '../../api/client';
import {
  getCategoryLabel, getPriorityLabel, getStatusLabel,
  categoryOptions, priorityOptions,
} from '../../data/status-labels';

interface Props {
  projectRoot: string;
}

const CATEGORY_SECTIONS = [
  { key: 'NOTICE', categories: ['NOTICE'] },
  { key: 'ISSUE',  categories: ['ISSUE'] },
  { key: 'RISK',   categories: ['RISK'] },
  { key: 'MEMO',   categories: ['MEMO'] },
];

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: 'var(--status-error)', MEDIUM: 'var(--status-review)', LOW: 'var(--status-idle)',
};
const STATUS_COLORS: Record<string, string> = {
  S_IDL: 'var(--status-idle)', S_PRG: 'var(--status-progress)', S_STB: 'var(--status-stable)',
  S_ERR: 'var(--status-error)', S_REV: 'var(--status-review)',
};
const STATUS_KEYS = ['S_IDL', 'S_PRG', 'S_STB', 'S_ERR', 'S_REV'];

export default function DashboardView({ projectRoot }: Props) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMapTab, setActiveMapTab] = useState<string>('all');

  // 모달
  const [showModal, setShowModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState<NoticeItem | null>(null);
  const [form, setForm] = useState({ title: '', category: 'NOTICE', priority: 'MEDIUM', content: '' });

  // 모달 리사이즈
  const [modalSize, setModalSize] = useState({ w: 480, h: 420 });
  const resizing = useRef(false);
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });

  const onResizeStart = useCallback((e: RMouseEvent) => {
    e.preventDefault();
    resizing.current = true;
    resizeStart.current = { x: e.clientX, y: e.clientY, w: modalSize.w, h: modalSize.h };
    const onMove = (ev: globalThis.MouseEvent) => {
      if (!resizing.current) return;
      setModalSize({
        w: Math.max(360, resizeStart.current.w + (ev.clientX - resizeStart.current.x)),
        h: Math.max(300, resizeStart.current.h + (ev.clientY - resizeStart.current.y)),
      });
    };
    const onUp = () => { resizing.current = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [modalSize]);

  // 모달 드래그 이동
  const [modalPos, setModalPos] = useState<{ x: number; y: number } | null>(null);
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, mx: 0, my: 0 });

  const onDragStart = useCallback((e: RMouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
    const currentX = modalPos?.x ?? rect.left;
    const currentY = modalPos?.y ?? rect.top;
    dragStart.current = { x: e.clientX, y: e.clientY, mx: currentX, my: currentY };
    const onMove = (ev: globalThis.MouseEvent) => {
      if (!dragging.current) return;
      setModalPos({
        x: dragStart.current.mx + (ev.clientX - dragStart.current.x),
        y: Math.max(0, dragStart.current.my + (ev.clientY - dragStart.current.y)),
      });
    };
    const onUp = () => { dragging.current = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [modalPos]);

  useEffect(() => { if (projectRoot) loadData(); }, [projectRoot]);

  async function loadData() {
    setLoading(true);
    try {
      const [s, n] = await Promise.all([fetchDashboardSummary(projectRoot), fetchNotices(projectRoot)]);
      setSummary(s); setNotices(n);
    } catch (e) { console.error('Dashboard load failed', e); }
    finally { setLoading(false); }
  }

  if (!projectRoot) return <div style={st.empty}>프로젝트를 선택해주세요</div>;
  if (loading) return <div style={st.empty}>Loading...</div>;
  if (!summary) return <div style={st.empty}>대시보드 데이터를 불러올 수 없습니다</div>;

  // Map 탭 데이터
  const cur = activeMapTab === 'all' ? summary : (() => {
    const g = summary.mapGroups.find(g => g.address === activeMapTab);
    return g ? { statusCounts: g.statusCounts, totalWaypoints: g.totalWaypoints, totalMaps: 1 } : { statusCounts: {}, totalWaypoints: 0, totalMaps: 0 };
  })();
  const currentBlocked = activeMapTab === 'all'
    ? summary.blockedItems
    : summary.blockedItems.filter(b => b.address.includes(activeMapTab.replace('M://root/', '')));
  const totalBar = STATUS_KEYS.reduce((sum, k) => sum + (cur.statusCounts[k] || 0), 0);

  // 공지 CRUD
  function openCreate(cat: string) { setEditingNotice(null); setForm({ title: '', category: cat, priority: 'MEDIUM', content: '' }); setModalPos(null); setShowModal(true); }
  function openEdit(item: NoticeItem) { setEditingNotice(item); setForm({ title: item.title, category: item.category, priority: item.priority, content: item.content }); setModalPos(null); setShowModal(true); }
  async function handleSave() {
    try {
      if (editingNotice) {
        await updateNotice(projectRoot, editingNotice.id, { ...editingNotice, ...form, status: editingNotice.status, created: editingNotice.created, resolved: editingNotice.resolved });
      } else {
        await createNotice(projectRoot, { title: form.title, category: form.category, priority: form.priority, content: form.content, status: 'OPEN', created: '', resolved: null });
      }
      setShowModal(false); loadData();
    } catch (e) { console.error('Save failed', e); }
  }
  async function handleDelete(item: NoticeItem) {
    if (!confirm(`"${item.title}" 항목을 삭제하시겠습니까?\n(Git 이력에는 보존됩니다)`)) return;
    try { await deleteNotice(projectRoot, item.id); loadData(); } catch (e) { console.error(e); }
  }
  async function handleResolve(item: NoticeItem) {
    try { await updateNotice(projectRoot, item.id, { ...item, status: 'RESOLVED', resolved: new Date().toISOString().split('T')[0] }); loadData(); } catch (e) { console.error(e); }
  }

  return (
    <div style={st.container}>
      <div style={st.title}>Dashboard</div>

      {/* ① WP 상황 — Map별 탭 */}
      <div style={st.section}>
        <div style={st.sectionTitle}>WayPoint 상황</div>
        <div style={st.tabBar}>
          <button style={activeMapTab === 'all' ? st.tabActive : st.tab} onClick={() => setActiveMapTab('all')}>전체</button>
          {summary.mapGroups.map(g => (
            <button key={g.address} style={activeMapTab === g.address ? st.tabActive : st.tab}
              onClick={() => setActiveMapTab(g.address)}>
              {g.address.replace('M://root/', '')}
            </button>
          ))}
        </div>
        <div style={st.statsRow}>
          <div style={st.statChip}><span style={st.statLabel}>Maps</span><span style={st.statValue}>{cur.totalMaps}</span></div>
          <div style={st.statChip}><span style={st.statLabel}>WayPoints</span><span style={st.statValue}>{cur.totalWaypoints}</span></div>
          {STATUS_KEYS.map(k => (cur.statusCounts[k] || 0) > 0 && (
            <div key={k} style={st.statChip}>
              <span style={{ ...st.legendDot, background: STATUS_COLORS[k] }} />
              <span style={st.statLabel}>{getStatusLabel(k)}</span>
              <span style={st.statValue}>{cur.statusCounts[k]}</span>
            </div>
          ))}
        </div>
        {totalBar > 0 && (
          <div style={st.statusBar}>
            {STATUS_KEYS.map(k => (cur.statusCounts[k] || 0) > 0 && <div key={k} style={{ flex: cur.statusCounts[k], background: STATUS_COLORS[k] }} />)}
          </div>
        )}
        {currentBlocked.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ ...st.sectionTitle, fontSize: 'var(--font-sm)' }}>BLOCKED ({currentBlocked.length})</div>
            {currentBlocked.map((b: BlockedItem) => (
              <div key={b.address} style={st.blockedRow}>
                <span style={st.blockedBadge}>BLOCKED</span>
                <span style={st.blockedAddr}>{b.address}</span>
                <span style={st.blockedSummary}>{b.summary}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ② 공지/메모/이슈/결정사항 — 카테고리별 세로 배치 */}
      {CATEGORY_SECTIONS.map(sec => {
        const items = notices.filter(n => sec.categories.includes(n.category) && n.status === 'OPEN');
        const sectionLabel = sec.categories.map(c => getCategoryLabel(c)).join(' / ');
        return (
          <div key={sec.key} style={st.section}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={st.sectionTitle}>{sectionLabel}</div>
              <button style={st.btnAdd} onClick={() => openCreate(sec.categories[0])}>+ 추가</button>
            </div>
            {items.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>등록된 항목이 없습니다</div>}
            {items.map(item => (
              <div key={item.id} style={st.noticeCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ ...st.priorityDot, background: PRIORITY_COLORS[item.priority] || 'var(--status-idle)' }} />
                  <span style={st.noticeTitle}>{item.title}</span>
                  <span style={st.categoryBadge}>{getCategoryLabel(item.category)}</span>
                  <span style={{ ...st.categoryBadge, background: PRIORITY_COLORS[item.priority] + '20', color: PRIORITY_COLORS[item.priority] }}>
                    {getPriorityLabel(item.priority)}
                  </span>
                </div>
                {item.content && <div style={st.noticeContent}>{item.content}</div>}
                <div style={st.noticeFooter}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-xs)' }}>{item.created}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={st.btnSmall} onClick={() => openEdit(item)}>편집</button>
                    <button style={{ ...st.btnSmall, color: 'var(--status-error)' }} onClick={() => handleDelete(item)}>삭제</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      })}

      {/* 모달 (리사이즈 가능) */}
      {showModal && (
        <div style={st.overlay} onClick={() => setShowModal(false)}>
          <div style={{
            ...st.modal, width: modalSize.w, minHeight: modalSize.h,
            ...(modalPos ? { position: 'fixed', left: modalPos.x, top: modalPos.y, margin: 0 } : {}),
          }} onClick={e => e.stopPropagation()}>
            <div style={st.dragHandle} onMouseDown={onDragStart}>
              <span>{editingNotice ? '수정' : '추가'}</span>
              <button style={st.closeBtn} onClick={() => setShowModal(false)}>×</button>
            </div>
            <label style={st.fieldLabel}>제목</label>
            <input style={st.input} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <label style={st.fieldLabel}>카테고리</label>
            <select style={st.input} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {categoryOptions.map(c => <option key={c} value={c}>{getCategoryLabel(c)}</option>)}
            </select>
            <label style={st.fieldLabel}>우선순위</label>
            <select style={st.input} value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
              {priorityOptions.map(p => <option key={p} value={p}>{getPriorityLabel(p)}</option>)}
            </select>
            <label style={st.fieldLabel}>내용</label>
            <textarea style={{ ...st.input, flex: 1, minHeight: 120, resize: 'vertical' }}
              value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
            <div style={st.modalButtons}>
              <button style={st.btnSecondary} onClick={() => setShowModal(false)}>취소</button>
              <button style={st.btnPrimary} onClick={handleSave}>저장</button>
            </div>
            {/* 리사이즈 핸들 */}
            <div style={st.resizeHandle} onMouseDown={onResizeStart} title="드래그하여 크기 조절" />
          </div>
        </div>
      )}
    </div>
  );
}

// ── 스타일 ──

const st: Record<string, CSSProperties> = {
  container: { padding: 24, overflowY: 'auto', height: '100%' },
  empty: { padding: 40, color: 'var(--text-muted)', textAlign: 'center' },
  title: { fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 },
  section: {
    background: 'var(--bg-surface)', border: '1px solid var(--border-light)',
    borderRadius: 'var(--radius-lg)', padding: 20, boxShadow: 'var(--shadow-sm)', marginBottom: 16,
  },
  sectionTitle: { fontSize: 'var(--font-md)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 0 },

  tabBar: { display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--border-light)', paddingBottom: 8 },
  tab: {
    padding: '6px 14px', border: 'none', borderRadius: 'var(--radius-md)',
    background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer',
    fontSize: 'var(--font-sm)', fontWeight: 500,
  },
  tabActive: {
    padding: '6px 14px', border: 'none', borderRadius: 'var(--radius-md)',
    background: 'var(--accent-bg)', color: 'var(--accent-primary)', cursor: 'pointer',
    fontSize: 'var(--font-sm)', fontWeight: 600,
  },

  statsRow: { display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 },
  statChip: { display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' },
  statLabel: { fontSize: 'var(--font-xs)', color: 'var(--text-muted)' },
  statValue: { fontSize: 'var(--font-md)', fontWeight: 700, color: 'var(--text-primary)' },
  legendDot: { display: 'inline-block', width: 8, height: 8, borderRadius: '50%' },
  statusBar: { display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden' },

  blockedRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: 'var(--font-sm)' },
  blockedBadge: { fontSize: 'var(--font-xs)', padding: '2px 8px', borderRadius: 10, fontWeight: 600, background: 'var(--status-error)', color: '#fff' },
  blockedAddr: { color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: 'var(--font-xs)' },
  blockedSummary: { color: 'var(--text-muted)', fontSize: 'var(--font-xs)', flex: 1 },

  noticeCard: { padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', marginBottom: 8 },
  noticeTitle: { fontWeight: 600, fontSize: 'var(--font-sm)', color: 'var(--text-primary)', flex: 1 },
  noticeContent: { fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginBottom: 8, whiteSpace: 'pre-wrap', lineHeight: 1.5 },
  noticeFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  priorityDot: { display: 'inline-block', width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  categoryBadge: { fontSize: 'var(--font-xs)', padding: '1px 6px', borderRadius: 8, background: 'var(--bg-tertiary)', color: 'var(--text-muted)', fontWeight: 500 },

  btnAdd: {
    padding: '4px 12px', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)',
    background: 'var(--bg-surface)', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: 'var(--font-xs)', fontWeight: 600,
  },
  btnSmall: { padding: '2px 8px', border: 'none', borderRadius: 4, background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 'var(--font-xs)' },
  btnPrimary: {
    padding: '8px 20px', border: 'none', borderRadius: 'var(--radius-md)',
    background: 'var(--accent-primary)', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 'var(--font-sm)',
  },
  btnSecondary: {
    padding: '8px 20px', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)',
    background: 'var(--bg-surface)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 'var(--font-sm)',
  },

  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: {
    position: 'relative', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', padding: 24,
    maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    display: 'flex', flexDirection: 'column',
  },
  dragHandle: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 16px', margin: '-24px -24px 16px -24px', cursor: 'move', userSelect: 'none',
    background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
    fontSize: 'var(--font-md)', fontWeight: 600, color: 'var(--text-primary)',
  },
  closeBtn: {
    border: 'none', background: 'transparent', fontSize: 18, cursor: 'pointer',
    color: 'var(--text-muted)', padding: '0 4px', lineHeight: 1,
  },
  modalButtons: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 },
  fieldLabel: { display: 'block', fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: 12, marginBottom: 4 },
  input: {
    width: '100%', padding: '8px 10px', border: '1px solid var(--border-medium)',
    borderRadius: 'var(--radius-md)', fontSize: 'var(--font-sm)', boxSizing: 'border-box',
    background: 'var(--bg-primary)', color: 'var(--text-primary)',
  },
  resizeHandle: {
    position: 'absolute', right: 0, bottom: 0, width: 16, height: 16, cursor: 'nwse-resize',
    background: 'linear-gradient(135deg, transparent 50%, var(--border-medium) 50%)',
    borderRadius: '0 0 var(--radius-lg) 0',
  },
};
