<WAYPOINT>
## [ADDRESS] W://root/maintenance/decisions_ui
## [STATUS] S_IDL

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
  - [ ] QuestionController — GET /api/questions: 모든 WP의 OPEN/DEFERRED 질문 수집 반환
  - [ ] QuestionController — POST /api/questions/decide: Decision 파일 생성 + WP OPEN_QUESTIONS 갱신
  - [ ] DecisionService — 파일명 규약 구현 (YYYY-MM-DD.slug.NNN.md, NNN 자동 증분)
  - [ ] DecisionService — Decision md 파일 포맷 생성 (05.ELEMENT_FORMAT 참조)
  - [ ] DecisionService — WP의 해당 Q 라인을 `[Q{N} RESOLVED <id>] 요약`으로 인플레이스 교체
  - [ ] 저장 성공 시 loadstar log add DECISION 자동 호출
  - [ ] IMPACT에 적힌 TECH_SPEC 항목을 해당 WP에 자동 추가 (선택 토글)

  # TASK — Frontend
  - [ ] Questions 탭 신설 (app_shell 네비게이션)
  - [ ] QuestionList 컴포넌트 — OPEN/DEFERRED 질문 테이블 (ADDRESS, Q, STATE, QUESTION)
  - [ ] DecisionModal 컴포넌트 — Context, Options (동적 목록), Decision*, Rationale, Impact 입력 폼
  - [ ] slug 자동 추천 (질문 내용 기반) — 사용자 편집 가능
  - [ ] "Defer" 액션 — [Q1] → [Q1 DEFERRED] 로 전환만 수행 (파일 생성 없음)
  - [ ] 결정 저장 후 목록 자동 갱신

  # RECURRING
  - (R) 변경 후 `cd backend && mvn test` 실행
  - (R) 변경 후 `cd frontend && npm test` 실행
  - (R) API 추가 시 `frontend/src/api/client.ts` 동기화 확인

### ISSUE
- OPEN_QUESTIONS:
  - [Q1] slug 자동 생성 전략 — 질문 앞 3~5 단어? 사용자 필수 입력? AI 추천?
  - [Q2] 여러 WP에 영향 주는 질문 처리 — UI에서 "WP 선택" 체크박스? 자동 감지?
  - [Q3] Decision 파일 편집(이미 저장된 것 수정)을 UI에서 허용할지? 아니면 Git 직접 편집 유도?

### COMMENT
- SPEC v1.3.12에서 Decision 파일 규약 확정됨 (05.ELEMENT_FORMAT Decision 섹션)
- 구현 전 `W://root/maintenance/orphan_delete`와의 시너지 확인 — UI 삭제 로직에 Q&A 결과 반영 가능
- Backend API 설계 시 POST /api/questions/{qid}/decide 형태 권장 (RESTful)
</WAYPOINT>
