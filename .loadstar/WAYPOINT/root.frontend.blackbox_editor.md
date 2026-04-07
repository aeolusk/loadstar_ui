<WAYPOINT>
## [ADDRESS] W://root/frontend/blackbox_editor
## [STATUS] S_STB

### IDENTITY
- SUMMARY: BlackBox 상세/편집 — DESCRIPTION/TODO/ISSUE/COMMENT 편집 + 선택 툴바 + CODE_MAP 뷰어 + 드리프트 경고
- METADATA: [Ver: 2.0, Created: 2026-04-06]
- SYNCED_AT: 2026-04-07

### CONNECTIONS
- PARENT: M://root/frontend
- CHILDREN: []
- REFERENCE: [W://root/test/test_blackbox_editor]
- BLACKBOX: B://root/frontend/blackbox_editor

### TODO
- ADDRESS: W://root/frontend/blackbox_editor
- TECH_SPEC:
  - [x] DESCRIPTION 편집: STATUS 드롭다운, SUMMARY 텍스트, SYNCED_AT 날짜 편집
  - [x] TODO 관리: 체크박스 토글, 항목 추가/삭제/편집
  - [x] TODO 관리: 전체선택 + 텍스트 필터 선택 툴바
  - [x] ISSUE 관리: 항목 추가/삭제/편집
  - [x] COMMENT 편집: 자유 텍스트 편집
  - [x] Backend: BlackBox 수정 API (PUT /api/elements/blackbox)
  - [x] Backend: 수정 후 loadstar log CLI로 변경 이력 기록
  - [x] 저장 시 로딩 인디케이터 표시

### ISSUE
(없음)

### COMMENT
- WayPoint 편집과 동일한 패턴 적용. CODE_MAP은 현재 읽기 전용으로 유지.
</WAYPOINT>
