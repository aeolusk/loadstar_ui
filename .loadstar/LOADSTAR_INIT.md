# LOADSTAR_INIT — loadstar_ui

> AI 세션 진입 시 이 파일을 읽어 프로젝트 컨텍스트를 복원합니다.
> 대시보드에서도 편집할 수 있습니다.

## 프로젝트 개요

- **스택**: Spring Boot 3 (backend) + React 19 + TypeScript + Vite (frontend)
- **서비스 URL**: http://localhost:8080
- **CLI**: `C:\bono\MCP\GIT\loadstar_cli\bin\loadstar.exe`

## AI 참고사항

- 2026-04-14: 기존 기능 구현 완료
- 2026-04-28: 테스트 WP 8건을 functional test로 대체 후 S_STB로 종결
- 2026-05-07: 보조 툴 "스케쥴 관리" 신규 트랙 진입
  - W://root/backend/schedule_service (S_PRG) — schedule.json REST API
  - W://root/frontend/schedule_view (S_PRG) — WBS 간트 보조 툴
  - 보조 툴 원칙: schedule.json은 schedule_service 외부에서 변경되지 않으며, schedule_view에서의 어떤 조작도 다른 모듈(WP/TODO/LOG)에 영향을 주지 않는다 (단방향 read만 허용)
- LOADSTAR_INIT.md 포맷이 SPEC(05.ELEMENT_FORMAT.md)에 정의되었습니다
