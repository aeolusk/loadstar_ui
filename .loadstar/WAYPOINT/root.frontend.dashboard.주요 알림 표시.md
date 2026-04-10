<WAYPOINT>
## [ADDRESS] W://root/frontend/dashboard/주요 알림 표시
## [STATUS] S_PRG

### IDENTITY
- SUMMARY: 프로젝트 공지사항 및 메모 표시 — AI 세션 진입 시 확인용 프로젝트 레벨 노트, 작업 방침, 주의사항 등을 대시보드에 표시
- METADATA: [Ver: 1.0, Created: 2026-04-08]

### CONNECTIONS
- PARENT: W://root/frontend/dashboard
- CHILDREN: []
- REFERENCE: []

### TODO
- ADDRESS: W://root/frontend/dashboard/주요 알림 표시
- TECH_SPEC:
  - [x] 2026-04-10 공지사항/메모 데이터 모델 설계 (제목, 내용, 작성일, 우선순위, 카테고리)
  - [x] 2026-04-10 백엔드 API — 공지 목록 조회/추가/수정/삭제 (저장소: .loadstar/NOTICE/)
  - [x] 2026-04-10 프론트엔드 — 대시보드 공지 카드 UI (최신순, 우선순위 표시)
  - [ ] LOADSTAR_INIT.md 연동 — AI 세션 시작 시 활성 공지 자동 포함

### ISSUE
(없음)

### COMMENT
- 용도: 프로젝트 횡단적 메모 축적 (통합 이슈, 작업 방침, 기법 기록, 개선 아이디어 등)
- AI 활용: 세션 진입 시 LOADSTAR_INIT.md 또는 대시보드 API로 현재 공지 확인
</WAYPOINT>
