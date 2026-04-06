import { useState } from 'react';
import type { CSSProperties } from 'react';

type LogKind = 'ALL' | 'NOTE' | 'DECISION' | 'ISSUE' | 'QUESTION' | 'CHANGE';

interface LogEntry {
  timestamp: string;
  kind: Exclude<LogKind, 'ALL'>;
  address: string;
  content: string;
}

const sampleLogs: LogEntry[] = [
  { timestamp: '2026-04-06 11:30', kind: 'NOTE', address: 'W://root/frontend/app_shell', content: '메인 화면 레이아웃 완성, 리사이즈 패널 구현 완료' },
  { timestamp: '2026-04-06 11:00', kind: 'DECISION', address: 'M://root', content: 'beige 컬러 테마 + IDE 스타일 레이아웃 채택' },
  { timestamp: '2026-04-06 10:30', kind: 'ISSUE', address: 'B://root/backend/element_service', content: 'SYNCED_AT 30일 초과 시 CODE_MAP 신뢰도 경고 로직 필요' },
  { timestamp: '2026-04-06 10:00', kind: 'QUESTION', address: 'W://root/backend/element_service', content: 'CONNECTIONS 파싱 시 순환 참조 처리 방법?' },
  { timestamp: '2026-04-06 09:30', kind: 'CHANGE', address: 'W://root/backend/project_config', content: 'Spring Boot 프로젝트 초기 설정 완료' },
  { timestamp: '2026-04-06 09:00', kind: 'NOTE', address: 'M://root', content: 'LOADSTAR 프로젝트 초기 구조 정의' },
];

const kindColors: Record<string, string> = {
  NOTE: 'var(--status-progress)',
  DECISION: 'var(--accent-primary)',
  ISSUE: 'var(--status-error)',
  QUESTION: 'var(--status-review)',
  CHANGE: 'var(--status-stable)',
};

const styles: Record<string, CSSProperties> = {
  container: {
    padding: 24,
    overflowY: 'auto',
    height: '100%',
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: 16,
  },
  filterBar: {
    display: 'flex',
    gap: 10,
    marginBottom: 16,
    alignItems: 'center',
  },
  select: {
    padding: '6px 10px',
    border: '1px solid var(--border-medium)',
    borderRadius: 'var(--radius-md)',
    background: 'var(--bg-surface)',
    color: 'var(--text-primary)',
    fontSize: 'var(--font-sm)',
    outline: 'none',
  },
  addressInput: {
    padding: '6px 10px',
    border: '1px solid var(--border-medium)',
    borderRadius: 'var(--radius-md)',
    background: 'var(--bg-surface)',
    color: 'var(--text-primary)',
    fontSize: 'var(--font-sm)',
    fontFamily: 'monospace',
    width: 260,
    outline: 'none',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  th: {
    textAlign: 'left' as const,
    padding: '8px 12px',
    fontSize: 'var(--font-sm)',
    color: 'var(--text-muted)',
    borderBottom: '2px solid var(--border-light)',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  td: {
    padding: '10px 12px',
    fontSize: 'var(--font-base)',
    borderBottom: '1px solid var(--border-light)',
    color: 'var(--text-primary)',
  },
  badge: {
    display: 'inline-block',
    fontSize: 'var(--font-xs)',
    padding: '2px 8px',
    borderRadius: 10,
    fontWeight: 600,
    color: '#fff',
  },
  addressCell: {
    fontFamily: 'monospace',
    fontSize: 'var(--font-sm)',
    color: 'var(--text-secondary)',
  },
  timestamp: {
    fontSize: 'var(--font-sm)',
    color: 'var(--text-muted)',
    whiteSpace: 'nowrap',
  },
};

const kindOptions: LogKind[] = ['ALL', 'NOTE', 'DECISION', 'ISSUE', 'QUESTION', 'CHANGE'];

export default function LogView() {
  const [kindFilter, setKindFilter] = useState<LogKind>('ALL');
  const [addressFilter, setAddressFilter] = useState('');

  const filtered = sampleLogs.filter((log) => {
    if (kindFilter !== 'ALL' && log.kind !== kindFilter) return false;
    if (addressFilter && !log.address.toLowerCase().includes(addressFilter.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={styles.container}>
      <div style={styles.title}>Log</div>

      {/* Filter Bar */}
      <div style={styles.filterBar}>
        <select
          style={styles.select}
          value={kindFilter}
          onChange={(e) => setKindFilter(e.target.value as LogKind)}
        >
          {kindOptions.map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
        <input
          style={styles.addressInput}
          placeholder="Filter by address..."
          value={addressFilter}
          onChange={(e) => setAddressFilter(e.target.value)}
        />
      </div>

      {/* Log Table */}
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Time</th>
            <th style={styles.th}>Kind</th>
            <th style={styles.th}>Address</th>
            <th style={styles.th}>Content</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((log, i) => (
            <tr key={i}>
              <td style={{ ...styles.td, ...styles.timestamp }}>{log.timestamp}</td>
              <td style={styles.td}>
                <span style={{ ...styles.badge, background: kindColors[log.kind] }}>{log.kind}</span>
              </td>
              <td style={{ ...styles.td, ...styles.addressCell }}>{log.address}</td>
              <td style={styles.td}>{log.content}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
