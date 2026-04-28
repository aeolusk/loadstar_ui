<WAYPOINT>
## [ADDRESS] W://root/maintenance/connections_edit
## [STATUS] S_STB

### IDENTITY
- SUMMARY: UI에 WayPoint CONNECTIONS 편집 기능 추가 — PARENT 변경(주소 유지), CHILDREN 추가/삭제
- METADATA: [Priority: P2, Created: 2026-04-24]
- SYNCED_AT: 2026-04-28

### CONNECTIONS
- PARENT: M://root/maintenance
- CHILDREN: []
- REFERENCE: [W://root/frontend/waypoint_editor, W://root/backend/element_service]

### CODE_MAP
- scope:
  - backend/src/main/java/com/loadstar/explorer/service/
  - backend/src/main/java/com/loadstar/explorer/controller/
  - frontend/src/features/waypoint-editor/
  - frontend/src/api/

### TODO
- ADDRESS: W://root/maintenance/connections_edit
- SUMMARY: WP의 PARENT 변경 및 CHILDREN 추가/삭제 UI + 백엔드 API
- TECH_SPEC:
  # TASK — Backend
  - [x] 2026-04-28 GET /api/elements/addresses — 전체 WP+MAP 주소 목록 (콤보박스 소스)
  - [x] 2026-04-28 PATCH /api/elements/waypoint/parent?root=&address=&newParent= — PARENT 필드 변경
    - 기존 부모 MAP/WP의 CHILDREN에서 제거, 새 부모의 CHILDREN에 추가
    - 주소(파일명)는 변경 없음
  - [x] 2026-04-28 POST /api/elements/waypoint/children?root=&parentAddr=&childAddr= — CHILDREN 추가
  - [x] 2026-04-28 DELETE /api/elements/waypoint/children?root=&parentAddr=&childAddr= — CHILDREN 제거
  - [x] 2026-04-28 변경 시 loadstar log add MODIFIED 자동 기록

  # TASK — Frontend
  - [x] 2026-04-28 client.ts — fetchAddresses, patchParent, addChild, removeChild API 함수 추가
  - [x] 2026-04-28 WayPointEditor에 CONNECTIONS 편집 섹션 추가 (edit 모드 토글)
  - [x] 2026-04-28 PARENT: 콤보박스(전체 주소 목록) + "없음" 클리어 옵션
  - [x] 2026-04-28 CHILDREN: 리스트 + × 삭제 버튼 + 콤보박스로 추가
  - [x] 2026-04-28 변경 성공 후 WP 데이터 재로드

  # RECURRING
  - (R) 변경 후 `cd backend && mvn compile` 실행
  - (R) 변경 후 `cd frontend && npx vite build` 실행

### ISSUE
- OPEN_QUESTIONS:
  (없음)

### COMMENT
- 보수적 접근: PARENT 변경은 PARENT 필드만 갱신 + 기존/신규 부모의 CHILDREN 리스트 동기화
- REFERENCE 편집은 DEFERRED — Q2 결정 후 v2에서 확장
</WAYPOINT>
