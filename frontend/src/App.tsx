import { useState } from 'react';
import MenuBar from './components/layout/MenuBar';
import Toolbar from './components/layout/Toolbar';
import ElementTree from './components/layout/ElementTree';
import EditorTabs from './components/layout/EditorTabs';
import StatusBar from './components/layout/StatusBar';
import './App.css';

export interface Tab {
  id: string;
  title: string;
  type: 'map' | 'waypoint' | 'blackbox' | 'dashboard' | 'todo' | 'history' | 'monitor' | 'git' | 'log' | 'cli';
  address?: string;
}

function App() {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  const openTab = (tab: Tab) => {
    const existing = tabs.find(t => t.id === tab.id);
    if (existing) {
      setActiveTabId(existing.id);
    } else {
      setTabs(prev => [...prev, tab]);
      setActiveTabId(tab.id);
    }
  };

  const closeTab = (tabId: string) => {
    setTabs(prev => prev.filter(t => t.id !== tabId));
    if (activeTabId === tabId) {
      setActiveTabId(tabs.length > 1 ? tabs[tabs.length - 2]?.id : null);
    }
  };

  return (
    <div className="app">
      <MenuBar />
      <Toolbar onOpenTab={openTab} />
      <div className="app-body">
        <ElementTree onOpenTab={openTab} />
        <EditorTabs
          tabs={tabs}
          activeTabId={activeTabId}
          onSelectTab={setActiveTabId}
          onCloseTab={closeTab}
        />
      </div>
      <StatusBar />
    </div>
  );
}

export default App;
