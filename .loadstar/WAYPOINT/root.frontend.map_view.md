<WAYPOINT>
## [ADDRESS] W://root/frontend/map_view
## [STATUS] S_PRG

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
  - [ ] Map 더블클릭 시 해당 Map 전용 탭 열기 (트리 연동)
  - [ ] Map 하위 WayPoint를 React Flow 노드로 배치 (좌→우 체인)
  - [ ] WayPoint 노드: 사각형 박스, STATUS 색상, TECH_SPEC 진행률 프로그레스 바
  - [ ] WayPoint 간 CHILDREN 관계를 엣지(화살표)로 연결
  - [ ] 체인 아래에 BlackBox 노드 연결 (하단 방향)
  - [ ] 체인 아래에 REFERENCE WayPoint 연결 (하단 방향, 점선)
  - [ ] 노드 클릭 시 해당 요소 탭 열기
  - [ ] 하위 Map 노드 표시 및 더블클릭 시 해당 Map 탭 열기
  - [ ] 줌/팬 인터랙션
  - [ ] fitView 자동 맞춤

### ISSUE
(없음)

### COMMENT
(없음)
</WAYPOINT>
