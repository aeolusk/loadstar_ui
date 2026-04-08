import { useState, useEffect } from 'react';
import type { Tab } from '../../App';
import type { TreeNode, ElementType } from '../../types/loadstar';
import { fetchTree, createSubMap, deleteMap } from '../../api/client';

interface ElementTreeProps {
  projectRoot: string;
  onOpenTab: (tab: Tab) => void;
  treeVersion?: number;
}

const typeToTabType = (type: ElementType): Tab['type'] => {
  switch (type) {
    case 'MAP': return 'map';
    case 'WAYPOINT': return 'waypoint';
  }
};

const typeIcon = (type: ElementType): { icon: string; cls: string } => {
  switch (type) {
    case 'MAP': return { icon: '📁', cls: 'map' };
    case 'WAYPOINT': return { icon: '◆', cls: 'waypoint' };
  }
};

const TreeNodeItem = ({
  node,
  depth,
  selectedAddress,
  onOpenTab,
  onSelectNode,
}: {
  node: TreeNode;
  depth: number;
  selectedAddress: string | null;
  onOpenTab: (tab: Tab) => void;
  onSelectNode: (address: string) => void;
}) => {
  const [expanded, setExpanded] = useState(depth === 0);
  const hasChildren = node.children.length > 0;
  const isSelected = node.address === selectedAddress;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const handleClick = () => {
    onSelectNode(node.address);
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
        style={{
          paddingLeft: depth * 16 + 8,
          background: isSelected ? 'rgba(58, 124, 165, 0.12)' : undefined,
          borderLeft: isSelected ? '2px solid #3a7ca5' : '2px solid transparent',
        }}
        onClick={handleClick}
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
          <span className="tree-node-name" style={{ fontWeight: isSelected ? 600 : undefined }}>{id}</span>
        </span>
      </div>
      {expanded && node.children.map(child => (
        <TreeNodeItem
          key={child.address}
          node={child}
          depth={depth + 1}
          selectedAddress={selectedAddress}
          onOpenTab={onOpenTab}
          onSelectNode={onSelectNode}
        />
      ))}
    </div>
  );
};

const ElementTree = ({ projectRoot, onOpenTab, treeVersion }: ElementTreeProps) => {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [showCreateMap, setShowCreateMap] = useState(false);
  const [newMapId, setNewMapId] = useState('');
  const [newMapSummary, setNewMapSummary] = useState('');
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const reloadTree = () => {
    if (!projectRoot) return;
    fetchTree(projectRoot)
      .then(setTree)
      .catch((err) => console.error('Failed to reload tree:', err));
  };

  useEffect(() => {
    if (!projectRoot) { setTree([]); return; }
    setLoading(true);
    fetchTree(projectRoot)
      .then(setTree)
      .catch((err) => console.error('Failed to load tree:', err))
      .finally(() => setLoading(false));
  }, [projectRoot, treeVersion]);

  // Find selected node type
  const findNode = (nodes: TreeNode[], addr: string): TreeNode | null => {
    for (const n of nodes) {
      if (n.address === addr) return n;
      const found = findNode(n.children, addr);
      if (found) return found;
    }
    return null;
  };
  const selectedNode = selectedAddress ? findNode(tree, selectedAddress) : null;
  const selectedIsMap = selectedNode?.type === 'MAP';

  // Parent Map for new Map: selected Map, or M://root
  const parentMapForCreate = selectedIsMap ? selectedAddress! : 'M://root';

  const handleCreateMap = async () => {
    if (!newMapId.trim() || !projectRoot) return;
    setCreating(true);
    try {
      await createSubMap(projectRoot, parentMapForCreate, newMapId.trim(), newMapSummary.trim() || undefined);
      setShowCreateMap(false);
      setNewMapId('');
      setNewMapSummary('');
      reloadTree();
      showToastMsg(`Map 생성 완료 (${parentMapForCreate}/${newMapId.trim()}). AI에게 내용 작성을 요청하세요.`);
    } catch (e) {
      showToastMsg('생성 실패: ' + (e instanceof Error ? e.message : 'Unknown error'));
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteMap = async () => {
    if (!selectedAddress || !selectedIsMap || !projectRoot) return;
    if (selectedAddress === 'M://root') {
      showToastMsg('루트 Map은 삭제할 수 없습니다.');
      return;
    }
    if (!confirm(`"${selectedAddress}"를 삭제하시겠습니까?`)) return;
    try {
      const result = await deleteMap(projectRoot, selectedAddress);
      if (result.success) {
        setSelectedAddress(null);
        reloadTree();
        showToastMsg(`Map "${selectedAddress}" 삭제 완료.`);
      } else {
        showToastMsg(result.error || '삭제 실패');
      }
    } catch (e: unknown) {
      // axios wraps the response — extract error message
      const axiosErr = e as { response?: { data?: { error?: string } } };
      const msg = axiosErr?.response?.data?.error || (e instanceof Error ? e.message : '삭제 실패');
      showToastMsg(msg);
    }
  };

  const btnStyle: React.CSSProperties = {
    border: 'none', background: 'none', cursor: 'pointer', fontSize: 13,
    color: 'var(--text-secondary)', padding: '0 3px', lineHeight: 1,
  };

  return (
    <div className="element-tree" style={{ position: 'relative' }}>
      {toast && (
        <div style={{
          position: 'absolute', top: 32, left: 8, right: 8, zIndex: 50,
          background: '#2c2417', color: '#fff', padding: '6px 12px', borderRadius: 4,
          fontSize: 11, textAlign: 'center',
        }}>
          {toast}
        </div>
      )}
      <div className="element-tree-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>Explorer</span>
        <div style={{ display: 'flex', gap: 2 }}>
          <button onClick={() => { setShowCreateMap(!showCreateMap); }} style={btnStyle} title="새 Map 생성">
            +
          </button>
          <button
            onClick={handleDeleteMap}
            style={{ ...btnStyle, color: selectedIsMap && selectedAddress !== 'M://root' ? '#b54a3f' : 'var(--text-muted)' }}
            disabled={!selectedIsMap || selectedAddress === 'M://root'}
            title="선택된 Map 삭제"
          >
            −
          </button>
        </div>
      </div>
      {showCreateMap && (
        <div style={{
          padding: '8px 10px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-secondary)',
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            부모: {parentMapForCreate}
          </div>
          <input
            value={newMapId} onChange={e => setNewMapId(e.target.value)}
            placeholder="Map ID"
            onKeyDown={e => e.key === 'Enter' && handleCreateMap()}
            style={{ fontSize: 11, padding: '3px 6px', border: '1px solid var(--border-light)', borderRadius: 3 }}
            autoFocus
          />
          <input
            value={newMapSummary} onChange={e => setNewMapSummary(e.target.value)}
            placeholder="Summary (선택)"
            onKeyDown={e => e.key === 'Enter' && handleCreateMap()}
            style={{ fontSize: 11, padding: '3px 6px', border: '1px solid var(--border-light)', borderRadius: 3 }}
          />
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={handleCreateMap} disabled={creating || !newMapId.trim()}
              style={{ fontSize: 10, padding: '2px 8px', border: '1px solid var(--border-light)', borderRadius: 3, background: '#fff', cursor: 'pointer' }}
            >생성</button>
            <button
              onClick={() => setShowCreateMap(false)}
              style={{ fontSize: 10, padding: '2px 8px', border: '1px solid var(--border-light)', borderRadius: 3, background: '#fff', cursor: 'pointer' }}
            >취소</button>
          </div>
        </div>
      )}
      {loading ? (
        <div style={{ padding: 12, color: 'var(--text-muted)', fontSize: 12 }}>Loading...</div>
      ) : (
        tree.map(node => (
          <TreeNodeItem
            key={node.address}
            node={node}
            depth={0}
            selectedAddress={selectedAddress}
            onOpenTab={onOpenTab}
            onSelectNode={setSelectedAddress}
          />
        ))
      )}
    </div>
  );
};

export default ElementTree;
