import { useState } from 'react';
import type { CSSProperties } from 'react';

interface SearchResult {
  address: string;
  type: 'MAP' | 'WAYPOINT' | 'BLACKBOX';
  summary: string;
}

const allResults: SearchResult[] = [
  { address: 'M://root/backend', type: 'MAP', summary: 'Spring Boot Backend' },
  { address: 'W://root/backend/element_service', type: 'WAYPOINT', summary: 'Element Service' },
  { address: 'B://root/backend/element_service', type: 'BLACKBOX', summary: 'Element Service BB' },
  { address: 'M://root/frontend', type: 'MAP', summary: 'React Frontend' },
  { address: 'W://root/frontend/app_shell', type: 'WAYPOINT', summary: 'App Shell' },
  { address: 'W://root/frontend/map_view', type: 'WAYPOINT', summary: 'Map View' },
  { address: 'W://root/backend/todo_service', type: 'WAYPOINT', summary: 'TODO Service' },
  { address: 'W://root/backend/git_service', type: 'WAYPOINT', summary: 'Git Service' },
];

const typeIcons: Record<string, string> = {
  MAP: '\u{1F5FA}',
  WAYPOINT: '\u{1F4CD}',
  BLACKBOX: '\u{1F4E6}',
};

const typeColors: Record<string, string> = {
  MAP: 'var(--accent-primary)',
  WAYPOINT: 'var(--status-progress)',
  BLACKBOX: 'var(--text-muted)',
};

const styles: Record<string, CSSProperties> = {
  container: {
    padding: 20,
    height: '100%',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-medium)',
    borderRadius: 'var(--radius-md)',
    marginBottom: 16,
  },
  searchIcon: {
    color: 'var(--text-muted)',
    fontSize: 14,
    flexShrink: 0,
  },
  input: {
    flex: 1,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontSize: 'var(--font-md)',
    color: 'var(--text-primary)',
    fontFamily: 'inherit',
  },
  resultCount: {
    fontSize: 'var(--font-sm)',
    color: 'var(--text-muted)',
    marginBottom: 12,
  },
  resultItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    transition: 'background 0.1s',
    borderBottom: '1px solid var(--border-light)',
  },
  resultIcon: {
    fontSize: 16,
    width: 24,
    textAlign: 'center' as const,
    flexShrink: 0,
  },
  resultBody: {
    flex: 1,
    minWidth: 0,
  },
  resultAddress: {
    fontFamily: 'monospace',
    fontSize: 'var(--font-sm)',
    color: 'var(--text-muted)',
  },
  resultSummary: {
    fontSize: 'var(--font-base)',
    color: 'var(--text-primary)',
    fontWeight: 500,
  },
  typeBadge: {
    fontSize: 'var(--font-xs)',
    padding: '1px 6px',
    borderRadius: 'var(--radius-sm)',
    fontWeight: 600,
    flexShrink: 0,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    color: 'var(--text-muted)',
    fontSize: 'var(--font-md)',
    gap: 8,
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 32,
    opacity: 0.3,
  },
};

export default function SearchPanel() {
  const [query, setQuery] = useState('');

  const results = query.trim()
    ? allResults.filter(
        (r) =>
          r.address.toLowerCase().includes(query.toLowerCase()) ||
          r.summary.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const showEmpty = query.trim().length > 0 && results.length === 0;

  return (
    <div style={styles.container}>
      {/* Search Input */}
      <div style={styles.searchBox}>
        <span style={styles.searchIcon}>&#128269;</span>
        <input
          style={styles.input}
          placeholder="Search elements by address or name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      {/* Results */}
      {results.length > 0 && (
        <>
          <div style={styles.resultCount}>{results.length} result(s)</div>
          {results.map((r, i) => (
            <div
              key={i}
              style={styles.resultItem}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-hover)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
            >
              <span style={styles.resultIcon}>{typeIcons[r.type]}</span>
              <div style={styles.resultBody}>
                <div style={styles.resultSummary}>{r.summary}</div>
                <div style={styles.resultAddress}>{r.address}</div>
              </div>
              <span
                style={{
                  ...styles.typeBadge,
                  color: typeColors[r.type],
                  background: r.type === 'MAP' ? 'var(--accent-bg)' : 'var(--bg-secondary)',
                }}
              >
                {r.type}
              </span>
            </div>
          ))}
        </>
      )}

      {/* No results state */}
      {showEmpty && (
        <div style={styles.emptyState}>
          <span style={styles.emptyIcon}>&#128269;</span>
          <span>No results found</span>
        </div>
      )}

      {/* Initial state */}
      {!query.trim() && (
        <div style={styles.emptyState}>
          <span style={styles.emptyIcon}>&#128269;</span>
          <span>Type to search elements</span>
        </div>
      )}
    </div>
  );
}
