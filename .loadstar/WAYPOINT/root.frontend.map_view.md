<WAYPOINT>
## [ADDRESS] W://root/frontend/map_view
## [STATUS] S_STB

### IDENTITY
- SUMMARY: Map 화면 — React Flow 기반 흐름도. Map 상단/WP 하단 분리 배치, WP 추가(앞/뒤/child) 드롭다운, 삭제, 선택 하이라이트, child/ref 배지 및 펼침 표시
- METADATA: [Ver: 2.0, Created: 2026-04-06]
- SYNCED_AT: 2026-04-08

### CONNECTIONS
- PARENT: M://root/frontend
- CHILDREN: []
- REFERENCE: [W://root/test/test_map_view]

### TODO
- TECH_SPEC:
  - [x] 2026-04-06 React Flow 기반 WP 체인 흐름도 (좌→우 수평)
  - [x] 2026-04-06 하단 패널: WP 선택 시 WayPointEditor 표시
  - [x] 2026-04-08 Map/WP 분리 레이아웃 (Map 상단 행, WP 하단 행)
  - [x] 2026-04-08 WP 추가 드롭다운 (앞/뒤/child) — 선택 노드 기준
  - [x] 2026-04-08 WP 추가 시 ID + Summary 입력
  - [x] 2026-04-08 WP/Map 삭제 (confirm 대화상자)
  - [x] 2026-04-08 선택 노드 파란 테두리 하이라이트
  - [x] 2026-04-08 child/ref 배지 (↳ N, → N) — 클릭 시 펼침
  - [x] 2026-04-08 child 노드 선택 하이라이트 + child 제거 버튼
  - [x] 2026-04-08 child 선택 시 + WayPoint 비활성화
  - [x] 2026-04-08 뷰포트 유지 (구조 변경 시 확대/위치 보존)
  - [x] 2026-04-08 구조 변경 시 좌측 트리 자동 갱신 (onStructureChange)
  - [x] 2026-04-08 생성 완료 토스트 "AI에게 내용 작성을 요청하세요"

### ISSUE
(없음)

### COMMENT
v2.0: 읽기 전용 흐름도 → 구조 관리 기능 추가 (WP/Map/child 추가·삭제)
</WAYPOINT>
