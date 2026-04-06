import { useState, useEffect, useCallback } from 'react';
import { browseDirectory, validateProject, type DirEntry } from '../../api/client';

interface ProjectOpenDialogProps {
  onProjectSelected: (root: string) => void;
}

const RECENT_KEY = 'loadstar-recent-projects';

function getRecentProjects(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function saveRecentProject(root: string) {
  const recent = getRecentProjects().filter(p => p !== root);
  recent.unshift(root);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 10)));
}

export default function ProjectOpenDialog({ onProjectSelected }: ProjectOpenDialogProps) {
  const [currentPath, setCurrentPath] = useState('');
  const [parentPath, setParentPath] = useState<string | null>(null);
  const [entries, setEntries] = useState<DirEntry[]>([]);
  const [hasLoadstar, setHasLoadstar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [inputPath, setInputPath] = useState('');

  const recent = getRecentProjects();

  const loadDir = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await browseDirectory(path);
      setCurrentPath(res.path);
      setParentPath(res.parent);
      setEntries(res.entries);
      setHasLoadstar(res.hasLoadstar);
      setInputPath(res.path);
    } catch {
      setError('디렉토리를 읽을 수 없습니다');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDir('');
  }, [loadDir]);

  const handleSelect = async (path: string) => {
    setValidating(true);
    setError(null);
    try {
      const result = await validateProject(path);
      if (result.valid) {
        saveRecentProject(path);
        onProjectSelected(path);
      } else {
        setError('선택한 폴더에 .loadstar 구조가 없습니다');
      }
    } catch {
      setError('서버 연결 실패');
    } finally {
      setValidating(false);
    }
  };

  const handleInputOpen = () => {
    const trimmed = inputPath.trim();
    if (trimmed) handleSelect(trimmed);
  };

  const handleInputBrowse = () => {
    const trimmed = inputPath.trim();
    if (trimmed) loadDir(trimmed);
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.dialog}>
        <div style={styles.header}>
          <span style={{ fontSize: 18 }}>&#128193;</span>
          <span style={styles.title}>LOADSTAR 프로젝트 열기</span>
        </div>

        {/* Path Input */}
        <div style={styles.inputRow}>
          <input
            style={styles.input}
            value={inputPath}
            onChange={e => setInputPath(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleInputOpen(); }}
            placeholder="프로젝트 경로를 입력하세요"
            spellCheck={false}
          />
          <button style={styles.btnSecondary} onClick={handleInputBrowse}>이동</button>
          <button
            style={{ ...styles.btnPrimary, opacity: validating ? 0.6 : 1 }}
            onClick={handleInputOpen}
            disabled={validating || !inputPath.trim()}
          >
            {validating ? '확인 중...' : '열기'}
          </button>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {/* Current path + select button */}
        {currentPath && (
          <div style={styles.pathBar}>
            <span style={styles.pathLabel}>현재 경로:</span>
            <span style={styles.pathValue}>{currentPath}</span>
            {hasLoadstar && (
              <span style={styles.loadstarBadge}>&#9733; .loadstar</span>
            )}
            {hasLoadstar && (
              <button
                style={styles.btnSelect}
                onClick={() => handleSelect(currentPath)}
                disabled={validating}
              >
                이 폴더 선택
              </button>
            )}
          </div>
        )}

        {/* Directory browser */}
        <div style={styles.browserHeader}>
          {parentPath !== null && (
            <div style={styles.dirEntry} onClick={() => loadDir(parentPath)}>
              <span style={styles.dirIcon}>&#128194;</span>
              <span style={styles.dirName}>..</span>
            </div>
          )}
        </div>
        <div style={styles.browser}>
          {loading ? (
            <div style={styles.loading}>로딩 중...</div>
          ) : entries.length === 0 ? (
            <div style={styles.loading}>하위 폴더 없음</div>
          ) : (
            entries.map(entry => (
              <div
                key={entry.path}
                style={{ ...styles.dirEntry, ...(entry.loadstarProject ? styles.dirEntryProject : {}) }}
                onClick={() => loadDir(entry.path)}
                onDoubleClick={() => { if (entry.loadstarProject) handleSelect(entry.path); }}
              >
                <span style={styles.dirIcon}>
                  {entry.loadstarProject ? '\u2605' : entry.hasChildren ? '\uD83D\uDCC2' : '\uD83D\uDCC1'}
                </span>
                <span style={styles.dirName}>{entry.name}</span>
                {entry.loadstarProject && (
                  <span style={styles.projectTag}>.loadstar</span>
                )}
              </div>
            ))
          )}
        </div>

        {/* Recent projects */}
        {recent.length > 0 && (
          <div style={styles.recentSection}>
            <div style={styles.recentTitle}>최근 프로젝트</div>
            {recent.map(p => (
              <div
                key={p}
                style={styles.recentItem}
                onClick={() => handleSelect(p)}
              >
                <span style={{ marginRight: 6 }}>&#9733;</span>
                {p}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed' as const, inset: 0,
    background: 'rgba(44, 36, 23, 0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000,
  },
  dialog: {
    background: '#faf8f5',
    border: '1px solid #d4c9b8',
    borderRadius: 10,
    boxShadow: '0 8px 32px rgba(44, 36, 23, 0.2)',
    width: 600, maxHeight: '80vh',
    display: 'flex', flexDirection: 'column' as const,
    overflow: 'hidden',
  },
  header: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '16px 20px',
    borderBottom: '1px solid #e5ddd0',
    background: '#f3efe8',
  },
  title: { fontSize: 16, fontWeight: 700, color: '#2c2417' },
  inputRow: {
    display: 'flex', gap: 6,
    padding: '12px 20px',
  },
  input: {
    flex: 1, padding: '8px 12px',
    border: '1px solid #d4c9b8', borderRadius: 6,
    fontSize: 13, fontFamily: 'monospace',
    background: '#fff', color: '#2c2417',
    outline: 'none',
  },
  btnPrimary: {
    padding: '8px 16px', border: 'none', borderRadius: 6,
    background: '#8b6914', color: '#fff',
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
  btnSecondary: {
    padding: '8px 12px', border: '1px solid #d4c9b8', borderRadius: 6,
    background: '#fff', color: '#6b5d4d',
    fontSize: 13, cursor: 'pointer',
  },
  btnSelect: {
    padding: '4px 12px', border: 'none', borderRadius: 4,
    background: '#5a8a5e', color: '#fff',
    fontSize: 11, fontWeight: 600, cursor: 'pointer',
    marginLeft: 'auto' as const,
  },
  error: {
    padding: '0 20px 8px', fontSize: 12, color: '#b54a3f',
  },
  pathBar: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '8px 20px',
    background: '#f3efe8', borderBottom: '1px solid #e5ddd0',
    fontSize: 12,
  },
  pathLabel: { color: '#9b8e7e' },
  pathValue: { color: '#2c2417', fontFamily: 'monospace', fontSize: 11 },
  loadstarBadge: {
    fontSize: 10, padding: '1px 8px',
    background: '#5a8a5e20', color: '#5a8a5e',
    borderRadius: 3, fontWeight: 600,
  },
  browserHeader: {},
  browser: {
    flex: 1, overflow: 'auto' as const,
    maxHeight: 300, minHeight: 200,
    padding: '4px 0',
  },
  dirEntry: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '6px 20px', cursor: 'pointer',
    fontSize: 13, color: '#2c2417',
    transition: 'background 0.1s',
    ':hover': { background: '#f0ebe3' },
  } as React.CSSProperties,
  dirEntryProject: {
    background: '#f5eed920',
  },
  dirIcon: { fontSize: 14, width: 18, textAlign: 'center' as const },
  dirName: { flex: 1 },
  projectTag: {
    fontSize: 10, padding: '1px 6px',
    background: '#8b691420', color: '#8b6914',
    borderRadius: 3, fontWeight: 600,
  },
  loading: {
    padding: '20px', textAlign: 'center' as const,
    color: '#9b8e7e', fontSize: 13,
  },
  recentSection: {
    borderTop: '1px solid #e5ddd0', padding: '12px 20px',
  },
  recentTitle: {
    fontSize: 11, color: '#9b8e7e', fontWeight: 600,
    marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: 0.5,
  },
  recentItem: {
    padding: '5px 8px', cursor: 'pointer',
    fontSize: 12, fontFamily: 'monospace', color: '#6b5d4d',
    borderRadius: 4, transition: 'background 0.1s',
  },
};
