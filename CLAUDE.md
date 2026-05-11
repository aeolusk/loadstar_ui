# LOADSTAR UI — Claude Agent 운영 규칙

## 세션 시작 절차 (권장)

1. 이 파일을 읽는다.
2. `.loadstar/LOADSTAR_INIT.md` 를 읽어 현재 프로젝트 상태를 파악한다.

---

## 프로젝트 개요

- **스택**: Spring Boot 3 (backend) + React 19 + TypeScript + Vite (frontend)
- **저장소**: `C:\bono\MCP\GIT\loadstar_ui\`
- **백엔드 빌드**: `cd backend && mvn spring-boot:run`
- **프론트엔드 빌드**: `cd frontend && npx vite build`
- **서비스 URL**: `http://localhost:8080` (백엔드가 프론트엔드 dist/ 서빙)
- **SPEC 문서**: `C:\bono\MCP\GIT\loadstar_SPEC\`
- **CLI 바이너리**: `C:\bono\MCP\GIT\loadstar_cli\bin\loadstar.exe`

---

## WayPoint 작업 규칙 (필수)

### 작업 전
1. 대상 WayPoint를 확인한다 (`.loadstar/WAYPOINT/` 하위)
2. TODO에 작업 항목이 없으면 `- [ ] 작업 내용`을 추가한다
3. STATUS가 `S_IDL`이면 `S_PRG`로 변경한다

### 작업 후
1. 완료된 TODO 항목을 `- [x] YYYY-MM-DD 작업 내용`으로 체크한다
2. WP의 모든 TODO TASK 항목이 완료되면 STATUS를 `S_STB`로 변경한다
3. SUMMARY가 현재 기능과 다르면 갱신한다

### 원칙
- **항목 없이 코드 수정 금지** — 먼저 WayPoint에 "무엇을 할 것인가"를 기록
- 빠른 버그 수정의 경우 코드 수정 후 사후 등록도 허용
- Hook(`.claude/hooks/loadstar-drift-check.sh`)이 소스 편집 시 리마인드

---

## Data WayPoint(dwp) 수정 규칙

dwp 파일(`.loadstar/DATA_WAYPOINT/*.md`)을 수정할 때:
- `METADATA`의 `Updated` 날짜를 오늘 날짜로 갱신한다.
- `Created` 날짜는 변경하지 않는다 (최초 작성일 불변).
- 예: `- METADATA: [Created: 2026-05-01, Updated: 2026-05-08]`

---

## 주소 체계

```
M://root/frontend       →  .loadstar/MAP/root.frontend.md
W://root/frontend/todo_view  →  .loadstar/WAYPOINT/root.frontend.todo_view.md
```

## 디렉토리 구조

```
loadstar_ui/
├── backend/           Spring Boot REST API
├── frontend/          React SPA (Vite)
├── .loadstar/
│   ├── MAP/
│   ├── WAYPOINT/
│   └── .clionly/
└── .claude/
    ├── settings.json  Hook 설정
    └── hooks/         메타 동기화 스크립트
```
