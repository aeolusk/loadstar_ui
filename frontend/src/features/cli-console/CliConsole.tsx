import { useState, useRef, useEffect, type CSSProperties } from 'react';
import { executeCliCommand } from '../../api/client';

interface CliConsoleProps {
  projectRoot: string;
}

interface HistoryEntry {
  type: 'input' | 'output' | 'error' | 'info';
  text: string;
}

const s: Record<string, CSSProperties> = {
  container: {
    display: 'flex', flexDirection: 'column', height: '100%',
    background: '#1e1e1e', color: '#cccccc', fontFamily: "'Consolas', 'Courier New', monospace",
    fontSize: 13,
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '6px 12px', background: '#252526', borderBottom: '1px solid #3c3c3c',
    fontSize: 12, color: '#888',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 8 },
  dot: (color: string) => ({
    width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block',
  }),
  output: {
    flex: 1, overflowY: 'auto', padding: '8px 12px', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
    lineHeight: 1.5,
  },
  inputRow: {
    display: 'flex', alignItems: 'center', padding: '6px 12px',
    borderTop: '1px solid #3c3c3c', background: '#1e1e1e',
  },
  prefix: { color: '#569cd6', fontWeight: 600, marginRight: 8, whiteSpace: 'nowrap', fontSize: 13 },
  input: {
    flex: 1, background: 'transparent', border: 'none', outline: 'none',
    color: '#cccccc', fontFamily: "'Consolas', 'Courier New', monospace", fontSize: 13,
    caretColor: '#569cd6',
  },
  cmdLine: { color: '#569cd6' },
  outputText: { color: '#cccccc' },
  errorText: { color: '#f48771' },
  infoText: { color: '#6a9955' },
  clearBtn: {
    background: 'transparent', border: '1px solid #555', borderRadius: 3,
    color: '#888', fontSize: 10, padding: '2px 8px', cursor: 'pointer',
  },
};

export default function CliConsole({ projectRoot }: CliConsoleProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([
    { type: 'info', text: 'LOADSTAR CLI Console - 명령어를 입력하세요 (예: show M://root, todo list, log W://root NOTE "test")' },
    { type: 'info', text: '"help" - 도움말, "clear" - 화면 초기화, 화살표 위/아래 - 명령 이력 탐색' },
  ]);
  const [input, setInput] = useState('');
  const [running, setRunning] = useState(false);
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [cmdHistoryIdx, setCmdHistoryIdx] = useState(-1);
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
    if (!running) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [history, running]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async () => {
    const trimmed = input.trim();
    if (!trimmed || running) return;

    setCmdHistory(prev => [...prev, trimmed]);
    setCmdHistoryIdx(-1);

    // Built-in commands
    if (trimmed === 'clear') {
      setHistory([{ type: 'info', text: 'Console cleared.' }]);
      setInput('');
      return;
    }
    if (trimmed === 'help') {
      setHistory(prev => [
        ...prev,
        { type: 'input', text: `$ ${trimmed}` },
        { type: 'info', text: [
          'loadstar CLI commands:',
          '  show [FILTER]                 WayPoint 목록 조회',
          '  todo add/update/done/delete/list/history',
          '  log [ADDRESS] [KIND] "[MSG]"  로그 기록',
          '  findlog [OFFSET] [LIMIT]      로그 검색',
          '  validate                      깨진 링크 검출',
          '',
          'Console commands:',
          '  clear    화면 초기화',
          '  help     도움말 표시',
        ].join('\n') },
      ]);
      setInput('');
      return;
    }

    // Parse: support "loadstar xxx" or just "xxx"
    let args: string[];
    let displayCmd: string;
    if (trimmed.toLowerCase().startsWith('loadstar ')) {
      args = parseArgs(trimmed.substring(9));
      displayCmd = trimmed;
    } else {
      args = parseArgs(trimmed);
      displayCmd = `loadstar ${trimmed}`;
    }

    setHistory(prev => [...prev, { type: 'input', text: `$ ${displayCmd}` }]);
    setInput('');
    setRunning(true);

    try {
      const result = await executeCliCommand(projectRoot, args);
      setHistory(prev => [
        ...prev,
        { type: result.success ? 'output' : 'error', text: result.output || '(no output)' },
      ]);
    } catch (e) {
      setHistory(prev => [
        ...prev,
        { type: 'error', text: e instanceof Error ? e.message : 'Command failed' },
      ]);
    } finally {
      setRunning(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (cmdHistory.length > 0) {
        const newIdx = cmdHistoryIdx < 0 ? cmdHistory.length - 1 : Math.max(0, cmdHistoryIdx - 1);
        setCmdHistoryIdx(newIdx);
        setInput(cmdHistory[newIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (cmdHistoryIdx >= 0) {
        const newIdx = cmdHistoryIdx + 1;
        if (newIdx >= cmdHistory.length) {
          setCmdHistoryIdx(-1);
          setInput('');
        } else {
          setCmdHistoryIdx(newIdx);
          setInput(cmdHistory[newIdx]);
        }
      }
    }
  };

  return (
    <div style={s.container} onClick={() => inputRef.current?.focus()}>
      <div style={s.header}>
        <div style={s.headerLeft}>
          <span style={s.dot('#f48771')} />
          <span style={s.dot('#e2c08d')} />
          <span style={s.dot('#6a9955')} />
          <span style={{ marginLeft: 8 }}>LOADSTAR Terminal</span>
          {running && <span style={{ color: '#569cd6', marginLeft: 8 }}>running...</span>}
        </div>
        <button style={s.clearBtn} onClick={(e) => { e.stopPropagation(); setHistory([{ type: 'info', text: 'Console cleared.' }]); }}>
          Clear
        </button>
      </div>

      <div ref={outputRef} style={s.output}>
        {history.map((entry, i) => {
          let lineStyle: CSSProperties;
          switch (entry.type) {
            case 'input': lineStyle = s.cmdLine; break;
            case 'error': lineStyle = s.errorText; break;
            case 'info': lineStyle = s.infoText; break;
            default: lineStyle = s.outputText;
          }
          return <div key={i} style={lineStyle}>{entry.text}</div>;
        })}
      </div>

      <div style={s.inputRow}>
        <span style={s.prefix}>loadstar $</span>
        <input
          ref={inputRef}
          style={s.input}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={running ? 'executing...' : 'enter command...'}
          disabled={running}
          spellCheck={false}
          autoComplete="off"
        />
      </div>
    </div>
  );
}

/** Parse command string respecting quoted arguments */
function parseArgs(cmd: string): string[] {
  const args: string[] = [];
  let current = '';
  let inQuote = false;
  let quoteChar = '';

  for (const ch of cmd) {
    if (inQuote) {
      if (ch === quoteChar) {
        inQuote = false;
      } else {
        current += ch;
      }
    } else if (ch === '"' || ch === "'") {
      inQuote = true;
      quoteChar = ch;
    } else if (ch === ' ') {
      if (current) {
        args.push(current);
        current = '';
      }
    } else {
      current += ch;
    }
  }
  if (current) args.push(current);
  return args;
}
