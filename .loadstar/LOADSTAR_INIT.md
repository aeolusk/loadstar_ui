# LOADSTAR_INIT — loadstar_ui

> AI 세션 진입 시 이 파일을 먼저 읽어 프로젝트 컨텍스트를 복원합니다.

## 프로젝트 개요

- **스택**: Spring Boot 3 (backend) + React 19 + TypeScript + Vite (frontend)
- **서비스 URL**: http://localhost:8080
- **CLI**: `C:\bono\MCP\GIT\loadstar_cli\bin\loadstar.exe`

## 현재 공지사항 / 메모

> 이 섹션은 프로젝트 레벨의 공지, 작업 방침, 주의사항을 기록합니다.
> 작업 전 반드시 확인하세요.

- (현재 등록된 공지 없음)

## 현재 이슈 / 리스크

> 프로젝트 횡단적 이슈, 기술 부채, 리스크를 기록합니다.

- (현재 등록된 이슈 없음)

## WayPoint 상태 요약 (2026-04-10 기준)

| 영역 | S_STB | S_PRG | S_IDL |
|:---|:---:|:---:|:---:|
| Backend (6) | 5 | 1 | 0 |
| Frontend (16) | 7 | 3 | 6 |
| Test (9) | 0 | 0 | 9 |

### 진행중 (S_PRG)
- `W://root/frontend/dashboard` — 실제 API 연동 미완
- `W://root/frontend/search` — API 연동 + Ctrl+K 미완
- `W://root/backend/project_config` — CI workflow 미완

### BLOCKED
- `W://root/frontend/dashboard` → test_dashboard
- `W://root/frontend/search` → test_search

## 다음 작업 후보

1. 대시보드 하위 WP 구현 (공지/이슈/WP상황/요소뷰)
2. search API 연동 + Ctrl+K
3. 프론트엔드 테스트 WP 9개 (S_IDL)
