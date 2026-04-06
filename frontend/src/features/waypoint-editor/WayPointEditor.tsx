import { useState, useEffect } from 'react';
import { fetchWayPoint, type WayPointDetail } from '../../api/client';

interface WayPointEditorProps {
  projectRoot: string;
  address: string;
}

const statusOptions = ['S_IDL', 'S_PRG', 'S_STB', 'S_ERR', 'S_REV'];
const statusColors: Record<string, string> = {
  S_IDL: '#9b8e7e', S_PRG: '#3a7ca5', S_STB: '#5a8a5e', S_ERR: '#b54a3f', S_REV: '#c47f17',
};
const statusLabels: Record<string, string> = {
  S_IDL: 'Idle', S_PRG: 'In Progress', S_STB: 'Stable', S_ERR: 'Error', S_REV: 'Review',
};

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

  // ISSUE editing
  const [issues, setIssues] = useState<string[]>([]);
  const [selectedIssues, setSelectedIssues] = useState<Set<number>>(new Set());
  const [editingIssue, setEditingIssue] = useState<number | null>(null);
  const [editIssueText, setEditIssueText] = useState('');
  const [newIssue, setNewIssue] = useState('');

  // OPEN_QUESTIONS editing
  const [openQuestions, setOpenQuestions] = useState<{ id: string; text: string; resolved: boolean }[]>([]);
  const [newOqText, setNewOqText] = useState('');

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
  }, [projectRoot, address]);

  if (loading) return <div style={{ color: 'var(--text-muted)', padding: 12 }}>Loading...</div>;
  if (error || !data) return <div style={{ color: 'var(--status-error)', padding: 12 }}>Error: {error}</div>;

  const color = statusColors[data.status] || statusColors.S_IDL;
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
    // TODO: API call to save
    setEditIdentity(false);
  };

  // --- Comment edit handlers ---
  const startEditComment = () => {
    setEditCommentText(data.comment || '');
    setEditComment(true);
  };
  const cancelEditComment = () => setEditComment(false);
  const saveComment = () => {
    // TODO: API call to save
    setEditComment(false);
  };

  // --- TODO summary edit ---
  const startEditTodoSummary = () => {
    setEditTodoSummaryText(data.todoSummary || '');
    setEditTodoSummary(true);
  };
  const cancelEditTodoSummary = () => setEditTodoSummary(false);
  const saveTodoSummary = () => {
    // TODO: API call
    setEditTodoSummary(false);
  };

  // --- TECH_SPEC handlers ---
  const toggleTechSpec = (idx: number) => {
    setTechSpecItems(prev => prev.map((item, i) => i === idx ? { ...item, done: !item.done } : item));
  };
  const toggleSelectTechSpec = (idx: number) => {
    setSelectedTechSpec(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };
  const deleteSelectedTechSpec = () => {
    setTechSpecItems(prev => prev.filter((_, i) => !selectedTechSpec.has(i)));
    setSelectedTechSpec(new Set());
  };
  const startEditTechSpecItem = (idx: number) => {
    setEditingTechSpec(idx);
    setEditTechSpecText(techSpecItems[idx].text);
  };
  const saveEditTechSpecItem = () => {
    if (editingTechSpec !== null) {
      setTechSpecItems(prev => prev.map((item, i) => i === editingTechSpec ? { ...item, text: editTechSpecText } : item));
      setEditingTechSpec(null);
    }
  };
  const addTechSpec = () => {
    if (newTechSpec.trim()) {
      setTechSpecItems(prev => [...prev, { text: newTechSpec.trim(), done: false }]);
      setNewTechSpec('');
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
    setIssues(prev => prev.filter((_, i) => !selectedIssues.has(i)));
    setSelectedIssues(new Set());
  };
  const startEditIssueItem = (idx: number) => {
    setEditingIssue(idx);
    setEditIssueText(issues[idx]);
  };
  const saveEditIssueItem = () => {
    if (editingIssue !== null) {
      setIssues(prev => prev.map((item, i) => i === editingIssue ? editIssueText : item));
      setEditingIssue(null);
    }
  };
  const addIssue = () => {
    if (newIssue.trim()) {
      setIssues(prev => [...prev, newIssue.trim()]);
      setNewIssue('');
    }
  };

  // --- OPEN_QUESTIONS handlers ---
  const toggleOqResolved = (idx: number) => {
    setOpenQuestions(prev => prev.map((q, i) => i === idx ? { ...q, resolved: !q.resolved } : q));
  };
  const addOpenQuestion = () => {
    if (newOqText.trim()) {
      const nextId = `Q${openQuestions.length + 1}`;
      setOpenQuestions(prev => [...prev, { id: nextId, text: newOqText.trim(), resolved: false }]);
      setNewOqText('');
    }
  };

  return (
    <div style={{ fontSize: 13 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 16, color: '#3a7ca5' }}>◆</span>
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{address.split('/').pop()}</span>
        <span style={s.badge(color)}>{statusLabels[data.status] || data.status}</span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>{address}</div>

      {/* ===== IDENTITY ===== */}
      <div style={s.section}>
        <div style={s.sectionHeader}>
          <span style={s.sectionTitle}>IDENTITY</span>
          <div style={s.headerBtns}>
            {editIdentity ? (
              <>
                <button style={s.btnPrimary} onClick={saveIdentity}>Save</button>
                <button style={s.btn} onClick={cancelEditIdentity}>Cancel</button>
              </>
            ) : (
              <button style={s.btn} onClick={startEditIdentity}>Edit</button>
            )}
          </div>
        </div>
        {editIdentity ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div>
              <div style={s.label}>Status</div>
              <select style={s.select} value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                {statusOptions.map(st => <option key={st} value={st}>{st} - {statusLabels[st]}</option>)}
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
            {selectedTechSpec.size > 0 && (
              <>
                <button style={s.btn} onClick={() => { const idx = [...selectedTechSpec][0]; startEditTechSpecItem(idx); }}>Edit</button>
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
            <div style={{ ...s.value, cursor: 'pointer' }} onDoubleClick={startEditTodoSummary}>
              {data.todoSummary || <span style={s.empty}>-</span>}
            </div>
          )}
        </div>

        {/* Progress bar */}
        {total > 0 && (
          <div style={s.progressBar}><div style={s.progressFill(pct)} /></div>
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
        <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
          <input
            style={{ ...s.inputSm, flex: 1 }}
            placeholder="새 항목 추가..."
            value={newTechSpec}
            onChange={e => setNewTechSpec(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addTechSpec(); }}
          />
          <button style={s.btnPrimary} onClick={addTechSpec} disabled={!newTechSpec.trim()}>+ Add</button>
        </div>
      </div>

      {/* ===== ISSUE ===== */}
      <div style={s.section}>
        <div style={s.sectionHeader}>
          <span style={s.sectionTitle}>ISSUE</span>
          <div style={s.headerBtns}>
            {selectedIssues.size > 0 && (
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

        <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
          <input
            style={{ ...s.inputSm, flex: 1 }}
            placeholder="새 이슈 추가..."
            value={newIssue}
            onChange={e => setNewIssue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addIssue(); }}
          />
          <button style={s.btnPrimary} onClick={addIssue} disabled={!newIssue.trim()}>+ Add</button>
        </div>
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

        <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
          <input
            style={{ ...s.inputSm, flex: 1 }}
            placeholder="새 질문 추가..."
            value={newOqText}
            onChange={e => setNewOqText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addOpenQuestion(); }}
          />
          <button style={s.btnPrimary} onClick={addOpenQuestion} disabled={!newOqText.trim()}>+ Add</button>
        </div>
      </div>

      {/* ===== COMMENT ===== */}
      <div style={s.section}>
        <div style={s.sectionHeader}>
          <span style={s.sectionTitle}>COMMENT</span>
          <div style={s.headerBtns}>
            {editComment ? (
              <>
                <button style={s.btnPrimary} onClick={saveComment}>Save</button>
                <button style={s.btn} onClick={cancelEditComment}>Cancel</button>
              </>
            ) : (
              <button style={s.btn} onClick={startEditComment}>Edit</button>
            )}
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
