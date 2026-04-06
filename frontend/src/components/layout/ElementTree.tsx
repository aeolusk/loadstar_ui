import { useState, useEffect } from 'react';
import type { Tab } from '../../App';
import type { TreeNode, ElementType } from '../../types/loadstar';
import { fetchTree } from '../../api/client';

interface ElementTreeProps {
  onOpenTab: (tab: Tab) => void;
}

const typeToTabType = (type: ElementType): Tab['type'] => {
  switch (type) {
    case 'MAP': return 'map';
    case 'WAYPOINT': return 'waypoint';
    case 'BLACKBOX': return 'blackbox';
  }
};

const typeIcon = (type: ElementType): { icon: string; cls: string } => {
  switch (type) {
    case 'MAP': return { icon: '📁', cls: 'map' };
    case 'WAYPOINT': return { icon: '◆', cls: 'waypoint' };
    case 'BLACKBOX': return { icon: '📦', cls: 'blackbox' };
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
  const hasChildren = node.children.length > 0;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const handleDoubleClick = () => {
    onOpenTab({
      id: node.address,
      title: node.address,
      type: typeToTabType(node.type),
      address: node.address,
    });
  };

  const id = node.address.split('/').pop() || node.address;

  return (
    <div>
      <div
        className="tree-node"
        style={{ paddingLeft: depth * 16 + 8 }}
        onDoubleClick={handleDoubleClick}
      >
        <span className="tree-node-label">
          {hasChildren ? (
            <span className="tree-toggle-btn" onClick={handleToggle}>
              {expanded ? '−' : '+'}
            </span>
          ) : (
            <span className="tree-toggle-spacer" />
          )}
          <span className={`tree-node-icon ${typeIcon(node.type).cls}`}>
            {typeIcon(node.type).icon}
          </span>
          <span className={`status-dot ${node.status}`} />
          <span className="tree-node-name">{id}</span>
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
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTree()
      .then(setTree)
      .catch((err) => console.error('Failed to load tree:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="element-tree">
      <div className="element-tree-header">Explorer</div>
      {loading ? (
        <div style={{ padding: 12, color: 'var(--text-muted)', fontSize: 12 }}>Loading...</div>
      ) : (
        tree.map(node => (
          <TreeNodeItem
            key={node.address}
            node={node}
            depth={0}
            onOpenTab={onOpenTab}
          />
        ))
      )}
    </div>
  );
};

export default ElementTree;
