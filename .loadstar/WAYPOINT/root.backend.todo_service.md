<WAYPOINT>
## [ADDRESS] W://root/backend/todo_service
## [STATUS] S_STB

### IDENTITY
- SUMMARY: TODO 관리 — loadstar todo CLI 연동 (add, update, done, delete, list, history)
- METADATA: [Ver: 1.0, Created: 2026-04-06]

### CONNECTIONS
- PARENT: M://root/backend
- CHILDREN: []
- REFERENCE: []
- BLACKBOX: B://root/backend/todo_service

### TODO
- ADDRESS: W://root/backend/todo_service
- SUMMARY: TODO CLI 연동 API 구현
- TECH_SPEC:
  - [x] GET /api/todo/list : TODO 목록 조회
  - [x] GET /api/todo/history : TODO 이력 조회
  - [x] POST /api/todo/add : TODO 추가
  - [x] PUT /api/todo/update : TODO 상태 변경
  - [x] POST /api/todo/done : TODO 완료
  - [x] DELETE /api/todo/delete : TODO 삭제

### ISSUE
(없음)

### COMMENT
(없음)
</WAYPOINT>
