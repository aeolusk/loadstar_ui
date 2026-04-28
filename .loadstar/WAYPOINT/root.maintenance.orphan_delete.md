<WAYPOINT>
## [ADDRESS] W://root/maintenance/orphan_delete
## [STATUS] S_STB

### IDENTITY
- SUMMARY: UI에서 WayPoint/Map 삭제 시 참조 없는 요소 자동 물리 삭제 로직 (orphan 방지)
- METADATA: [Priority: P2, Created: 2026-04-24]
- SYNCED_AT: 2026-04-28

### CONNECTIONS
- PARENT: M://root/maintenance
- CHILDREN: []
- REFERENCE: [W://root/backend/element_service, W://root/frontend/waypoint_editor]

### CODE_MAP
- scope:
  - backend/src/main/java/com/loadstar/explorer/service/
  - frontend/src/features/waypoint-editor/

### TODO
- ADDRESS: W://root/maintenance/orphan_delete
- SUMMARY: 삭제 시 참조 무결성 검사 + 물리 파일 제거
- TECH_SPEC:
  - [x] 2026-04-28 삭제 대상 WP/Map을 참조(REFERENCE/WAYPOINTS)하는 다른 요소 조회 API — GET /api/elements/references (backend)
  - [x] 2026-04-28 참조자 있으면 삭제 차단 + "{개수}개 요소가 참조 중" 경고 반환 (backend)
  - [x] 2026-04-28 참조자 없으면 md 파일 물리 삭제 + 부모의 CHILDREN/WAYPOINTS 리스트 자동 갱신 (backend)
  - [x] 2026-04-28 loadstar log add 자동 호출 (cli.logModified) (backend)
  - [x] 2026-04-28 MAP cascade 삭제 — 산하 WP 선택 후 삭제 (option C) (backend + frontend)
  - [x] 2026-04-28 UI 삭제 버튼 클릭 시 참조자 존재 여부를 사전 조회 → 차단되면 경고 모달 표시 (frontend)
  - [x] 2026-04-28 삭제 성공 시 ElementTree 자동 갱신 (window.location.reload) (frontend)
  - [x] 2026-04-28 MapView MAP 삭제 버그 픽스 — 삭제 대상이 항상 현재 뷰로 고정되어 WP 수가 잘못 체크되던 문제 수정 (선택된 MAP 기준으로 변경, confirm 전 WP 사전 확인)
  - (R) 변경 후 `mvn test` / `npm test` 실행하여 회귀 검증

### ISSUE
- 기존 placeholder WP 4건이 orphan 상태로 남아있었음 (2026-04-24 수동 삭제). 이 로직이 있었다면 자동 정리됐을 것.
- OPEN_QUESTIONS:
  (없음)

### COMMENT
- 이 WP는 placeholder WP 4건이 데이터 정합성 검증 중 발견되어 신규 등록된 유지보수 작업이다.
</WAYPOINT>
