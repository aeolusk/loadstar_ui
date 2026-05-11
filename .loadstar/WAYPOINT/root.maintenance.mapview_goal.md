<WAYPOINT>
## [ADDRESS] W://root/maintenance/mapview_goal
## [STATUS] S_STB

### IDENTITY
- SUMMARY: MapView 그래프 노드에 GOAL 필드 표시 — WayPoint 카드에서 의도를 한눈에 파악
- METADATA: [Created: 2026-05-11]
- SYNCED_AT: 2026-05-11

### CONNECTIONS
- PARENT: M://root/maintenance
- CHILDREN: []
- REFERENCE: [W://root/frontend/map_view]

### CODE_MAP
- scope:
  - backend/src/main/java/com/loadstar/explorer/
  - frontend/src/features/map-view/
  - frontend/src/api/

### TODO
- [x] 2026-05-11 MapViewResponse.MapViewItem에 goal 필드 추가 (backend)
- [x] 2026-05-11 ElementService.getMapView()에서 WayPoint goal 설정 (backend)
- [x] 2026-05-11 MapViewItem 프론트엔드 인터페이스에 goal 추가 (client.ts)
- [x] 2026-05-11 WayPointNode에 goal prop 전달 및 렌더링 (MapView.tsx)
- [x] 2026-05-11 현재 Map의 GOAL 헤더 표시/인라인 편집 (MapView.tsx)
- [x] 2026-05-11 서브맵 선택 시 하단 패널 MapGoalPanel 표시/편집 (MapView.tsx)
- [x] 2026-05-11 PATCH /api/elements/map 엔드포인트 + ElementWriter.writeMap() GOAL 지원

### ISSUE
(없음)

### COMMENT
- GOAL 필드가 WayPointEditor에 추가됐으나 MapView 카드에는 미반영 — 드리프트 해소
</WAYPOINT>
