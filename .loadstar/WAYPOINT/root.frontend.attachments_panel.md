<WAYPOINT>
## [ADDRESS] W://root/frontend/attachments_panel
## [STATUS] S_STB

### IDENTITY
- SUMMARY: WP/dwp 에디터에 ATTACHMENTS 섹션 추가 — 파서·모델·Writer 업데이트 + 프론트엔드 표시·인라인 편집
- METADATA: [Priority: P1, Created: 2026-05-12]
- SYNCED_AT: 2026-05-12 16:00

### GOAL
SPEC v1.7.0에서 신설된 ATTACHMENTS 슬롯이 실제 에디터에서도 읽히고 편집될 수 있게 한다. `https://` / `file:///` URL을 추가·삭제할 수 있으며, ` — 설명` 부분도 인라인으로 편집 가능하다.

### CONNECTIONS
- PARENT: M://root/frontend
- CHILDREN: []
- REFERENCE: [W://root/frontend/waypoint_editor, W://root/frontend/dwp_editor]

### CODE_MAP
- scope:
  - frontend/src/
  - backend/src/main/java/com/loadstar/explorer/

### ATTACHMENTS
- https://github.com/anthropics/loadstar — SPEC 저장소
- file:///loadstar_SPEC/02.SCHEMA_DEF.md — §7 Attachment URL Schemes 정의

### TODO
# TASK
- [x] 2026-05-12 WayPointDetailResponse.java — attachments 필드(List<String>) 추가
- [x] 2026-05-12 ElementParser.java — ATTACHMENTS 섹션 파싱 추가 (URL 항목 수집, `— 설명` 포함 원문 그대로)
- [x] 2026-05-12 ElementWriter.java — ATTACHMENTS 섹션 직렬화 추가
- [x] 2026-05-12 client.ts — WayPointDetail 타입에 attachments 필드 추가, updateWp 페이로드에 포함
- [x] 2026-05-12 WayPointEditor.tsx — ATTACHMENTS 섹션 UI (목록 표시 + 항목 추가/삭제/편집)
- [x] 2026-05-12 DataWayPointEditor.tsx — ATTACHMENTS 섹션 UI (목록 표시 + 항목 추가/삭제/편집)

# RECURRING
- (R) 변경 후 mvn spring-boot:run 빌드 확인
- (R) WP/dwp 파일 저장 후 loadstar validate 통과 확인

### ISSUE
- OPEN_QUESTIONS: []
- 항목 원문(URL + 선택 설명) 그대로 저장 — UI에서 URL/설명을 분리 표시하되 파일 저장 시 `- URL — 설명` 포맷으로 합쳐서 기록한다.

### COMMENT
- SPEC 참조: file:///loadstar_SPEC/02.SCHEMA_DEF.md — §7 Attachment URL Schemes
</WAYPOINT>
