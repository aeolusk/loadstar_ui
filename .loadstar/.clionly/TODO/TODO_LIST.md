| 주소 (Address) | 발생 시간 (Time) | 작업 요약 (Summary) | 상태 (Status) | 선행 조건 (Depends_On) |
| :--- | :--- | :--- | :--- | :--- |
| W://root/frontend/map_view | 2026-04-06 12:01 | Map Viewer 구현: React Flow 노드 배치, WP 체인 흐름도, BlackBox/참조 연결, 노드 클릭 탭 열기 | ACTIVE | - |
| W://root/backend/cli_service | 2026-04-06 11:47 | ProcessBuilder 기반 CLI 실행기 구현 | PENDING | - |
| W://root/backend/log_service | 2026-04-06 11:47 | 로그 CLI 연동 API 구현 | PENDING | W://root/backend/cli_service |
| W://root/backend/monitor_service | 2026-04-06 11:47 | 모니터링 CLI 연동 API 구현 | PENDING | W://root/backend/cli_service |
| W://root/backend/git_service | 2026-04-06 11:47 | Git 이력/checkpoint API 구현 | PENDING | - |
| W://root/backend/todo_service | 2026-04-06 11:47 | TODO CLI 연동 API 구현 | PENDING | W://root/backend/cli_service |
| W://root/backend/element_service | 2026-04-06 11:47 | 요소 파싱/조회/편집 API 구현 | PENDING | - |
| W://root/backend/project_config | 2026-04-06 11:47 | 프로젝트 초기화/설정 API 구현 | PENDING | - |
| W://root/frontend/search | 2026-04-06 11:47 | Command Palette 검색 구현 | ACTIVE | - |
| W://root/frontend/cli_console | 2026-04-06 11:47 | CLI 콘솔 화면 구현 | ACTIVE | - |
| W://root/frontend/log_view | 2026-04-06 11:47 | 로그 검색/조회 화면 구현 | ACTIVE | - |
| W://root/frontend/git_view | 2026-04-06 11:47 | GIT 이력 조회 화면 구현 | ACTIVE | - |
| W://root/frontend/monitor_view | 2026-04-06 11:47 | 모니터링/드리프트 현황 화면 구현 | ACTIVE | - |
| W://root/frontend/todo_view | 2026-04-06 11:47 | TODO 목록 + History 탭 전환 화면 구현 | ACTIVE | - |
| W://root/frontend/dashboard | 2026-04-06 11:47 | 프로젝트 대시보드 화면 구현 | ACTIVE | - |
| W://root/frontend/blackbox_editor | 2026-04-06 11:47 | BlackBox 상세/편집 화면 구현 (드리프트 경고 포함) | ACTIVE | - |
| W://root/frontend/waypoint_editor | 2026-04-06 11:47 | WayPoint 상세/편집 화면 구현 | ACTIVE | - |
