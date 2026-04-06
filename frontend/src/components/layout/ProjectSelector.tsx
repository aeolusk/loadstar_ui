import { useState, useCallback } from 'react';
import { validateProject } from '../../api/client';

interface ProjectSelectorProps {
  projectRoot: string;
  onProjectChange: (root: string) => void;
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

export default function ProjectSelector({ projectRoot, onProjectChange }: ProjectSelectorProps) {
  const [input, setInput] = useState(projectRoot);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRecent, setShowRecent] = useState(false);

  const recent = getRecentProjects();

  const handleOpen = useCallback(async (root?: string) => {
    const target = root || input.trim();
    if (!target) return;

    setLoading(true);
    setError(null);
    try {
      const result = await validateProject(target);
      if (result.valid) {
        saveRecentProject(target);
        setInput(target);
        onProjectChange(target);
        setShowRecent(false);
      } else {
        setError('.loadstar 폴더를 찾을 수 없습니다');
      }
    } catch {
      setError('서버 연결 실패');
    } finally {
      setLoading(false);
    }
  }, [input, onProjectChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleOpen();
  };

  return (
    <div className="project-selector">
      <div className="project-selector-row">
        <input
          className="project-selector-input"
          type="text"
          value={input}
          onChange={e => { setInput(e.target.value); setError(null); }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowRecent(true)}
          onBlur={() => setTimeout(() => setShowRecent(false), 200)}
          placeholder="프로젝트 경로 입력 (예: C:\project)"
          spellCheck={false}
        />
        <button
          className="project-selector-btn"
          onClick={() => handleOpen()}
          disabled={loading || !input.trim()}
        >
          {loading ? '...' : 'Open'}
        </button>
      </div>
      {error && <div className="project-selector-error">{error}</div>}
      {projectRoot && !error && (
        <div className="project-selector-active">{projectRoot}</div>
      )}
      {showRecent && recent.length > 0 && (
        <div className="project-selector-recent">
          {recent.map(p => (
            <div
              key={p}
              className="project-selector-recent-item"
              onMouseDown={() => { setInput(p); handleOpen(p); }}
            >
              {p}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
