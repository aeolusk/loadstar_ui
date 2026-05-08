<WAYPOINT>
## [ADDRESS] W://root/backend/dwp_api
## [STATUS] S_STB

### IDENTITY
- SUMMARY: DWP(Data WayPoint) 백엔드 지원 — D:// 주소 라우팅, TABLES 파싱/쓰기, GET/PUT /elements/dwp 엔드포인트
- METADATA: [Created: 2026-05-08]
- SYNCED_AT: 2026-05-08

### CONNECTIONS
- PARENT: M://root/backend
- CHILDREN: []
- REFERENCE: [W://root/frontend/dwp_editor]

### CODE_MAP
- scope:
  - backend/src/main/java/com/loadstar/explorer/

### TODO
- SUMMARY: DWP를 위한 백엔드 API 계층 구현
- TECH_SPEC:
  # TASK
  - [x] 2026-05-08 WayPointDetailResponse — tables 필드(List<TableEntry>) + TableEntry 이너 클래스 추가
  - [x] 2026-05-08 ElementService.addressToPath — D:// → DATA_WAYPOINT/ 처리 추가
  - [x] 2026-05-08 ElementParser.parseWayPointDetail — ### TABLES 섹션 파싱 추가
  - [x] 2026-05-08 ElementWriter — writeDwp() 메서드 추가 (<DWP> 태그, TABLES 직렬화, TODO 섹션 제외)
  - [x] 2026-05-08 ElementService — getDwpDetail(), updateDwp() 메서드 추가
  - [x] 2026-05-08 ElementController — GET /elements/dwp, PUT /elements/dwp 엔드포인트 추가

### ISSUE
(없음)

### COMMENT
(없음)
</WAYPOINT>
