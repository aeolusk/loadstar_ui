import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchSchedule, saveSchedule, refreshScheduleStatus } from '../../api/client';
import type { ScheduleItemResponse, ScheduleViewData } from '../../api/client';

// ===== Date helpers (UTC-safe) =====

const todayStr = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const addDays = (dateStr: string, n: number): string => {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

const diffDays = (a: string, b: string): number =>
  Math.round((new Date(b + 'T00:00:00Z').getTime() - new Date(a + 'T00:00:00Z').getTime()) / 86_400_000);

const clampDate = (date: string, min: string, max: string): string => {
  if (date < min) return min;
  if (date > max) return max;
  return date;
};

function generateDateLabels(startDate: string, durationDays: number) {
  const labels: { label: string; dayOffset: number }[] = [];
  if (durationDays <= 90) {
    for (let day = 0; day < durationDays; day += 7) {
      labels.push({ label: addDays(startDate, day).slice(5), dayOffset: day });
    }
  } else {
    const [sy, sm] = startDate.split('-').map(Number);
    let year = sy, month = sm;
    while (true) {
      const firstOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
      const offset = diffDays(startDate, firstOfMonth);
      if (offset >= durationDays) break;
      if (offset >= 0) labels.push({ label: `${month}월`, dayOffset: offset });
      month++;
      if (month > 12) { month = 1; year++; }
    }
  }
  return labels;
}

// 4-state: 진행 / 완료 / 반복 / 미존재
function barBgStyle(item: ScheduleItemResponse): React.CSSProperties {
  if (!item.exists) return { backgroundColor: '#ef4444' };
  if (item.recurringOnly) return { backgroundColor: '#f97316' };
  if (item.completed) return { backgroundColor: '#16a34a' };
  return { backgroundColor: '#2563eb' };
}

// ===== Constants =====
const ROW_HEIGHT = 34;
const DATE_AXIS_HEIGHT = 28;
const NAME_COL_WIDTH = 300;
const HANDLE_W = 8;
const TODAY = todayStr();

// ===== Drag state =====
interface DragState {
  address: string;
  type: 'start' | 'end' | 'move';
  startX: number;
  pixelsPerDay: number;
  originalStart: string;
  originalEnd: string;
  originalBgStyle: React.CSSProperties;
}

// ===== Shared styles =====
const inputStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)',
  border: '1px solid var(--border-light)', borderRadius: 4,
  padding: '3px 6px', fontSize: 12,
};

// ===== Component =====
interface Props { projectRoot: string; }

export default function ScheduleView({ projectRoot }: Props) {
  const [view, setView] = useState<ScheduleViewData>({ startDate: TODAY, durationDays: 30 });
  const [items, setItems] = useState<ScheduleItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [startDateInput, setStartDateInput] = useState(view.startDate);
  const [durationInput, setDurationInput] = useState(String(view.durationDays));
  const chartRef = useRef<HTMLDivElement>(null);
  const latestItemsRef = useRef<ScheduleItemResponse[]>([]);

  // Keep ref in sync so drag onUp always sees the latest items
  useEffect(() => { latestItemsRef.current = items; }, [items]);

  // Initial load
  useEffect(() => {
    if (!projectRoot) return;
    setLoading(true);
    fetchSchedule(projectRoot)
      .then(data => {
        setView(data.view);
        setItems(data.items);
        setStartDateInput(data.view.startDate);
        setDurationInput(String(data.view.durationDays));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [projectRoot]);

  // Auto-save: server handles all date adjustment, UI refreshes from response
  const autoSave = useCallback(async (newView: ScheduleViewData, currentItems: ScheduleItemResponse[]) => {
    setSaving(true);
    try {
      const body = {
        view: newView,
        items: Object.fromEntries(currentItems.map(it => [it.address, { start: it.start, end: it.end, status: it.status ?? 'ACTIVE' }])),
      };
      const updated = await saveSchedule(projectRoot, body);
      setItems(updated.items);
      setView(updated.view);
      setStartDateInput(updated.view.startDate);
      setDurationInput(String(updated.view.durationDays));
    } catch (e) {
      console.error('Save failed', e);
    } finally {
      setSaving(false);
    }
  }, [projectRoot]);

  // Drag mousemove / mouseup — local preview, auto-save on release
  useEffect(() => {
    if (!dragState) return;
    const viewEnd = addDays(view.startDate, view.durationDays - 1);

    const onMove = (e: MouseEvent) => {
      const delta = Math.round((e.clientX - dragState.startX) / dragState.pixelsPerDay);
      setItems(prev => prev.map(item => {
        if (item.address !== dragState.address) return item;
        let ns = dragState.originalStart, ne = dragState.originalEnd;
        if (dragState.type === 'start') {
          ns = clampDate(addDays(dragState.originalStart, delta), view.startDate, ne);
        } else if (dragState.type === 'end') {
          ne = clampDate(addDays(dragState.originalEnd, delta), ns, viewEnd);
        } else {
          const dur = diffDays(dragState.originalStart, dragState.originalEnd);
          ns = addDays(dragState.originalStart, delta);
          ne = addDays(dragState.originalEnd, delta);
          if (ns < view.startDate) { ns = view.startDate; ne = addDays(ns, dur); }
          if (ne > viewEnd) { ne = viewEnd; ns = addDays(ne, -dur); }
          ns = clampDate(ns, view.startDate, viewEnd);
          ne = clampDate(ne, ns, viewEnd);
        }
        return { ...item, start: ns, end: ne };
      }));
    };
    const onUp = () => {
      setDragState(null);
      autoSave(view, latestItemsRef.current);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
  }, [dragState, view, autoSave]);

  // Duration change: validate → optimistic view update → auto-save
  const handleDurationChange = useCallback(() => {
    const v = parseInt(durationInput, 10);
    if (isNaN(v) || v < 30 || v > 365) {
      alert('기간은 30 ~ 365일 사이로 입력해 주세요.');
      setDurationInput(String(view.durationDays));
      return;
    }
    const newView = { startDate: startDateInput, durationDays: v };
    setView(newView);
    autoSave(newView, items);
  }, [durationInput, startDateInput, view, items, autoSave]);

  const handleRefreshStatus = useCallback(async () => {
    setRefreshing(true);
    try {
      const updated = await refreshScheduleStatus(projectRoot);
      setItems(updated.items);
      setView(updated.view);
      setStartDateInput(updated.view.startDate);
      setDurationInput(String(updated.view.durationDays));
    } catch (e) {
      console.error('Refresh failed', e);
    } finally {
      setRefreshing(false);
    }
  }, [projectRoot]);

  // Drag start
  const startDrag = (e: React.MouseEvent, item: ScheduleItemResponse, type: DragState['type']) => {
    e.preventDefault(); e.stopPropagation();
    const rect = chartRef.current!.getBoundingClientRect();
    setDragState({ address: item.address, type, startX: e.clientX, pixelsPerDay: rect.width / view.durationDays, originalStart: item.start, originalEnd: item.end, originalBgStyle: barBgStyle(item) });
  };

  // Bar positioning
  const barLeft = (start: string) => `${(Math.max(0, diffDays(view.startDate, start)) / view.durationDays) * 100}%`;
  const barWidth = (start: string, end: string) => {
    const s = Math.max(0, diffDays(view.startDate, start));
    const e2 = Math.min(view.durationDays, diffDays(view.startDate, end) + 1);
    return `${(Math.max(0, e2 - s) / view.durationDays) * 100}%`;
  };

  const viewEndDate = addDays(view.startDate, view.durationDays - 1);
  const todayOffset = diffDays(view.startDate, TODAY);
  const dateLabels = generateDateLabels(view.startDate, view.durationDays);

  if (loading) return <div style={{ padding: 20, color: 'var(--text-muted)' }}>로딩 중...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', overflow: 'hidden', userSelect: dragState ? 'none' : undefined }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px', borderBottom: '1px solid var(--border-light)', flexShrink: 0, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>시작일</span>
        <input
          type="date" value={startDateInput}
          onChange={e => setStartDateInput(e.target.value)}
          style={inputStyle}
        />
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>기간</span>
        <input
          type="text" value={durationInput}
          onChange={e => setDurationInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleDurationChange(); }}
          style={{ ...inputStyle, width: 60 }}
        />
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>일</span>
        <button
          onClick={handleDurationChange}
          style={{ padding: '3px 8px', fontSize: 11, borderRadius: 4, border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', cursor: 'pointer' }}
        >변경</button>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>~ {viewEndDate}</span>
        <button
          onClick={handleRefreshStatus}
          disabled={refreshing || saving}
          style={{ padding: '3px 8px', fontSize: 11, borderRadius: 4, border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', cursor: refreshing ? 'default' : 'pointer', marginLeft: 'auto', opacity: refreshing ? 0.6 : 1 }}
        >{refreshing ? '갱신 중…' : 'WP 상태갱신'}</button>
        {saving && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>저장 중…</span>}
      </div>

      {/* ── Legend ── */}
      <div style={{ display: 'flex', gap: 14, padding: '4px 12px', borderBottom: '1px solid var(--border-light)', flexShrink: 0 }}>
        {[
          { color: '#2563eb', label: '진행' },
          { color: '#16a34a', label: '완료' },
          { color: '#f97316', label: '반복' },
          { color: '#ef4444', label: '미존재' },
        ].map(({ color, label }) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, backgroundColor: color }} />
            {label}
          </span>
        ))}
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
          <span style={{ display: 'inline-block', width: 1, height: 10, backgroundColor: '#f87171' }} />
          오늘
        </span>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', minHeight: 0, alignItems: 'flex-start' }}>

        {/* Name column */}
        <div style={{ width: NAME_COL_WIDTH, flexShrink: 0, borderRight: '1px solid var(--border-light)' }}>
          <div style={{ height: DATE_AXIS_HEIGHT, backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-light)' }} />
          {items.map(item => (
            <div key={item.address} style={{ height: ROW_HEIGHT, display: 'flex', alignItems: 'center', padding: '0 8px', borderBottom: '1px solid var(--border-light)', gap: 4 }}>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: 10, color: item.exists ? 'var(--text-muted)' : '#ef4444', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.address}
                </div>
                {item.summary && (
                  <div style={{ fontSize: 12, color: item.exists ? 'var(--text-primary)' : '#b91c1c', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.summary}
                  </div>
                )}
              </div>
              {!item.exists && (
                <button
                  onClick={() => { const ni = items.filter(i => i.address !== item.address); setItems(ni); autoSave(view, ni); }}
                  title="스케쥴에서 삭제"
                  style={{ flexShrink: 0, padding: '1px 5px', fontSize: 10, color: '#ef4444', background: 'transparent', border: '1px solid #ef4444', borderRadius: 3, cursor: 'pointer' }}
                >삭제</button>
              )}
            </div>
          ))}
        </div>

        {/* Gantt chart */}
        <div ref={chartRef} style={{ flex: 1, position: 'relative', overflowX: 'hidden', overflowY: 'visible', minWidth: 0 }}>

          {/* Date axis */}
          <div style={{ height: DATE_AXIS_HEIGHT, position: 'relative', borderBottom: '1px solid var(--border-light)', backgroundColor: 'var(--bg-tertiary)', overflow: 'hidden' }}>
            {dateLabels.map(({ label, dayOffset }) => (
              <div key={dayOffset} style={{ position: 'absolute', left: `${(dayOffset / view.durationDays) * 100}%`, top: 0, height: '100%', display: 'flex', alignItems: 'center', fontSize: 11, color: 'var(--text-muted)', paddingLeft: 4, pointerEvents: 'none' }}>
                {label}
              </div>
            ))}
            {todayOffset >= 0 && todayOffset < view.durationDays && (
              <div style={{ position: 'absolute', left: `${(todayOffset / view.durationDays) * 100}%`, top: 0, bottom: 0, width: 1, backgroundColor: '#f87171', pointerEvents: 'none' }} />
            )}
          </div>

          {/* Grid + bars */}
          <div style={{ position: 'relative' }}>
            {todayOffset >= 0 && todayOffset < view.durationDays && (
              <div style={{ position: 'absolute', left: `${(todayOffset / view.durationDays) * 100}%`, top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(248,113,113,0.25)', pointerEvents: 'none', zIndex: 0 }} />
            )}
            {dateLabels.map(({ dayOffset }) => (
              <div key={dayOffset} style={{ position: 'absolute', left: `${(dayOffset / view.durationDays) * 100}%`, top: 0, bottom: 0, width: 1, backgroundColor: 'var(--border-light)', pointerEvents: 'none' }} />
            ))}

            {items.map(item => {
              const inView = item.end >= view.startDate && item.start <= addDays(view.startDate, view.durationDays);
              const isDraggingThis = dragState?.address === item.address;
              const activeBgStyle = isDraggingThis ? dragState!.originalBgStyle : barBgStyle(item);
              return (
                <div key={item.address} style={{ height: ROW_HEIGHT, position: 'relative', borderBottom: '1px solid var(--border-light)' }}>
                  {inView && (
                    <div
                      style={{ position: 'absolute', left: barLeft(item.start), width: barWidth(item.start, item.end), top: 5, height: ROW_HEIGHT - 10, ...activeBgStyle, borderRadius: 3, cursor: item.exists && !item.recurringOnly ? 'grab' : 'default', zIndex: 1, display: 'flex', alignItems: 'center', opacity: item.exists ? 1 : 0.75 }}
                      onMouseDown={item.exists && !item.recurringOnly ? (e) => startDrag(e, item, 'move') : undefined}
                    >
                      {item.exists && !item.recurringOnly && <>
                        <div style={{ position: 'absolute', left: 0, top: 0, width: HANDLE_W, height: '100%', cursor: 'ew-resize', zIndex: 2 }} onMouseDown={e => startDrag(e, item, 'start')} />
                        <div style={{ position: 'absolute', right: 0, top: 0, width: HANDLE_W, height: '100%', cursor: 'ew-resize', zIndex: 2 }} onMouseDown={e => startDrag(e, item, 'end')} />
                      </>}
                      <span style={{ fontSize: 10, color: '#fff', paddingLeft: HANDLE_W + 2, paddingRight: HANDLE_W + 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
                        {item.start.slice(5).replace('-', '.')}→{item.end.slice(5).replace('-', '.')}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
