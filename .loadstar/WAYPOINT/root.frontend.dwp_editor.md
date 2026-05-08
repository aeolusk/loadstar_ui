<WAYPOINT>
## [ADDRESS] W://root/frontend/dwp_editor
## [STATUS] S_STB

### IDENTITY
- SUMMARY: DataWayPointEditor 컴포넌트 구현 — WayPointEditor 기반 파생. TODO 제거, TABLES UI 추가, D:// 라우팅 연결
- METADATA: [Created: 2026-05-08]
- SYNCED_AT: 2026-05-08

### CONNECTIONS
- PARENT: M://root/frontend
- CHILDREN: []
- REFERENCE: [W://root/frontend/waypoint_editor, W://root/backend/dwp_api]

### CODE_MAP
- scope:
  - frontend/src/

### TODO
- SUMMARY: DWP 에디터 프론트엔드 구현
- TECH_SPEC:
  # TASK
  - [x] 2026-05-08 types/loadstar.ts — ElementType에 'DWP' 추가
  - [x] 2026-05-08 client.ts — WayPointDetail에 tables 필드 추가, fetchDwp/updateDwp 함수 추가
  - [x] 2026-05-08 ElementTree.tsx — DWP 타입 → 'dwp' 탭타입, 아이콘 처리
  - [x] 2026-05-08 App.tsx — Tab type union에 'dwp' 추가
  - [x] 2026-05-08 EditorTabs.tsx — 'dwp' 케이스 추가, DataWayPointEditor 연결, 탭 아이콘
  - [x] 2026-05-08 DataWayPointEditor.tsx — 신규 컴포넌트. WayPointEditor에서 TODO 제거, CHILDREN 제거, TABLES 섹션 추가
  - [x] 2026-05-08 WayPointEditor.tsx — navigateTo에 D:// → dwp 케이스 추가

### ISSUE
(없음)

### COMMENT
(없음)
</WAYPOINT>
