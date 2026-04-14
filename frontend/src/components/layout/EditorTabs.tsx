import type { Tab } from '../../App';
import {
  Folder, Diamond, SquaresFour, CheckSquare, ClockCounterClockwise,
  GitBranch, Scroll, Terminal, MagnifyingGlass, X, Star,
} from '@phosphor-icons/react';
import DashboardView from '../../features/dashboard/DashboardView';
import MapView from '../../features/map-view/MapView';
import WayPointEditor from '../../features/waypoint-editor/WayPointEditor';
import TodoView from '../../features/todo-view/TodoView';
import GitView from '../../features/git-view/GitView';
import LogView from '../../features/log-view/LogView';
import CliConsole from '../../features/cli-console/CliConsole';
import SearchPanel from '../../features/search/SearchPanel';

interface EditorTabsProps {
  projectRoot: string;
  tabs: Tab[];
  activeTabId: string | null;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onOpenTab: (tab: Tab) => void;
  onStructureChange?: () => void;
}

const TAB_ICON = 12;
const tabTypeIcon = (type: Tab['type']): React.ReactNode => {
  switch (type) {
    case 'map': return <Folder size={TAB_ICON} />;
    case 'waypoint': return <Diamond size={TAB_ICON} />;
    case 'dashboard': return <SquaresFour size={TAB_ICON} />;
    case 'todo': return <CheckSquare size={TAB_ICON} />;
    case 'history': return <ClockCounterClockwise size={TAB_ICON} />;
    case 'git': return <GitBranch size={TAB_ICON} />;
    case 'log': return <Scroll size={TAB_ICON} />;
    case 'cli': return <Terminal size={TAB_ICON} />;
    case 'search': return <MagnifyingGlass size={TAB_ICON} />;
  }
};

const TabContent = ({ tab, projectRoot, onOpenTab, onStructureChange }: { tab: Tab; projectRoot: string; onOpenTab: (tab: Tab) => void; onStructureChange?: () => void }) => {
  switch (tab.type) {
    case 'dashboard': return <DashboardView projectRoot={projectRoot} />;
    case 'map': return <MapView projectRoot={projectRoot} address={tab.address || ''} onOpenTab={onOpenTab} onStructureChange={onStructureChange} />;
    case 'waypoint': return <WayPointEditor projectRoot={projectRoot} address={tab.address || ''} onOpenTab={onOpenTab} />;
    case 'todo': return <TodoView projectRoot={projectRoot} />;
    case 'history': return <TodoView projectRoot={projectRoot} />;
    case 'git': return <GitView projectRoot={projectRoot} />;
    case 'log': return <LogView projectRoot={projectRoot} />;
    case 'cli': return <CliConsole projectRoot={projectRoot} />;
    case 'search': return <SearchPanel projectRoot={projectRoot} onOpenTab={onOpenTab} />;
    default: return <div>Unknown tab type</div>;
  }
};

const EditorTabs = ({ projectRoot, tabs, activeTabId, onSelectTab, onCloseTab, onOpenTab, onStructureChange }: EditorTabsProps) => {

  return (
    <div className="editor-area">
      {tabs.length > 0 && (
        <div className="editor-tabs-bar">
          {tabs.map(tab => (
            <div
              key={tab.id}
              className={`editor-tab ${tab.id === activeTabId ? 'active' : ''}`}
              onClick={() => onSelectTab(tab.id)}
            >
              <span className="editor-tab-icon">{tabTypeIcon(tab.type)}</span>
              <span>{tab.title}</span>
              <span
                className="editor-tab-close"
                onClick={(e) => { e.stopPropagation(); onCloseTab(tab.id); }}
              >
                <X size={12} />
              </span>
            </div>
          ))}
        </div>
      )}
      <div className="editor-content">
        {tabs.length === 0 && (
          <div className="editor-empty">
            <div className="editor-empty-icon"><Star size={32} /></div>
            <div>탭을 열려면 트리에서 요소를 더블클릭하거나 툴바 버튼을 클릭하세요.</div>
            <div className="editor-empty-hint">
              <kbd>Ctrl+K</kbd> 로 빠른 검색
            </div>
          </div>
        )}
        {tabs.map(tab => (
          <div
            key={tab.id}
            style={{ display: tab.id === activeTabId ? 'contents' : 'none' }}
          >
            <TabContent tab={tab} projectRoot={projectRoot} onOpenTab={onOpenTab} onStructureChange={onStructureChange} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default EditorTabs;
