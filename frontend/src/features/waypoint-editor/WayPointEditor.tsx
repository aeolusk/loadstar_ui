import { useState, useEffect } from 'react';
import { fetchWayPoint, updateWayPoint, fetchGitHistory, fetchGitVersion, type WayPointDetail, type GitCommitEntry } from '../../api/client';
import { statusOptions, getStatusLabel, getStatusColor } from '../../data/status-labels';

interface WayPointEditorProps {
  projectRoot: string;
  address: string;
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

export default function WayPointEditor({ projectRoot, address }: WayPointEditorProps) {
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
  const [editVersion, setEditVersion] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [editSyncedAt, setEditSyncedAt] = useState('');
  const [editCommentText, setEditCommentText] = useState('');
  const [editTodoSummaryText, setEditTodoSummaryText] = useState('');

  // TECH_SPEC editing
  const [techSpecItems, setTechSpecItems] = useState<{ text: string; done: boolean }[]>([]);
  const [selectedTechSpec, setSelectedTechSpec] = useState<Set<number>>(new Set());
  const [editingTechSpec, setEditingTechSpec] = useState<number | null>(null);
  const [editTechSpecText, setEditTechSpecText] = useState('');
  const [newTechSpec, setNewTechSpec] = useState('');
  const [techSpecFilter, setTechSpecFilter] = useState('');

  // ISSUE editing
  const [issues, setIssues] = useState<string[]>([]);
  const [selectedIssues, setSelectedIssues] = useState<Set<number>>(new Set());
  const [editingIssue, setEditingIssue] = useState<number | null>(null);
  const [editIssueText, setEditIssueText] = useState('');
  const [newIssue, setNewIssue] = useState('');

  // OPEN_QUESTIONS editing
  const [openQuestions, setOpenQuestions] = useState<{ id: string; text: string; resolved: boolean }[]>([]);
  const [newOqText, setNewOqText] = useState('');

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
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const isReadOnly = viewingCommit !== null;

  if (loading || gitVersionLoading) return <div style={{ color: 'var(--text-muted)', padding: 12 }}>Loading...</div>;
  if (error || !data) return <div style={{ color: 'var(--status-error)', padding: 12 }}>Error: {error}</div>;

  const color = getStatusColor(data.status);
  const done = techSpecItems.filter(t => t.done).length;
  const total = techSpecItems.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  // --- Identity edit handlers ---
  const startEditIdentity = () => {
    setEditStatus(data.status);
    setEditSummary(data.summary || '');
    setEditVersion(data.version || '');
    setEditPriority(data.priority || '');
    setEditSyncedAt(data.syncedAt || '');
    setEditIdentity(true);
  };
  const cancelEditIdentity = () => setEditIdentity(false);
  const saveIdentity = () => {
    saveToServer({ status: editStatus, summary: editSummary, version: editVersion, priority: editPriority, syncedAt: editSyncedAt });
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

  // --- TECH_SPEC handlers ---
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
    const updated = techSpecItems.filter((_, i) => !selectedTechSpec.has(i));
    setTechSpecItems(updated);
    setSelectedTechSpec(new Set());
    saveToServer({ techSpec: updated }); // skipHistory=false → history에 기록
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
      const updated = [...techSpecItems, { text: newTechSpec.trim(), done: false }];
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
        <span style={{ fontSize: 16, color: '#3a7ca5' }}>◆</span>
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{address.split('/').pop()}</span>
        <span style={s.badge(color)}>{getStatusLabel(data.status)}</span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: isReadOnly ? 8 : 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>{address}</span>
        {saving && <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Saving...</span>}
      </div>

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
              <span style={{ marginRight: 6, fontSize: 10 }}>{gitExpanded ? '▼' : '▶'}</span>
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
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {data.version && <div><span style={s.label}>Version: </span><span style={{ fontSize: 12 }}>{data.version}</span></div>}
              {data.created && <div><span style={s.label}>Created: </span><span style={{ fontSize: 12 }}>{data.created}</span></div>}
              {data.priority && <div><span style={s.label}>Priority: </span><span style={{ fontSize: 12 }}>{data.priority}</span></div>}
              {data.syncedAt && <div><span style={s.label}>SYNCED_AT: </span><span style={{ fontSize: 12 }}>{data.syncedAt}</span></div>}
            </div>
          </>
        )}
      </div>

      {/* ===== CONNECTIONS (read-only) ===== */}
      <div style={s.section}>
        <div style={s.sectionHeader}>
          <span style={s.sectionTitle}>CONNECTIONS</span>
        </div>
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
        {!data.parent && data.children.length === 0 && data.references.length === 0 && !data.blackbox && (
          <div style={s.empty}>연결 정보 없음</div>
        )}
      </div>

      {/* ===== TODO / TECH_SPEC ===== */}
      <div style={s.section}>
        <div style={s.sectionHeader}>
          <span style={s.sectionTitle}>TODO / TECH_SPEC {total > 0 && `(${done}/${total})`}</span>
          <div style={s.headerBtns}>
            {!isReadOnly && selectedTechSpec.size > 0 && (
              <>
                <button style={s.btn} onClick={() => { const idx = [...selectedTechSpec][0]; startEditTechSpecItem(idx); }}>Edit</button>
                <button style={s.btnPrimary} onClick={doneSelectedTechSpec}>Done ({selectedTechSpec.size})</button>
                <button style={s.btnDanger} onClick={deleteSelectedTechSpec}>Delete ({selectedTechSpec.size})</button>
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
                    setSelectedTechSpec(new Set(techSpecItems.map((_, i) => i)));
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

        {/* TECH_SPEC items */}
        {techSpecItems.map((item, i) => (
          <div key={i} style={s.checkRow}>
            <input
              type="checkbox"
              checked={selectedTechSpec.has(i)}
              onChange={() => toggleSelectTechSpec(i)}
              style={{ marginTop: 2 }}
            />
            <input
              type="checkbox"
              checked={item.done}
              onChange={() => toggleTechSpec(i)}
              style={{ marginTop: 2 }}
            />
            {editingTechSpec === i ? (
              <div style={{ display: 'flex', gap: 4, flex: 1 }}>
                <input style={{ ...s.inputSm, flex: 1 }} value={editTechSpecText} onChange={e => setEditTechSpecText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveEditTechSpecItem(); if (e.key === 'Escape') setEditingTechSpec(null); }} autoFocus />
                <button style={s.btnPrimary} onClick={saveEditTechSpecItem}>OK</button>
              </div>
            ) : (
              <span
                style={{ color: item.done ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: item.done ? 'line-through' : 'none', cursor: 'pointer' }}
                onDoubleClick={() => startEditTechSpecItem(i)}
              >
                {item.text}
              </span>
            )}
          </div>
        ))}
        {total === 0 && <div style={s.empty}>항목 없음</div>}

        {/* Add new TECH_SPEC */}
        {!isReadOnly && <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
          <input
            style={{ ...s.inputSm, flex: 1 }}
            placeholder="새 항목 추가..."
            value={newTechSpec}
            onChange={e => setNewTechSpec(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addTechSpec(); }}
          />
          <button style={s.btnPrimary} onClick={addTechSpec} disabled={!newTechSpec.trim()}>+ Add</button>
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
