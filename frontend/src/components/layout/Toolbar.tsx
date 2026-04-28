import type { Tab } from '../../App';
import { SquaresFour, CheckSquare, GitBranch, Scroll, Terminal, Info, Question } from '@phosphor-icons/react';

interface ToolbarProps {
  onOpenTab: (tab: Tab) => void;
  onAbout: () => void;
}

const ICON_SIZE = 14;

const toolbarItems: { label: string; type: Tab['type']; icon: React.ReactNode }[] = [
  { label: '대시보드', type: 'dashboard', icon: <SquaresFour size={ICON_SIZE} /> },
  { label: 'TODO', type: 'todo', icon: <CheckSquare size={ICON_SIZE} /> },
  { label: 'Questions', type: 'questions', icon: <Question size={ICON_SIZE} /> },
  { label: 'GIT', type: 'git', icon: <GitBranch size={ICON_SIZE} /> },
  { label: '로그', type: 'log', icon: <Scroll size={ICON_SIZE} /> },
  { label: 'CLI', type: 'cli', icon: <Terminal size={ICON_SIZE} /> },
];

const Toolbar = ({ onOpenTab, onAbout }: ToolbarProps) => {
  const handleClick = (item: typeof toolbarItems[0]) => {
    onOpenTab({
      id: `tool-${item.type}`,
      title: item.label,
      type: item.type,
    });
  };

  return (
    <div className="toolbar">
      {toolbarItems.map(item => (
        <button
          key={item.type}
          className="toolbar-btn"
          onClick={() => handleClick(item)}
        >
          <span>{item.icon}</span> {item.label}
        </button>
      ))}
      <div className="toolbar-separator" />
      <div className="toolbar-spacer" />
      <div className="toolbar-search" style={{ cursor: 'pointer' }} onClick={() => onOpenTab({ id: 'tool-search', title: 'Search', type: 'search' })}>
        <span>Search</span>
        <kbd>Ctrl+K</kbd>
      </div>
      <div className="toolbar-badge">
        <span className="toolbar-badge-count">0</span>
      </div>
      <button className="toolbar-btn" onClick={onAbout} title="About">
        <Info size={ICON_SIZE} />
      </button>
    </div>
  );
};

export default Toolbar;
