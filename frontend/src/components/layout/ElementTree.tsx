import { useState } from 'react';
import type { Tab } from '../../App';
import type { TreeNode, ElementType } from '../../types/loadstar';

interface ElementTreeProps {
  onOpenTab: (tab: Tab) => void;
}

// 임시 샘플 데이터 — 추후 API 연동
const sampleTree: TreeNode[] = [
  {
    address: 'M://root',
    type: 'MAP',
    status: 'S_PRG',
    summary: 'Project Root',
    children: [
      {
        address: 'M://root/backend',
        type: 'MAP',
        status: 'S_IDL',
        summary: 'Backend',
        children: [],
      },
      {
        address: 'M://root/frontend',
        type: 'MAP',
        status: 'S_IDL',
        summary: 'Frontend',
        children: [],
      },
    ],
  },
];

const typeToTabType = (type: ElementType): Tab['type'] => {
  switch (type) {
    case 'MAP': return 'map';
    case 'WAYPOINT': return 'waypoint';
    case 'BLACKBOX': return 'blackbox';
  }
};

const typeIcon = (type: ElementType) => {
  switch (type) {
    case 'MAP': return '📁';
    case 'WAYPOINT': return '◆';
    case 'BLACKBOX': return '📦';
  }
};

const TreeNodeItem = ({
  node,
  depth,
  onOpenTab,
}: {
  node: TreeNode;
  depth: number;
  onOpenTab: (tab: Tab) => void;
}) => {
  const [expanded, setExpanded] = useState(depth === 0);

  const handleDoubleClick = () => {
    onOpenTab({
      id: node.address,
      title: node.address,
      type: typeToTabType(node.type),
      address: node.address,
    });
  };

  const handleClick = () => {
    if (node.children.length > 0) {
      setExpanded(!expanded);
    }
  };

  const id = node.address.split('/').pop() || node.address;

  return (
    <div>
      <div
        className="tree-node"
        style={{ paddingLeft: depth * 16 + 8 }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        <span className="tree-node-label">
          {node.children.length > 0 && (
            <span style={{ fontSize: 10 }}>{expanded ? '▼' : '▶'}</span>
          )}
          <span className="tree-node-icon">{typeIcon(node.type)}</span>
          <span className={`status-dot ${node.status}`} />
          <span>{id}</span>
        </span>
      </div>
      {expanded && node.children.map(child => (
        <TreeNodeItem
          key={child.address}
          node={child}
          depth={depth + 1}
          onOpenTab={onOpenTab}
        />
      ))}
    </div>
  );
};

const ElementTree = ({ onOpenTab }: ElementTreeProps) => {
  return (
    <div className="element-tree">
      <div className="element-tree-header">Explorer</div>
      {sampleTree.map(node => (
        <TreeNodeItem
          key={node.address}
          node={node}
          depth={0}
          onOpenTab={onOpenTab}
        />
      ))}
    </div>
  );
};

export default ElementTree;
