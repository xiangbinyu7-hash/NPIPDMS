import { useState, useRef, useEffect } from 'react';
import { Plus, Save, RotateCcw, Trash2, Link2 } from 'lucide-react';

interface FlowNode {
  id: string;
  type: 'start' | 'process' | 'end';
  label: string;
  subtitle?: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FlowConnection {
  from: string;
  to: string;
}

interface ProcessFlowLayoutEditorProps {
  workStations: Array<{
    id: number;
    processes: Array<{
      process_name: string;
      work_seconds: number;
    }>;
    totalSeconds: number;
  }>;
  componentId: string;
  onSave?: (nodes: FlowNode[], connections: FlowConnection[]) => void;
}

export default function ProcessFlowLayoutEditor({
  workStations,
  componentId,
  onSave
}: ProcessFlowLayoutEditorProps) {
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [connections, setConnections] = useState<FlowConnection[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectFromId, setConnectFromId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (workStations.length > 0 && nodes.length === 0) {
      generateFlowChart();
    }
  }, [workStations]);

  const generateFlowChart = () => {
    const newNodes: FlowNode[] = [];
    const newConnections: FlowConnection[] = [];

    const startY = 100;
    const spacing = 200;
    const processWidth = 160;
    const processHeight = 80;
    const terminalWidth = 120;
    const terminalHeight = 60;

    newNodes.push({
      id: 'start',
      type: 'start',
      label: '开始',
      x: 50,
      y: startY,
      width: terminalWidth,
      height: terminalHeight
    });

    let currentX = 50 + terminalWidth + spacing;

    workStations.forEach((station, index) => {
      const nodeId = `station-${station.id}`;
      const processNames = station.processes.map(p => p.process_name).join('\n');
      const workTime = `${(station.totalSeconds / 3600).toFixed(2)}h`;

      newNodes.push({
        id: nodeId,
        type: 'process',
        label: `工位${station.id}`,
        subtitle: `${processNames}\n工时: ${workTime}`,
        x: currentX,
        y: startY - 10,
        width: processWidth,
        height: processHeight
      });

      if (index === 0) {
        newConnections.push({ from: 'start', to: nodeId });
      } else {
        newConnections.push({ from: `station-${workStations[index - 1].id}`, to: nodeId });
      }

      currentX += processWidth + spacing;
    });

    const endId = 'end';
    newNodes.push({
      id: endId,
      type: 'end',
      label: '结束',
      x: currentX,
      y: startY,
      width: terminalWidth,
      height: terminalHeight
    });

    if (workStations.length > 0) {
      newConnections.push({
        from: `station-${workStations[workStations.length - 1].id}`,
        to: endId
      });
    }

    setNodes(newNodes);
    setConnections(newConnections);
  };

  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    if (editingNodeId || isConnecting) return;

    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    setDraggingNodeId(nodeId);
    setSelectedNodeId(nodeId);
    setDragOffset({
      x: e.clientX - node.x,
      y: e.clientY - node.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingNodeId) return;

    const newNodes = nodes.map(node => {
      if (node.id === draggingNodeId) {
        return {
          ...node,
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        };
      }
      return node;
    });

    setNodes(newNodes);
  };

  const handleMouseUp = () => {
    setDraggingNodeId(null);
  };

  const handleDoubleClick = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    setEditingNodeId(nodeId);
    setEditLabel(node.label);
    setEditSubtitle(node.subtitle || '');
    setSelectedNodeId(null);
  };

  const saveEdit = () => {
    if (!editingNodeId) return;

    const newNodes = nodes.map(node => {
      if (node.id === editingNodeId) {
        return {
          ...node,
          label: editLabel,
          subtitle: editSubtitle
        };
      }
      return node;
    });

    setNodes(newNodes);
    setEditingNodeId(null);
  };

  const cancelEdit = () => {
    setEditingNodeId(null);
    setEditLabel('');
    setEditSubtitle('');
  };

  const deleteNode = (nodeId: string) => {
    if (nodeId === 'start' || nodeId === 'end') {
      alert('不能删除开始或结束节点');
      return;
    }

    if (!confirm('确定要删除此节点吗？')) return;

    setNodes(nodes.filter(n => n.id !== nodeId));
    setConnections(connections.filter(c => c.from !== nodeId && c.to !== nodeId));
    setSelectedNodeId(null);
  };

  const addProcessNode = () => {
    const newId = `process-${Date.now()}`;
    const newNode: FlowNode = {
      id: newId,
      type: 'process',
      label: '新工位',
      subtitle: '双击编辑',
      x: 400,
      y: 100,
      width: 160,
      height: 80
    };

    setNodes([...nodes, newNode]);
    setSelectedNodeId(newId);
  };

  const startConnecting = () => {
    setIsConnecting(true);
    setConnectFromId(null);
    setSelectedNodeId(null);
  };

  const handleNodeClickInConnectMode = (nodeId: string) => {
    if (!isConnecting) return;

    if (!connectFromId) {
      setConnectFromId(nodeId);
    } else {
      if (connectFromId !== nodeId) {
        const exists = connections.some(
          c => c.from === connectFromId && c.to === nodeId
        );
        if (!exists) {
          setConnections([...connections, { from: connectFromId, to: nodeId }]);
        }
      }
      setConnectFromId(null);
      setIsConnecting(false);
    }
  };

  const deleteConnection = (from: string, to: string) => {
    setConnections(connections.filter(c => !(c.from === from && c.to === to)));
  };

  const handleSave = () => {
    if (onSave) {
      onSave(nodes, connections);
    }
    alert('Layout图已保存');
  };

  const getConnectionPath = (from: FlowNode, to: FlowNode) => {
    const fromX = from.x + from.width;
    const fromY = from.y + from.height / 2;
    const toX = to.x;
    const toY = to.y + to.height / 2;

    const midX = (fromX + toX) / 2;

    return `M ${fromX} ${fromY} L ${midX} ${fromY} L ${midX} ${toY} L ${toX} ${toY}`;
  };

  const renderNode = (node: FlowNode) => {
    const isSelected = selectedNodeId === node.id;
    const isEditing = editingNodeId === node.id;
    const isTerminal = node.type === 'start' || node.type === 'end';
    const isConnectFrom = connectFromId === node.id;

    return (
      <div
        key={node.id}
        className={`absolute ${isConnecting ? 'cursor-crosshair' : 'cursor-move'} ${
          isSelected ? 'ring-2 ring-blue-500' : ''
        } ${isConnectFrom ? 'ring-4 ring-green-500' : ''}`}
        style={{
          left: node.x,
          top: node.y,
          width: node.width,
          height: node.height
        }}
        onMouseDown={(e) => {
          if (!isConnecting) {
            handleMouseDown(e, node.id);
          }
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (isConnecting) {
            handleNodeClickInConnectMode(node.id);
          }
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          if (!isConnecting) {
            handleDoubleClick(node.id);
          }
        }}
      >
        <div
          className={`w-full h-full flex flex-col items-center justify-center border-2 shadow-lg transition-all ${
            isTerminal
              ? 'rounded-full bg-white border-gray-400'
              : 'rounded-lg bg-blue-50 border-blue-400'
          } ${isSelected ? 'shadow-xl scale-105' : ''} ${
            isConnectFrom ? 'border-green-500 bg-green-50' : ''
          }`}
        >
          {isEditing ? (
            <div className="p-2 space-y-1 w-full" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="节点标题"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    saveEdit();
                  } else if (e.key === 'Escape') {
                    cancelEdit();
                  }
                }}
              />
              <textarea
                value={editSubtitle}
                onChange={(e) => setEditSubtitle(e.target.value)}
                className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="节点副标题（可选）"
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    cancelEdit();
                  }
                }}
              />
              <div className="flex gap-1">
                <button
                  onClick={saveEdit}
                  className="flex-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  保存
                </button>
                <button
                  onClick={cancelEdit}
                  className="flex-1 px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="font-semibold text-gray-800 text-center px-2">
                {node.label}
              </div>
              {node.subtitle && (
                <div className="text-xs text-gray-600 text-center px-2 mt-1 whitespace-pre-line">
                  {node.subtitle}
                </div>
              )}
            </>
          )}
        </div>

        {isSelected && !isEditing && !isConnecting && (
          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl p-1 border-2 border-gray-200 flex gap-1 z-50">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDoubleClick(node.id);
              }}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              title="编辑内容"
            >
              编辑
            </button>
            {!isTerminal && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNode(node.id);
                }}
                className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                title="删除节点"
              >
                删除
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-800">Layout图</h4>
        <div className="flex gap-2">
          <button
            onClick={addProcessNode}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
            disabled={isConnecting}
          >
            <Plus className="w-4 h-4" />
            添加工位
          </button>
          <button
            onClick={() => {
              if (isConnecting) {
                setIsConnecting(false);
                setConnectFromId(null);
              } else {
                startConnecting();
              }
            }}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg ${
              isConnecting
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-orange-600 hover:bg-orange-700 text-white'
            }`}
          >
            <Link2 className="w-4 h-4" />
            {isConnecting ? '取消连接' : '连接工位'}
          </button>
          <button
            onClick={generateFlowChart}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            disabled={isConnecting}
          >
            <RotateCcw className="w-4 h-4" />
            重新生成
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            disabled={isConnecting}
          >
            <Save className="w-4 h-4" />
            保存布局
          </button>
        </div>
      </div>

      {isConnecting && (
        <div className="bg-green-50 border-2 border-green-500 rounded-lg p-3">
          <p className="text-sm font-semibold text-green-800">
            连接模式：
            {connectFromId
              ? '请点击目标节点完成连接'
              : '请点击起始节点'}
          </p>
        </div>
      )}

      <div
        ref={canvasRef}
        className="relative bg-white border-2 border-gray-300 rounded-lg overflow-auto"
        style={{
          height: '500px',
          backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={() => {
          if (!isConnecting) {
            setSelectedNodeId(null);
          }
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
          {connections.map((conn, index) => {
            const fromNode = nodes.find(n => n.id === conn.from);
            const toNode = nodes.find(n => n.id === conn.to);
            if (!fromNode || !toNode) return null;

            const path = getConnectionPath(fromNode, toNode);
            const midPoint = {
              x: (fromNode.x + fromNode.width + toNode.x) / 2,
              y: (fromNode.y + fromNode.height / 2 + toNode.y + toNode.height / 2) / 2
            };

            return (
              <g key={index}>
                <path
                  d={path}
                  stroke="#3b82f6"
                  strokeWidth="2"
                  fill="none"
                  markerEnd="url(#arrowhead)"
                  className="hover:stroke-red-500 cursor-pointer"
                  style={{ pointerEvents: 'stroke' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isConnecting && confirm('删除这条连接线？')) {
                      deleteConnection(conn.from, conn.to);
                    }
                  }}
                />
                <circle
                  cx={midPoint.x}
                  cy={midPoint.y}
                  r="8"
                  fill="white"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  className="hover:fill-red-100 cursor-pointer"
                  style={{ pointerEvents: 'all' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isConnecting && confirm('删除这条连接线？')) {
                      deleteConnection(conn.from, conn.to);
                    }
                  }}
                />
                <text
                  x={midPoint.x}
                  y={midPoint.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="10"
                  fill="#3b82f6"
                  className="pointer-events-none"
                >
                  ×
                </text>
              </g>
            );
          })}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="#3b82f6" />
            </marker>
          </defs>
        </svg>

        <div className="relative" style={{ zIndex: 2, minWidth: '2000px', minHeight: '500px' }}>
          {nodes.map(renderNode)}
        </div>
      </div>

      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
        <p className="font-medium mb-1">操作说明：</p>
        <ul className="space-y-1 text-xs">
          <li>• <span className="font-semibold">拖拽节点</span>：按住节点拖动调整位置</li>
          <li>• <span className="font-semibold">编辑内容</span>：单击选中节点 → 点击"编辑"按钮（或双击节点直接编辑）</li>
          <li>• <span className="font-semibold">连接节点</span>：点击"连接工位" → 点击起始节点 → 点击目标节点</li>
          <li>• <span className="font-semibold">删除连接</span>：点击连接线中间的圆点</li>
          <li>• <span className="font-semibold">删除节点</span>：选中节点 → 点击"删除"按钮</li>
          <li>• 按Enter键保存编辑，按Esc键取消编辑</li>
        </ul>
      </div>
    </div>
  );
}
