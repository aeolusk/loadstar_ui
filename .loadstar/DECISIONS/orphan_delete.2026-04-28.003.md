<DECISION>
## [ID] orphan_delete.2026-04-28.003
## [STATUS] DECIDED
## [CREATED_AT] 2026-04-28 14:30

### SOURCE
- WP: W://root/maintenance/orphan_delete
- Question: Q1

### QUESTION
wp가 있는 map을 삭제할 경우 어떻게 할까요?

### DECISION
wp가 있는 map은 삭제할 수 없다는 메시지 팝업을 띄워줘

### NOTE
cascade 삭제 모달(Option C) 방식으로 구현됐다가, 2026-04-28 WP 삭제는 개발자에게 직접 위임하는 방향으로 최종 변경.

### AI_CONFIRMATION
- 처리상태: 처리완료
- 확인일시: 2026-04-28
- 처리내용: MapView.tsx handleDeleteMap() — WP가 존재하면 toast 메시지로 차단. cascade 모달 및 deleteMapCascade 호출 제거.
</DECISION>
