<WAYPOINT>
## [ADDRESS] W://root/maintenance/orphan_delete
## [STATUS] S_IDL

### IDENTITY
- SUMMARY: UI에서 WayPoint/Map 삭제 시 참조 없는 요소 자동 물리 삭제 로직 (orphan 방지)
- METADATA: [Priority: P2, Created: 2026-04-24]
- SYNCED_AT: 2026-04-24

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
  - [ ] 삭제 대상 WP/Map을 참조(PARENT/CHILDREN/REFERENCE/WAYPOINTS)하는 다른 요소 조회 API (backend)
  - [ ] 참조자 있으면 삭제 차단 + "{개수}개 요소가 참조 중" 경고 반환 (backend)
  - [ ] 참조자 없으면 md 파일 물리 삭제 + 부모의 CHILDREN/WAYPOINTS 리스트 자동 갱신 (backend)
  - [ ] loadstar log add 자동 호출 (DELETED kind, 또는 MODIFIED로 대체 기록) (backend)
  - [ ] UI 삭제 버튼 클릭 시 참조자 존재 여부를 사전 조회 → 차단되면 경고 모달 표시 (frontend)
  - [ ] 삭제 성공 시 ElementTree 자동 갱신 (frontend)
  - (R) 변경 후 `mvn test` / `npm test` 실행하여 회귀 검증

### ISSUE
- 기존 placeholder WP 4건이 orphan 상태로 남아있었음 (2026-04-24 수동 삭제). 이 로직이 있었다면 자동 정리됐을 것.
- OPEN_QUESTIONS:
  - [Q1] MAP 삭제 시 그 맵 산하 모든 WP를 어떻게 처리할 것인가? (cascade vs 차단 vs 선택)

### COMMENT
- 이 WP는 placeholder WP 4건이 데이터 정합성 검증 중 발견되어 신규 등록된 유지보수 작업이다.
</WAYPOINT>
