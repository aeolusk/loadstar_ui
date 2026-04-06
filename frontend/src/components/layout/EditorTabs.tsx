import type { Tab } from '../../App';

interface EditorTabsProps {
  tabs: Tab[];
  activeTabId: string | null;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
}

const EditorTabs = ({ tabs, activeTabId, onSelectTab, onCloseTab }: EditorTabsProps) => {
  const activeTab = tabs.find(t => t.id === activeTabId);

  return (
    <div className="editor-area">
      <div className="editor-tabs-bar">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`editor-tab ${tab.id === activeTabId ? 'active' : ''}`}
            onClick={() => onSelectTab(tab.id)}
          >
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
      <div className="editor-content">
        {activeTab ? (
          <div>
            <h3>{activeTab.title}</h3>
            <p>Type: {activeTab.type}</p>
            {activeTab.address && <p>Address: {activeTab.address}</p>}
            <p style={{ color: '#999' }}>콘텐츠 구현 예정</p>
          </div>
        ) : (
          <div className="editor-empty">
            탭을 열려면 트리에서 요소를 더블클릭하거나 툴바 버튼을 클릭하세요.
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorTabs;
