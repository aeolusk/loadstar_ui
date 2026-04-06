<WAYPOINT>
## [ADDRESS] W://root/frontend/map_view
## [STATUS] S_STB

### IDENTITY
- SUMMARY: Map 화면 — React Flow 기반 WayPoint 체인 흐름도, 좌→우 수평 배치, 하단 BlackBox/참조 연결
- METADATA: [Ver: 1.0, Created: 2026-04-06]

### CONNECTIONS
- PARENT: M://root/frontend
- CHILDREN: []
- REFERENCE: [W://root/test/test_map_view]
- BLACKBOX: B://root/frontend/map_view

### TODO
- ADDRESS: W://root/frontend/map_view
- SUMMARY: Map Viewer 화면 구현
- TECH_SPEC:
  - [x] Map 더블클릭 시 해당 Map 전용 탭 열기 (트리 연동)
  - [x] Map 하위 WayPoint를 React Flow 노드로 배치 (좌→우 체인)
  - [x] WayPoint 노드: 사각형 박스, STATUS 색상, summary 표시
  - [x] WayPoint 간 CHILDREN 관계를 엣지(화살표)로 연결
  - [x] BlackBox 아이콘(📦)을 WayPoint 노드 우상단에 표시
  - [x] REFERENCE WayPoint 연결 (하단 방향, 점선 화살표)
  - [x] WayPoint 클릭 시 하단 패널에 상세 표시
  - [x] BlackBox 아이콘 클릭 시 하단 패널에 BlackBox 상세 표시
  - [x] 하위 Map 노드 표시 및 더블클릭 시 해당 Map 탭 열기
  - [x] 줌/팬 인터랙션
  - [x] fitView 자동 맞춤
  - [x] 상하 분할 패널 (리사이즈 가능)
  - [x] 실제 .loadstar 데이터 API 연동

### ISSUE
(없음)

### COMMENT
(없음)
</WAYPOINT>
