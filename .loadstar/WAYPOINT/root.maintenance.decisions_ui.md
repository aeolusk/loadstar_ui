<WAYPOINT>
## [ADDRESS] W://root/maintenance/decisions_ui
## [STATUS] S_STB

### IDENTITY
- SUMMARY: UI에 Questions 탭 + Decide 모달 추가. DECISIONS/ 파일 생성과 WP.OPEN_QUESTIONS 자동 갱신 워크플로 구현
- METADATA: [Priority: P2, Created: 2026-04-24]
- SYNCED_AT: 2026-04-24

### CONNECTIONS
- PARENT: M://root/maintenance
- CHILDREN: []
- REFERENCE: [W://root/backend/element_service, W://root/frontend/app_shell]

### CODE_MAP
- scope:
  - backend/src/main/java/com/loadstar/explorer/
  - frontend/src/features/

### TODO
- ADDRESS: W://root/maintenance/decisions_ui
- SUMMARY: Questions 탭 + Decision 기록 워크플로 — AI-사람 협업 결정 과정 보존
- TECH_SPEC:
  # TASK — Backend
  - [x] 2026-04-28 QuestionController — GET /api/questions: 모든 WP의 OPEN/DEFERRED 질문 수집 반환
  - [x] 2026-04-28 QuestionController — POST /api/questions/decide: Decision 파일 생성 + WP OPEN_QUESTIONS 갱신
  - [x] 2026-04-28 QuestionController — POST /api/questions/defer: DEFERRED 전환
  - [x] 2026-04-28 DecisionService — 파일명 규약 구현 (YYYY-MM-DD.slug.NNN.md, NNN 자동 증분)
  - [x] 2026-04-28 DecisionService — Decision md 파일 포맷 생성 (05.ELEMENT_FORMAT 참조)
  - [x] 2026-04-28 DecisionService — WP의 해당 Q 라인을 `[Q{N} RESOLVED <id>] 요약`으로 인플레이스 교체
  - [x] 2026-04-28 저장 성공 시 loadstar log add DECISION 자동 호출
  - [x] 2026-04-28 IMPACT에 적힌 TECH_SPEC 항목을 해당 WP에 자동 추가 (선택 토글)

  # TASK — Frontend
  - [x] 2026-04-28 Questions 탭 신설 (Toolbar + EditorTabs)
  - [x] 2026-04-28 QuestionList 컴포넌트 — OPEN/DEFERRED 질문 테이블 (ADDRESS, QID, STATE, QUESTION)
  - [x] 2026-04-28 DecisionModal 컴포넌트 — Context, Options (동적 목록), Decision*, Rationale, Impact 입력 폼
  - [x] 2026-04-28 slug 자동 추천 (질문 내용 기반) — 사용자 편집 가능
  - [x] 2026-04-28 "Defer" 액션 — [Q1] → [Q1 DEFERRED] 로 전환만 수행 (파일 생성 없음)
  - [x] 2026-04-28 결정 저장 후 목록 자동 갱신

  # TASK — v2 (2026-04-28)
  - [x] 2026-04-28 Backend: DecideRequest 단순화 — decision, note(비고) 2필드만 유지
  - [x] 2026-04-28 Backend: 파일명 규약 변경 — {wp_id}.{YYYY-MM-DD}.{NNN:03d}.md
  - [x] 2026-04-28 Backend: QuestionItem에 decisionText 필드 추가 (DECISIONS 파일 DECISION 섹션 읽기)
  - [x] 2026-04-28 Backend: DONE 상태 지원 — [Q1 DONE file.md] 파싱
  - [x] 2026-04-28 Backend: POST /api/questions/done — RESOLVED → DONE 전환
  - [x] 2026-04-28 Backend: POST /api/questions/close — 직접 DONE 종결
  - [x] 2026-04-28 Backend: GET /api/questions/open-file — Desktop.open() OS 파일 탐색기
  - [x] 2026-04-28 Frontend: QuestionList — "결정 기록" → "답변" 버튼명
  - [x] 2026-04-28 Frontend: QuestionList — WP view 이동 화살표 버튼 (onOpenTab prop)
  - [x] 2026-04-28 Frontend: DecisionModal 간소화 — 파일명(자동, readonly), 결정, 비고 3항목
  - [x] 2026-04-28 Frontend: RESOLVED/DONE 카드 — 버튼 대신 답변 2줄 미리보기
  - [x] 2026-04-28 Frontend: DONE 상태 배지 색상 + 필터 추가
  - [x] 2026-04-28 Frontend: RESOLVED 항목 파일명 클릭 시 OS 파일 탐색기 열기

  # TASK — v3 Questions Tab Redesign (2026-04-28)
  - [x] 2026-04-28 Backend: DELETE /api/questions — WP 파일에서 질문 라인 영구 삭제
  - [x] 2026-04-28 Backend: GET /api/questions/decision?path= — DECISION/NOTE 섹션 읽기
  - [x] 2026-04-28 Backend: PUT /api/questions/decision?path= — DECISION/NOTE 섹션 덮어쓰기
  - [x] 2026-04-28 Frontend: STATE_LABEL — OPEN→대기, DEFERRED→추후검토, RESOLVED→결정완료, DONE→결정반영
  - [x] 2026-04-28 Frontend: ALL 필터 탭 제거 (기본 탭: OPEN)
  - [x] 2026-04-28 Frontend: DEFERRED — 답변 + 삭제(deleteQuestion) 버튼
  - [x] 2026-04-28 Frontend: RESOLVED — 미리보기 2줄 텍스트 + 수정(edit DecisionModal) 버튼
  - [x] 2026-04-28 Frontend: DONE — 버튼 없이 미리보기 내용만 출력
  - [x] 2026-04-28 Frontend: client.ts — deleteQuestion, fetchDecisionContent, updateDecisionContent 추가

  # RECURRING
  - (R) 변경 후 `cd backend && mvn compile` 실행
  - (R) 변경 후 `cd frontend && npx vite build` 실행
  - (R) API 추가 시 `frontend/src/api/client.ts` 동기화 확인

### ISSUE
- OPEN_QUESTIONS:

### COMMENT
- SPEC v1.3.12에서 Decision 파일 규약 확정됨 (05.ELEMENT_FORMAT Decision 섹션)
- 구현 전 `W://root/maintenance/orphan_delete`와의 시너지 확인 — UI 삭제 로직에 Q&A 결과 반영 가능
- Backend API 설계 시 POST /api/questions/{qid}/decide 형태 권장 (RESTful)
</WAYPOINT>
