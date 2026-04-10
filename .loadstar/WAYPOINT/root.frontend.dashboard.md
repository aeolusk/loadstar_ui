<WAYPOINT>
## [ADDRESS] W://root/frontend/dashboard
## [STATUS] S_PRG
- SYNCED_AT: 2026-04-10

### IDENTITY
- SUMMARY: 프로젝트 대시보드 화면 구현
- METADATA: [Ver: 1.0, Created: 2026-04-06]

### CONNECTIONS
- PARENT: M://root/frontend
- CHILDREN: [W://root/frontend/dashboard/elememt_view, W://root/frontend/dashboard/주요 알림 표시, W://root/frontend/dashboard/주요 이슈 표시, W://root/frontend/dashboard/waypoint 상황 표시]
- REFERENCE: [W://root/test/test_dashboard]

### TODO
- ADDRESS: W://root/frontend/dashboard
- TECH_SPEC:
  - [x] 샘플 데이터 기반 화면 레이아웃 구현
  - [x] 2026-04-10 백엔드 DashboardService + Controller 구현 (summary, notices CRUD)
  - [x] 2026-04-10 프론트엔드 API 클라이언트 확장 (dashboard 함수 추가)
  - [x] 2026-04-10 DashboardView 재구현 — Map별 탭 WP상황 + 공지/이슈 패널
  - [x] 2026-04-10 EditorTabs에서 projectRoot prop 전달
  - [x] 2026-04-10 CRUD 시 loadstar log 자동 기록 (DashboardService logNoticeAction)
  - [x] 2026-04-10 카테고리/우선순위 다국어 라벨 적용 (status-labels.ts 확장)
  - [x] 2026-04-10 모달 드래그 이동 + 리사이즈 지원
  - [x] 2026-04-10 카테고리 4개 세로 분리 배치 (공지/이슈/리스크/메모)

### ISSUE
(없음)

### COMMENT
(없음)
</WAYPOINT>
