<CODEBRIEF>
## [ADDRESS] loadstar_ui.v1.frontend.features.MapView
## [SYNCED_AT] 2026-04-07

### 1. FILE
- PATH: frontend/src/features/map-view/MapView.tsx
- LANGUAGE: TypeScript (React)

### 2. STRUCTURE
Map 시각화 컴포넌트 — ReactFlow 기반 WayPoint 체인 흐름도 + 하단 상세 패널

Props:
- `MapView({ projectRoot, address, onOpenTab })` — 메인 컴포넌트

커스텀 노드:
- `WayPointNode` — WP 노드 (상태 색상, 라벨, 요약)
- `MapNode` — Map 컨테이너 노드
- `RefWayPointNode` — 외부 참조 WP 노드 (점선 테두리)

그래프 빌드:
- `buildGraph(items, onNodeSelect)` — 노드/엣지 생성 (체인 + 참조 팬아웃 배치)

레이아웃:
- 상단: ReactFlow 흐름도 (좌→우 수평 배치)
- 하단: 리사이즈 가능한 WayPointEditor 상세 패널

주요 의존관계:
- @xyflow/react — ReactFlow, Handle, Position, MarkerType
- react-resizable-panels — Group, Panel, Separator
- api/client — fetchMapView
- features/waypoint-editor/WayPointEditor — 하단 상세 패널

### 3. COMMENT
- FlowChart는 memo로 감싸서 불필요한 리렌더링 방지
- 참조 노드는 부모 WP 아래에 부채살 패턴으로 배치
</CODEBRIEF>
