<CODEBRIEF>
## [ADDRESS] loadstar_ui.v1.frontend.layout.EditorTabs
## [SYNCED_AT] 2026-04-07

### 1. FILE
- PATH: frontend/src/components/layout/EditorTabs.tsx
- LANGUAGE: TypeScript (React)

### 2. STRUCTURE
탭 바 관리자 — 탭 타입에 따라 적절한 에디터 컴포넌트를 라우팅

Props:
- `EditorTabs({ projectRoot, tabs[], activeTabId, onSelectTab, onCloseTab, onOpenTab })` — 메인 컴포넌트

라우팅:
- `TabContent({ tab, projectRoot, onOpenTab })` — 탭 타입별 컴포넌트 렌더링
- `tabTypeIcon(type)` — 탭 타입별 아이콘 매핑

탭 타입 → 컴포넌트:
- map → MapView (projectRoot, address, onOpenTab)
- waypoint → WayPointEditor (projectRoot, address, onOpenTab)
- blackbox → BlackBoxEditor (projectRoot, address, onOpenTab)
- todo/history → TodoView (projectRoot)
- git → GitView (projectRoot)
- log → LogView (projectRoot)
- cli → CliConsole (projectRoot)
- dashboard → DashboardView
- monitor → MonitorView

주요 의존관계:
- 모든 feature 컴포넌트를 import
- App — Tab 인터페이스

### 3. COMMENT
- 비활성 탭은 display:none으로 숨겨서 상태 유지
</CODEBRIEF>
