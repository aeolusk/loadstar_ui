<CODEBRIEF>
## [ADDRESS] loadstar_ui.v1.frontend.App
## [SYNCED_AT] 2026-04-07

### 1. FILE
- PATH: frontend/src/App.tsx
- LANGUAGE: TypeScript (React)

### 2. STRUCTURE
루트 애플리케이션 컴포넌트 — 탭 상태, 프로젝트 선택, 리사이즈 가능한 패널 레이아웃 관리

- `Tab` (interface) — 탭 정의 (id, title, type, address)
- `openTab(tab: Tab)` — 탭 열기/활성화 (중복 시 기존 탭으로 이동)
- `closeTab(tabId: string)` — 탭 닫기 + 인접 탭으로 포커스 이동
- `handleProjectChange(root: string)` — 프로젝트 변경 시 탭 초기화

주요 의존관계:
- react-resizable-panels — 패널 레이아웃
- components/layout/* — MenuBar, Toolbar, ProjectSelector, ElementTree, EditorTabs, StatusBar

### 3. COMMENT
- Tab.type 으로 에디터 종류 결정: map, waypoint, blackbox, dashboard, todo, history, monitor, git, log, cli
</CODEBRIEF>
