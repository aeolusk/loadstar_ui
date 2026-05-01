<WAYPOINT>
## [ADDRESS] W://root/frontend/map_view
## [STATUS] S_STB

### IDENTITY
- SUMMARY: Map 화면 — React Flow 기반 흐름도. Map 상단/WP 하단 분리 배치, WP 추가(앞/뒤/child) 드롭다운, 삭제, 선택 하이라이트(WP 파란색/Map 주황색), child/ref 배지 및 펼침 표시
- METADATA: [Ver: 2.1, Created: 2026-04-06]
- SYNCED_AT: 2026-05-01

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
  - [x] 2026-04-28 Map 노드 클릭 선택 하이라이트 — 주황색 테두리/배경/아이콘 (#e6851a)
  - [x] 2026-04-28 MAP 삭제 대상 수정 — 선택된 MAP 노드 기준 삭제 (기존: 항상 현재 뷰 삭제)
  - [x] 2026-04-28 MAP 삭제 WP 사전 확인 순서 수정 — confirm 팝업 전에 대상 MAP의 WP 존재 여부 먼저 체크
  - [x] 2026-05-01 선택 WP의 child/ref 펼침 표시를 GroupBox로 교체 — 선분 제거, 단일 박스 안에 Children/References 섹션 표시, 클릭 선택 유지

### ISSUE
(없음)

### COMMENT
v2.0: 읽기 전용 흐름도 → 구조 관리 기능 추가 (WP/Map/child 추가·삭제)
</WAYPOINT>
