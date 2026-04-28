import { useState, useEffect } from 'react';
import {
  fetchQuestions, fetchDecisions, decideQuestion, deferQuestion, deleteQuestion,
  fetchDecisionContent, updateDecisionContent, openDecisionFile,
  type QuestionItem, type DecisionListItem, type DecideRequest,
} from '../../api/client';
import type { Tab } from '../../App';
import { ArrowRight } from '@phosphor-icons/react';

interface QuestionListProps {
  projectRoot: string;
  onOpenTab?: (tab: Tab) => void;
}

type FilterState = 'OPEN' | 'DEFERRED' | 'DECISIONS';

const STATE_COLOR: Record<string, string> = {
  OPEN:      '#e6851a',
  DEFERRED:  '#7c6e5a',
  DECISIONS: '#4a8f5a',
};

const AI_STATUS_COLOR: Record<string, string> = {
  '처리대기중': '#e6851a',
  '처리완료':  '#4a8f5a',
  '처리실패':  '#b54a3f',
  '처리취소':  '#888',
  'SUPERSEDED': '#aaa',
};

const s = {
  container: { padding: 16, fontSize: 13, height: '100%', overflowY: 'auto' as const },
  header: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 },
  title: { fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' },
  badge: (color: string) => ({
    fontSize: 11, padding: '2px 8px', borderRadius: 3, fontWeight: 600,
    background: color + '20', color,
  }) as React.CSSProperties,
  filterBar: { display: 'flex', gap: 8, marginBottom: 12 },
  filterBtn: (active: boolean, color: string) => ({
    padding: '3px 14px', borderRadius: 12, border: '1px solid',
    fontSize: 12, cursor: 'pointer', fontWeight: active ? 700 : 400,
    background: active ? color + '20' : 'var(--bg-surface)',
    color: active ? color : 'var(--text-secondary)',
    borderColor: active ? color : 'var(--border-medium)',
    transition: 'all 0.1s',
  }) as React.CSSProperties,
  card: {
    border: '1px solid var(--border-light)', borderRadius: 6,
    padding: '10px 14px', marginBottom: 8, background: 'var(--bg-surface)',
  } as React.CSSProperties,
  wpRow: { display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 },
  wpAddr: { fontSize: 11, color: 'var(--text-muted)' },
  arrowBtn: {
    padding: '1px 4px', border: 'none', background: 'transparent',
    cursor: 'pointer', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center',
  } as React.CSSProperties,
  cardHeader: { display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 },
  qid: { fontSize: 12, fontWeight: 700, color: 'var(--accent-primary)', minWidth: 28, flexShrink: 0 },
  qtext: { fontSize: 13, color: 'var(--text-primary)', flex: 1 },
  stateBadge: (color: string) => ({
    fontSize: 10, padding: '1px 7px', borderRadius: 3, fontWeight: 600, flexShrink: 0,
    background: color + '20', color,
  }) as React.CSSProperties,
  actions: { display: 'flex', gap: 6, marginTop: 8 },
  btn: {
    padding: '3px 10px', borderRadius: 3, border: '1px solid var(--border-medium)',
    fontSize: 11, cursor: 'pointer', background: 'var(--bg-surface)', color: 'var(--text-secondary)',
  } as React.CSSProperties,
  btnPrimary: {
    padding: '3px 10px', borderRadius: 3, border: '1px solid var(--accent-primary)',
    fontSize: 11, cursor: 'pointer', background: 'var(--accent-bg)', color: 'var(--accent-primary)', fontWeight: 600,
  } as React.CSSProperties,
  btnDanger: {
    padding: '3px 10px', borderRadius: 3, border: '1px solid var(--status-error)',
    fontSize: 11, cursor: 'pointer', background: '#b54a3f10', color: 'var(--status-error)',
  } as React.CSSProperties,
  decisionPreview: {
    marginTop: 6, padding: '6px 10px', background: 'var(--bg-tertiary)',
    borderRadius: 4, fontSize: 12, color: 'var(--text-secondary)',
    borderLeft: '3px solid var(--status-stable)', lineHeight: 1.5,
  } as React.CSSProperties,
  questionPreview: {
    marginTop: 4, padding: '5px 10px', background: 'var(--bg-secondary)',
    borderRadius: 4, fontSize: 11, color: 'var(--text-muted)',
    borderLeft: '3px solid var(--border-medium)', lineHeight: 1.5, fontStyle: 'italic' as const,
  } as React.CSSProperties,
  fileRef: {
    fontSize: 10, color: 'var(--text-muted)', marginTop: 4,
    cursor: 'pointer', textDecoration: 'underline dotted', display: 'inline-block',
  } as React.CSSProperties,
  empty: { color: 'var(--text-muted)', fontStyle: 'italic' as const, padding: '20px 0', textAlign: 'center' as const },
  overlay: {
    position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  modal: {
    background: 'var(--bg-primary)', border: '1px solid var(--border-medium)', borderRadius: 8,
    padding: 24, width: 500, boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    maxHeight: '80vh', overflowY: 'auto' as const,
  },
  modalTitle: { fontSize: 15, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' },
  label: { fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, display: 'block' },
  inputReadonly: {
    width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid var(--border-light)',
    fontSize: 12, background: 'var(--bg-tertiary)', color: 'var(--text-muted)',
    boxSizing: 'border-box' as const, marginBottom: 12, fontFamily: 'monospace',
  },
  textarea: {
    width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid var(--border-medium)',
    fontSize: 13, background: 'var(--bg-surface)', color: 'var(--text-primary)',
    boxSizing: 'border-box' as const, marginBottom: 12, minHeight: 80, resize: 'vertical' as const,
  },
};

// ===== Decision Modal =====
interface DecisionModalProps {
  item: QuestionItem;
  mode: 'create' | 'edit';
  editFilePath?: string;
  initialDecision?: string;
  initialNote?: string;
  onClose: () => void;
  onSaved: () => void;
  projectRoot: string;
}

function DecisionModal({ item, mode, editFilePath, initialDecision = '', initialNote = '', onClose, onSaved, projectRoot }: DecisionModalProps) {
  const today = new Date().toISOString().slice(0, 10);
  const wpId = item.wpAddress.split('/').pop() || 'decision';
  const autoName = `${wpId}.${today}.NNN.md`;

  const [decision, setDecision] = useState(initialDecision);
  const [note, setNote] = useState(initialNote);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!decision.trim()) { setError('결정 내용을 입력하세요.'); return; }
    setSaving(true);
    setError(null);
    try {
      if (mode === 'edit' && editFilePath) {
        const r = await updateDecisionContent(editFilePath, decision, note);
        if (!r.success) throw new Error(r.error || '수정 실패');
      } else {
        const req: DecideRequest = {
          wpAddress: item.wpAddress,
          qid: item.qid,
          questionText: item.text,
          decision,
          note,
        };
        const r = await decideQuestion(projectRoot, req);
        if (!r.success) throw new Error(r.error || '저장 실패');
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류 발생');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <div style={s.modalTitle}>{mode === 'edit' ? '답변 수정' : '답변'} — [{item.qid}]</div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
          {item.text}
        </div>

        {mode === 'create' && (
          <>
            <label style={s.label}>파일명 (자동 생성)</label>
            <input style={s.inputReadonly} value={autoName} readOnly />
          </>
        )}

        <label style={s.label}>결정 *</label>
        <textarea style={s.textarea} value={decision} onChange={e => setDecision(e.target.value)}
          placeholder="어떤 결정을 내렸는가..." autoFocus />

        <label style={s.label}>비고</label>
        <textarea style={{ ...s.textarea, minHeight: 56 }} value={note} onChange={e => setNote(e.target.value)}
          placeholder="추가 맥락, 이유, 참고 사항..." />

        {error && <div style={{ color: 'var(--status-error)', fontSize: 12, marginBottom: 8 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button style={s.btn} onClick={onClose}>취소</button>
          <button style={s.btnPrimary} onClick={handleSave} disabled={saving}>
            {saving ? '저장 중...' : mode === 'edit' ? '수정 저장' : '결정 저장'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== Confirm Delete Modal =====
function ConfirmDelete({ item, onConfirm, onCancel, deleting }: {
  item: QuestionItem; onConfirm: () => void; onCancel: () => void; deleting: boolean;
}) {
  return (
    <div style={s.overlay} onClick={onCancel}>
      <div style={{ ...s.modal, width: 380 }} onClick={e => e.stopPropagation()}>
        <div style={s.modalTitle}>질문 삭제</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
          <strong>[{item.qid}]</strong> 항목을 WayPoint에서 삭제합니다.
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button style={s.btn} onClick={onCancel}>취소</button>
          <button style={s.btnDanger} onClick={onConfirm} disabled={deleting}>
            {deleting ? '삭제 중...' : '삭제'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== Decision file card (결정완료 tab) =====
function DecisionCard({ item, onOpenTab }: { item: DecisionListItem; onOpenTab?: (tab: Tab) => void }) {
  const [editOpen, setEditOpen] = useState(false);
  const [editInitial, setEditInitial] = useState<{ decision: string; note: string } | null>(null);
  const [reloading, setReloading] = useState(false);

  const aiColor = AI_STATUS_COLOR[item.aiStatus] || '#888';
  const isSuperseded = item.status === 'SUPERSEDED';

  const handleEdit = async () => {
    try {
      const content = await fetchDecisionContent(item.filePath);
      setEditInitial({ decision: content.decision, note: content.note });
      setEditOpen(true);
    } catch {
      // ignore
    }
  };

  const handleEditSaved = async () => {
    setEditOpen(false);
    setEditInitial(null);
    setReloading(true);
    setTimeout(() => setReloading(false), 500);
  };

  const fakeQItem: QuestionItem = {
    wpAddress: item.wpAddress,
    wpSummary: '',
    qid: item.questionId || '',
    state: 'OPEN',
    text: item.question || '',
  };

  return (
    <div style={{ ...s.card, opacity: isSuperseded ? 0.6 : 1 }}>
      {/* Header: ID + AI status + file open */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
          {item.id}
        </span>
        <span style={s.stateBadge(aiColor)}>{item.aiStatus}</span>
        {isSuperseded && <span style={s.stateBadge('#aaa')}>대체됨</span>}
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{item.createdAt}</span>
        <span
          style={s.fileRef}
          onClick={() => openDecisionFile(item.filePath)}
          title={item.filePath}
        >📄</span>
      </div>

      {/* WP address */}
      <div style={s.wpRow}>
        <span style={s.wpAddr}>{item.wpAddress} [{item.questionId}]</span>
        {onOpenTab && item.wpAddress && (
          <button style={s.arrowBtn}
            onClick={() => onOpenTab({ id: item.wpAddress, title: item.wpAddress.split('/').pop() || item.wpAddress, type: 'waypoint', address: item.wpAddress })}
            title="WayPoint 열기">
            <ArrowRight size={11} />
          </button>
        )}
      </div>

      {/* Original question */}
      {item.question && (
        <div style={s.questionPreview}>Q: {item.question}</div>
      )}

      {/* Decision preview */}
      {item.decision && (
        <div style={s.decisionPreview}>{item.decision}</div>
      )}

      {/* Actions */}
      {!isSuperseded && (
        <div style={{ ...s.actions, justifyContent: 'flex-end' }}>
          <button style={s.btn} onClick={handleEdit} disabled={reloading}>수정</button>
        </div>
      )}

      {/* Edit modal */}
      {editOpen && editInitial && (
        <div style={s.overlay} onClick={() => setEditOpen(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalTitle}>답변 수정 — [{item.questionId}]</div>
            {item.question && (
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
                {item.question}
              </div>
            )}
            <label style={s.label}>결정 *</label>
            <textarea style={s.textarea} defaultValue={editInitial.decision}
              id={`dec-edit-${item.id}`} autoFocus />
            <label style={s.label}>비고</label>
            <textarea style={{ ...s.textarea, minHeight: 56 }} defaultValue={editInitial.note}
              id={`note-edit-${item.id}`} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button style={s.btn} onClick={() => setEditOpen(false)}>취소</button>
              <button style={s.btnPrimary} onClick={async () => {
                const dec = (document.getElementById(`dec-edit-${item.id}`) as HTMLTextAreaElement)?.value || '';
                const note = (document.getElementById(`note-edit-${item.id}`) as HTMLTextAreaElement)?.value || '';
                await updateDecisionContent(item.filePath, dec, note);
                handleEditSaved();
              }}>수정 저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== QuestionList =====
export default function QuestionList({ projectRoot, onOpenTab }: QuestionListProps) {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [decisions, setDecisions] = useState<DecisionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterState>('OPEN');
  const [error, setError] = useState<string | null>(null);

  const [decidingItem, setDecidingItem] = useState<QuestionItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<QuestionItem | null>(null);
  const [deferring, setDeferring] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetchQuestions(projectRoot),
      fetchDecisions(projectRoot),
    ])
      .then(([qs, ds]) => { setQuestions(qs); setDecisions(ds); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (projectRoot) load(); }, [projectRoot]);

  const removeQuestion = (wpAddress: string, qid: string) =>
    setQuestions(prev => prev.filter(it => !(it.wpAddress === wpAddress && it.qid === qid)));

  const handleDefer = async (item: QuestionItem) => {
    const key = item.wpAddress + item.qid;
    setDeferring(key);
    try {
      await deferQuestion(projectRoot, item.wpAddress, item.qid);
      setQuestions(prev => prev.map(it =>
        it.wpAddress === item.wpAddress && it.qid === item.qid
          ? { ...it, state: 'DEFERRED' as const }
          : it
      ));
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류');
    } finally {
      setDeferring(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    setDeleting(true);
    try {
      await deleteQuestion(projectRoot, deletingItem.wpAddress, deletingItem.qid);
      removeQuestion(deletingItem.wpAddress, deletingItem.qid);
      setDeletingItem(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : '삭제 실패');
    } finally {
      setDeleting(false);
    }
  };

  const openCounts = questions.filter(q => q.state === 'OPEN').length;
  const deferredCounts = questions.filter(q => q.state === 'DEFERRED').length;
  const decidedCounts = decisions.filter(d => d.status !== 'SUPERSEDED').length;

  if (loading) return <div style={{ padding: 20, color: 'var(--text-muted)' }}>Loading...</div>;
  if (error) return <div style={{ padding: 20, color: 'var(--status-error)' }}>Error: {error}</div>;

  const visibleQuestions = questions.filter(q => q.state === filter);

  return (
    <div style={s.container}>
      {/* Header */}
      <div style={s.header}>
        <span style={s.title}>Questions</span>
        <span style={s.badge(STATE_COLOR.OPEN)}>대기 {openCounts}</span>
        <span style={s.badge(STATE_COLOR.DEFERRED)}>추후검토 {deferredCounts}</span>
        <span style={s.badge(STATE_COLOR.DECISIONS)}>결정완료 {decidedCounts}</span>
        <button style={{ ...s.btn, marginLeft: 'auto' }} onClick={load}>새로고침</button>
      </div>

      {/* Filter tabs */}
      <div style={s.filterBar}>
        <button style={s.filterBtn(filter === 'OPEN', STATE_COLOR.OPEN)} onClick={() => setFilter('OPEN')}>대기</button>
        <button style={s.filterBtn(filter === 'DEFERRED', STATE_COLOR.DEFERRED)} onClick={() => setFilter('DEFERRED')}>추후검토</button>
        <button style={s.filterBtn(filter === 'DECISIONS', STATE_COLOR.DECISIONS)} onClick={() => setFilter('DECISIONS')}>결정완료</button>
      </div>

      {/* OPEN / DEFERRED question list */}
      {filter !== 'DECISIONS' && (
        <>
          {visibleQuestions.length === 0 && (
            <div style={s.empty}>
              {filter === 'OPEN' ? '대기 중인 질문이 없습니다.' : '추후검토 항목이 없습니다.'}
            </div>
          )}
          {visibleQuestions.map(item => {
            const key = item.wpAddress + item.qid;
            return (
              <div key={key} style={s.card}>
                <div style={s.wpRow}>
                  <span style={s.wpAddr}>{item.wpAddress}</span>
                  {onOpenTab && (
                    <button style={s.arrowBtn}
                      onClick={() => onOpenTab({ id: item.wpAddress, title: item.wpAddress.split('/').pop() || item.wpAddress, type: 'waypoint', address: item.wpAddress })}
                      title="WayPoint 열기">
                      <ArrowRight size={11} />
                    </button>
                  )}
                </div>
                <div style={s.cardHeader}>
                  <span style={s.qid}>[{item.qid}]</span>
                  <span style={s.qtext}>{item.text}</span>
                  <span style={s.stateBadge(STATE_COLOR[item.state])}>
                    {item.state === 'OPEN' ? '대기' : '추후검토'}
                  </span>
                </div>
                <div style={s.actions}>
                  <button style={s.btnPrimary} onClick={() => setDecidingItem(item)}>답변</button>
                  {item.state === 'OPEN' && (
                    <button style={s.btn} onClick={() => handleDefer(item)} disabled={deferring === key}>
                      {deferring === key ? '...' : 'Defer'}
                    </button>
                  )}
                  {item.state === 'DEFERRED' && (
                    <button style={s.btnDanger} onClick={() => setDeletingItem(item)}>삭제</button>
                  )}
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* DECISIONS file list */}
      {filter === 'DECISIONS' && (
        <>
          {decisions.length === 0 && (
            <div style={s.empty}>결정 파일이 없습니다.</div>
          )}
          {decisions.map(item => (
            <DecisionCard key={item.id} item={item} onOpenTab={onOpenTab} />
          ))}
        </>
      )}

      {/* Modals */}
      {decidingItem && (
        <DecisionModal
          item={decidingItem}
          mode="create"
          projectRoot={projectRoot}
          onClose={() => setDecidingItem(null)}
          onSaved={() => { setDecidingItem(null); load(); }}
        />
      )}

      {deletingItem && (
        <ConfirmDelete
          item={deletingItem}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingItem(null)}
          deleting={deleting}
        />
      )}
    </div>
  );
}
