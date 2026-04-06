<WAYPOINT>
## [ADDRESS] W://root/backend/element_service
## [STATUS] S_PRG

### IDENTITY
- SUMMARY: 요소 파싱/조회/편집 — Map, WayPoint, BlackBox md 파일 읽기/쓰기, 트리 구조 JSON 변환
- METADATA: [Ver: 2.0, Created: 2026-04-06]

### CONNECTIONS
- PARENT: M://root/backend
- CHILDREN: []
- REFERENCE: [W://root/backend/cli_service]
- BLACKBOX: B://root/backend/element_service

### TODO
- ADDRESS: W://root/backend/element_service
- SUMMARY: 요소 편집 API 구현
- TECH_SPEC:
  - [x] GET /api/elements/tree : 트리 조회
  - [x] GET /api/elements/map-view : Map 뷰 데이터
  - [x] GET /api/elements/waypoint : WayPoint 상세 조회
  - [x] GET /api/elements/blackbox : BlackBox 상세 조회
  - [x] GET /api/elements/validate : 프로젝트 유효성 검증
  - [ ] PUT /api/elements/waypoint : WayPoint 수정 (md 파일 쓰기)
  - [ ] 수정 후 loadstar log MODIFIED CLI 호출로 변경 이력 기록

### ISSUE
(없음)

### COMMENT
- 편집 API는 md 파일을 직접 수정하고 loadstar log CLI로 변경 이력을 기록하는 구조
</WAYPOINT>
