import type { Tab } from '../../App';

interface ToolbarProps {
  onOpenTab: (tab: Tab) => void;
}

const toolbarItems: { label: string; type: Tab['type']; icon: string }[] = [
  { label: '대시보드', type: 'dashboard', icon: '⊞' },
  { label: 'TODO', type: 'todo', icon: '☑' },
  { label: 'History', type: 'history', icon: '↻' },
  { label: '모니터링', type: 'monitor', icon: '◎' },
  { label: 'GIT', type: 'git', icon: '⑂' },
  { label: '로그', type: 'log', icon: '☰' },
  { label: 'CLI', type: 'cli', icon: '▸' },
];

const Toolbar = ({ onOpenTab }: ToolbarProps) => {
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
      <div className="toolbar-search">
        <span>Search</span>
        <kbd>Ctrl+K</kbd>
      </div>
      <div className="toolbar-badge">
        <span className="toolbar-badge-count">0</span>
      </div>
    </div>
  );
};

export default Toolbar;
