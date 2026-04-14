import { useState, useEffect, useCallback } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import MenuBar from './components/layout/MenuBar';
import Toolbar from './components/layout/Toolbar';
import ProjectSelector from './components/layout/ProjectSelector';
import ProjectOpenDialog from './components/layout/ProjectOpenDialog';
import ElementTree from './components/layout/ElementTree';
import EditorTabs from './components/layout/EditorTabs';
import StatusBar from './components/layout/StatusBar';
import './App.css';

export interface Tab {
  id: string;
  title: string;
  type: 'map' | 'waypoint' | 'dashboard' | 'todo' | 'history' | 'git' | 'log' | 'cli' | 'search';
  address?: string;
}

function App() {
  const [projectRoot, setProjectRoot] = useState<string>('');
  const [showOpenDialog, setShowOpenDialog] = useState(true);
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [treeVersion, setTreeVersion] = useState(0);

  const handleStructureChange = () => setTreeVersion(v => v + 1);

  const openSearchTab = useCallback(() => {
    openTab({ id: 'tool-search', title: 'Search', type: 'search' });
  }, [tabs]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        openSearchTab();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openSearchTab]);

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

  const handleProjectChange = (root: string) => {
    setProjectRoot(root);
    setShowOpenDialog(false);
    const dashboardTab: Tab = { id: 'tool-dashboard', title: 'Dashboard', type: 'dashboard' };
    setTabs([dashboardTab]);
    setActiveTabId(dashboardTab.id);
  };

  return (
    <div className="app">
      {/* Project Open Dialog - shown when no project is selected */}
      {showOpenDialog && !projectRoot && (
        <ProjectOpenDialog onProjectSelected={handleProjectChange} />
      )}

      <MenuBar />
      <Toolbar onOpenTab={openTab} />
      <div className="app-body">
        <Group orientation="horizontal">
          <Panel defaultSize="22%" minSize="18%" maxSize="45%" id="tree-panel">
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <ProjectSelector
                projectRoot={projectRoot}
                onProjectChange={handleProjectChange}
                onOpenDialog={() => setShowOpenDialog(true)}
              />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <ElementTree projectRoot={projectRoot} onOpenTab={openTab} treeVersion={treeVersion} />
              </div>
            </div>
          </Panel>
          <Separator className="resize-handle" />
          <Panel defaultSize="78%" minSize="45%" id="editor-panel">
            <EditorTabs
              projectRoot={projectRoot}
              tabs={tabs}
              activeTabId={activeTabId}
              onSelectTab={setActiveTabId}
              onCloseTab={closeTab}
              onOpenTab={openTab}
              onStructureChange={handleStructureChange}
            />
          </Panel>
        </Group>
      </div>
      <StatusBar projectRoot={projectRoot} />
    </div>
  );
}

export default App;
