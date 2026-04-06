<WAYPOINT>
## [ADDRESS] W://root/backend/log_service
## [STATUS] S_STB

### IDENTITY
- SUMMARY: 로그 관리 — loadstar log/findlog CLI 연동, KIND/Address 필터링
- METADATA: [Ver: 1.0, Created: 2026-04-06]

### CONNECTIONS
- PARENT: M://root/backend
- CHILDREN: []
- REFERENCE: []
- BLACKBOX: B://root/backend/log_service

### TODO
- ADDRESS: W://root/backend/log_service
- SUMMARY: 로그 CLI 연동 API 구현
- TECH_SPEC:
  - [x] GET /api/log/find : 로그 조회 (offset/limit/address/kind)
  - [x] CLI findlog 출력 파싱

### ISSUE
(없음)

### COMMENT
(없음)
</WAYPOINT>
