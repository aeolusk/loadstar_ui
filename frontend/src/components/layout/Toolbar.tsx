import type { Tab } from '../../App';

interface ToolbarProps {
  onOpenTab: (tab: Tab) => void;
}

const toolbarItems: { label: string; type: Tab['type'] }[] = [
  { label: '대시보드', type: 'dashboard' },
  { label: 'TODO', type: 'todo' },
  { label: 'History', type: 'history' },
  { label: '모니터링', type: 'monitor' },
  { label: 'GIT', type: 'git' },
  { label: '로그', type: 'log' },
  { label: 'CLI', type: 'cli' },
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
          {item.label}
        </button>
      ))}
    </div>
  );
};

export default Toolbar;
