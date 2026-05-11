import { useEffect, useState } from 'react';
import { fetchTree } from '../../api/client';
import type { TreeNode } from '../../types/loadstar';

interface GoalReportProps {
  projectRoot: string;
}

const COLOR_TEXT = '#1f2328';
const COLOR_MUTED = '#8c959f';
const COLOR_BORDER = '#d0d7de';
const COLOR_GOAL = '#0550ae';
const COLOR_DWP = '#6f42c1';

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
  btnRow: { display: 'flex', gap: 6 } as React.CSSProperties,
  btn: {
    border: `1px solid ${COLOR_BORDER}`,
    background: '#f6f8fa',
    padding: '4px 10px',
    fontSize: 12,
    cursor: 'pointer',
    borderRadius: 4,
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
};

const GoalReport = ({ projectRoot }: GoalReportProps) => {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openTodos, setOpenTodos] = useState<Set<string>>(new Set());

  // Inject print CSS into <head> so @media print works reliably
  useEffect(() => {
    const el = document.createElement('style');
    el.id = 'goal-report-print-style';
    el.textContent = PRINT_STYLE;
    document.head.appendChild(el);
    return () => {
      document.getElementById('goal-report-print-style')?.remove();
    };
  }, []);

  useEffect(() => {
    if (!projectRoot) {
      setTree([]);
      return;
    }
    setLoading(true);
    setError(null);
    fetchTree(projectRoot)
      .then(setTree)
      .catch((err) => {
        console.error('Failed to load tree:', err);
        setError('트리 로드 실패');
      })
      .finally(() => setLoading(false));
  }, [projectRoot]);

  const toggle = (key: string) => {
    setOpenTodos((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Open new blank window with Goals HTML only — reliable cross-browser PDF print
  const handlePrint = () => {
    const el = document.querySelector('.goal-report-root') as HTMLElement;
    if (!el) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Goals Report</title>
<style>
body{font-family:"Segoe UI",Tahoma,sans-serif;font-size:13px;line-height:1.55;color:#1f2328;padding:24px 32px;margin:0}
.goal-report-no-print{display:none!important}
.goal-report-todo-body{display:block!important}
</style>
</head>
<body>${el.innerHTML}</body>
</html>`);
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

  if (!projectRoot) {
    return (
      <div style={s.container}><div style={s.empty}>프로젝트를 먼저 선택하세요.</div></div>
    );
  }
  if (loading) return <div style={s.container}><div style={s.empty}>불러오는 중...</div></div>;
  if (error) return <div style={s.container}><div style={s.empty}>{error}</div></div>;

  return (
    <div className="goal-report-root" style={s.container}>
      <div style={s.header} className="goal-report-no-print">
        <h2 style={s.title}>Goals Report</h2>
        <div style={s.btnRow}>
          <button style={s.btn} onClick={handlePrint}>인쇄 / PDF</button>
          <button style={s.btn} onClick={downloadMarkdown}>Markdown 다운로드</button>
        </div>
      </div>
      {tree.length === 0 ? (
        <div style={s.empty}>표시할 요소가 없습니다.</div>
      ) : (
        tree.map((node) => <Node key={node.address} node={node} depth={0} openTodos={openTodos} onToggle={toggle} />)
      )}
    </div>
  );
};

interface NodeProps {
  node: TreeNode;
  depth: number;
  openTodos: Set<string>;
  onToggle: (key: string) => void;
}

const Node = ({ node, depth, openTodos, onToggle }: NodeProps) => {
  const indent = depth * 24;

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

  return (
    <div style={{ ...s.block, marginLeft: indent }}>
      <div style={s.addr}>
        {isMap ? '📁 ' : '◆ '}{node.address}
      </div>
      <div style={s.summary}>{node.summary || '(SUMMARY 없음)'}</div>
      {goal
        ? <div style={s.goalLine}>🎯 {goal}</div>
        : <div style={s.goalMissing}>🎯 GOAL (미지정)</div>}

      {!isMap && tasks.length > 0 && (
        <div style={s.todoBlock}>
          <div style={s.todoHeader} onClick={() => onToggle(tasksKey)}>
            <span style={s.todoToggle}>{tasksOpen ? '−' : '+'}</span>
            <span>TODO ({tasks.filter(t => t.done).length}/{tasks.length})</span>
          </div>
          {/* Always rendered — display controlled by inline style so print CSS can force-show */}
          <div className="goal-report-todo-body" style={{ marginTop: 2, display: tasksOpen ? 'block' : 'none' }}>
            {tasks.map((t, i) => (
              <div key={i} style={{ ...s.todoItem, ...(t.done ? s.todoDone : {}) }}>
                {t.done ? '✓' : '☐'} {t.text}
              </div>
            ))}
          </div>
        </div>
      )}
      {!isMap && recurring.length > 0 && (
        <div style={s.todoBlock}>
          <div style={s.todoHeader} onClick={() => onToggle(recurringKey)}>
            <span style={s.todoToggle}>{recurringOpen ? '−' : '+'}</span>
            <span>RECURRING ({recurring.length})</span>
          </div>
          {/* Always rendered — display controlled by inline style so print CSS can force-show */}
          <div className="goal-report-todo-body" style={{ marginTop: 2, display: recurringOpen ? 'block' : 'none' }}>
            {recurring.map((t, i) => (
              <div key={i} style={{ ...s.todoItem, ...s.todoRecurring }}>
                ↻ {t.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {node.children?.length > 0 && (
        <div style={{ marginTop: 10 }}>
          {node.children.map((c) => (
            <Node key={c.address} node={c} depth={depth + 1} openTodos={openTodos} onToggle={onToggle} />
          ))}
        </div>
      )}
    </div>
  );
};

// ===== Markdown serialization =====

function treeToMarkdown(tree: TreeNode[]): string {
  const out: string[] = ['# Goals Report', '', `Generated: ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`, ''];
  for (const node of tree) {
    renderMd(node, 0, out);
  }
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
  if (node.goal?.trim()) {
    out.push(`🎯 ${node.goal.trim()}`);
  } else {
    out.push(`🎯 _(GOAL 미지정)_`);
  }
  out.push('');

  const todos = node.todos ?? [];
  const tasks = todos.filter(t => !t.recurring);
  const recurring = todos.filter(t => t.recurring);

  if (node.type === 'WAYPOINT' && tasks.length > 0) {
    out.push(`**TODO** (${tasks.filter(t => t.done).length}/${tasks.length})`);
    out.push('');
    for (const t of tasks) {
      out.push(`- [${t.done ? 'x' : ' '}] ${t.text}`);
    }
    out.push('');
  }
  if (node.type === 'WAYPOINT' && recurring.length > 0) {
    out.push(`**RECURRING** (${recurring.length})`);
    out.push('');
    for (const t of recurring) {
      out.push(`- (R) ${t.text}`);
    }
    out.push('');
  }

  for (const c of node.children ?? []) {
    renderMd(c, depth + 1, out);
  }
}

export default GoalReport;
