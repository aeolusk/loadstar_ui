import type { Tab } from '../../App';
import DashboardView from '../../features/dashboard/DashboardView';
import MapView from '../../features/map-view/MapView';
import WayPointEditor from '../../features/waypoint-editor/WayPointEditor';
import BlackBoxEditor from '../../features/blackbox-editor/BlackBoxEditor';
import TodoView from '../../features/todo-view/TodoView';
import MonitorView from '../../features/monitor-view/MonitorView';
import GitView from '../../features/git-view/GitView';
import LogView from '../../features/log-view/LogView';
import CliConsole from '../../features/cli-console/CliConsole';

interface EditorTabsProps {
  projectRoot: string;
  tabs: Tab[];
  activeTabId: string | null;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onOpenTab: (tab: Tab) => void;
}

const tabTypeIcon = (type: Tab['type']): string => {
  switch (type) {
    case 'map': return '📁';
    case 'waypoint': return '◆';
    case 'blackbox': return '📦';
    case 'dashboard': return '⊞';
    case 'todo': return '☑';
    case 'history': return '↻';
    case 'monitor': return '◎';
    case 'git': return '⑂';
    case 'log': return '☰';
    case 'cli': return '▸';
  }
};

const TabContent = ({ tab, projectRoot, onOpenTab }: { tab: Tab; projectRoot: string; onOpenTab: (tab: Tab) => void }) => {
  switch (tab.type) {
    case 'dashboard': return <DashboardView />;
    case 'map': return <MapView projectRoot={projectRoot} address={tab.address || ''} onOpenTab={onOpenTab} />;
    case 'waypoint': return <WayPointEditor projectRoot={projectRoot} address={tab.address || ''} />;
    case 'blackbox': return <BlackBoxEditor projectRoot={projectRoot} address={tab.address || ''} />;
    case 'todo': return <TodoView projectRoot={projectRoot} />;
    case 'history': return <TodoView projectRoot={projectRoot} />;
    case 'monitor': return <MonitorView />;
    case 'git': return <GitView />;
    case 'log': return <LogView />;
    case 'cli': return <CliConsole />;
    default: return <div>Unknown tab type</div>;
  }
};

const EditorTabs = ({ projectRoot, tabs, activeTabId, onSelectTab, onCloseTab, onOpenTab }: EditorTabsProps) => {

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
                ×
              </span>
            </div>
          ))}
        </div>
      )}
      <div className="editor-content">
        {tabs.length === 0 && (
          <div className="editor-empty">
            <div className="editor-empty-icon">☆</div>
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
            <TabContent tab={tab} projectRoot={projectRoot} onOpenTab={onOpenTab} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default EditorTabs;
