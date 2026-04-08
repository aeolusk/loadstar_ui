<CODEBRIEF>
## [ADDRESS] loadstar_ui.v1.frontend.layout.ElementTree
## [SYNCED_AT] 2026-04-07

### 1. FILE
- PATH: frontend/src/components/layout/ElementTree.tsx
- LANGUAGE: TypeScript (React)

### 2. STRUCTURE
요소 트리 탐색기 — MAP/WAYPOINT 계층을 트리로 표시, BLACKBOX 노드는 숨김 처리

Props:
- `ElementTree({ projectRoot, onOpenTab })` — 메인 컴포넌트

재귀 렌더링:
- `TreeNodeItem({ node, depth, onOpenTab })` — 트리 노드 (펼침/접힘 + 더블클릭 탭 열기)
- `typeToTabType(ElementType)` — MAP→map, WAYPOINT→waypoint, BLACKBOX→blackbox
- `typeIcon(ElementType)` — 타입별 아이콘/CSS 클래스

주요 의존관계:
- api/client — fetchTree
- types/loadstar — TreeNode, ElementType

### 3. COMMENT
- BLACKBOX 타입 자식 노드는 filter로 숨김 처리
- depth=0 노드는 기본 펼침
</CODEBRIEF>
