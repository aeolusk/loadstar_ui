> 🌐 **[English](README.md)** | **한국어**

# LOADSTAR Explorer UI

LOADSTAR 방법론 기반 프로젝트 구조를 시각적으로 탐색하고 관리하는 웹 애플리케이션입니다.

![LOADSTAR Explorer UI — Map View & WayPoint Editor](docs/waypoint_editor.png)

> 📌 LOADSTAR가 처음이라면 먼저 [openLoadstar 전체 안내](https://github.com/openLoadstar/openLoadstar) 를 참고하세요.

---

## 🧭 개요

LOADSTAR Explorer는 `.loadstar/` 메타데이터(Map·WayPoint·Decision·로그)를 Eclipse 스타일의 웹 UI로 제공합니다. 프로젝트 구조를 흐름도로 시각화하고, WayPoint 편집·TODO 관리·Git 이력 조회·CLI 실행을 한 화면에서 수행할 수 있습니다.

CLI만으로도 모든 기능을 쓸 수 있지만, **WayPoint가 다수**(20개 이상)이거나 **여러 사람이 협업**하는 경우 UI가 거의 필수에 가깝습니다.

---

## 🧱 기술 스택

| Layer | Stack |
|:---|:---|
| Backend | Spring Boot 3.4, Java 17, Maven |
| Frontend | React 19, TypeScript, Vite |
| Visualization | React Flow (`@xyflow/react`) |
| Layout | `react-resizable-panels` |
| CLI 연동 | [openLoadstar/cli](https://github.com/openLoadstar/cli) (Go 바이너리) |
| Spec | [openLoadstar/spec](https://github.com/openLoadstar/spec) |

---

## ✨ 주요 기능

### 📊 Dashboard

![Dashboard](docs/dashboard.png)

- WayPoint 상황 한눈에 보기 — Map / WayPoints / 작업완료 카운트
- Map별 진행률 바 시각화 (전체·backend·frontend·test·maintenance 탭)
- AI 참고사항 (`LOADSTAR_INIT.md`) 표시·편집 — AI 세션 진입 컨텍스트 관리
- 공지사항 영역 — 프로젝트 레벨 메모

### 🗺️ Map View

- React Flow 기반 흐름도로 Map / WayPoint 구조 시각화
- WayPoint 추가 (앞 / 뒤 / 자식), 삭제, 선택 하이라이트
- child / reference 배지 표시 및 펼침

### 📝 WayPoint Editor

- IDENTITY · CONNECTIONS · CODE_MAP · TECH_SPEC 섹션 편집
- TECH_SPEC 체크박스 토글, 항목 추가 / 삭제
- 변경 시 `loadstar log` 자동 기록

### ✅ TODO

- WayPoint STATUS 기반 TODO 목록 (ACTIVE / PENDING / BLOCKED)
- Sync 버튼으로 CLI `todo sync` 실행
- History 탭에서 TECH_SPEC 완료 이력 조회 (Map 필터)

### ❓ Questions

![Questions](docs/questions.png)

- WayPoint의 OPEN_QUESTIONS 통합 조회 (대기 / 추후검토 / 결정완료 탭)
- 질문 작성·답변·결정 기록 — 결정 사항은 `.loadstar/DECISIONS/` 에 ADR 형태로 저장
- 결정 완료된 질문은 처리 상태별로 분류 (처리완료 / 처리취소 / 처리대기중)

### 🧾 Git History

- `.loadstar/` 커밋 이력 조회
- 커밋 선택 시 변경 파일 목록 표시 (Added / Modified / Deleted)

### 📜 Log Viewer

- `loadstar log` 검색 (KIND / Address 필터, 시간순 정렬)

### 💻 CLI Console

- loadstar CLI 명령을 웹에서 직접 실행
- 명령 이력 탐색, 색상 구분 출력

### 🎯 Goals Report

- Map → WayPoint 계층을 한 화면에서 SUMMARY / GOAL / TODO 보고서 형식으로 조망
- TODO / RECURRING 섹션을 +/- 토글로 펼침/닫힘 (기본 닫힘), 진척률 표시
- 인쇄/PDF (새 창 열기 — 앱 셸 제외, Goals 보고서만 출력) 및 Markdown 다운로드

### 🔍 Search

- Command Palette (`Ctrl+K`) 기반 통합 검색

---

## 🛠️ 사전 요구사항

- Java 17 이상
- Node.js 18 이상
- [openLoadstar/cli](https://github.com/openLoadstar/cli) 빌드된 바이너리

---

## 🚀 빠른 시작

```bash
# 1. 프론트엔드 빌드
cd frontend
npm install
npx vite build

# 2. 백엔드 실행 (프론트엔드 dist/ 도 함께 서빙)
cd ../backend
mvn spring-boot:run

# 3. 브라우저에서 접속
# http://localhost:8080
```

> 백엔드가 프론트엔드 `dist/` 를 함께 서빙하므로 별도 dev 서버를 띄울 필요는 없습니다 (개발 시에는 `vite dev` 별도 사용 가능).

---

## 📂 프로젝트 구조

```
loadstar_ui/
├── backend/                Spring Boot REST API
│   └── src/main/java/com/loadstar/explorer/
│       ├── controller/     REST 엔드포인트
│       └── service/        비즈니스 로직 (Element·Todo·Git·Log·CLI)
├── frontend/               React SPA (Vite)
│   └── src/
│       ├── features/       기능별 컴포넌트 (map-view, waypoint-editor, goal-report, ...)
│       ├── components/     공통 컴포넌트 (AppShell, ElementTree, ...)
│       └── api/            API 클라이언트
├── .loadstar/              LOADSTAR 메타데이터
│   ├── MAP/                Map 요소
│   ├── WAYPOINT/           WayPoint 요소
│   ├── DATA_WAYPOINT/      D:// Data WayPoint 요소
│   └── .clionly/           ⚠️ CLI 전용 (직접 편집 금지)
└── docs/                   문서·스크린샷
```

---

## 🔗 관련 프로젝트

- 🌐 **[openLoadstar](https://github.com/openLoadstar/openLoadstar)** — 전체 생태계 안내
- 📖 **[spec](https://github.com/openLoadstar/spec)** — LOADSTAR 방법론 명세
- 🛠️ **[cli](https://github.com/openLoadstar/cli)** — Go 기반 CLI 도구
- 🔌 **[mcp](https://github.com/openLoadstar/mcp)** — Python MCP 서버 (외부 AI 클라이언트 연동)

---

## 📮 기여 / 보안

- 🤝 **기여 가이드**: [openLoadstar/CONTRIBUTING.ko.md](https://github.com/openLoadstar/openLoadstar/blob/main/CONTRIBUTING.ko.md)
- 🔒 **보안 신고**: [openLoadstar/SECURITY.ko.md](https://github.com/openLoadstar/openLoadstar/blob/main/SECURITY.ko.md) — GitHub Security Advisories를 우선 사용해 주세요.
- 💬 **질문·아이디어**: [GitHub Discussions](https://github.com/openLoadstar/openLoadstar/discussions)

---

## 📄 License

[Apache License 2.0](./LICENSE)
