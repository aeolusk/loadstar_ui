<WAYPOINT>
## [ADDRESS] W://root/frontend/waypoint_editor
## [STATUS] S_PRG

### IDENTITY
- SUMMARY: WayPoint 상세/편집 — IDENTITY, TODO, ISSUE, COMMENT 편집 + CLI 연동 변경 이력
- METADATA: [Ver: 2.0, Created: 2026-04-06]

### CONNECTIONS
- PARENT: M://root/frontend
- CHILDREN: []
- REFERENCE: [W://root/test/test_waypoint_editor, W://root/backend/element_service]
- BLACKBOX: B://root/frontend/waypoint_editor

### TODO
- ADDRESS: W://root/frontend/waypoint_editor
- SUMMARY: WayPoint 편집 기능 구현
- TECH_SPEC:
  - [x] WayPoint 상세 조회 화면 (API 연동)
  - [ ] IDENTITY 편집: STATUS 드롭다운 변경
  - [ ] IDENTITY 편집: SUMMARY 인라인 텍스트 편집
  - [ ] IDENTITY 편집: METADATA (Version, Priority) 편집
  - [ ] IDENTITY 편집: SYNCED_AT 날짜 편집
  - [ ] TODO 관리: TECH_SPEC 체크박스 토글
  - [ ] TODO 관리: TECH_SPEC 항목 추가
  - [ ] TODO 관리: TECH_SPEC 항목 삭제
  - [ ] TODO 관리: TECH_SPEC 항목 텍스트 편집
  - [ ] TODO 관리: TODO SUMMARY 편집
  - [ ] ISSUE 관리: 이슈 항목 추가
  - [ ] ISSUE 관리: 이슈 항목 삭제
  - [ ] ISSUE 관리: 이슈 항목 편집
  - [ ] ISSUE 관리: OPEN_QUESTIONS 추가
  - [ ] ISSUE 관리: OPEN_QUESTIONS RESOLVED 전환
  - [ ] COMMENT 편집: 자유 텍스트 편집
  - [ ] Backend: WayPoint 수정 API (PUT /api/elements/waypoint)
  - [ ] Backend: 수정 후 loadstar log CLI로 변경 이력 기록
  - [ ] 저장 시 로딩 인디케이터 표시

### ISSUE
(없음)

### COMMENT
- 편집 흐름: UI 편집 → Backend API 호출 → md 파일 직접 수정 → loadstar log MODIFIED 실행 → 응답 반환
- CONNECTIONS 편집은 별도 WayPoint에서 처리 (현재 스코프 외)
</WAYPOINT>
