<CODEBRIEF>
## [ADDRESS] loadstar_ui.v1.frontend.features.WayPointEditor
## [SYNCED_AT] 2026-04-07

### 1. FILE
- PATH: frontend/src/features/waypoint-editor/WayPointEditor.tsx
- LANGUAGE: TypeScript (React)

### 2. STRUCTURE
WayPoint 편집 메인 컴포넌트 — IDENTITY, CONNECTIONS, CODE_MAP, TODO, ISSUE, COMMENT 편집 + Git History

Props:
- `WayPointEditor({ projectRoot, address, onOpenTab? })` — 메인 컴포넌트

편집 기능:
- `saveToServer(patch, skipHistory?)` — 서버 저장 (skipHistory로 Done/Delete 구분)
- `startEditIdentity()` / `saveIdentity()` — IDENTITY 편집 (status, summary, version, priority, syncedAt)
- `doneSelectedTechSpec()` / `deleteSelectedTechSpec()` — TECH_SPEC Done(history 기록)/Delete(단순 삭제)
- `addTechSpec()` / `startEditTechSpecItem()` — TECH_SPEC 추가/편집
- `addIssue()` / `deleteSelectedIssues()` — ISSUE 관리
- `addOpenQuestion()` / `toggleOqResolved()` — OPEN_QUESTIONS 관리

CODE_MAP:
- `openDirBrowser()` — 디렉토리 탐색 팝업 열기
- `selectDirAsScope()` — 디렉토리를 scope로 추가 (절대→상대 경로 변환)

Git History:
- `loadGitVersion(commit)` — 과거 버전 로드 (읽기 전용)
- `restoreCurrent()` — 현재 버전 복원

네비게이션:
- `navigateTo(addr)` — 주소 더블클릭 시 해당 탭 열기/이동

주요 의존관계:
- api/client — fetchWayPoint, updateWayPoint, fetchGitHistory, fetchGitVersion, browseDirectory
- data/status-labels — getStatusLabel, getStatusColor, statusOptions
- App — Tab 인터페이스

### 3. COMMENT
- 읽기전용 모드: viewingCommit !== null 시 모든 편집 UI 숨김
- 선택 툴바: All 체크박스 + 텍스트 필터로 TECH_SPEC 항목 일괄 선택
</CODEBRIEF>
