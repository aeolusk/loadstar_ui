<WAYPOINT>
## [ADDRESS] W://root/frontend/todo_view
## [STATUS] S_STB

### IDENTITY
- SUMMARY: TODO 화면 — sync 기반 TODO 목록 (PENDING/ACTIVE/BLOCKED) + TECH_SPEC 완료 히스토리, Map 필터 지원
- METADATA: [Ver: 2.0, Created: 2026-04-06]
- SYNCED_AT: 2026-04-08

### CONNECTIONS
- PARENT: M://root/frontend
- CHILDREN: []
- REFERENCE: [W://root/test/test_todo_view]

### TODO
- [x] 2026-04-06 샘플 데이터 기반 화면 레이아웃 구현 (목록/History 탭 전환)
- [x] 2026-04-06 실제 API 연동 (loadstar todo CLI)
- [x] 2026-04-06 필터 조건: Status, Address 필터
- [x] 2026-04-08 CLI todo 재구현 반영 — 새 포맷 (ADDRESS/STATUS/SUMMARY 3컬럼)
- [x] 2026-04-08 Sync 버튼 + 확인 팝업 + 동기화 결과 토스트
- [x] 2026-04-08 History 탭: WP TECH_SPEC [x] 항목 수집, Map 필터 드롭다운
- [x] 2026-04-08 백엔드 history 캐시 (sync 시 무효화)
- [x] 2026-04-08 구버전 API 제거 (add/update/done/delete)

### ISSUE
(없음)

### COMMENT
- v2.0: CLI todo가 sync 기반으로 전환됨에 따라 UI도 전면 개편. CRUD 제거, sync 버튼 추가, history는 WP TECH_SPEC에서 직접 수집.
</WAYPOINT>
