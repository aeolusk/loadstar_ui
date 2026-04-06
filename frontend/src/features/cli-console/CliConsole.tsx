import { useState } from 'react';
import type { CSSProperties } from 'react';

interface HistoryEntry {
  command: string;
  output: string;
}

const initialHistory: HistoryEntry[] = [
  {
    command: 'loadstar status',
    output: 'Project: LOADSTAR Explorer\nStatus: S_PRG\nElements: 3 Maps, 18 WayPoints, 6 BlackBoxes\nDrift warnings: 1',
  },
  {
    command: 'loadstar todo list --active',
    output: 'ACTIVE  BlackBox md 파싱 구현          W://root/backend/element_service\nACTIVE  리사이즈 패널 적용              W://root/frontend/app_shell',
  },
  {
    command: 'loadstar sync check',
    output: 'B://root/backend/element_service  SYNCED_AT: 2026-03-01  [EXPIRED - 36 days]',
  },
];

const styles: Record<string, CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: '#1e1e1e',
    color: '#d4d4d4',
    fontFamily: "'Consolas', 'Courier New', monospace",
    fontSize: 13,
  },
  header: {
    padding: '10px 16px',
    background: '#2d2d2d',
    borderBottom: '1px solid #404040',
    fontSize: 12,
    color: '#888',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  headerDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
  },
  output: {
    flex: 1,
    overflowY: 'auto',
    padding: 16,
  },
  historyEntry: {
    marginBottom: 16,
  },
  prompt: {
    color: '#6a9955',
    fontWeight: 600,
  },
  commandText: {
    color: '#dcdcaa',
  },
  outputText: {
    whiteSpace: 'pre-wrap',
    color: '#d4d4d4',
    marginTop: 4,
    paddingLeft: 4,
  },
  inputRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 16px',
    borderTop: '1px solid #404040',
    background: '#252525',
    gap: 8,
  },
  inputPrefix: {
    color: '#6a9955',
    fontWeight: 600,
    flexShrink: 0,
  },
  input: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#dcdcaa',
    fontFamily: "'Consolas', 'Courier New', monospace",
    fontSize: 13,
  },
};

export default function CliConsole() {
  const [history, setHistory] = useState<HistoryEntry[]>(initialHistory);
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && input.trim()) {
      setHistory((prev) => [
        ...prev,
        { command: `loadstar ${input}`, output: `Command "${input}" executed. (sample output)` },
      ]);
      setInput('');
    }
  };

  return (
    <div style={styles.container}>
      {/* Terminal Header */}
      <div style={styles.header}>
        <span style={{ ...styles.headerDot, background: '#f44' }} />
        <span style={{ ...styles.headerDot, background: '#fa0' }} />
        <span style={{ ...styles.headerDot, background: '#0b0' }} />
        <span style={{ marginLeft: 8 }}>LOADSTAR CLI Console</span>
      </div>

      {/* Output Area */}
      <div style={styles.output}>
        {history.map((entry, i) => (
          <div key={i} style={styles.historyEntry}>
            <div>
              <span style={styles.prompt}>$ </span>
              <span style={styles.commandText}>{entry.command}</span>
            </div>
            <div style={styles.outputText}>{entry.output}</div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div style={styles.inputRow}>
        <span style={styles.inputPrefix}>loadstar $</span>
        <input
          style={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleSubmit}
          placeholder="Enter command..."
        />
      </div>
    </div>
  );
}
