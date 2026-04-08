<CODEBRIEF>
## [ADDRESS] loadstar_ui.v1.frontend.api.client
## [SYNCED_AT] 2026-04-07

### 1. FILE
- PATH: frontend/src/api/client.ts
- LANGUAGE: TypeScript

### 2. STRUCTURE
중앙 API 클라이언트 — axios 기반, 모든 백엔드 통신의 단일 진입점

Element API:
- `validateProject(root)` — 프로젝트 유효성 검증
- `fetchTree(root)` — 요소 트리 조회
- `fetchMapView(root, address)` — Map 시각화 데이터
- `fetchWayPoint(root, address)` — WayPoint 상세 조회
- `updateWayPoint(root, data, skipHistory?)` — WayPoint 수정
- `fetchBlackBox(root, address)` — BlackBox 상세 조회
- `updateBlackBox(root, data, skipHistory?)` — BlackBox 수정

TODO API:
- `fetchTodoList(root)`, `fetchTodoHistory(root, address?)`
- `addTodo(root, address, summary, dependsOn?)`
- `updateTodoStatus(root, address, status)`, `doneTodo()`, `deleteTodo()`

Git API:
- `fetchProjectGitLog(root, limit?)` — 프로젝트 전체 커밋 이력
- `fetchGitDetail(root, hash)` — 커밋 상세 (변경 파일 목록)
- `fetchGitHistory(root, address)` — 파일별 커밋 이력
- `fetchGitVersion(root, address, hash)` — 과거 WayPoint 버전
- `fetchGitBlackBoxVersion(root, address, hash)` — 과거 BlackBox 버전

CLI/Log API:
- `executeCliCommand(root, args[])` — CLI 명령 실행
- `fetchLog(root, offset, limit, address?, kind?)` — 로그 조회
- `browseDirectory(path)` — 디렉토리 탐색

주요 의존관계:
- axios — HTTP 클라이언트
- baseURL: DEV시 http://localhost:8080/api, 프로덕션시 /api

### 3. COMMENT
- 모든 API 함수는 root(프로젝트 경로)를 첫 번째 파라미터로 받음
</CODEBRIEF>
