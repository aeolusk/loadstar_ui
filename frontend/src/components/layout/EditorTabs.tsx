import type { Tab } from '../../App';

interface EditorTabsProps {
  tabs: Tab[];
  activeTabId: string | null;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
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

const EditorTabs = ({ tabs, activeTabId, onSelectTab, onCloseTab }: EditorTabsProps) => {
  const activeTab = tabs.find(t => t.id === activeTabId);

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
        {activeTab ? (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>
              {tabTypeIcon(activeTab.type)} {activeTab.title}
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>Type: {activeTab.type}</p>
            {activeTab.address && (
              <p style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>Address: {activeTab.address}</p>
            )}
            <p style={{ color: 'var(--text-muted)', marginTop: 16 }}>콘텐츠 구현 예정</p>
          </div>
        ) : (
          <div className="editor-empty">
            <div className="editor-empty-icon">☆</div>
            <div>탭을 열려면 트리에서 요소를 더블클릭하거나 툴바 버튼을 클릭하세요.</div>
            <div className="editor-empty-hint">
              <kbd>Ctrl+K</kbd> 로 빠른 검색
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorTabs;
