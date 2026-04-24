<WAYPOINT>
## [ADDRESS] W://root/maintenance/connections_edit
## [STATUS] S_IDL

### IDENTITY
- SUMMARY: UI에 WayPoint CONNECTIONS 편집 기능 추가 — PARENT 변경, REFERENCE 추가/삭제
- METADATA: [Priority: P2, Created: 2026-04-24]
- SYNCED_AT: 2026-04-24

### CONNECTIONS
- PARENT: M://root/maintenance
- CHILDREN: []
- REFERENCE: [W://root/frontend/waypoint_editor, W://root/backend/element_service, W://root/maintenance/orphan_delete]

### CODE_MAP
- scope:
  - backend/src/main/java/com/loadstar/explorer/service/
  - frontend/src/features/waypoint-editor/

### TODO
- ADDRESS: W://root/maintenance/connections_edit
- SUMMARY: WP의 PARENT 변경 및 REFERENCE 추가/삭제 UI + 백엔드 API
- TECH_SPEC:
  # TASK — Backend
  - [ ] ConnectionController — PATCH /api/waypoints/{addr}/parent: PARENT 변경
    - 이전 부모의 CHILDREN에서 제거, 새 부모의 CHILDREN에 추가
    - 주소 표기도 새 경로 기준으로 변경 (파일명 rename 필요 여부 검토)
  - [ ] ConnectionController — POST /api/waypoints/{addr}/references: REFERENCE 추가
  - [ ] ConnectionController — DELETE /api/waypoints/{addr}/references/{targetAddr}: REFERENCE 삭제
  - [ ] ConnectionService — 순환 참조 검사 (self-ref, REFERENCE cycle)
  - [ ] ConnectionService — 대상 주소 존재 여부 검증
  - [ ] 변경 시 loadstar log add MODIFIED 자동 기록

  # TASK — Frontend
  - [ ] WayPointEditor에 CONNECTIONS 편집 섹션 추가
  - [ ] PARENT 선택 UI — Map/WayPoint 트리 드롭다운 또는 주소 autocomplete
  - [ ] REFERENCE 리스트 — 항목 삭제(×) 버튼 + "Add reference" 인풋 (autocomplete)
  - [ ] 변경 저장 시 낙관적 업데이트 + 실패 시 롤백
  - [ ] 변경 성공 후 ElementTree 자동 갱신 (PARENT 변경 반영)

  # RECURRING
  - (R) 변경 후 `cd backend && mvn test` 실행
  - (R) 변경 후 `cd frontend && npm test` 실행
  - (R) 변경 후 `loadstar validate` 로 깨진 참조 미발생 확인

### ISSUE
- OPEN_QUESTIONS:
  - [Q1] PARENT 변경 시 주소 자체가 바뀌어야 하는가? (예: W://a/b/x → W://c/d/x). 바뀐다면 파일명 rename 필요. 안 바꾼다면 주소와 실제 계층이 어긋남.
  - [Q2] REFERENCE는 단방향인가 양방향인가? A가 B를 REFERENCE하면 B에서도 "이 WP를 참조 중" 표시할지?
  - [Q3] PARENT 변경이 산하 WP 전체에 cascade 영향을 주는 경우(서브트리 이동) 어떻게 처리할지?

### COMMENT
- Address rename 결정은 orphan_delete(`W://root/maintenance/orphan_delete`)의 cascade/block 정책과 연관됨 — 함께 결정 권장
- 주소가 바뀌면 모든 참조자(다른 WP의 REFERENCE, DECISIONS 파일의 SOURCE)도 갱신 필요 — 영향 범위 큼
- 보수적 접근: 프로토타입에선 "PARENT 변경은 주소 유지" 로 시작하고, v2에서 리네임까지 확장 검토
</WAYPOINT>
