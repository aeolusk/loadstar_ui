<WAYPOINT>
## [ADDRESS] W://root/maintenance/selection_mousedown
## [STATUS] S_STB

### IDENTITY
- SUMMARY: Map 화면(MapView)의 WP/Map 노드 selection — onMouseDownCapture로 전환하여 노드 내부 어디서나 마우스 누른 순간 즉시 선택
- METADATA: [Priority: P2, Created: 2026-05-01]
- SYNCED_AT: 2026-05-01 17:30

### CONNECTIONS
- PARENT: M://root/maintenance
- CHILDREN: []
- REFERENCE: [W://root/frontend/map_view]

### CODE_MAP
- scope:
  - frontend/src/features/map-view/

### TODO
# TASK
- [x] 2026-05-01 MapView WayPointNode: onClick → onMouseDownCapture + 좌클릭 가드
- [x] 2026-05-01 MapView MapNode: 동일
- [x] 2026-05-01 MapView RefWayPointNode: 동일
- [x] 2026-05-01 MapView ChildWayPointNode: 동일
- [x] 2026-05-01 FlowChart ReactFlow에 nodeDragThreshold=5 유지 (drag UX 보조)
- [x] 2026-05-01 vite build 통과

# RECURRING
- (R) 변경 후 `cd frontend && npx vite build` 실행

### ISSUE
- OPEN_QUESTIONS:
  (없음)

### COMMENT
- 처리 범위: Map 화면(MapView) ReactFlow 노드 4종. 좌측 Explorer 트리(ElementTree), 에디터 탭(EditorTabs), Git/Search 화면은 사용자 지시에 따라 제외.
- 원래 문제: React Flow nodeDragThreshold 기본값 1px → 1px만 이동해도 drag로 인식, click suppress.
- onClick → onMouseDown 시도: Handle 컴포넌트가 mousedown bubble phase에서 stopPropagation 호출 → 노드 border 영역에서만 반응.
- nodeDragThreshold=5 시도: 여전히 미세 이동 시 선택 누락.
- 최종 방법: onMouseDownCapture (capture phase). 자식의 stopPropagation과 무관하게 부모가 먼저 실행. 노드 내부 어디를 눌러도 마우스 누른 순간 즉시 선택 발화.
- WayPointEditor 안의 selection 후보(TECH_SPEC 항목 multi-select, Git History 커밋 행)는 본 WP 대상 아님.
</WAYPOINT>
