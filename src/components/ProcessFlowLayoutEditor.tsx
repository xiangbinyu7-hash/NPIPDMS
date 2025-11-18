import { useState, useRef, useEffect } from 'react';
import { Plus, Save, RotateCcw, Edit2, Trash2 } from 'lucide-react';

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
    if (editingNodeId) return;

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

  const startEditing = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    setEditingNodeId(nodeId);
    setEditLabel(node.label);
    setEditSubtitle(node.subtitle || '');
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
      subtitle: '点击编辑',
      x: 400,
      y: 100,
      width: 160,
      height: 80
    };

    setNodes([...nodes, newNode]);
    setSelectedNodeId(newId);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(nodes, connections);
    }
    alert('流程图已保存');
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

    return (
      <div
        key={node.id}
        className={`absolute cursor-move ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
        style={{
          left: node.x,
          top: node.y,
          width: node.width,
          height: node.height
        }}
        onMouseDown={(e) => handleMouseDown(e, node.id)}
      >
        <div
          className={`w-full h-full flex flex-col items-center justify-center border-2 shadow-lg transition-all ${
            isTerminal
              ? 'rounded-full bg-white border-gray-400'
              : 'rounded-lg bg-blue-50 border-blue-400'
          } ${isSelected ? 'shadow-xl scale-105' : ''}`}
        >
          {isEditing ? (
            <div className="p-2 space-y-1 w-full" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <textarea
                value={editSubtitle}
                onChange={(e) => setEditSubtitle(e.target.value)}
                className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
              <div className="flex gap-1">
                <button
                  onClick={saveEdit}
                  className="flex-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  保存
                </button>
                <button
                  onClick={() => setEditingNodeId(null)}
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

        {isSelected && !isEditing && (
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 flex gap-1 bg-white rounded shadow-lg p-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                startEditing(node.id);
              }}
              className="p-1 hover:bg-blue-50 rounded"
              title="编辑"
            >
              <Edit2 className="w-4 h-4 text-blue-600" />
            </button>
            {!isTerminal && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNode(node.id);
                }}
                className="p-1 hover:bg-red-50 rounded"
                title="删除"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
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
        <h4 className="font-semibold text-gray-800">工艺流程图 Layout</h4>
        <div className="flex gap-2">
          <button
            onClick={addProcessNode}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Plus className="w-4 h-4" />
            添加工位
          </button>
          <button
            onClick={generateFlowChart}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RotateCcw className="w-4 h-4" />
            重新生成
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Save className="w-4 h-4" />
            保存布局
          </button>
        </div>
      </div>

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
        onClick={() => setSelectedNodeId(null)}
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
          {connections.map((conn, index) => {
            const fromNode = nodes.find(n => n.id === conn.from);
            const toNode = nodes.find(n => n.id === conn.to);
            if (!fromNode || !toNode) return null;

            return (
              <g key={index}>
                <path
                  d={getConnectionPath(fromNode, toNode)}
                  stroke="#3b82f6"
                  strokeWidth="2"
                  fill="none"
                  markerEnd="url(#arrowhead)"
                />
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
          <li>• 拖拽节点可以调整位置</li>
          <li>• 点击节点后可以使用顶部工具栏编辑或删除</li>
          <li>• 点击"重新生成"可以根据最新的工位数据重新生成流程图</li>
          <li>• 点击"保存布局"保存当前的流程图设计</li>
        </ul>
      </div>
    </div>
  );
}
