import { useState, useEffect } from 'react';
import { fetchWayPoint, updateWayPoint, fetchGitHistory, fetchGitVersion, browseDirectory, fetchReferences, deleteWayPoint, fetchAddresses, patchParent, addChild, removeChild, type WayPointDetail, type GitCommitEntry, type DirEntry, type ReferenceInfo } from '../../api/client';
import { statusOptions, getStatusLabel, getStatusColor } from '../../data/status-labels';
import type { Tab } from '../../App';
import { Diamond, FolderOpen, Folder, Check, Circle, CaretDown, CaretRight, Trash } from '@phosphor-icons/react';

interface WayPointEditorProps {
  projectRoot: string;
  address: string;
  onOpenTab?: (tab: Tab) => void;
}

// ===== Styles =====
const s = {
  section: { marginBottom: 20 } as React.CSSProperties,
  sectionHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 8, borderBottom: '1px solid var(--border-light)', paddingBottom: 4,
  } as React.CSSProperties,
  sectionTitle: { fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' } as React.CSSProperties,
  headerBtns: { display: 'flex', gap: 4 } as React.CSSProperties,
  btn: {
    padding: '2px 8px', border: '1px solid var(--border-medium)', borderRadius: 3,
    background: 'var(--bg-surface)', fontSize: 11, cursor: 'pointer', color: 'var(--text-secondary)',
  } as React.CSSProperties,
  btnPrimary: {
    padding: '2px 8px', border: '1px solid var(--accent-primary)', borderRadius: 3,
    background: 'var(--accent-bg)', fontSize: 11, cursor: 'pointer', color: 'var(--accent-primary)', fontWeight: 600,
  } as React.CSSProperties,
  btnDanger: {
    padding: '2px 8px', border: '1px solid var(--status-error)', borderRadius: 3,
    background: '#b54a3f10', fontSize: 11, cursor: 'pointer', color: 'var(--status-error)',
  } as React.CSSProperties,
  label: { fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 } as React.CSSProperties,
  value: { fontSize: 13, color: 'var(--text-primary)', marginBottom: 8 } as React.CSSProperties,
  link: { fontSize: 13, color: 'var(--accent-primary)', cursor: 'pointer', textDecoration: 'underline' } as React.CSSProperties,
  input: {
    width: '100%', padding: '4px 8px', border: '1px solid var(--border-medium)', borderRadius: 4,
    fontSize: 13, fontFamily: 'inherit', background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none',
  } as React.CSSProperties,
  inputSm: {
    padding: '3px 6px', border: '1px solid var(--border-medium)', borderRadius: 3,
    fontSize: 12, fontFamily: 'inherit', background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none',
  } as React.CSSProperties,
  textarea: {
    width: '100%', padding: '6px 8px', border: '1px solid var(--border-medium)', borderRadius: 4,
    fontSize: 13, fontFamily: 'inherit', background: 'var(--bg-surface)', color: 'var(--text-primary)',
    outline: 'none', resize: 'vertical' as const, minHeight: 60,
  } as React.CSSProperties,
  select: {
    padding: '3px 6px', border: '1px solid var(--border-medium)', borderRadius: 3,
    fontSize: 12, background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none',
  } as React.CSSProperties,
  badge: (color: string) => ({
    fontSize: 11, padding: '1px 8px', background: color + '20', color, borderRadius: 3, fontWeight: 600, display: 'inline-block',
  }) as React.CSSProperties,
  progressBar: { height: 6, borderRadius: 3, background: 'var(--bg-tertiary)', overflow: 'hidden', marginBottom: 8 } as React.CSSProperties,
  progressFill: (pct: number) => ({
    height: '100%', width: `${pct}%`, background: pct === 100 ? 'var(--status-stable)' : 'var(--accent-primary)', borderRadius: 3,
  }) as React.CSSProperties,
  checkRow: { padding: '3px 0', display: 'flex', alignItems: 'flex-start', gap: 6 } as React.CSSProperties,
  empty: { fontSize: 12, color: 'var(--text-muted)', padding: '4px 0', fontStyle: 'italic' as const } as React.CSSProperties,
};

export default function WayPointEditor({ projectRoot, address, onOpenTab }: WayPointEditorProps) {
  const [data, setData] = useState<WayPointDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit modes
  const [editIdentity, setEditIdentity] = useState(false);
  const [editComment, setEditComment] = useState(false);
  const [editTodoSummary, setEditTodoSummary] = useState(false);

  // Edit buffers
  const [editStatus, setEditStatus] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editGoal, setEditGoal] = useState('');
  const [editVersion, setEditVersion] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [editSyncedAt, setEditSyncedAt] = useState('');
  const [editCommentText, setEditCommentText] = useState('');
  const [editTodoSummaryText, setEditTodoSummaryText] = useState('');

  // TODO editing (변수명은 후속 리네임 WP에서 정리)
  const [techSpecItems, setTechSpecItems] = useState<{ text: string; done: boolean; recurring?: boolean }[]>([]);
  const [selectedTechSpec, setSelectedTechSpec] = useState<Set<number>>(new Set());
  const [editingTechSpec, setEditingTechSpec] = useState<number | null>(null);
  const [editTechSpecText, setEditTechSpecText] = useState('');
  const [focusedTechSpec, setFocusedTechSpec] = useState<number | null>(null);
  const [newTechSpec, setNewTechSpec] = useState('');
  const [techSpecFilter, setTechSpecFilter] = useState('');

  // CODE_MAP editing
  const [codeMapScopes, setCodeMapScopes] = useState<string[]>([]);
  const [editCodeMap, setEditCodeMap] = useState(false);
  const [newScope, setNewScope] = useState('');
  const [showDirBrowser, setShowDirBrowser] = useState(false);
  const [dirBrowserPath, setDirBrowserPath] = useState('');
  const [dirBrowserParent, setDirBrowserParent] = useState<string | null>(null);
  const [dirBrowserEntries, setDirBrowserEntries] = useState<DirEntry[]>([]);
  const [dirBrowserLoading, setDirBrowserLoading] = useState(false);

  // ATTACHMENTS editing
  const [attachments, setAttachments] = useState<string[]>([]);
  const [editAttachments, setEditAttachments] = useState(false);
  const [newAttachment, setNewAttachment] = useState('');
  const [editingAttachmentIdx, setEditingAttachmentIdx] = useState<number | null>(null);
  const [editAttachmentText, setEditAttachmentText] = useState('');

  // ISSUE editing
  const [issues, setIssues] = useState<string[]>([]);
  const [selectedIssues, setSelectedIssues] = useState<Set<number>>(new Set());
  const [editingIssue, setEditingIssue] = useState<number | null>(null);
  const [editIssueText, setEditIssueText] = useState('');
  const [newIssue, setNewIssue] = useState('');

  // OPEN_QUESTIONS editing
  const [openQuestions, setOpenQuestions] = useState<{ id: string; text: string; resolved: boolean }[]>([]);
  const [newOqText, setNewOqText] = useState('');

  // CONNECTIONS editing
  const [editConnections, setEditConnections] = useState(false);
  const [connLoading, setConnLoading] = useState(false);
  const [connError, setConnError] = useState<string | null>(null);
  const [allAddresses, setAllAddresses] = useState<string[]>([]);
  const [editParent, setEditParent] = useState<string>('');
  const [editChildren, setEditChildren] = useState<string[]>([]);
  const [addChildInput, setAddChildInput] = useState('');

  // Delete WP
  const [deleteModal, setDeleteModal] = useState<'idle' | 'checking' | 'blocked' | 'confirm'>('idle');
  const [deleteRefs, setDeleteRefs] = useState<ReferenceInfo[]>([]);
  const [deleting, setDeleting] = useState(false);

  // Git History
  const [gitHistory, setGitHistory] = useState<GitCommitEntry[]>([]);
  const [gitExpanded, setGitExpanded] = useState(false);
  const [gitLoading, setGitLoading] = useState(false);
  const [viewingCommit, setViewingCommit] = useState<GitCommitEntry | null>(null);
  const [gitVersionLoading, setGitVersionLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchWayPoint(projectRoot, address)
      .then(d => {
        setData(d);
        setTechSpecItems(d.techSpec.map(t => ({ ...t })));
        setIssues([...d.issues]);
        setOpenQuestions(d.openQuestions.map(q => ({ ...q })));
        setCodeMapScopes([...(d.codeMapScopes || [])]);
        setAttachments([...(d.attachments || [])]);
      })
      .catch(e => setError(e.message || 'Failed to load'))
      .finally(() => setLoading(false));
    // Load git history
    setGitLoading(true);
    fetchGitHistory(projectRoot, address)
      .then(setGitHistory)
      .catch(() => setGitHistory([]))
      .finally(() => setGitLoading(false));
  }, [projectRoot, address]);

  const saveToServer = async (patch: Partial<WayPointDetail>, skipHistory = false) => {
    if (!data) return;
    setSaving(true);
    try {
      const payload: WayPointDetail = { ...data, ...patch };
      const updated = await updateWayPoint(projectRoot, payload, skipHistory);
      setData(updated);
      setTechSpecItems(updated.techSpec.map(t => ({ ...t })));
      setIssues([...updated.issues]);
      setOpenQuestions(updated.openQuestions.map(q => ({ ...q })));
      setCodeMapScopes([...(updated.codeMapScopes || [])]);
      setAttachments([...(updated.attachments || [])]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const loadGitVersion = async (commit: GitCommitEntry) => {
    setGitVersionLoading(true);
    try {
      const d = await fetchGitVersion(projectRoot, address, commit.hash);
      setData(d);
      setTechSpecItems(d.techSpec.map(t => ({ ...t })));
      setIssues([...d.issues]);
      setOpenQuestions(d.openQuestions.map(q => ({ ...q })));
      setAttachments([...(d.attachments || [])]);
      setViewingCommit(commit);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load version');
    } finally {
      setGitVersionLoading(false);
    }
  };

  const restoreCurrent = async () => {
    setViewingCommit(null);
    setLoading(true);
    setError(null);
    try {
      const d = await fetchWayPoint(projectRoot, address);
      setData(d);
      setTechSpecItems(d.techSpec.map(t => ({ ...t })));
      setIssues([...d.issues]);
      setOpenQuestions(d.openQuestions.map(q => ({ ...q })));
      setAttachments([...(d.attachments || [])]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const isReadOnly = viewingCommit !== null;

  const openDirBrowser = async () => {
    setShowDirBrowser(true);
    setDirBrowserLoading(true);
    try {
      const res = await browseDirectory(projectRoot);
      setDirBrowserPath(res.path);
      setDirBrowserParent(null); // don't go above project root
      setDirBrowserEntries(res.entries);
    } catch { /* ignore */ }
    finally { setDirBrowserLoading(false); }
  };

  const browseDirTo = async (path: string) => {
    setDirBrowserLoading(true);
    try {
      const res = await browseDirectory(path);
      setDirBrowserPath(res.path);
      // Only allow going up to project root
      setDirBrowserParent(res.parent && res.path !== projectRoot ? res.parent : null);
      setDirBrowserEntries(res.entries);
    } catch { /* ignore */ }
    finally { setDirBrowserLoading(false); }
  };

  const selectDirAsScope = () => {
    if (!dirBrowserPath) return;
    // Convert absolute path to relative from project root
    let relative = dirBrowserPath.replace(/\\/g, '/');
    const root = projectRoot.replace(/\\/g, '/');
    if (relative.startsWith(root)) {
      relative = relative.substring(root.length);
      if (relative.startsWith('/')) relative = relative.substring(1);
    }
    if (relative && !relative.endsWith('/')) relative += '/';
    if (relative && !codeMapScopes.includes(relative)) {
      setCodeMapScopes([...codeMapScopes, relative]);
    }
    setShowDirBrowser(false);
  };

  // --- CONNECTIONS edit handlers ---
  const startEditConnections = async () => {
    if (!data) return;
    setConnLoading(true);
    setConnError(null);
    try {
      const addrs = await fetchAddresses(projectRoot);
      setAllAddresses(addrs);
      setEditParent(data.parent || '');
      setEditChildren([...(data.children || [])]);
      setEditConnections(true);
    } catch {
      setConnError('주소 목록 로드 실패');
    } finally {
      setConnLoading(false);
    }
  };

  const cancelEditConnections = () => {
    setEditConnections(false);
    setConnError(null);
    setAddChildInput('');
  };

  const saveConnections = async () => {
    if (!data) return;
    setConnLoading(true);
    setConnError(null);
    try {
      const oldParent = data.parent || '';
      const newParent = editParent;

      // PARENT change
      if (oldParent !== newParent) {
        const r = await patchParent(projectRoot, address, newParent || null);
        if (!r.success) throw new Error(r.error || 'PARENT 변경 실패');
      }

      // CHILDREN: add new ones
      const oldChildren = data.children || [];
      for (const c of editChildren) {
        if (!oldChildren.includes(c)) {
          const r = await addChild(projectRoot, address, c);
          if (!r.success) throw new Error(r.error || 'CHILDREN 추가 실패');
        }
      }
      // CHILDREN: remove deleted ones
      for (const c of oldChildren) {
        if (!editChildren.includes(c)) {
          const r = await removeChild(projectRoot, address, c);
          if (!r.success) throw new Error(r.error || 'CHILDREN 제거 실패');
        }
      }

      // Reload WP data
      const updated = await fetchWayPoint(projectRoot, address);
      setData(updated);
      setTechSpecItems(updated.techSpec.map(t => ({ ...t })));
      setIssues([...updated.issues]);
      setOpenQuestions(updated.openQuestions.map(q => ({ ...q })));
      setCodeMapScopes([...(updated.codeMapScopes || [])]);
      setEditConnections(false);
      setAddChildInput('');
    } catch (e) {
      setConnError(e instanceof Error ? e.message : '저장 실패');
    } finally {
      setConnLoading(false);
    }
  };

  const handleDeleteClick = async () => {
    setDeleteModal('checking');
    try {
      const refs = await fetchReferences(projectRoot, address);
      setDeleteRefs(refs);
      setDeleteModal(refs.length > 0 ? 'blocked' : 'confirm');
    } catch {
      setDeleteModal('idle');
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await deleteWayPoint(projectRoot, address);
      // Signal parent to refresh tree — reload page as fallback
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : '삭제 실패');
      setDeleteModal('idle');
    } finally {
      setDeleting(false);
    }
  };

  const navigateTo = (addr: string) => {
    if (!onOpenTab || !addr) return;
    let type: Tab['type'] = 'waypoint';
    if (addr.startsWith('M://')) type = 'map';
    else if (addr.startsWith('D://')) type = 'dwp';
    onOpenTab({ id: addr, title: addr.split('/').pop() || addr, type, address: addr });
  };

  if (loading || gitVersionLoading) return <div style={{ color: 'var(--text-muted)', padding: 12 }}>Loading...</div>;
  if (error || !data) return <div style={{ color: 'var(--status-error)', padding: 12 }}>Error: {error}</div>;

  const color = getStatusColor(data.status);
  const checkableItems = techSpecItems.filter(t => !t.recurring);
  const done = checkableItems.filter(t => t.done).length;
  const total = checkableItems.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  // --- Identity edit handlers ---
  const startEditIdentity = () => {
    setEditStatus(data.status);
    setEditSummary(data.summary || '');
    setEditGoal(data.goal || '');
    setEditVersion(data.version || '');
    setEditPriority(data.priority || '');
    setEditSyncedAt(data.syncedAt || '');
    setEditIdentity(true);
  };
  const cancelEditIdentity = () => setEditIdentity(false);
  const saveIdentity = () => {
    saveToServer({ status: editStatus, summary: editSummary, goal: editGoal || null, version: editVersion, priority: editPriority, syncedAt: editSyncedAt });
    setEditIdentity(false);
  };

  // --- Comment edit handlers ---
  const startEditComment = () => {
    setEditCommentText(data.comment || '');
    setEditComment(true);
  };
  const cancelEditComment = () => setEditComment(false);
  const saveComment = () => {
    saveToServer({ comment: editCommentText || null });
    setEditComment(false);
  };

  // --- TODO summary edit ---
  const startEditTodoSummary = () => {
    setEditTodoSummaryText(data.todoSummary || '');
    setEditTodoSummary(true);
  };
  const cancelEditTodoSummary = () => setEditTodoSummary(false);
  const saveTodoSummary = () => {
    saveToServer({ todoSummary: editTodoSummaryText });
    setEditTodoSummary(false);
  };

  // --- TODO handlers ---
  const toggleTechSpec = (idx: number) => {
    const updated = techSpecItems.map((item, i) => i === idx ? { ...item, done: !item.done } : item);
    setTechSpecItems(updated);
    saveToServer({ techSpec: updated });
  };
  const toggleSelectTechSpec = (idx: number) => {
    setSelectedTechSpec(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };
  const doneSelectedTechSpec = () => {
    const updated = techSpecItems.map((item, i) =>
      selectedTechSpec.has(i) && !item.recurring ? { ...item, done: true } : item
    );
    setTechSpecItems(updated);
    setSelectedTechSpec(new Set());
    saveToServer({ techSpec: updated });
  };
  const deleteSelectedTechSpec = () => {
    const updated = techSpecItems.filter((_, i) => !selectedTechSpec.has(i));
    setTechSpecItems(updated);
    setSelectedTechSpec(new Set());
    saveToServer({ techSpec: updated }, true); // skipHistory=true → history 없이 삭제
  };
  const startEditTechSpecItem = (idx: number) => {
    setEditingTechSpec(idx);
    setEditTechSpecText(techSpecItems[idx].text);
    setFocusedTechSpec(null);
  };
  const saveEditTechSpecItem = () => {
    if (editingTechSpec !== null) {
      const updated = techSpecItems.map((item, i) => i === editingTechSpec ? { ...item, text: editTechSpecText } : item);
      setTechSpecItems(updated);
      setEditingTechSpec(null);
      saveToServer({ techSpec: updated });
    }
  };
  const addTechSpec = () => {
    if (newTechSpec.trim()) {
      const updated = [...techSpecItems, { text: newTechSpec.trim(), done: false, recurring: false }];
      setTechSpecItems(updated);
      setNewTechSpec('');
      saveToServer({ techSpec: updated });
    }
  };

  const addRecurringTechSpec = () => {
    if (newTechSpec.trim()) {
      const updated = [...techSpecItems, { text: newTechSpec.trim(), done: false, recurring: true }];
      setTechSpecItems(updated);
      setNewTechSpec('');
      saveToServer({ techSpec: updated });
    }
  };

  // --- ISSUE handlers ---
  const toggleSelectIssue = (idx: number) => {
    setSelectedIssues(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };
  const deleteSelectedIssues = () => {
    const updated = issues.filter((_, i) => !selectedIssues.has(i));
    setIssues(updated);
    setSelectedIssues(new Set());
    saveToServer({ issues: updated });
  };
  const startEditIssueItem = (idx: number) => {
    setEditingIssue(idx);
    setEditIssueText(issues[idx]);
  };
  const saveEditIssueItem = () => {
    if (editingIssue !== null) {
      const updated = issues.map((item, i) => i === editingIssue ? editIssueText : item);
      setIssues(updated);
      setEditingIssue(null);
      saveToServer({ issues: updated });
    }
  };
  const addIssue = () => {
    if (newIssue.trim()) {
      const updated = [...issues, newIssue.trim()];
      setIssues(updated);
      setNewIssue('');
      saveToServer({ issues: updated });
    }
  };

  // --- OPEN_QUESTIONS handlers ---
  const toggleOqResolved = (idx: number) => {
    const updated = openQuestions.map((q, i) => i === idx ? { ...q, resolved: !q.resolved } : q);
    setOpenQuestions(updated);
    saveToServer({ openQuestions: updated });
  };
  const addOpenQuestion = () => {
    if (newOqText.trim()) {
      const nextId = `Q${openQuestions.length + 1}`;
      const updated = [...openQuestions, { id: nextId, text: newOqText.trim(), resolved: false }];
      setOpenQuestions(updated);
      setNewOqText('');
      saveToServer({ openQuestions: updated });
    }
  };

  return (
    <div style={{ fontSize: 13 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Diamond size={16} color="#3a7ca5" />
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{address.split('/').pop()}</span>
        <span style={s.badge(color)}>{getStatusLabel(data.status)}</span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: isReadOnly ? 8 : 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>{address}</span>
        {saving && <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Saving...</span>}
        {!isReadOnly && (
          <button
            onClick={handleDeleteClick}
            style={{ ...s.btnDanger, marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}
            title="WayPoint 물리 삭제"
          >
            <Trash size={11} /> 삭제
          </button>
        )}
      </div>

      {/* Delete WP modals */}
      {deleteModal !== 'idle' && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'var(--bg-primary)', border: '1px solid var(--border-medium)',
            borderRadius: 8, padding: 24, width: 440, boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          }}>
            {deleteModal === 'checking' && <div style={{ color: 'var(--text-muted)' }}>참조 확인 중...</div>}

            {deleteModal === 'blocked' && (
              <>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--status-error)', marginBottom: 12 }}>
                  삭제 차단 — {deleteRefs.length}개 요소가 이 WP를 참조 중입니다
                </div>
                <ul style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16, paddingLeft: 20 }}>
                  {deleteRefs.map(r => <li key={r.address}>{r.address} — {r.summary}</li>)}
                </ul>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
                  참조를 먼저 제거한 뒤 삭제하세요.
                </div>
                <button style={s.btn} onClick={() => setDeleteModal('idle')}>닫기</button>
              </>
            )}

            {deleteModal === 'confirm' && (
              <>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>WayPoint 삭제</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                  <strong>{address}</strong> 를 물리적으로 삭제합니다. 이 작업은 되돌릴 수 없습니다.
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button style={s.btn} onClick={() => setDeleteModal('idle')}>취소</button>
                  <button style={s.btnDanger} onClick={handleDeleteConfirm} disabled={deleting}>
                    {deleting ? '삭제 중...' : '삭제'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Read-only banner for historical version */}
      {isReadOnly && viewingCommit && (
        <div style={{
          background: '#e8f4fd', border: '1px solid #90caf9', borderRadius: 6,
          padding: '8px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 12, color: '#1565c0' }}>
            과거 버전 보기 중 — {viewingCommit.date.substring(0, 19)} ({viewingCommit.hash.substring(0, 7)}) {viewingCommit.message}
          </span>
          <button
            style={{ fontSize: 11, padding: '3px 10px', background: '#1976d2', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600, color: '#fff' }}
            onClick={restoreCurrent}
          >
            현재 버전으로 돌아가기
          </button>
        </div>
      )}

      {/* ===== GIT HISTORY ===== */}
      {gitHistory.length > 0 && (
        <div style={{ ...s.section, marginBottom: 12 }}>
          <div
            style={{ ...s.sectionHeader, cursor: 'pointer', userSelect: 'none' }}
            onClick={() => setGitExpanded(!gitExpanded)}
          >
            <span style={s.sectionTitle}>
              <span style={{ marginRight: 6, fontSize: 10 }}>{gitExpanded ? <CaretDown size={10} /> : <CaretRight size={10} />}</span>
              GIT HISTORY ({gitHistory.length})
            </span>
            {gitLoading && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>loading...</span>}
          </div>
          {gitExpanded && (
            <div style={{ maxHeight: 200, overflowY: 'auto', fontSize: 11 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '2px 6px', fontWeight: 500, width: 140 }}>Date</th>
                    <th style={{ padding: '2px 6px', fontWeight: 500, width: 90 }}>Author</th>
                    <th style={{ padding: '2px 6px', fontWeight: 500 }}>Message</th>
                    <th style={{ padding: '2px 6px', fontWeight: 500, width: 70 }}>Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {gitHistory.map(c => (
                    <tr
                      key={c.hash}
                      style={{
                        borderBottom: '1px solid var(--border-light)',
                        cursor: 'pointer',
                        background: viewingCommit?.hash === c.hash ? 'var(--accent-bg)' : 'transparent',
                      }}
                      onClick={() => loadGitVersion(c)}
                    >
                      <td style={{ padding: '3px 6px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{c.date.substring(0, 19)}</td>
                      <td style={{ padding: '3px 6px', color: 'var(--text-secondary)' }}>{c.author}</td>
                      <td style={{ padding: '3px 6px', color: 'var(--text-primary)' }}>{c.message}</td>
                      <td style={{ padding: '3px 6px', fontFamily: 'monospace', color: 'var(--accent-primary)', fontSize: 10 }}>{c.hash.substring(0, 7)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===== IDENTITY ===== */}
      <div style={s.section}>
        <div style={s.sectionHeader}>
          <span style={s.sectionTitle}>IDENTITY</span>
          <div style={s.headerBtns}>
            {!isReadOnly && (editIdentity ? (
              <>
                <button style={s.btnPrimary} onClick={saveIdentity}>Save</button>
                <button style={s.btn} onClick={cancelEditIdentity}>Cancel</button>
              </>
            ) : (
              <button style={s.btn} onClick={startEditIdentity}>Edit</button>
            ))}
          </div>
        </div>
        {editIdentity ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div>
              <div style={s.label}>Status</div>
              <select style={s.select} value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                {statusOptions.map(st => <option key={st} value={st}>{st} - {getStatusLabel(st)}</option>)}
              </select>
            </div>
            <div>
              <div style={s.label}>Summary</div>
              <input style={s.input} value={editSummary} onChange={e => setEditSummary(e.target.value)} />
            </div>
            <div>
              <div style={s.label}>Goal</div>
              <textarea style={{ ...s.textarea, minHeight: 48 }} value={editGoal} onChange={e => setEditGoal(e.target.value)} placeholder="이 WayPoint가 달성해야 할 의도 (선택)" />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}><div style={s.label}>Version</div><input style={s.inputSm} value={editVersion} onChange={e => setEditVersion(e.target.value)} /></div>
              <div style={{ flex: 1 }}><div style={s.label}>Priority</div><input style={s.inputSm} value={editPriority} onChange={e => setEditPriority(e.target.value)} /></div>
              <div style={{ flex: 1 }}><div style={s.label}>SYNCED_AT</div><input style={s.inputSm} type="date" value={editSyncedAt} onChange={e => setEditSyncedAt(e.target.value)} /></div>
            </div>
          </div>
        ) : (
          <>
            <div style={s.label}>Summary</div>
            <div style={s.value}>{data.summary || '-'}</div>
            {data.goal && (
              <div style={{ marginBottom: 8 }}>
                <div style={s.label}>Goal</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic' }}>{data.goal}</div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {data.version && <div><span style={s.label}>Version: </span><span style={{ fontSize: 12 }}>{data.version}</span></div>}
              {data.created && <div><span style={s.label}>Created: </span><span style={{ fontSize: 12 }}>{data.created}</span></div>}
              {data.priority && <div><span style={s.label}>Priority: </span><span style={{ fontSize: 12 }}>{data.priority}</span></div>}
              {data.syncedAt && <div><span style={s.label}>SYNCED_AT: </span><span style={{ fontSize: 12 }}>{data.syncedAt}</span></div>}
            </div>
          </>
        )}
      </div>

      {/* ===== CONNECTIONS ===== */}
      <div style={s.section}>
        <div style={s.sectionHeader}>
          <span style={s.sectionTitle}>CONNECTIONS</span>
          <div style={s.headerBtns}>
            {!isReadOnly && (editConnections ? (
              <>
                <button style={s.btnPrimary} onClick={saveConnections} disabled={connLoading}>
                  {connLoading ? '저장 중...' : 'Save'}
                </button>
                <button style={s.btn} onClick={cancelEditConnections} disabled={connLoading}>Cancel</button>
              </>
            ) : (
              <button style={s.btn} onClick={startEditConnections} disabled={connLoading}>
                {connLoading ? '...' : 'Edit'}
              </button>
            ))}
          </div>
        </div>

        {connError && <div style={{ fontSize: 11, color: 'var(--status-error)', marginBottom: 6 }}>{connError}</div>}

        {editConnections ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* PARENT edit */}
            <div>
              <div style={s.label}>PARENT</div>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <select
                  style={{ ...s.select, flex: 1 }}
                  value={editParent}
                  onChange={e => setEditParent(e.target.value)}
                >
                  <option value="">— 없음 (clear) —</option>
                  {allAddresses.filter(a => a !== address).map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
                {editParent && (
                  <button style={s.btnDanger} onClick={() => setEditParent('')} title="PARENT 제거">×</button>
                )}
              </div>
            </div>

            {/* CHILDREN edit */}
            <div>
              <div style={s.label}>CHILDREN</div>
              {editChildren.length === 0 && <div style={s.empty}>없음</div>}
              {editChildren.map(c => (
                <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-primary)', flex: 1, fontFamily: 'monospace' }}>{c}</span>
                  <button
                    style={s.btnDanger}
                    onClick={() => setEditChildren(editChildren.filter(x => x !== c))}
                    title="제거"
                  >×</button>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                <select
                  style={{ ...s.select, flex: 1 }}
                  value={addChildInput}
                  onChange={e => setAddChildInput(e.target.value)}
                >
                  <option value="">— WayPoint 선택 —</option>
                  {allAddresses
                    .filter(a => a.startsWith('W://') && a !== address && !editChildren.includes(a))
                    .map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <button
                  style={s.btnPrimary}
                  disabled={!addChildInput}
                  onClick={() => {
                    if (addChildInput && !editChildren.includes(addChildInput)) {
                      setEditChildren([...editChildren, addChildInput]);
                      setAddChildInput('');
                    }
                  }}
                >+ Add</button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {data.parent && (
              <div style={{ marginBottom: 4 }}>
                <span style={s.label}>Parent: </span>
                <span style={s.link} onDoubleClick={() => navigateTo(data.parent!)}>{data.parent}</span>
              </div>
            )}
            {data.children.length > 0 && (
              <div style={{ marginBottom: 4 }}>
                <span style={s.label}>Children: </span>
                {data.children.map(c => (
                  <span key={c} style={{ ...s.link, marginRight: 8 }} onDoubleClick={() => navigateTo(c)}>{c}</span>
                ))}
              </div>
            )}
            {data.references.length > 0 && (
              <div style={{ marginBottom: 4 }}>
                <span style={s.label}>Reference: </span>
                {data.references.map(r => (
                  <span key={r} style={{ ...s.link, marginRight: 8 }} onDoubleClick={() => navigateTo(r)}>{r}</span>
                ))}
              </div>
            )}
            {!data.parent && data.children.length === 0 && data.references.length === 0 && (
              <div style={s.empty}>연결 정보 없음</div>
            )}
          </>
        )}
      </div>

      {/* ===== CODE_MAP ===== */}
      <div style={s.section}>
        <div style={s.sectionHeader}>
          <span style={s.sectionTitle}>CODE_MAP</span>
          <div style={s.headerBtns}>
            {!isReadOnly && (editCodeMap ? (
              <>
                <button style={s.btnPrimary} onClick={() => {
                  saveToServer({ codeMapScopes });
                  setEditCodeMap(false);
                }}>Save</button>
                <button style={s.btn} onClick={() => {
                  setCodeMapScopes([...(data.codeMapScopes || [])]);
                  setEditCodeMap(false);
                }}>Cancel</button>
              </>
            ) : (
              <button style={s.btn} onClick={() => setEditCodeMap(true)}>Edit</button>
            ))}
          </div>
        </div>
        {editCodeMap ? (
          <div>
            {codeMapScopes.map((scope, i) => (
              <div key={i} style={{ display: 'flex', gap: 4, marginBottom: 4, alignItems: 'center' }}>
                <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-primary)', flex: 1 }}>{scope}</span>
                <button style={s.btnDanger} onClick={() => setCodeMapScopes(codeMapScopes.filter((_, j) => j !== i))}>x</button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
              <input
                style={{ ...s.inputSm, flex: 1, fontFamily: 'monospace' }}
                placeholder="scope 경로 추가... (예: backend/src/main/java/.../service/)"
                value={newScope}
                onChange={e => setNewScope(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newScope.trim()) {
                    setCodeMapScopes([...codeMapScopes, newScope.trim()]);
                    setNewScope('');
                  }
                }}
              />
              <button style={s.btnPrimary} onClick={() => {
                if (newScope.trim()) { setCodeMapScopes([...codeMapScopes, newScope.trim()]); setNewScope(''); }
              }} disabled={!newScope.trim()}>+ Add</button>
              <button style={s.btn} onClick={openDirBrowser}>Browse</button>
            </div>

            {/* Directory Browser Popup */}
            {showDirBrowser && (
              <div style={{
                marginTop: 8, border: '1px solid var(--border-medium)', borderRadius: 6,
                background: 'var(--bg-surface)', maxHeight: 250, display: 'flex', flexDirection: 'column',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '6px 10px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-tertiary)',
                }}>
                  <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {dirBrowserPath}
                  </span>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button style={s.btnPrimary} onClick={selectDirAsScope}>Select</button>
                    <button style={s.btn} onClick={() => setShowDirBrowser(false)}>Close</button>
                  </div>
                </div>
                <div style={{ overflow: 'auto', flex: 1, maxHeight: 200 }}>
                  {dirBrowserLoading ? (
                    <div style={{ padding: 12, fontSize: 11, color: 'var(--text-muted)' }}>Loading...</div>
                  ) : (
                    <>
                      {dirBrowserParent && (
                        <div
                          style={{ padding: '4px 10px', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                          onClick={() => browseDirTo(dirBrowserParent)}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <FolderOpen size={14} /><span style={{ color: 'var(--text-muted)' }}>..</span>
                        </div>
                      )}
                      {dirBrowserEntries.map(entry => (
                        <div
                          key={entry.path}
                          style={{ padding: '4px 10px', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                          onClick={() => browseDirTo(entry.path)}
                          onDoubleClick={() => {
                            // Double-click to select this directory as scope
                            let relative = entry.path.replace(/\\/g, '/');
                            const root = projectRoot.replace(/\\/g, '/');
                            if (relative.startsWith(root)) {
                              relative = relative.substring(root.length);
                              if (relative.startsWith('/')) relative = relative.substring(1);
                            }
                            if (relative && !relative.endsWith('/')) relative += '/';
                            if (relative && !codeMapScopes.includes(relative)) {
                              setCodeMapScopes([...codeMapScopes, relative]);
                            }
                            setShowDirBrowser(false);
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          {entry.hasChildren ? <FolderOpen size={14} /> : <Folder size={14} />}
                          <span style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{entry.name}</span>
                        </div>
                      ))}
                      {dirBrowserEntries.length === 0 && (
                        <div style={{ padding: 12, fontSize: 11, color: 'var(--text-muted)' }}>하위 폴더 없음</div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          codeMapScopes.length > 0 ? (
            <div>
              <div style={s.label}>scope:</div>
              {codeMapScopes.map((scope, i) => (
                <div key={i} style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-primary)', padding: '2px 0 2px 12px' }}>{scope}</div>
              ))}
            </div>
          ) : (
            <div style={s.empty}>CODE_MAP 없음 (코드 수정이 수반되는 경우 scope를 지정하세요)</div>
          )
        )}
      </div>

      {/* ===== ATTACHMENTS ===== */}
      <div style={s.section}>
        <div style={s.sectionHeader}>
          <span style={s.sectionTitle}>ATTACHMENTS</span>
          <div style={s.headerBtns}>
            {!isReadOnly && (editAttachments ? (
              <>
                <button style={s.btnPrimary} onClick={() => {
                  const finalList = editingAttachmentIdx !== null
                    ? attachments.map((a, i) => i === editingAttachmentIdx ? editAttachmentText.trim() : a).filter(a => a)
                    : attachments;
                  setAttachments(finalList);
                  setEditingAttachmentIdx(null);
                  saveToServer({ attachments: finalList });
                  setEditAttachments(false);
                }}>Save</button>
                <button style={s.btn} onClick={() => {
                  setAttachments([...(data.attachments || [])]);
                  setEditingAttachmentIdx(null);
                  setNewAttachment('');
                  setEditAttachments(false);
                }}>Cancel</button>
              </>
            ) : (
              <button style={s.btn} onClick={() => setEditAttachments(true)}>Edit</button>
            ))}
          </div>
        </div>
        {editAttachments ? (
          <div>
            {attachments.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 4, marginBottom: 4, alignItems: 'center' }}>
                {editingAttachmentIdx === i ? (
                  <input
                    style={{ ...s.inputSm, flex: 1, fontFamily: 'monospace' }}
                    value={editAttachmentText}
                    autoFocus
                    onChange={e => setEditAttachmentText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        setAttachments(attachments.map((a, j) => j === i ? editAttachmentText.trim() : a).filter(a => a));
                        setEditingAttachmentIdx(null);
                      } else if (e.key === 'Escape') {
                        setEditingAttachmentIdx(null);
                      }
                    }}
                  />
                ) : (
                  <span
                    style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-primary)', flex: 1, cursor: 'pointer' }}
                    onClick={() => { setEditingAttachmentIdx(i); setEditAttachmentText(item); }}
                  >{item}</span>
                )}
                <button style={s.btnDanger} onClick={() => {
                  setAttachments(attachments.filter((_, j) => j !== i));
                  if (editingAttachmentIdx === i) setEditingAttachmentIdx(null);
                }}>x</button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
              <input
                style={{ ...s.inputSm, flex: 1, fontFamily: 'monospace' }}
                placeholder="URL 추가... (예: https://... 또는 file:///path/to/file.sql)"
                value={newAttachment}
                onChange={e => setNewAttachment(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newAttachment.trim()) {
                    setAttachments([...attachments, newAttachment.trim()]);
                    setNewAttachment('');
                  }
                }}
              />
              <button style={s.btnPrimary} onClick={() => {
                if (newAttachment.trim()) { setAttachments([...attachments, newAttachment.trim()]); setNewAttachment(''); }
              }} disabled={!newAttachment.trim()}>+ Add</button>
            </div>
          </div>
        ) : (
          attachments.length > 0 ? (
            <div>
              {attachments.map((item, i) => {
                const dashIdx = item.indexOf(' — ');
                const url = dashIdx >= 0 ? item.substring(0, dashIdx) : item;
                const desc = dashIdx >= 0 ? item.substring(dashIdx + 3) : null;
                const isHttp = url.startsWith('http://') || url.startsWith('https://');
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 6, padding: '2px 0 2px 4px' }}>
                    {isHttp ? (
                      <a href={url} target="_blank" rel="noreferrer" style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--accent-blue)', wordBreak: 'break-all' }}>{url}</a>
                    ) : (
                      <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-primary)', wordBreak: 'break-all' }}>{url}</span>
                    )}
                    {desc && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>— {desc}</span>}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={s.empty}>ATTACHMENTS 없음</div>
          )
        )}
      </div>

      {/* ===== TODO ===== */}
      <div style={s.section}>
        <div style={s.sectionHeader}>
          <span style={s.sectionTitle}>TODO {total > 0 && `(${done}/${total})`}</span>
          <div style={s.headerBtns}>
            {!isReadOnly && (
              <>
                {focusedTechSpec !== null && editingTechSpec === null && (
                  <button style={s.btn} onClick={() => startEditTechSpecItem(focusedTechSpec)}>Edit</button>
                )}
                {selectedTechSpec.size > 0 && (
                  <>
                    <button style={s.btnPrimary} onClick={doneSelectedTechSpec}>Done ({selectedTechSpec.size})</button>
                    <button style={s.btnDanger} onClick={deleteSelectedTechSpec}>Delete ({selectedTechSpec.size})</button>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* TODO Summary */}
        <div style={{ marginBottom: 8 }}>
          <div style={s.label}>Summary</div>
          {editTodoSummary ? (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <input style={{ ...s.inputSm, flex: 1 }} value={editTodoSummaryText} onChange={e => setEditTodoSummaryText(e.target.value)} />
              <button style={s.btnPrimary} onClick={saveTodoSummary}>OK</button>
              <button style={s.btn} onClick={cancelEditTodoSummary}>X</button>
            </div>
          ) : (
            <div style={{ ...s.value, cursor: isReadOnly ? 'default' : 'pointer' }} onDoubleClick={isReadOnly ? undefined : startEditTodoSummary}>
              {data.todoSummary || <span style={s.empty}>-</span>}
            </div>
          )}
        </div>

        {/* Progress bar */}
        {total > 0 && (
          <div style={s.progressBar}><div style={s.progressFill(pct)} /></div>
        )}

        {/* Selection toolbar */}
        {total > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0 6px',
            borderBottom: '1px solid var(--border-light)', marginBottom: 4,
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <input
                type="checkbox"
                checked={selectedTechSpec.size === total && total > 0}
                ref={el => { if (el) el.indeterminate = selectedTechSpec.size > 0 && selectedTechSpec.size < total; }}
                onChange={() => {
                  if (selectedTechSpec.size === total) {
                    setSelectedTechSpec(new Set());
                  } else {
                    const nonRecurringIndices = techSpecItems.reduce<number[]>((acc, item, i) => {
                      if (!item.recurring) acc.push(i);
                      return acc;
                    }, []);
                    setSelectedTechSpec(new Set(nonRecurringIndices));
                  }
                }}
              />
              All
            </label>
            <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
              <input
                style={{ ...s.inputSm, width: '100%', paddingRight: 50, fontSize: 11 }}
                placeholder="텍스트 필터로 선택..."
                value={techSpecFilter}
                onChange={e => setTechSpecFilter(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && techSpecFilter.trim()) {
                    const keyword = techSpecFilter.trim().toLowerCase();
                    const matched = new Set<number>();
                    techSpecItems.forEach((item, i) => {
                      if (item.text.toLowerCase().includes(keyword)) matched.add(i);
                    });
                    setSelectedTechSpec(matched);
                  }
                }}
              />
              {techSpecFilter && (
                <button
                  style={{ ...s.btnPrimary, position: 'absolute', right: 2, top: '50%', transform: 'translateY(-50%)', padding: '1px 6px', fontSize: 10 }}
                  onClick={() => {
                    const keyword = techSpecFilter.trim().toLowerCase();
                    if (!keyword) return;
                    const matched = new Set<number>();
                    techSpecItems.forEach((item, i) => {
                      if (item.text.toLowerCase().includes(keyword)) matched.add(i);
                    });
                    setSelectedTechSpec(matched);
                  }}
                >
                  Select
                </button>
              )}
            </div>
            {selectedTechSpec.size > 0 && (
              <span style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{selectedTechSpec.size}건</span>
            )}
          </div>
        )}

        {/* TODO items */}
        {techSpecItems.map((item, i) => (
          <div
            key={i}
            style={{
              ...s.checkRow,
              background: focusedTechSpec === i && editingTechSpec !== i ? 'var(--accent-bg)' : 'transparent',
              borderRadius: 3,
              cursor: editingTechSpec === i ? 'default' : 'pointer',
            }}
            onClick={(e) => {
              if (editingTechSpec !== null) return;
              if ((e.target as HTMLElement).tagName === 'INPUT') return;
              setFocusedTechSpec(focusedTechSpec === i ? null : i);
            }}
          >
            <input
              type="checkbox"
              checked={selectedTechSpec.has(i)}
              onChange={() => toggleSelectTechSpec(i)}
              style={{ marginTop: 2 }}
            />
            {item.recurring ? (
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, color: '#7c6f3a',
                background: '#f0e8c0', border: '1px solid #c8b84a',
                borderRadius: 3, padding: '1px 5px', width: 16, height: 16,
                flexShrink: 0, marginTop: 2, letterSpacing: 0.3,
              }}>R</span>
            ) : (
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 16, height: 16, marginTop: 2, flexShrink: 0,
                color: item.done ? '#5a8a5e' : 'var(--text-muted)', fontSize: 13,
              }}>
                {item.done ? <Check size={13} /> : <Circle size={13} />}
              </span>
            )}
            {editingTechSpec === i ? (
              <div style={{ display: 'flex', gap: 4, flex: 1 }}>
                <input style={{ ...s.inputSm, flex: 1 }} value={editTechSpecText} onChange={e => setEditTechSpecText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveEditTechSpecItem(); if (e.key === 'Escape') setEditingTechSpec(null); }} autoFocus />
                <button style={s.btnPrimary} onClick={saveEditTechSpecItem}>OK</button>
              </div>
            ) : (
              <span style={{ color: item.done ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                {item.text}
              </span>
            )}
          </div>
        ))}
        {techSpecItems.length === 0 && <div style={s.empty}>항목 없음</div>}

        {/* Add new TODO item */}
        {!isReadOnly && <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
          <input
            style={{ ...s.inputSm, flex: 1 }}
            placeholder="새 항목 추가..."
            value={newTechSpec}
            onChange={e => setNewTechSpec(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addTechSpec(); }}
          />
          <button style={s.btnPrimary} onClick={addTechSpec} disabled={!newTechSpec.trim()}>+ Add</button>
          <button
            style={{ ...s.btn, color: '#7c6f3a', borderColor: '#c8b84a' }}
            onClick={addRecurringTechSpec}
            disabled={!newTechSpec.trim()}
            title="반복 항목으로 추가"
          >+ (R)</button>
        </div>}
      </div>

      {/* ===== ISSUE ===== */}
      <div style={s.section}>
        <div style={s.sectionHeader}>
          <span style={s.sectionTitle}>ISSUE</span>
          <div style={s.headerBtns}>
            {!isReadOnly && selectedIssues.size > 0 && (
              <>
                <button style={s.btn} onClick={() => { const idx = [...selectedIssues][0]; startEditIssueItem(idx); }}>Edit</button>
                <button style={s.btnDanger} onClick={deleteSelectedIssues}>Delete ({selectedIssues.size})</button>
              </>
            )}
          </div>
        </div>

        {issues.map((issue, i) => (
          <div key={i} style={s.checkRow}>
            <input type="checkbox" checked={selectedIssues.has(i)} onChange={() => toggleSelectIssue(i)} style={{ marginTop: 2 }} />
            {editingIssue === i ? (
              <div style={{ display: 'flex', gap: 4, flex: 1 }}>
                <input style={{ ...s.inputSm, flex: 1 }} value={editIssueText} onChange={e => setEditIssueText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveEditIssueItem(); if (e.key === 'Escape') setEditingIssue(null); }} autoFocus />
                <button style={s.btnPrimary} onClick={saveEditIssueItem}>OK</button>
              </div>
            ) : (
              <span style={{ color: 'var(--text-secondary)' }} onDoubleClick={() => startEditIssueItem(i)}>{issue}</span>
            )}
          </div>
        ))}
        {issues.length === 0 && <div style={s.empty}>이슈 없음</div>}

        {!isReadOnly && <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
          <input
            style={{ ...s.inputSm, flex: 1 }}
            placeholder="새 이슈 추가..."
            value={newIssue}
            onChange={e => setNewIssue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addIssue(); }}
          />
          <button style={s.btnPrimary} onClick={addIssue} disabled={!newIssue.trim()}>+ Add</button>
        </div>}
      </div>

      {/* ===== OPEN_QUESTIONS ===== */}
      <div style={s.section}>
        <div style={s.sectionHeader}>
          <span style={s.sectionTitle}>OPEN_QUESTIONS</span>
        </div>

        {openQuestions.map((q, i) => (
          <div key={q.id} style={{ padding: '4px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{ ...s.badge(q.resolved ? '#5a8a5e' : '#c47f17'), cursor: 'pointer' }}
              onClick={() => toggleOqResolved(i)}
              title="클릭하여 상태 전환"
            >
              {q.resolved ? 'RESOLVED' : 'OPEN'}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>[{q.id}]</span>
            <span>{q.text}</span>
          </div>
        ))}
        {openQuestions.length === 0 && <div style={s.empty}>미결 질문 없음</div>}

        {!isReadOnly && <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
          <input
            style={{ ...s.inputSm, flex: 1 }}
            placeholder="새 질문 추가..."
            value={newOqText}
            onChange={e => setNewOqText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addOpenQuestion(); }}
          />
          <button style={s.btnPrimary} onClick={addOpenQuestion} disabled={!newOqText.trim()}>+ Add</button>
        </div>}
      </div>

      {/* ===== COMMENT ===== */}
      <div style={s.section}>
        <div style={s.sectionHeader}>
          <span style={s.sectionTitle}>COMMENT</span>
          <div style={s.headerBtns}>
            {!isReadOnly && (editComment ? (
              <>
                <button style={s.btnPrimary} onClick={saveComment}>Save</button>
                <button style={s.btn} onClick={cancelEditComment}>Cancel</button>
              </>
            ) : (
              <button style={s.btn} onClick={startEditComment}>Edit</button>
            ))}
          </div>
        </div>
        {editComment ? (
          <textarea style={s.textarea} value={editCommentText} onChange={e => setEditCommentText(e.target.value)} rows={4} />
        ) : (
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
            {data.comment || <span style={s.empty}>코멘트 없음</span>}
          </div>
        )}
      </div>
    </div>
  );
}
