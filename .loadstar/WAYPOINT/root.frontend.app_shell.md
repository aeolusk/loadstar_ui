<WAYPOINT>
## [ADDRESS] W://root/frontend/app_shell
## [STATUS] S_STB

### IDENTITY
- SUMMARY: 앱 골격 — Menu Bar, Toolbar, Element Tree (Map 추가/삭제, 선택 하이라이트), Editor Tabs, Status Bar
- METADATA: [Ver: 2.0, Created: 2026-04-06]
- SYNCED_AT: 2026-04-08

### CONNECTIONS
- PARENT: M://root/frontend
- CHILDREN: []
- REFERENCE: [W://root/test/test_app_shell]

### TODO
- TECH_SPEC:
  - [x] 2026-04-06 Menu Bar, Toolbar, ElementTree, EditorTabs, StatusBar 레이아웃
  - [x] 2026-04-08 ElementTree: Map 추가(+ 버튼) / 삭제(− 버튼, confirm, 하위 항목 시 경고)
  - [x] 2026-04-08 ElementTree: 노드 선택 하이라이트 (파란 좌측 보더)
  - [x] 2026-04-08 Toolbar: 모니터링 버튼 제거
  - [x] 2026-04-08 EditorTabs: BlackBox editor 제거
  - [x] 2026-04-08 구조 변경 시 트리 자동 갱신 (treeVersion)

### ISSUE
(없음)

### COMMENT
v2.0: ElementTree에 Map CRUD + 선택 하이라이트, BlackBox/Monitor 제거, 구조 변경 연동
</WAYPOINT>
