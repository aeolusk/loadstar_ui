import { useState, useEffect } from 'react';
import { fetchBlackBox, updateBlackBox, fetchGitHistory, fetchGitBlackBoxVersion, type BlackBoxDetail, type GitCommitEntry } from '../../api/client';
import { statusOptions, getStatusLabel, getStatusColor } from '../../data/status-labels';

interface BlackBoxEditorProps {
  projectRoot: string;
  address: string;
}

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
  checkRow: { padding: '3px 0', display: 'flex', alignItems: 'flex-start', gap: 6 } as React.CSSProperties,
  empty: { fontSize: 12, color: 'var(--text-muted)', padding: '4px 0', fontStyle: 'italic' as const } as React.CSSProperties,
  codeFile: { fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', padding: '6px 0 2px', fontFamily: 'monospace' } as React.CSSProperties,
  codeItem: { fontSize: 12, color: 'var(--text-secondary)', padding: '2px 0 2px 16px', fontFamily: 'monospace' } as React.CSSProperties,
  warningBanner: { background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 6, padding: '8px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as React.CSSProperties,
  progressBar: { height: 6, borderRadius: 3, background: 'var(--bg-tertiary)', overflow: 'hidden', marginBottom: 8 } as React.CSSProperties,
  progressFill: (pct: number) => ({
    height: '100%', width: `${pct}%`, background: pct === 100 ? 'var(--status-stable)' : 'var(--accent-primary)', borderRadius: 3,
  }) as React.CSSProperties,
};

function isDriftExpired(syncedAt: string | null): boolean {
  if (!syncedAt) return false;
  const diffDays = daysSince(syncedAt);
  return diffDays > 30;
}

function daysSince(syncedAt: string | null): number {
  if (!syncedAt) return 0;
  const synced = new Date(syncedAt);
  const now = new Date();
  return Math.floor((now.getTime() - synced.getTime()) / (1000 * 60 * 60 * 24));
}

type TodoItem = { text: string; wpRef: number; done: boolean };

export default function BlackBoxEditor({ projectRoot, address }: BlackBoxEditorProps) {
  const [data, setData] = useState<BlackBoxDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit modes
  const [editDescription, setEditDescription] = useState(false);
  const [editComment, setEditComment] = useState(false);

  // Edit buffers
  const [editStatus, setEditStatus] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editSyncedAt, setEditSyncedAt] = useState('');
  const [editCommentText, setEditCommentText] = useState('');

  // TODO editing
  const [todoItems, setTodoItems] = useState<TodoItem[]>([]);
  const [selectedTodo, setSelectedTodo] = useState<Set<number>>(new Set());
  const [editingTodo, setEditingTodo] = useState<number | null>(null);
  const [editTodoText, setEditTodoText] = useState('');
  const [newTodo, setNewTodo] = useState('');
  const [todoFilter, setTodoFilter] = useState('');

  // ISSUE editing
  const [issues, setIssues] = useState<string[]>([]);
  const [selectedIssues, setSelectedIssues] = useState<Set<number>>(new Set());
  const [editingIssue, setEditingIssue] = useState<number | null>(null);
  const [editIssueText, setEditIssueText] = useState('');
  const [newIssue, setNewIssue] = useState('');

  // Git History
  const [gitHistory, setGitHistory] = useState<GitCommitEntry[]>([]);
  const [gitExpanded, setGitExpanded] = useState(false);
  const [gitLoading, setGitLoading] = useState(false);
  const [viewingCommit, setViewingCommit] = useState<GitCommitEntry | null>(null);
  const [gitVersionLoading, setGitVersionLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchBlackBox(projectRoot, address)
      .then(d => {
        setData(d);
        setTodoItems(d.todos.map(t => ({ ...t })));
        setIssues([...d.issues]);
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

  const loadGitVersion = async (commit: GitCommitEntry) => {
    setGitVersionLoading(true);
    try {
      const d = await fetchGitBlackBoxVersion(projectRoot, address, commit.hash);
      setData(d);
      setTodoItems(d.todos.map(t => ({ ...t })));
      setIssues([...d.issues]);
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
      const d = await fetchBlackBox(projectRoot, address);
      setData(d);
      setTodoItems(d.todos.map(t => ({ ...t })));
      setIssues([...d.issues]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const isReadOnly = viewingCommit !== null;

  const saveToServer = async (patch: Partial<BlackBoxDetail>, skipHistory = false) => {
    if (!data) return;
    setSaving(true);
    try {
      const payload: BlackBoxDetail = { ...data, ...patch };
      const updated = await updateBlackBox(projectRoot, payload, skipHistory);
      setData(updated);
      setTodoItems(updated.todos.map(t => ({ ...t })));
      setIssues([...updated.issues]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading || gitVersionLoading) return <div style={{ color: 'var(--text-muted)', padding: 12 }}>Loading...</div>;
  if (error || !data) return <div style={{ color: 'var(--status-error)', padding: 12 }}>Error: {error}</div>;

  const color = getStatusColor(data.status);
  const driftExpired = isDriftExpired(data.syncedAt);
  const days = daysSince(data.syncedAt);
  const done = todoItems.filter(t => t.done).length;
  const total = todoItems.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  // --- Description edit handlers ---
  const startEditDescription = () => {
    setEditStatus(data.status);
    setEditSummary(data.summary || '');
    setEditSyncedAt(data.syncedAt || '');
    setEditDescription(true);
  };
  const cancelEditDescription = () => setEditDescription(false);
  const saveDescription = () => {
    saveToServer({ status: editStatus, summary: editSummary, syncedAt: editSyncedAt });
    setEditDescription(false);
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

  // --- TODO handlers ---
  const toggleTodo = (idx: number) => {
    const updated = todoItems.map((item, i) => i === idx ? { ...item, done: !item.done } : item);
    setTodoItems(updated);
    saveToServer({ todos: updated });
  };
  const toggleSelectTodo = (idx: number) => {
    setSelectedTodo(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };
  const doneSelectedTodo = () => {
    const updated = todoItems.filter((_, i) => !selectedTodo.has(i));
    setTodoItems(updated);
    setSelectedTodo(new Set());
    saveToServer({ todos: updated }); // skipHistory=false → history에 기록
  };
  const deleteSelectedTodo = () => {
    const updated = todoItems.filter((_, i) => !selectedTodo.has(i));
    setTodoItems(updated);
    setSelectedTodo(new Set());
    saveToServer({ todos: updated }, true); // skipHistory=true → history 없이 삭제
  };
  const startEditTodoItem = (idx: number) => {
    setEditingTodo(idx);
    setEditTodoText(todoItems[idx].text);
  };
  const saveEditTodoItem = () => {
    if (editingTodo !== null) {
      const updated = todoItems.map((item, i) => i === editingTodo ? { ...item, text: editTodoText } : item);
      setTodoItems(updated);
      setEditingTodo(null);
      saveToServer({ todos: updated });
    }
  };
  const addTodo = () => {
    if (newTodo.trim()) {
      const updated = [...todoItems, { text: newTodo.trim(), done: false, wpRef: 0 }];
      setTodoItems(updated);
      setNewTodo('');
      saveToServer({ todos: updated });
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

  return (
    <div style={{ fontSize: 13 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 16 }}>&#128230;</span>
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{address.split('/').pop()}</span>
        <span style={s.badge(color)}>{getStatusLabel(data.status)}</span>
        {data.syncedAt && (
          <span style={{ fontSize: 11, color: driftExpired ? '#b54a3f' : 'var(--text-muted)' }}>
            SYNCED_AT: {data.syncedAt} ({days}d ago)
          </span>
        )}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: isReadOnly ? 8 : 12, display: 'flex', alignItems: 'center', gap: 8 }}>
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

      {/* ===== DESCRIPTION ===== */}
      <div style={s.section}>
        <div style={s.sectionHeader}>
          <span style={s.sectionTitle}>DESCRIPTION</span>
          <div style={s.headerBtns}>
            {!isReadOnly && (editDescription ? (
              <>
                <button style={s.btnPrimary} onClick={saveDescription}>Save</button>
                <button style={s.btn} onClick={cancelEditDescription}>Cancel</button>
              </>
            ) : (
              <button style={s.btn} onClick={startEditDescription}>Edit</button>
            ))}
          </div>
        </div>
        {editDescription ? (
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
              <div style={s.label}>SYNCED_AT</div>
              <input style={s.inputSm} type="date" value={editSyncedAt} onChange={e => setEditSyncedAt(e.target.value)} />
            </div>
          </div>
        ) : (
          <>
            <div style={s.label}>Summary</div>
            <div style={s.value}>{data.summary || '-'}</div>
            {data.linkedWp && (
              <div><span style={s.label}>Linked WP: </span><span style={s.link}>{data.linkedWp}</span></div>
            )}
          </>
        )}
      </div>

      {/* ===== CODE_MAP (read-only) ===== */}
      {data.codeMap.length > 0 && (
        <div style={s.section}>
          <div style={s.sectionHeader}>
            <span style={s.sectionTitle}>
              CODE_MAP
              <span style={{ ...s.badge(data.codeMapPhase === 'actual' ? '#5a8a5e' : '#9b8e7e'), marginLeft: 8 }}>
                {data.codeMapPhase === 'actual' ? '실측' : '계획'}
              </span>
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

      {/* ===== TODO ===== */}
      <div style={s.section}>
        <div style={s.sectionHeader}>
          <span style={s.sectionTitle}>TODO {total > 0 && `(${done}/${total})`}</span>
          <div style={s.headerBtns}>
            {!isReadOnly && selectedTodo.size > 0 && (
              <>
                <button style={s.btn} onClick={() => { const idx = [...selectedTodo][0]; startEditTodoItem(idx); }}>Edit</button>
                <button style={s.btnPrimary} onClick={doneSelectedTodo}>Done ({selectedTodo.size})</button>
                <button style={s.btnDanger} onClick={deleteSelectedTodo}>Delete ({selectedTodo.size})</button>
              </>
            )}
          </div>
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
                checked={selectedTodo.size === total && total > 0}
                ref={el => { if (el) el.indeterminate = selectedTodo.size > 0 && selectedTodo.size < total; }}
                onChange={() => {
                  if (selectedTodo.size === total) {
                    setSelectedTodo(new Set());
                  } else {
                    setSelectedTodo(new Set(todoItems.map((_, i) => i)));
                  }
                }}
              />
              All
            </label>
            <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
              <input
                style={{ ...s.inputSm, width: '100%', paddingRight: 50, fontSize: 11 }}
                placeholder="텍스트 필터로 선택..."
                value={todoFilter}
                onChange={e => setTodoFilter(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && todoFilter.trim()) {
                    const keyword = todoFilter.trim().toLowerCase();
                    const matched = new Set<number>();
                    todoItems.forEach((item, i) => {
                      if (item.text.toLowerCase().includes(keyword)) matched.add(i);
                    });
                    setSelectedTodo(matched);
                  }
                }}
              />
              {todoFilter && (
                <button
                  style={{ ...s.btnPrimary, position: 'absolute', right: 2, top: '50%', transform: 'translateY(-50%)', padding: '1px 6px', fontSize: 10 }}
                  onClick={() => {
                    const keyword = todoFilter.trim().toLowerCase();
                    if (!keyword) return;
                    const matched = new Set<number>();
                    todoItems.forEach((item, i) => {
                      if (item.text.toLowerCase().includes(keyword)) matched.add(i);
                    });
                    setSelectedTodo(matched);
                  }}
                >
                  Select
                </button>
              )}
            </div>
            {selectedTodo.size > 0 && (
              <span style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{selectedTodo.size}건</span>
            )}
          </div>
        )}

        {/* TODO items */}
        {todoItems.map((item, i) => (
          <div key={i} style={s.checkRow}>
            <input
              type="checkbox"
              checked={selectedTodo.has(i)}
              onChange={() => toggleSelectTodo(i)}
              style={{ marginTop: 2 }}
            />
            <input
              type="checkbox"
              checked={item.done}
              onChange={() => toggleTodo(i)}
              style={{ marginTop: 2 }}
            />
            {editingTodo === i ? (
              <div style={{ display: 'flex', gap: 4, flex: 1 }}>
                <input style={{ ...s.inputSm, flex: 1 }} value={editTodoText} onChange={e => setEditTodoText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveEditTodoItem(); if (e.key === 'Escape') setEditingTodo(null); }} autoFocus />
                <button style={s.btnPrimary} onClick={saveEditTodoItem}>OK</button>
              </div>
            ) : (
              <span
                style={{ color: item.done ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: item.done ? 'line-through' : 'none', cursor: 'pointer' }}
                onDoubleClick={() => startEditTodoItem(i)}
              >
                {item.text}
                {item.wpRef > 0 && (
                  <span style={{ fontSize: 10, color: 'var(--accent-primary)', marginLeft: 6 }}>[WP_REF:{item.wpRef}]</span>
                )}
              </span>
            )}
          </div>
        ))}
        {total === 0 && <div style={s.empty}>항목 없음</div>}

        {/* Add new TODO */}
        {!isReadOnly && <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
          <input
            style={{ ...s.inputSm, flex: 1 }}
            placeholder="새 항목 추가..."
            value={newTodo}
            onChange={e => setNewTodo(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addTodo(); }}
          />
          <button style={s.btnPrimary} onClick={addTodo} disabled={!newTodo.trim()}>+ Add</button>
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
