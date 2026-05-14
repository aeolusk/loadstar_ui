import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Tab } from '../../App';
import {
  Folder, Diamond, SquaresFour, CheckSquare, ClockCounterClockwise,
  GitBranch, Scroll, Terminal, MagnifyingGlass, X, Star, Question, CalendarBlank, Target,
  CaretDoubleRight,
} from '@phosphor-icons/react';
import DashboardView from '../../features/dashboard/DashboardView';
import MapView from '../../features/map-view/MapView';
import WayPointEditor from '../../features/waypoint-editor/WayPointEditor';
import DataWayPointEditor from '../../features/dwp-editor/DataWayPointEditor';
import TodoView from '../../features/todo-view/TodoView';
import GitView from '../../features/git-view/GitView';
import LogView from '../../features/log-view/LogView';
import CliConsole from '../../features/cli-console/CliConsole';
import SearchPanel from '../../features/search/SearchPanel';
import QuestionList from '../../features/questions/QuestionList';
import ScheduleView from '../../features/schedule/ScheduleView';
import GoalReport from '../../features/goal-report/GoalReport';

interface EditorTabsProps {
  projectRoot: string;
  tabs: Tab[];
  activeTabId: string | null;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onMoveTabToEnd: (tabId: string) => void;
  onOpenTab: (tab: Tab) => void;
  onStructureChange?: () => void;
}

const TAB_ICON = 12;
const tabTypeIcon = (type: Tab['type']): React.ReactNode => {
  switch (type) {
    case 'map': return <Folder size={TAB_ICON} />;
    case 'waypoint': return <Diamond size={TAB_ICON} />;
    case 'dwp': return <Diamond size={TAB_ICON} weight="fill" />;
    case 'dashboard': return <SquaresFour size={TAB_ICON} />;
    case 'todo': return <CheckSquare size={TAB_ICON} />;
    case 'history': return <ClockCounterClockwise size={TAB_ICON} />;
    case 'git': return <GitBranch size={TAB_ICON} />;
    case 'log': return <Scroll size={TAB_ICON} />;
    case 'cli': return <Terminal size={TAB_ICON} />;
    case 'search': return <MagnifyingGlass size={TAB_ICON} />;
    case 'questions': return <Question size={TAB_ICON} />;
    case 'schedule': return <CalendarBlank size={TAB_ICON} />;
    case 'goals': return <Target size={TAB_ICON} />;
  }
};

const TabContent = ({ tab, projectRoot, onOpenTab, onStructureChange }: { tab: Tab; projectRoot: string; onOpenTab: (tab: Tab) => void; onStructureChange?: () => void }) => {
  switch (tab.type) {
    case 'dashboard': return <DashboardView projectRoot={projectRoot} />;
    case 'map': return <MapView projectRoot={projectRoot} address={tab.address || ''} onOpenTab={onOpenTab} onStructureChange={onStructureChange} />;
    case 'waypoint': return <WayPointEditor projectRoot={projectRoot} address={tab.address || ''} onOpenTab={onOpenTab} />;
    case 'dwp': return <DataWayPointEditor projectRoot={projectRoot} address={tab.address || ''} onOpenTab={onOpenTab} />;
    case 'todo': return <TodoView projectRoot={projectRoot} />;
    case 'history': return <TodoView projectRoot={projectRoot} />;
    case 'git': return <GitView projectRoot={projectRoot} />;
    case 'log': return <LogView projectRoot={projectRoot} />;
    case 'cli': return <CliConsole projectRoot={projectRoot} />;
    case 'search': return <SearchPanel projectRoot={projectRoot} onOpenTab={onOpenTab} />;
    case 'questions': return <QuestionList projectRoot={projectRoot} onOpenTab={onOpenTab} />;
    case 'schedule': return <ScheduleView projectRoot={projectRoot} />;
    case 'goals': return <GoalReport projectRoot={projectRoot} />;
    default: return <div>Unknown tab type</div>;
  }
};

const EditorTabs = ({ projectRoot, tabs, activeTabId, onSelectTab, onCloseTab, onMoveTabToEnd, onOpenTab, onStructureChange }: EditorTabsProps) => {
  const tabsBarRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLDivElement | null>(null);
  const overflowRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useLayoutEffect(() => {
    const bar = tabsBarRef.current;
    const tab = activeTabRef.current;
    if (!bar || !tab) return;
    const barRect = bar.getBoundingClientRect();
    const tabRect = tab.getBoundingClientRect();
    if (tabRect.left < barRect.left) {
      bar.scrollLeft += Math.floor(tabRect.left - barRect.left);
    } else if (tabRect.right > barRect.right) {
      bar.scrollLeft += Math.ceil(tabRect.right - barRect.right);
    }
  }, [activeTabId, tabs]);

  useLayoutEffect(() => {
    const el = tabsBarRef.current;
    if (el) setIsOverflowing(el.scrollWidth > el.clientWidth + 1);
  });

  useEffect(() => {
    const el = tabsBarRef.current;
    if (!el) return;
    const update = () => setIsOverflowing(el.scrollWidth > el.clientWidth + 1);
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [tabs.length > 0]);

  useEffect(() => {
    if (!showDropdown) return;
    const close = (e: MouseEvent) => {
      if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [showDropdown]);

  return (
    <div className="editor-area">
      {tabs.length > 0 && (
        <div className="editor-tabs-bar-wrapper">
          <div className="editor-tabs-bar" ref={tabsBarRef}>
            {tabs.map(tab => (
              <div
                key={tab.id}
                ref={el => {
                  if (el) tabRefs.current.set(tab.id, el);
                  else tabRefs.current.delete(tab.id);
                  if (tab.id === activeTabId) (activeTabRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
                }}
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
          <div className="editor-tabs-overflow" ref={overflowRef}>
              <button
                className="editor-tabs-overflow-btn"
                onClick={() => setShowDropdown(!showDropdown)}
                title={`전체 탭 ${tabs.length}개`}
              >
                <CaretDoubleRight size={14} />
              </button>
              {showDropdown && (
                <div className="editor-tabs-dropdown">
                  {tabs.map(tab => (
                    <div
                      key={tab.id}
                      className={`editor-tabs-dropdown-item ${tab.id === activeTabId ? 'active' : ''}`}
                      onClick={() => {
                        const bar = tabsBarRef.current;
                        const tabEl = tabRefs.current.get(tab.id);
                        if (bar && tabEl && tabEl.offsetLeft + tabEl.offsetWidth > bar.scrollLeft + bar.clientWidth) {
                          onMoveTabToEnd(tab.id);
                        } else {
                          onSelectTab(tab.id);
                        }
                        setShowDropdown(false);
                      }}
                    >
                      <span className="editor-tab-icon">{tabTypeIcon(tab.type)}</span>
                      <span className="editor-tabs-dropdown-title">{tab.title}</span>
                      {tab.address && <span className="editor-tabs-dropdown-address">{tab.address}</span>}
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
          </div>
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
