import { useEffect, useState, useCallback, useMemo } from 'react';
import { fetchTree, updateMap, updateWayPoint, fetchWayPoint, addToMap, createSubMap } from '../../api/client';
import type { TreeNode } from '../../types/loadstar';

interface GoalReportProps {
  projectRoot: string;
}

type EditedField = { summary: string; goal: string };
type PendingWp = { mapAddress: string; id: string; summary: string; goal: string };
type PendingMap = { parentMapAddress: string; id: string; summary: string };

const COLOR_TEXT = '#1f2328';
const COLOR_MUTED = '#8c959f';
const COLOR_BORDER = '#d0d7de';
const COLOR_GOAL = '#0550ae';
const COLOR_DWP = '#6f42c1';
const COLOR_DIRTY = '#d4622a';

const STATUS_COLORS: Record<string, string> = {
  S_IDL: '#8c959f',
  S_PRG: '#0076d6',
  S_STB: '#1a7f37',
  S_ERR: '#cf222e',
  S_REV: '#8250df',
};

const PRINT_STYLE = `
@media print {
  body * { visibility: hidden !important; }
  .goal-report-root, .goal-report-root * { visibility: visible !important; }
  .goal-report-root { position: absolute !important; left: 0; top: 0; width: 100% !important; height: auto !important; padding: 12px 24px !important; overflow: visible !important; }
  .goal-report-no-print { display: none !important; }
  .goal-report-todo-body { display: block !important; visibility: visible !important; }
}
`;

const s = {
  container: {
    height: '100%',
    overflow: 'auto',
    background: '#ffffff',
    color: COLOR_TEXT,
    padding: '24px 32px',
    fontFamily: '"Segoe UI", Tahoma, sans-serif',
    fontSize: 13,
    lineHeight: 1.55,
  } as React.CSSProperties,
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: `2px solid ${COLOR_BORDER}`,
    paddingBottom: 12,
    marginBottom: 20,
  } as React.CSSProperties,
  title: { margin: 0, fontSize: 18, fontWeight: 600 } as React.CSSProperties,
  titleRow: { display: 'flex', alignItems: 'center', gap: 10 } as React.CSSProperties,
  editBadge: {
    background: COLOR_DIRTY,
    color: 'white',
    fontSize: 11,
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: 4,
  } as React.CSSProperties,
  dirtyCount: {
    fontSize: 12,
    color: COLOR_DIRTY,
    fontWeight: 500,
  } as React.CSSProperties,
  btnRow: { display: 'flex', gap: 6 } as React.CSSProperties,
  btn: {
    border: `1px solid ${COLOR_BORDER}`,
    background: '#f6f8fa',
    padding: '4px 10px',
    fontSize: 12,
    cursor: 'pointer',
    borderRadius: 4,
  } as React.CSSProperties,
  btnPrimary: {
    border: `1px solid #0969da`,
    background: '#0969da',
    color: 'white',
    padding: '4px 12px',
    fontSize: 12,
    cursor: 'pointer',
    borderRadius: 4,
    fontWeight: 500,
  } as React.CSSProperties,
  btnDanger: {
    border: `1px solid ${COLOR_BORDER}`,
    background: '#f6f8fa',
    color: COLOR_TEXT,
    padding: '4px 10px',
    fontSize: 12,
    cursor: 'pointer',
    borderRadius: 4,
  } as React.CSSProperties,
  saveError: {
    fontSize: 12,
    color: '#cf222e',
    marginLeft: 8,
  } as React.CSSProperties,
  empty: { color: COLOR_MUTED, fontStyle: 'italic' } as React.CSSProperties,
  block: { marginBottom: 18 } as React.CSSProperties,
  addr: { fontFamily: 'Consolas, monospace', fontSize: 12, color: COLOR_MUTED } as React.CSSProperties,
  summary: { fontWeight: 600, marginTop: 2 } as React.CSSProperties,
  goalLine: { color: COLOR_GOAL, marginTop: 2 } as React.CSSProperties,
  goalMissing: { color: COLOR_MUTED, fontStyle: 'italic', marginTop: 2 } as React.CSSProperties,
  dwpLine: { color: COLOR_DWP, fontStyle: 'italic', marginTop: 2 } as React.CSSProperties,
  todoBlock: { marginTop: 6, marginLeft: 4 } as React.CSSProperties,
  todoHeader: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 12,
    color: COLOR_MUTED,
    cursor: 'pointer',
    userSelect: 'none' as const,
    padding: '1px 4px',
    borderRadius: 3,
  } as React.CSSProperties,
  todoToggle: {
    display: 'inline-block',
    width: 12,
    textAlign: 'center' as const,
    fontFamily: 'Consolas, monospace',
    color: COLOR_MUTED,
  } as React.CSSProperties,
  todoItem: { fontSize: 12, margin: '1px 0' } as React.CSSProperties,
  todoDone: { color: COLOR_MUTED, textDecoration: 'line-through' } as React.CSSProperties,
  todoRecurring: { color: '#8250df' } as React.CSSProperties,
  // Edit mode styles
  editInput: {
    width: '100%',
    fontSize: 13,
    fontWeight: 600,
    border: `1px solid ${COLOR_BORDER}`,
    borderRadius: 4,
    padding: '3px 6px',
    boxSizing: 'border-box' as const,
    fontFamily: '"Segoe UI", Tahoma, sans-serif',
    marginTop: 2,
  } as React.CSSProperties,
  editGoal: {
    width: '100%',
    fontSize: 12,
    border: `1px solid ${COLOR_BORDER}`,
    borderRadius: 4,
    padding: '3px 6px',
    boxSizing: 'border-box' as const,
    fontFamily: '"Segoe UI", Tahoma, sans-serif',
    resize: 'vertical' as const,
    minHeight: 44,
    color: COLOR_GOAL,
    marginTop: 2,
  } as React.CSSProperties,
  editGoalLabel: {
    fontSize: 11,
    color: COLOR_MUTED,
    marginTop: 4,
    display: 'block',
  } as React.CSSProperties,
  moveBtn: {
    background: 'none',
    border: `1px solid ${COLOR_BORDER}`,
    borderRadius: 3,
    cursor: 'pointer',
    fontSize: 11,
    padding: '1px 5px',
    lineHeight: 1.2,
    color: COLOR_MUTED,
    minWidth: 22,
  } as React.CSSProperties,
  moveBtnDisabled: {
    opacity: 0.3,
    cursor: 'default',
  } as React.CSSProperties,
  addWpBtn: {
    background: 'none',
    border: `1px dashed ${COLOR_BORDER}`,
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 12,
    padding: '5px 10px',
    color: COLOR_MUTED,
    marginTop: 8,
    width: '100%',
    textAlign: 'left' as const,
  } as React.CSSProperties,
  // Modal styles
  modalOverlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  } as React.CSSProperties,
  modalBox: {
    background: '#fff',
    borderRadius: 8,
    padding: '24px 28px',
    width: 420,
    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
  } as React.CSSProperties,
  modalTitle: { margin: '0 0 16px', fontSize: 15, fontWeight: 600 } as React.CSSProperties,
  modalLabel: { fontSize: 12, color: COLOR_MUTED, display: 'block', marginBottom: 4 } as React.CSSProperties,
  modalInput: {
    width: '100%',
    border: `1px solid ${COLOR_BORDER}`,
    borderRadius: 4,
    padding: '5px 8px',
    fontSize: 13,
    boxSizing: 'border-box' as const,
    fontFamily: '"Segoe UI", Tahoma, sans-serif',
    marginBottom: 12,
  } as React.CSSProperties,
  modalError: { fontSize: 12, color: '#cf222e', marginBottom: 10 } as React.CSSProperties,
  modalBtnRow: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 } as React.CSSProperties,
};

const GoalReport = ({ projectRoot }: GoalReportProps) => {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openTodos, setOpenTodos] = useState<Set<string>>(new Set());

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [editedData, setEditedData] = useState<Map<string, EditedField>>(new Map());
  const [mapOrders, setMapOrders] = useState<Map<string, string[]>>(new Map());
  const [pendingWps, setPendingWps] = useState<PendingWp[]>([]);
  const [pendingMaps, setPendingMaps] = useState<PendingMap[]>([]);
  const [dirtyAddresses, setDirtyAddresses] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Add WP modal state
  const [addWpModal, setAddWpModal] = useState<string | null>(null);
  const [addWpId, setAddWpId] = useState('');
  const [addWpSummary, setAddWpSummary] = useState('');
  const [addWpGoal, setAddWpGoal] = useState('');
  const [addWpError, setAddWpError] = useState('');

  // Add Map modal state
  const [addMapModal, setAddMapModal] = useState<string | null>(null);
  const [addMapId, setAddMapId] = useState('');
  const [addMapSummary, setAddMapSummary] = useState('');
  const [addMapError, setAddMapError] = useState('');

  // Inject print CSS
  useEffect(() => {
    const el = document.createElement('style');
    el.id = 'goal-report-print-style';
    el.textContent = PRINT_STYLE;
    document.head.appendChild(el);
    return () => { document.getElementById('goal-report-print-style')?.remove(); };
  }, []);

  // Flat address → node map
  const nodeMap = useMemo(() => {
    const map = new Map<string, TreeNode>();
    const visit = (node: TreeNode) => {
      map.set(node.address, node);
      node.children?.forEach(visit);
    };
    tree.forEach(visit);
    return map;
  }, [tree]);

  // All known addresses (tree + pending) for duplicate check
  const allKnownAddresses = useMemo(() => {
    const addrs = new Set(nodeMap.keys());
    pendingWps.forEach(w => addrs.add(`W://${w.mapAddress.substring(4)}/${w.id}`));
    pendingMaps.forEach(m => addrs.add(`M://${m.parentMapAddress.substring(4)}/${m.id}`));
    return addrs;
  }, [nodeMap, pendingWps, pendingMaps]);

  const loadTree = useCallback(async () => {
    if (!projectRoot) { setTree([]); return; }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTree(projectRoot);
      setTree(data);
    } catch (err) {
      console.error('Failed to load tree:', err);
      setError('트리 로드 실패');
    } finally {
      setLoading(false);
    }
  }, [projectRoot]);

  useEffect(() => { loadTree(); }, [loadTree]);

  const toggle = (key: string) => {
    setOpenTodos(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  // ── Edit handlers ──────────────────────────────────────────────

  const enterEditMode = () => {
    setEditedData(new Map());
    setMapOrders(new Map());
    setPendingWps([]);
    setPendingMaps([]);
    setDirtyAddresses(new Set());
    setSaveError(null);
    setEditMode(true);
  };

  const cancelEdit = () => {
    setEditMode(false);
    setEditedData(new Map());
    setMapOrders(new Map());
    setPendingWps([]);
    setPendingMaps([]);
    setDirtyAddresses(new Set());
    setSaveError(null);
  };

  const handleFieldChange = (address: string, field: 'summary' | 'goal', value: string, node: TreeNode) => {
    setEditedData(prev => {
      const next = new Map(prev);
      const cur = next.get(address) ?? { summary: node.summary ?? '', goal: node.goal ?? '' };
      next.set(address, { ...cur, [field]: value });
      return next;
    });
    setDirtyAddresses(prev => new Set([...prev, address]));
  };

  const handleMoveWp = (mapAddr: string, currentOrder: string[], idx: number, dir: -1 | 1) => {
    const newOrder = [...currentOrder];
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= newOrder.length) return;
    [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];
    setMapOrders(prev => new Map([...prev, [mapAddr, newOrder]]));
    setDirtyAddresses(prev => new Set([...prev, mapAddr]));
  };

  const openAddWpModal = (mapAddr: string) => {
    setAddWpModal(mapAddr);
    setAddWpId('');
    setAddWpSummary('');
    setAddWpGoal('');
    setAddWpError('');
  };

  const confirmAddWp = () => {
    if (!addWpModal) return;
    const id = addWpId.trim();
    if (!/^[a-z][a-z0-9_]*$/.test(id)) {
      setAddWpError('소문자로 시작, 소문자·숫자·언더스코어만 허용됩니다.');
      return;
    }
    const childAddr = `W://${addWpModal.substring(4)}/${id}`;
    if (allKnownAddresses.has(childAddr)) {
      setAddWpError(`이미 존재하는 주소입니다: ${childAddr}`);
      return;
    }
    const mapNode = nodeMap.get(addWpModal);
    const currentOrder = mapOrders.get(addWpModal) ?? (mapNode?.children.map(c => c.address) ?? []);
    setPendingWps(prev => [...prev, { mapAddress: addWpModal, id, summary: addWpSummary.trim(), goal: addWpGoal.trim() }]);
    setMapOrders(prev => new Map([...prev, [addWpModal, [...currentOrder, childAddr]]]));
    setDirtyAddresses(prev => new Set([...prev, addWpModal]));
    setAddWpModal(null);
  };

  const deletePendingWp = (childAddr: string, parentMapAddr: string) => {
    setPendingWps(prev => prev.filter(w => `W://${w.mapAddress.substring(4)}/${w.id}` !== childAddr));
    setMapOrders(prev => {
      const cur = prev.get(parentMapAddr);
      if (!cur) return prev;
      const next = new Map(prev);
      const filtered = cur.filter(a => a !== childAddr);
      next.set(parentMapAddr, filtered);
      return next;
    });
  };

  const openAddMapModal = (parentMapAddr: string) => {
    setAddMapModal(parentMapAddr);
    setAddMapId('');
    setAddMapSummary('');
    setAddMapError('');
  };

  const confirmAddMap = () => {
    if (!addMapModal) return;
    const id = addMapId.trim();
    if (!/^[a-z][a-z0-9_]*$/.test(id)) {
      setAddMapError('소문자로 시작, 소문자·숫자·언더스코어만 허용됩니다.');
      return;
    }
    const newAddr = `M://${addMapModal.substring(4)}/${id}`;
    if (allKnownAddresses.has(newAddr)) {
      setAddMapError(`이미 존재하는 주소입니다: ${newAddr}`);
      return;
    }
    const mapNode = nodeMap.get(addMapModal);
    const currentOrder = mapOrders.get(addMapModal) ?? (mapNode?.children.map(c => c.address) ?? []);
    setPendingMaps(prev => [...prev, { parentMapAddress: addMapModal, id, summary: addMapSummary.trim() }]);
    setMapOrders(prev => new Map([...prev, [addMapModal, [...currentOrder, newAddr]]]));
    setDirtyAddresses(prev => new Set([...prev, addMapModal]));
    setAddMapModal(null);
  };

  const deletePendingMap = (newAddr: string, parentMapAddr: string) => {
    setPendingMaps(prev => prev.filter(m => `M://${m.parentMapAddress.substring(4)}/${m.id}` !== newAddr));
    setMapOrders(prev => {
      const cur = prev.get(parentMapAddr);
      if (!cur) return prev;
      const next = new Map(prev);
      next.set(parentMapAddr, cur.filter(a => a !== newAddr));
      return next;
    });
  };

  const saveAll = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      // Step 1: create new Maps and skeleton WP files
      for (const m of pendingMaps) {
        await createSubMap(projectRoot, m.parentMapAddress, m.id, m.summary || undefined);
      }
      for (const wp of pendingWps) {
        const childAddr = `W://${wp.mapAddress.substring(4)}/${wp.id}`;
        await addToMap(projectRoot, wp.mapAddress, childAddr, undefined, wp.summary || undefined, wp.goal || undefined);
      }
      // Step 2: patch dirty nodes
      for (const addr of dirtyAddresses) {
        const node = nodeMap.get(addr);
        if (!node) continue;
        const ed = editedData.get(addr);
        if (node.type === 'MAP') {
          const hasOrder = mapOrders.has(addr);
          const summary = ed?.summary ?? node.summary;
          const goal = ed?.goal !== undefined ? (ed.goal || null) : (node.goal ?? null);
          const waypoints = hasOrder ? mapOrders.get(addr) : undefined;
          await updateMap(projectRoot, addr, summary, goal, waypoints);
        } else if (node.type === 'WAYPOINT' && ed) {
          const detail = await fetchWayPoint(projectRoot, addr);
          detail.summary = ed.summary;
          detail.goal = ed.goal || null;
          await updateWayPoint(projectRoot, detail, true);
        }
      }
      // Step 3: reload tree and exit edit mode
      const newTree = await fetchTree(projectRoot);
      setTree(newTree);
      setEditMode(false);
      setEditedData(new Map());
      setMapOrders(new Map());
      setPendingWps([]);
      setPendingMaps([]);
      setDirtyAddresses(new Set());
    } catch (err) {
      console.error('Save failed:', err);
      setSaveError('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // ── Print / Export ─────────────────────────────────────────────

  const handlePrint = () => {
    const el = document.querySelector('.goal-report-root') as HTMLElement;
    if (!el) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Goals Report</title>
<style>body{font-family:"Segoe UI",Tahoma,sans-serif;font-size:13px;line-height:1.55;color:#1f2328;padding:24px 32px;margin:0}.goal-report-no-print{display:none!important}.goal-report-todo-body{display:block!important}</style>
</head><body>${el.innerHTML}</body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  const downloadMarkdown = () => {
    const md = treeToMarkdown(tree);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const ts = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `goals-report-${ts}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ── Render ─────────────────────────────────────────────────────

  if (!projectRoot) return <div style={s.container}><div style={s.empty}>프로젝트를 먼저 선택하세요.</div></div>;
  if (loading) return <div style={s.container}><div style={s.empty}>불러오는 중...</div></div>;
  if (error) return <div style={s.container}><div style={s.empty}>{error}</div></div>;

  const dirtyCount = dirtyAddresses.size;

  return (
    <div className="goal-report-root" style={s.container}>
      {/* Header */}
      <div style={s.header} className="goal-report-no-print">
        <div style={s.titleRow}>
          <h2 style={s.title}>Goals Report</h2>
          {editMode && <span style={s.editBadge}>편집 모드</span>}
          {editMode && dirtyCount > 0 && (
            <span style={s.dirtyCount}>● {dirtyCount}개 항목 변경됨</span>
          )}
        </div>
        <div style={s.btnRow}>
          {!editMode ? (
            <>
              <button style={s.btn} onClick={enterEditMode}>편집</button>
              <button style={s.btn} onClick={handlePrint}>인쇄 / PDF</button>
              <button style={s.btn} onClick={downloadMarkdown}>Markdown 다운로드</button>
            </>
          ) : (
            <>
              {saveError && <span style={s.saveError}>{saveError}</span>}
              <button style={s.btnPrimary} onClick={saveAll} disabled={saving}>
                {saving ? '저장 중...' : '모두 저장'}
              </button>
              <button style={s.btnDanger} onClick={cancelEdit} disabled={saving}>취소</button>
            </>
          )}
        </div>
      </div>

      {/* Tree */}
      {tree.length === 0 ? (
        <div style={s.empty}>표시할 요소가 없습니다.</div>
      ) : (
        tree.map(node => (
          <Node
            key={node.address}
            node={node}
            depth={0}
            openTodos={openTodos}
            onToggle={toggle}
            editMode={editMode}
            editedData={editedData}
            mapOrders={mapOrders}
            pendingWps={pendingWps}
            pendingMaps={pendingMaps}
            dirtyAddresses={dirtyAddresses}
            nodeMap={nodeMap}
            onFieldChange={handleFieldChange}
            onMoveWp={handleMoveWp}
            onAddWp={openAddWpModal}
            onAddMap={openAddMapModal}
            onDeletePendingWp={deletePendingWp}
            onDeletePendingMap={deletePendingMap}
          />
        ))
      )}

      {/* Add WP Modal */}
      {addWpModal && (
        <div style={s.modalOverlay}>
          <div style={s.modalBox}>
            <p style={s.modalTitle}>새 WayPoint 추가</p>
            <span style={{ fontSize: 11, color: COLOR_MUTED, display: 'block', marginBottom: 12 }}>
              부모: <code>{addWpModal}</code>
            </span>
            <label style={s.modalLabel}>ID (영문 소문자·숫자·언더스코어) *</label>
            <input
              style={s.modalInput}
              value={addWpId}
              onChange={e => { setAddWpId(e.target.value); setAddWpError(''); }}
              placeholder="예: new_feature"
              autoFocus
              onKeyDown={e => { if (e.key === 'Escape') setAddWpModal(null); }}
            />
            <label style={s.modalLabel}>SUMMARY</label>
            <input
              style={s.modalInput}
              value={addWpSummary}
              onChange={e => setAddWpSummary(e.target.value)}
              placeholder="간략한 설명"
              onKeyDown={e => { if (e.key === 'Escape') setAddWpModal(null); }}
            />
            <label style={s.modalLabel}>GOAL</label>
            <textarea
              style={{ ...s.modalInput, minHeight: 56, resize: 'vertical', color: COLOR_GOAL }}
              value={addWpGoal}
              onChange={e => setAddWpGoal(e.target.value)}
              placeholder="이 WayPoint가 달성하고자 하는 목표"
              onKeyDown={e => { if (e.key === 'Escape') setAddWpModal(null); }}
            />
            {addWpError && <div style={s.modalError}>{addWpError}</div>}
            <div style={s.modalBtnRow}>
              <button style={s.btn} onClick={() => setAddWpModal(null)}>취소</button>
              <button style={s.btnPrimary} onClick={confirmAddWp}>추가</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Map Modal */}
      {addMapModal && (
        <div style={s.modalOverlay}>
          <div style={s.modalBox}>
            <p style={s.modalTitle}>새 Map 추가</p>
            <span style={{ fontSize: 11, color: COLOR_MUTED, display: 'block', marginBottom: 12 }}>
              부모: <code>{addMapModal}</code>
            </span>
            <label style={s.modalLabel}>ID (영문 소문자·숫자·언더스코어) *</label>
            <input
              style={s.modalInput}
              value={addMapId}
              onChange={e => { setAddMapId(e.target.value); setAddMapError(''); }}
              placeholder="예: new_module"
              autoFocus
              onKeyDown={e => { if (e.key === 'Escape') setAddMapModal(null); }}
            />
            <label style={s.modalLabel}>SUMMARY</label>
            <input
              style={s.modalInput}
              value={addMapSummary}
              onChange={e => setAddMapSummary(e.target.value)}
              placeholder="간략한 설명"
              onKeyDown={e => { if (e.key === 'Escape') setAddMapModal(null); }}
            />
            {addMapError && <div style={s.modalError}>{addMapError}</div>}
            <div style={s.modalBtnRow}>
              <button style={s.btn} onClick={() => setAddMapModal(null)}>취소</button>
              <button style={s.btnPrimary} onClick={confirmAddMap}>추가</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Node Component ──────────────────────────────────────────────

interface NodeProps {
  node: TreeNode;
  depth: number;
  openTodos: Set<string>;
  onToggle: (key: string) => void;
  editMode: boolean;
  editedData: Map<string, EditedField>;
  mapOrders: Map<string, string[]>;
  pendingWps: PendingWp[];
  pendingMaps: PendingMap[];
  dirtyAddresses: Set<string>;
  nodeMap: Map<string, TreeNode>;
  onFieldChange: (address: string, field: 'summary' | 'goal', value: string, node: TreeNode) => void;
  onMoveWp: (mapAddr: string, currentOrder: string[], idx: number, dir: -1 | 1) => void;
  onAddWp: (mapAddr: string) => void;
  onAddMap: (mapAddr: string) => void;
  onDeletePendingWp: (childAddr: string, parentMapAddr: string) => void;
  onDeletePendingMap: (newAddr: string, parentMapAddr: string) => void;
  // When this node is a direct Map child being reordered
  reorderCtx?: { idx: number; total: number; currentOrder: string[]; parentMapAddr: string };
}

const Node = ({
  node, depth, openTodos, onToggle,
  editMode, editedData, mapOrders, pendingWps, pendingMaps, dirtyAddresses, nodeMap,
  onFieldChange, onMoveWp, onAddWp, onAddMap, onDeletePendingWp, onDeletePendingMap,
  reorderCtx,
}: NodeProps) => {
  const indent = depth * 24;
  const isDirty = dirtyAddresses.has(node.address);
  const ed = editedData.get(node.address);
  const displaySummary = ed?.summary ?? node.summary ?? '';
  const displayGoal = ed?.goal ?? node.goal ?? '';

  // DWP: always read-only
  if (node.type === 'DWP') {
    return (
      <div style={{ ...s.block, marginLeft: indent }}>
        <div style={s.addr}>{node.address}</div>
        <div style={s.dwpLine}>📊 {node.summary || '(설명 없음)'}</div>
      </div>
    );
  }

  const isMap = node.type === 'MAP';
  const goal = node.goal?.trim();
  const todos = node.todos ?? [];
  const tasks = todos.filter(t => !t.recurring);
  const recurring = todos.filter(t => t.recurring);
  const tasksKey = `${node.address}:tasks`;
  const recurringKey = `${node.address}:recurring`;
  const tasksOpen = openTodos.has(tasksKey);
  const recurringOpen = openTodos.has(recurringKey);

  // Children in edit mode: use mapOrders if available, else original
  const childAddresses = isMap && editMode
    ? (mapOrders.get(node.address) ?? node.children.map(c => c.address))
    : node.children.map(c => c.address);

  const childSharedProps = {
    openTodos, onToggle, editMode, editedData, mapOrders, pendingWps, pendingMaps,
    dirtyAddresses, nodeMap, onFieldChange, onMoveWp, onAddWp, onAddMap,
    onDeletePendingWp, onDeletePendingMap,
  };

  return (
    <div style={{ ...s.block, marginLeft: indent }}>
      {/* Address row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {editMode && reorderCtx && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginRight: 4 }}>
            <button
              style={{ ...s.moveBtn, ...(reorderCtx.idx === 0 ? s.moveBtnDisabled : {}) }}
              disabled={reorderCtx.idx === 0}
              onClick={() => onMoveWp(reorderCtx.parentMapAddr, reorderCtx.currentOrder, reorderCtx.idx, -1)}
            >↑</button>
            <button
              style={{ ...s.moveBtn, ...(reorderCtx.idx === reorderCtx.total - 1 ? s.moveBtnDisabled : {}) }}
              disabled={reorderCtx.idx === reorderCtx.total - 1}
              onClick={() => onMoveWp(reorderCtx.parentMapAddr, reorderCtx.currentOrder, reorderCtx.idx, 1)}
            >↓</button>
          </div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            {editMode && isDirty && <span style={{ color: COLOR_DIRTY, fontSize: 10, marginRight: 4 }}>●</span>}
            <span style={s.addr}>{isMap ? '📁 ' : '◆ '}{node.address}</span>
            {editMode && (
              <span style={{
                background: STATUS_COLORS[node.status] ?? '#8c959f',
                color: 'white',
                padding: '1px 5px',
                borderRadius: 3,
                fontSize: 10,
                marginLeft: 6,
                fontWeight: 500,
              }}>
                {node.status}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* SUMMARY */}
      {editMode ? (
        <input
          style={s.editInput}
          value={displaySummary}
          onChange={e => onFieldChange(node.address, 'summary', e.target.value, node)}
          placeholder="SUMMARY"
        />
      ) : (
        <div style={s.summary}>{node.summary || '(SUMMARY 없음)'}</div>
      )}

      {/* GOAL */}
      {editMode ? (
        <>
          <span style={s.editGoalLabel}>🎯 GOAL</span>
          <textarea
            style={s.editGoal}
            value={displayGoal}
            onChange={e => onFieldChange(node.address, 'goal', e.target.value, node)}
            placeholder="GOAL 입력..."
            rows={2}
          />
        </>
      ) : (
        goal
          ? <div style={s.goalLine}>🎯 {goal}</div>
          : <div style={s.goalMissing}>🎯 GOAL (미지정)</div>
      )}

      {/* TODO sections (view mode only) */}
      {!editMode && !isMap && tasks.length > 0 && (
        <div style={s.todoBlock}>
          <div style={s.todoHeader} onClick={() => onToggle(tasksKey)}>
            <span style={s.todoToggle}>{tasksOpen ? '−' : '+'}</span>
            <span>TODO ({tasks.filter(t => t.done).length}/{tasks.length})</span>
          </div>
          <div className="goal-report-todo-body" style={{ marginTop: 2, display: tasksOpen ? 'block' : 'none' }}>
            {tasks.map((t, i) => (
              <div key={i} style={{ ...s.todoItem, ...(t.done ? s.todoDone : {}) }}>
                {t.done ? '✓' : '☐'} {t.text}
              </div>
            ))}
          </div>
        </div>
      )}
      {!editMode && !isMap && recurring.length > 0 && (
        <div style={s.todoBlock}>
          <div style={s.todoHeader} onClick={() => onToggle(recurringKey)}>
            <span style={s.todoToggle}>{recurringOpen ? '−' : '+'}</span>
            <span>RECURRING ({recurring.length})</span>
          </div>
          <div className="goal-report-todo-body" style={{ marginTop: 2, display: recurringOpen ? 'block' : 'none' }}>
            {recurring.map((t, i) => (
              <div key={i} style={{ ...s.todoItem, ...s.todoRecurring }}>↻ {t.text}</div>
            ))}
          </div>
        </div>
      )}

      {/* Children */}
      {(childAddresses.length > 0 || (editMode && isMap)) && (
        <div style={{ marginTop: 10 }}>
          {childAddresses.map((childAddr, idx) => {
            const childNode = nodeMap.get(childAddr);
            const pendingWp = pendingWps.find(
              w => `W://${w.mapAddress.substring(4)}/${w.id}` === childAddr
            );

            const pendingMap = pendingMaps.find(
              m => `M://${m.parentMapAddress.substring(4)}/${m.id}` === childAddr
            );

            if (!childNode && (pendingWp || pendingMap)) {
              const isPendingMap = !!pendingMap;
              const label = isPendingMap ? `📁 ${childAddr}` : `◆ ${childAddr}`;
              const displaySummary = isPendingMap
                ? (pendingMap!.summary || '(내용 미입력)')
                : (pendingWp!.summary || '(내용 미입력)');
              return (
                <div key={childAddr} style={{ marginLeft: 0, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginRight: 4 }}>
                      <button style={{ ...s.moveBtn, ...s.moveBtnDisabled }} disabled>↑</button>
                      <button style={{ ...s.moveBtn, ...s.moveBtnDisabled }} disabled>↓</button>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ color: COLOR_DIRTY, fontSize: 10 }}>●</span>
                        <span style={{ ...s.addr, color: COLOR_DWP }}>{label}</span>
                        <span style={{ background: '#6f42c1', color: 'white', padding: '1px 5px', borderRadius: 3, fontSize: 10 }}>NEW</span>
                        <button
                          onClick={() => isPendingMap
                            ? onDeletePendingMap(childAddr, node.address)
                            : onDeletePendingWp(childAddr, node.address)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cf222e', fontSize: 13, lineHeight: 1, padding: '0 2px', marginLeft: 'auto' }}
                          title="삭제"
                        >×</button>
                      </div>
                      <div style={{ ...s.summary, color: COLOR_DWP }}>{displaySummary}</div>
                    </div>
                  </div>
                </div>
              );
            }

            if (!childNode) return null;

            return (
              <Node
                key={childAddr}
                node={childNode}
                depth={depth + 1}
                {...childSharedProps}
                reorderCtx={editMode && isMap ? {
                  idx,
                  total: childAddresses.length,
                  currentOrder: childAddresses,
                  parentMapAddr: node.address,
                } : undefined}
              />
            );
          })}

          {/* + WP / Map 추가 버튼 (Map nodes in edit mode) */}
          {editMode && isMap && (
            <div style={{ marginLeft: (depth + 1) * 24, display: 'flex', gap: 6 }}>
              <button style={s.addWpBtn} onClick={() => onAddWp(node.address)}>
                + WP 추가
              </button>
              <button style={s.addWpBtn} onClick={() => onAddMap(node.address)}>
                + Map 추가
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Markdown serialization ──────────────────────────────────────

function treeToMarkdown(tree: TreeNode[]): string {
  const out: string[] = ['# Goals Report', '', `Generated: ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`, ''];
  for (const node of tree) renderMd(node, 0, out);
  return out.join('\n');
}

function renderMd(node: TreeNode, depth: number, out: string[]): void {
  if (node.type === 'DWP') {
    const indent = '  '.repeat(depth);
    out.push(`${indent}- 📊 \`${node.address}\` — ${node.summary || '(설명 없음)'}`);
    return;
  }
  const heading = '#'.repeat(Math.min(depth + 2, 6));
  const icon = node.type === 'MAP' ? '📁' : '◆';
  out.push(`${heading} ${icon} \`${node.address}\``);
  out.push('');
  out.push(`**${node.summary || '(SUMMARY 없음)'}**`);
  out.push('');
  out.push(node.goal?.trim() ? `🎯 ${node.goal.trim()}` : `🎯 _(GOAL 미지정)_`);
  out.push('');
  const todos = node.todos ?? [];
  const tasks = todos.filter(t => !t.recurring);
  const recurring = todos.filter(t => t.recurring);
  if (node.type === 'WAYPOINT' && tasks.length > 0) {
    out.push(`**TODO** (${tasks.filter(t => t.done).length}/${tasks.length})`);
    out.push('');
    for (const t of tasks) out.push(`- [${t.done ? 'x' : ' '}] ${t.text}`);
    out.push('');
  }
  if (node.type === 'WAYPOINT' && recurring.length > 0) {
    out.push(`**RECURRING** (${recurring.length})`);
    out.push('');
    for (const t of recurring) out.push(`- (R) ${t.text}`);
    out.push('');
  }
  for (const c of node.children ?? []) renderMd(c, depth + 1, out);
}

export default GoalReport;
