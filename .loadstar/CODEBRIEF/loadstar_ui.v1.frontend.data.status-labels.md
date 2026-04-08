<CODEBRIEF>
## [ADDRESS] loadstar_ui.v1.frontend.data.status-labels
## [SYNCED_AT] 2026-04-07

### 1. FILE
- PATH: frontend/src/data/status-labels.ts
- LANGUAGE: TypeScript

### 2. STRUCTURE
상태 코드 중앙 정의 — 색상/라벨 관리, 다국어(ko/en) 지원

- `getStatusLabel(code)` — 현재 로케일의 상태 라벨 반환
- `getStatusColor(code)` — 상태별 HEX 색상 반환
- `setLocale(locale: 'ko'|'en')` — 표시 언어 전환
- `getLocale()` — 현재 로케일 반환
- `statusOptions` — 전체 상태 코드 배열
- `getStatusLabelsMap()` / `getStatusColorsMap()` — 전체 맵 반환

상태 정의:
- S_IDL: 대기 (#9b8e7e)
- S_PRG: 진행중 (#3a7ca5)
- S_STB: 작업완료 (#5a8a5e)
- S_ERR: 오류 (#b54a3f)
- S_REV: 검토필요 (#c47f17)

### 3. COMMENT
- WayPointEditor, BlackBoxEditor, MapView 3개 파일에서 공유 참조
</CODEBRIEF>
