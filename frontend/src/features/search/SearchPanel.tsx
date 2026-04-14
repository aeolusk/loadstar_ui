import { useState, useRef, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { searchElements, type SearchResultItem } from '../../api/client';
import type { Tab } from '../../App';
import { MapTrifold, Diamond } from '@phosphor-icons/react';

interface SearchPanelProps {
  projectRoot: string;
  onOpenTab: (tab: Tab) => void;
}

const typeIcons: Record<string, React.ReactNode> = {
  MAP: <MapTrifold size={14} />,
  WAYPOINT: <Diamond size={14} />,
};

const statusColors: Record<string, string> = {
  S_IDL: '#9b8e7e',
  S_PRG: '#3a7ca5',
  S_STB: '#5a8a5e',
  S_ERR: '#b54a3f',
  S_REV: '#c47f17',
};

export default function SearchPanel({ projectRoot, onOpenTab }: SearchPanelProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = async () => {
    if (!projectRoot || !query.trim()) return;
    setLoading(true);
    try {
      const items = await searchElements(projectRoot, query.trim());
      setResults(items);
    } catch (e) {
      console.error('Search failed', e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleRowClick = (item: SearchResultItem) => {
    const type = item.type === 'MAP' ? 'map' : 'waypoint';
    onOpenTab({
      id: `${type}-${item.address}`,
      title: item.address.split('/').pop() || item.address,
      type,
      address: item.address,
    });
  };

  return (
    <div style={s.container}>
      {/* Search Bar */}
      <div style={s.filterSection}>
        <div style={s.filterRow}>
          <div style={{ ...s.filterGroup, flex: 1 }}>
            <span style={s.filterLabel}>Search</span>
            <input
              ref={inputRef}
              style={s.input}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="검색어 입력 (주소, 키워드, 내용...)"
              spellCheck={false}
            />
          </div>
          <div style={{ ...s.filterGroup, alignSelf: 'flex-end' }}>
            <button style={s.btnPrimary} onClick={handleSearch} disabled={loading || !query.trim()}>
              {loading ? '...' : '검색'}
            </button>
            <button style={s.btn} onClick={() => { setQuery(''); setResults(null); }}>초기화</button>
          </div>
        </div>
      </div>

      {/* Results */}
      {results === null ? (
        <div style={s.empty}>검색어를 입력하고 Enter 또는 [검색] 버튼을 클릭하세요.</div>
      ) : results.length === 0 ? (
        <div style={s.empty}>검색 결과가 없습니다.</div>
      ) : (
        <table style={s.table}>
          <thead>
            <tr>
              <th style={{ ...s.th, width: 50 }}>Type</th>
              <th style={{ ...s.th, width: 60 }}>Status</th>
              <th style={{ ...s.th, width: 240 }}>Address</th>
              <th style={s.th}>Snippet</th>
              <th style={{ ...s.th, width: 50, textAlign: 'center' as const }}>Hits</th>
            </tr>
          </thead>
          <tbody>
            {results.map((item, i) => (
              <tr
                key={i}
                style={{ ...(i % 2 === 0 ? {} : { background: 'var(--bg-secondary)' }), cursor: 'pointer' }}
                onClick={() => handleRowClick(item)}
                onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'var(--bg-hover)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = i % 2 === 0 ? '' : 'var(--bg-secondary)'; }}
              >
                <td style={{ ...s.td, textAlign: 'center', fontSize: 16 }}>
                  {typeIcons[item.type] || '?'}
                </td>
                <td style={s.td}>
                  <span style={{
                    ...s.badge,
                    background: statusColors[item.status] || '#666',
                    color: '#fff',
                  }}>
                    {item.status}
                  </span>
                </td>
                <td style={{ ...s.td, ...s.mono }}>
                  {item.address}
                </td>
                <td style={s.td}>
                  <div
                    style={s.snippet}
                    dangerouslySetInnerHTML={{ __html: item.snippet }}
                  />
                </td>
                <td style={{ ...s.td, textAlign: 'center', ...s.muted }}>
                  {item.matchCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {results && results.length > 0 && (
        <div style={s.resultCount}>{results.length}건</div>
      )}
    </div>
  );
}

const s: Record<string, CSSProperties> = {
  container: { height: '100%', overflow: 'auto', fontSize: 13, position: 'relative' },
  filterSection: {
    padding: '12px 16px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-secondary)',
    position: 'sticky', top: 0, zIndex: 2,
  },
  filterRow: {
    display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' as const,
  },
  filterGroup: {
    display: 'flex', flexDirection: 'column' as const, gap: 3,
  },
  filterLabel: {
    fontSize: 11, color: 'var(--text-muted)', fontWeight: 600,
  },
  input: {
    padding: '5px 8px', border: '1px solid var(--border-medium)', borderRadius: 4,
    fontSize: 12, fontFamily: 'monospace', background: 'var(--bg-surface)', color: 'var(--text-primary)',
    outline: 'none', minWidth: 200,
  },
  btnPrimary: {
    padding: '5px 14px', border: '1px solid var(--accent-primary)', borderRadius: 4,
    background: 'var(--accent-primary)', color: '#fff', fontSize: 12, fontWeight: 600,
    cursor: 'pointer', marginRight: 4,
  },
  btn: {
    padding: '5px 12px', border: '1px solid var(--border-medium)', borderRadius: 4,
    background: 'var(--bg-surface)', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer',
  },
  empty: {
    padding: '40px 16px', textAlign: 'center' as const, color: 'var(--text-muted)', fontSize: 13,
  },
  table: {
    width: '100%', borderCollapse: 'collapse' as const,
  },
  th: {
    textAlign: 'left' as const, padding: '8px 12px', fontSize: 11,
    color: 'var(--text-muted)', borderBottom: '2px solid var(--border-light)',
    fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 0.5,
    position: 'sticky' as const, top: 52, background: 'var(--bg-surface)',
  },
  td: {
    padding: '8px 12px', borderBottom: '1px solid var(--border-light)', color: 'var(--text-primary)',
    verticalAlign: 'top' as const,
  },
  badge: {
    display: 'inline-block', fontSize: 10, padding: '2px 8px', borderRadius: 10, fontWeight: 600,
    whiteSpace: 'nowrap' as const,
  },
  mono: {
    fontFamily: 'monospace', fontSize: 11, color: 'var(--text-secondary)',
    whiteSpace: 'nowrap' as const,
  },
  muted: {
    fontSize: 12, color: 'var(--text-muted)',
  },
  snippet: {
    fontSize: 11, lineHeight: '1.5', color: 'var(--text-secondary)',
    whiteSpace: 'pre-wrap' as const, maxHeight: 60, overflow: 'hidden',
    fontFamily: 'monospace',
  },
  resultCount: {
    padding: '8px 16px', fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' as const,
  },
};
