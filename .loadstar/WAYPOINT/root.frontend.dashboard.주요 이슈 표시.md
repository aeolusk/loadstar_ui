<WAYPOINT>
## [ADDRESS] W://root/frontend/dashboard/주요 이슈 표시
## [STATUS] S_STB

### IDENTITY
- SUMMARY: 프로젝트 통합 이슈 및 리스크 표시 — 크로스커팅 이슈, 기술 부채, 리스크를 대시보드에 표시하여 추적
- METADATA: [Ver: 1.0, Created: 2026-04-08]

### CONNECTIONS
- PARENT: W://root/frontend/dashboard
- CHILDREN: []
- REFERENCE: []

### TODO
- ADDRESS: W://root/frontend/dashboard/주요 이슈 표시
- TECH_SPEC:
  - [x] 2026-04-10 이슈/리스크 데이터 모델 설계 (제목, 설명, 심각도, 상태, 관련WP, 등록일)
  - [x] 2026-04-10 백엔드 API — 공지와 통합 NOTICE/ 디렉토리로 CRUD 구현
  - [x] 2026-04-10 프론트엔드 — 대시보드 이슈 카드 UI (심각도별 색상)
  - [x] 2026-04-10 이슈 해결 시 히스토리 보존 (파일 삭제 → git 이력 보존)

### ISSUE
(없음)

### COMMENT
- 용도: WayPoint 단위가 아닌 프로젝트 레벨의 횡단적 이슈/리스크 추적
- 예시: cli↔ui 스펙 불일치, 반복 발생 패턴, 아키텍처 결정 사유
</WAYPOINT>
