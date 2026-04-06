import { useState } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
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
    const idx = tabs.findIndex(t => t.id === tabId);
    const newTabs = tabs.filter(t => t.id !== tabId);
    setTabs(newTabs);
    if (activeTabId === tabId) {
      const nextTab = newTabs[Math.min(idx, newTabs.length - 1)];
      setActiveTabId(nextTab?.id ?? null);
    }
  };

  return (
    <div className="app">
      <MenuBar />
      <Toolbar onOpenTab={openTab} />
      <div className="app-body">
        <Group orientation="horizontal">
          <Panel defaultSize="22%" minSize="18%" maxSize="45%" id="tree-panel">
            <ElementTree onOpenTab={openTab} />
          </Panel>
          <Separator className="resize-handle" />
          <Panel defaultSize="78%" minSize="45%" id="editor-panel">
            <EditorTabs
              tabs={tabs}
              activeTabId={activeTabId}
              onSelectTab={setActiveTabId}
              onCloseTab={closeTab}
              onOpenTab={openTab}
            />
          </Panel>
        </Group>
      </div>
      <StatusBar />
    </div>
  );
}

export default App;
