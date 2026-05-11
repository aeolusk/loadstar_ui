<WAYPOINT>
## [ADDRESS] W://root/maintenance/goals_editor
## [STATUS] S_STB

### IDENTITY
- SUMMARY: Goals Viewer를 편집 모드로 확장 — GOAL/SUMMARY 수정, Map 내 WP 순서 조정, 스켈레톤 WP 신규 생성
- METADATA: [Created: 2026-05-11]
- SYNCED_AT: 2026-05-11

### CONNECTIONS
- PARENT: M://root/maintenance
- CHILDREN: []
- REFERENCE: [W://root/frontend/goal_report]

### CODE_MAP
- scope:
  - frontend/src/features/goal-report/
  - backend/src/main/java/com/loadstar/explorer/service/ElementService.java
  - backend/src/main/java/com/loadstar/explorer/controller/ElementController.java

### TODO
- [x] 2026-05-11 ElementService.updateMap()에 waypoints 리스트 파라미터 추가 (순서 반영)
- [x] 2026-05-11 PATCH /api/elements/map 컨트롤러에 waypoints 파라미터 수신 처리
- [x] 2026-05-11 GoalReport.tsx에 editMode 토글 버튼 + 취소(Cancel) 버튼 추가
- [x] 2026-05-11 편집 상태 관리 구현 (editedData, mapOrders, dirtyAddresses — deep clone 기반)
- [x] 2026-05-11 Dirty 표시 UI — 변경 노드에 주황 점(●) + 헤더 변경 카운터
- [x] 2026-05-11 편집 UI — GOAL/SUMMARY textarea/input + Map 내 WP ↑↓ 버튼 (STATUS는 표시 전용)
- [x] 2026-05-11 WP 신규 생성 UI — Map 노드 하단 "+ WP 추가" 버튼, ID(영문)/SUMMARY 입력 모달
- [x] 2026-05-11 ID 유효성 검사 (^[a-z][a-z0-9_]*$) 및 중복 검사 (트리 내 주소 기준)
- [x] 2026-05-11 "모두 저장" 버튼 — dirty 노드 순차 PATCH + 신규 WP POST 후 트리 재로드 및 editMode 종료

### ISSUE
(없음)

### COMMENT
- 편집 범위: GOAL/SUMMARY + Map 레벨 WP 순서. STATUS 표시 전용. CHILDREN 순서·TODO 순서는 추후.
- WP 생성: 기존 POST /api/elements/map/add 재활용 (파일 미존재 시 스켈레톤 자동 생성됨)
- WP ID: 영문 소문자+숫자+언더스코어만 허용, 중복 검사는 프론트엔드에서 트리 주소 목록으로 처리
- Dirty tracking: 수정된 노드 주소 Set으로 관리, Cancel 시 전체 롤백, Save All 완료 시 클리어
- waypoints 파라미터 전달: URLSearchParams repeated param 방식 (waypoints=A&waypoints=B)
- 저장 순서: POST(신규 WP skeleton) → PATCH(수정) → GET tree 재로드
</WAYPOINT>
