import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Zap, Edit2, Check } from 'lucide-react';

interface ProcessSequence {
  id: string;
  process_name: string;
  sequence_level: number;
  work_hours: number;
  order_index: number;
  description: string;
}

interface WorkStation {
  id: number;
  processes: ProcessSequence[];
  totalHours: number;
}

interface ProcessFlowChartAreaProps {
  configurationId: string;
}

export default function ProcessFlowChartArea({ configurationId }: ProcessFlowChartAreaProps) {
  const [sequences, setSequences] = useState<ProcessSequence[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLevelId, setEditingLevelId] = useState<string | null>(null);
  const [tempLevel, setTempLevel] = useState('');
  const [editingWorkTimeId, setEditingWorkTimeId] = useState<string | null>(null);
  const [tempWorkTime, setTempWorkTime] = useState('');
  const [newProcess, setNewProcess] = useState({
    name: '',
    level: 1,
    seconds: 0,
    description: ''
  });
  const [workStations, setWorkStations] = useState<WorkStation[]>([]);
  const [flowChartData, setFlowChartData] = useState<{
    totalWorkers: number;
    taktTime: number;
    flowChartData?: {
      totalSeconds: number;
      totalHours: number;
      balanceRate: number;
      maxStationSeconds: number;
    };
  } | null>(null);

  useEffect(() => {
    loadSequences();
    loadFlowChart();
  }, [configurationId]);

  const loadSequences = async () => {
    const { data } = await supabase
      .from('process_sequences')
      .select('*')
      .eq('configuration_id', configurationId)
      .order('sequence_level')
      .order('order_index');

    if (data) {
      setSequences(data);
    }
  };

  const loadFlowChart = async () => {
    const { data } = await supabase
      .from('process_flow_charts')
      .select('*')
      .eq('configuration_id', configurationId)
      .maybeSingle();

    if (data) {
      const totalSeconds = data.flow_chart_data?.totalSeconds || 0;
      const totalHours = data.flow_chart_data?.totalHours || (totalSeconds / 3600);
      const maxStationSeconds = data.flow_chart_data?.maxStationSeconds || 0;

      setFlowChartData({
        totalWorkers: data.total_workers,
        taktTime: data.takt_time,
        flowChartData: {
          totalSeconds,
          totalHours,
          balanceRate: data.flow_chart_data?.balanceRate || 0,
          maxStationSeconds
        }
      });

      if (data.flow_chart_data?.workStations) {
        setWorkStations(data.flow_chart_data.workStations);
      }
    }
  };

  const addProcess = async () => {
    if (!newProcess.name.trim()) {
      alert('请输入工序名称');
      return;
    }

    setLoading(true);
    try {
      const maxOrderIndex = sequences
        .filter(s => s.sequence_level === newProcess.level)
        .reduce((max, s) => Math.max(max, s.order_index), -1);

      await supabase
        .from('process_sequences')
        .insert([{
          configuration_id: configurationId,
          process_name: newProcess.name,
          sequence_level: newProcess.level,
          work_hours: newProcess.seconds / 3600,
          order_index: maxOrderIndex + 1,
          description: newProcess.description
        }]);

      setNewProcess({ name: '', level: 1, seconds: 0, description: '' });
      setShowAddForm(false);
      loadSequences();
    } catch (error) {
      alert('添加工序失败');
    } finally {
      setLoading(false);
    }
  };

  const deleteProcess = async (id: string) => {
    if (!confirm('确定要删除此工序吗？')) return;

    await supabase
      .from('process_sequences')
      .delete()
      .eq('id', id);

    loadSequences();
  };

  const startEditLevel = (seq: ProcessSequence) => {
    setEditingLevelId(seq.id);
    setTempLevel(seq.sequence_level.toString());
  };

  const handleLevelChange = async (id: string) => {
    const newLevel = parseFloat(tempLevel);
    if (isNaN(newLevel) || newLevel <= 0) {
      alert('请输入有效的等级数字');
      setEditingLevelId(null);
      return;
    }

    setLoading(true);
    try {
      const process = sequences.find(s => s.id === id);
      if (!process) return;

      if (newLevel % 1 !== 0) {
        const beforeLevel = Math.floor(newLevel);
        const afterLevel = Math.ceil(newLevel);

        const processesToUpdate = sequences
          .filter(s => s.id !== id && s.sequence_level >= afterLevel)
          .sort((a, b) => a.sequence_level - b.sequence_level);

        for (const p of processesToUpdate) {
          await supabase
            .from('process_sequences')
            .update({ sequence_level: p.sequence_level + 1 })
            .eq('id', p.id);
        }

        await supabase
          .from('process_sequences')
          .update({ sequence_level: afterLevel, order_index: 0 })
          .eq('id', id);
      } else {
        await supabase
          .from('process_sequences')
          .update({ sequence_level: Math.floor(newLevel) })
          .eq('id', id);
      }

      setEditingLevelId(null);
      loadSequences();
    } catch (error) {
      alert('更新等级失败');
    } finally {
      setLoading(false);
    }
  };

  const startEditWorkTime = (seq: ProcessSequence) => {
    setEditingWorkTimeId(seq.id);
    setTempWorkTime((seq.work_hours * 3600).toString());
  };

  const handleWorkTimeChange = async (id: string) => {
    const newSeconds = parseFloat(tempWorkTime);
    if (isNaN(newSeconds) || newSeconds < 0) {
      alert('请输入有效的工时（秒）');
      setEditingWorkTimeId(null);
      return;
    }

    setLoading(true);
    try {
      await supabase
        .from('process_sequences')
        .update({ work_hours: newSeconds / 3600 })
        .eq('id', id);

      setEditingWorkTimeId(null);
      loadSequences();
    } catch (error) {
      alert('更新工时失败');
    } finally {
      setLoading(false);
    }
  };

  const generateFlowChart = async () => {
    if (sequences.length === 0) {
      alert('请先添加工序');
      return;
    }

    setLoading(true);
    try {
      const totalSeconds = sequences.reduce((sum, s) => sum + s.work_hours * 3600, 0);
      const totalHours = totalSeconds / 3600;

      const sortedSequences = [...sequences].sort((a, b) => {
        if (a.sequence_level !== b.sequence_level) {
          return a.sequence_level - b.sequence_level;
        }
        return a.order_index - b.order_index;
      });

      // 计算建议总人数和瓶颈工序
      const maxProcess = sequences.reduce((max, seq) =>
        seq.work_hours > max.work_hours ? seq : max
      , sequences[0]);
      const bottleneckSeconds = maxProcess.work_hours * 3600;

      // 暂时假设每个工序建议1人，后续可以从数据库读取
      const suggestedStationCount = sequences.length;

      // 确保至少有1个工位
      const initialStationCount = Math.max(1, suggestedStationCount);

      // 贪心算法：按建议人数分配工位，最小化方差
      // 策略：瓶颈工序单独，其他工序优先填充到最空闲的工位
      const stations: WorkStation[] = [];

      // 初始化工位数组（按建议人数）
      for (let i = 0; i < initialStationCount; i++) {
        stations.push({
          id: i + 1,
          processes: [],
          totalHours: 0
        });
      }

      // 第一遍：按顺序分配工序到工位
      let currentStationIdx = 0;
      for (let i = 0; i < sortedSequences.length; i++) {
        const seq = sortedSequences[i];
        const seqSeconds = seq.work_hours * 3600;

        // 瓶颈工序：找一个空工位单独放置
        if (seq.id === maxProcess.id) {
          // 找到第一个空工位
          let emptyStationIdx = stations.findIndex(s => s.processes.length === 0);
          if (emptyStationIdx === -1) {
            // 没有空工位，创建新工位
            stations.push({
              id: stations.length + 1,
              processes: [seq],
              totalHours: seq.work_hours
            });
          } else {
            stations[emptyStationIdx].processes.push(seq);
            stations[emptyStationIdx].totalHours += seq.work_hours;
          }
          continue;
        }

        // 非瓶颈工序：尝试添加到当前工位，如果超出则找下一个工位
        let placed = false;
        const startIdx = currentStationIdx;

        // 先尝试当前工位及后续工位
        for (let attempts = 0; attempts < stations.length && !placed; attempts++) {
          const stationSeconds = stations[currentStationIdx].totalHours * 3600;

          // 检查是否可以放入当前工位（不超过瓶颈工时）
          if (stationSeconds + seqSeconds <= bottleneckSeconds) {
            stations[currentStationIdx].processes.push(seq);
            stations[currentStationIdx].totalHours += seq.work_hours;
            placed = true;
            // 继续使用当前工位（尽量填满）
          } else {
            // 当前工位放不下，尝试下一个
            currentStationIdx = (currentStationIdx + 1) % stations.length;
          }
        }

        // 如果所有工位都放不下，创建新工位
        if (!placed) {
          stations.push({
            id: stations.length + 1,
            processes: [seq],
            totalHours: seq.work_hours
          });
          // 如果工序超过瓶颈，这是正常的（它会成为新的瓶颈）
        }
      }

      // 优化：移除空工位
      const finalStations = stations.filter(s => s.processes.length > 0);

      if (finalStations.length === 0) {
        throw new Error('无法生成工位分配方案');
      }

      // 按工位内最小工序等级排序，确保顺序正确
      finalStations.sort((a, b) => {
        const minLevelA = Math.min(...a.processes.map(p => p.sequence_level));
        const minLevelB = Math.min(...b.processes.map(p => p.sequence_level));
        if (minLevelA !== minLevelB) return minLevelA - minLevelB;

        const minOrderA = Math.min(...a.processes.map(p => p.order_index));
        const minOrderB = Math.min(...b.processes.map(p => p.order_index));
        return minOrderA - minOrderB;
      });

      // 重新分配工位ID
      finalStations.forEach((station, index) => {
        station.id = index + 1;
      });

      const maxStationSeconds = Math.max(...finalStations.map(s => s.totalHours * 3600));
      const actualTaktTime = maxStationSeconds;
      const balanceRate = (totalSeconds / (finalStations.length * maxStationSeconds)) * 100;

      const { data: existing } = await supabase
        .from('process_flow_charts')
        .select('id')
        .eq('configuration_id', configurationId)
        .maybeSingle();

      const flowData = {
        total_workers: finalStations.length,
        takt_time: actualTaktTime,
        flow_chart_data: {
          sequences: sortedSequences,
          totalSeconds,
          totalHours,
          workStations: finalStations,
          balanceRate,
          maxStationSeconds
        },
        updated_at: new Date().toISOString()
      };

      if (existing) {
        await supabase
          .from('process_flow_charts')
          .update(flowData)
          .eq('id', existing.id);
      } else {
        await supabase
          .from('process_flow_charts')
          .insert([{
            configuration_id: configurationId,
            ...flowData
          }]);
      }

      setWorkStations(finalStations);
      setFlowChartData({
        totalWorkers: finalStations.length,
        taktTime: actualTaktTime,
        flowChartData: {
          totalSeconds,
          totalHours,
          balanceRate,
          maxStationSeconds
        }
      });
      alert('工艺流程图生成成功！');
    } catch (error) {
      console.error('生成流程图失败:', error);
      const errorMessage = error instanceof Error ? error.message : '生成失败，请检查数据';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const sortedSequences = [...sequences].sort((a, b) => {
    if (a.sequence_level !== b.sequence_level) {
      return a.sequence_level - b.sequence_level;
    }
    return a.order_index - b.order_index;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-800">工艺流程图</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            添加工序
          </button>
          <button
            onClick={generateFlowChart}
            disabled={loading || sequences.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
          >
            <Zap size={18} />
            {loading ? '生成中...' : '智能生成流程图'}
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
          <h4 className="font-medium text-gray-700">添加新工序</h4>
          <div className="grid grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="工序名称"
              value={newProcess.name}
              onChange={(e) => setNewProcess({ ...newProcess, name: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="等级"
              min="1"
              value={newProcess.level}
              onChange={(e) => setNewProcess({ ...newProcess, level: parseInt(e.target.value) || 1 })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="工时（秒）"
              min="0"
              step="1"
              value={newProcess.seconds}
              onChange={(e) => setNewProcess({ ...newProcess, seconds: parseFloat(e.target.value) || 0 })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="描述"
              value={newProcess.description}
              onChange={(e) => setNewProcess({ ...newProcess, description: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={addProcess}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              确认添加
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              取消
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-700">工艺序列表</h4>
        {sortedSequences.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">暂无工序，请添加工序</p>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-100 px-4 py-3 grid grid-cols-12 gap-4 border-b border-gray-200">
              <div className="col-span-1 text-sm font-semibold text-gray-700">等级</div>
              <div className="col-span-11 text-sm font-semibold text-gray-700">工序</div>
            </div>

            <div className="divide-y divide-gray-200">
              {(() => {
                const groupedSequences = sequences.reduce((acc, seq) => {
                  if (!acc[seq.sequence_level]) {
                    acc[seq.sequence_level] = [];
                  }
                  acc[seq.sequence_level].push(seq);
                  return acc;
                }, {} as Record<number, ProcessSequence[]>);

                const levels = Object.keys(groupedSequences).map(Number).sort((a, b) => a - b);

                return levels.map(level => (
                  <div key={level} className="grid grid-cols-12 gap-4 px-4 py-4 hover:bg-gray-50 transition-colors min-h-[120px]">
                    <div className="col-span-1 flex items-start justify-center pt-2">
                      <span className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 text-white font-bold rounded-lg text-lg shadow-md">
                        {level}
                      </span>
                    </div>

                    <div className="col-span-11 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 auto-rows-max">
                      {groupedSequences[level]
                        .sort((a, b) => a.order_index - b.order_index)
                        .map((seq) => (
                          <div
                            key={seq.id}
                            className="bg-white border-2 border-blue-200 rounded-lg p-4 hover:shadow-md hover:border-blue-400 transition-all relative group"
                          >
                            <button
                              onClick={() => deleteProcess(seq.id)}
                              className="absolute top-2 right-2 p-1 text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              title="删除"
                            >
                              <Trash2 size={14} />
                            </button>

                            <div className="mb-2">
                              {editingLevelId === seq.id ? (
                                <div className="flex items-center gap-1 mb-2">
                                  <span className="text-xs text-gray-500">等级:</span>
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={tempLevel}
                                    onChange={(e) => setTempLevel(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleLevelChange(seq.id);
                                      }
                                    }}
                                    className="w-16 px-2 py-1 border border-blue-500 rounded text-xs"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleLevelChange(seq.id)}
                                    className="p-0.5 text-green-600 hover:bg-green-50 rounded"
                                  >
                                    <Check size={14} />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => startEditLevel(seq)}
                                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-2"
                                >
                                  等级 {seq.sequence_level}
                                  <Edit2 size={12} />
                                </button>
                              )}

                              <h5 className="font-semibold text-gray-800 text-base leading-tight mb-2">
                                {seq.process_name}
                              </h5>
                            </div>

                            <div className="space-y-1">
                              {seq.description && (
                                <p className="text-xs text-gray-600">
                                  描述: {seq.description}
                                </p>
                              )}
                              {editingWorkTimeId === seq.id ? (
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-gray-500">工时:</span>
                                  <input
                                    type="number"
                                    step="1"
                                    value={tempWorkTime}
                                    onChange={(e) => setTempWorkTime(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleWorkTimeChange(seq.id);
                                      }
                                    }}
                                    className="w-20 px-2 py-1 border border-blue-500 rounded text-xs"
                                    autoFocus
                                  />
                                  <span className="text-xs text-gray-500">秒</span>
                                  <button
                                    onClick={() => handleWorkTimeChange(seq.id)}
                                    className="p-0.5 text-green-600 hover:bg-green-50 rounded"
                                  >
                                    <Check size={14} />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => startEditWorkTime(seq)}
                                  className="text-xs font-medium text-blue-700 hover:text-blue-900 flex items-center gap-1"
                                >
                                  工时: {(seq.work_hours * 3600).toFixed(0)}秒
                                  <Edit2 size={12} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}
        <p className="text-sm text-gray-600">
          提示：点击工序卡片中的"等级"或"工时"可编辑。等级输入小数（如2.5）可将工序插入到对应等级之间。按回车键或点击✓确认
        </p>
      </div>

      {flowChartData && workStations.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-gray-800">工艺展开流程图（智能优化结果）</h4>
            <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg">
              ✨ 已自动优化至最佳平衡率
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 shadow">
              <p className="text-sm text-gray-600 mb-1">最优工位数（已优化）</p>
              <p className="text-3xl font-bold text-blue-600">{flowChartData.totalWorkers} 人</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow">
              <p className="text-sm text-gray-600 mb-1">节拍时间</p>
              <p className="text-3xl font-bold text-green-600">{flowChartData.taktTime.toFixed(2)} 秒</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow">
              <p className="text-sm text-gray-600 mb-1">生产线平衡率</p>
              <p className="text-3xl font-bold text-purple-600">
                {((flowChartData.flowChartData?.balanceRate || 0)).toFixed(1)}%
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow">
              <p className="text-sm text-gray-600 mb-1">总工时</p>
              <p className="text-3xl font-bold text-orange-600">
                {(flowChartData.flowChartData?.totalSeconds || 0).toFixed(0)}秒
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-5 shadow border-l-4 border-blue-500">
            <h5 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-blue-600">📊</span> 生产线平衡计算逻辑与依据
            </h5>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="bg-blue-50 p-3 rounded">
                <p className="font-semibold text-blue-800 mb-1">1. 平衡率计算公式：</p>
                <p className="font-mono bg-white px-3 py-2 rounded border border-blue-200">
                  平衡率 = (总工时 ÷ (工位数 × 最大工位工时)) × 100%
                </p>
                <p className="mt-2 text-gray-600 space-y-1">
                  <span className="block">• 总工时 = 所有工序工时之和 = {((flowChartData.flowChartData?.totalSeconds || 0)).toFixed(0)}秒</span>
                  <span className="block">• 工位数 = {flowChartData.totalWorkers}个</span>
                  <span className="block">• 最大工位工时 = 所有工位中工时最多的那个 = {((flowChartData.flowChartData?.maxStationSeconds || 0)).toFixed(0)}秒</span>
                  <span className="block mt-2">• 平衡率 = ({((flowChartData.flowChartData?.totalSeconds || 0)).toFixed(0)}秒 ÷ ({flowChartData.totalWorkers} × {((flowChartData.flowChartData?.maxStationSeconds || 0)).toFixed(0)}秒)) × 100%
                  = <span className="font-bold text-blue-700">{((flowChartData.flowChartData?.balanceRate || 0)).toFixed(1)}%</span></span>
                </p>
              </div>

              <div className="bg-green-50 p-3 rounded">
                <p className="font-semibold text-green-800 mb-1">2. 实际节拍时间：</p>
                <p className="font-mono bg-white px-3 py-2 rounded border border-green-200">
                  实际节拍时间 = 最大工位工时（生产瓶颈）
                </p>
                <p className="mt-2 text-gray-600">
                  生产线的实际节拍受最慢工位（瓶颈工位）限制。当前实际节拍 =
                  <span className="font-bold text-green-700"> {flowChartData.taktTime.toFixed(0)}秒/件</span>
                </p>
              </div>

              <div className="bg-amber-50 p-3 rounded">
                <p className="font-semibold text-amber-800 mb-1">3. 智能优化策略（核心算法）：</p>
                <ul className="list-disc list-inside space-y-1 text-gray-600 ml-2">
                  <li className="font-semibold text-amber-900">优化目标：自动调整工位数，使平衡率接近100%</li>
                  <li>遍历所有可能的工位数量（1 ~ 工序总数）</li>
                  <li>对每种工位数，计算目标平均工时 = 总工时 ÷ 工位数</li>
                  <li>按工序等级顺序分配，尽量使每个工位接近目标工时</li>
                  <li>计算每种方案的平衡率，自动选择平衡率最高的方案</li>
                  <li>当平衡率达到98%以上时提前终止（已达最优）</li>
                  <li className="font-semibold text-amber-900">结果：推荐的工位数能让生产线达到最佳平衡</li>
                </ul>
              </div>

              <div className="bg-purple-50 p-3 rounded">
                <p className="font-semibold text-purple-800 mb-1">4. 优化目标与评价：</p>
                <p className="text-gray-600">
                  追求最高的生产线平衡率（理想值100%），使各工位工时尽可能接近，
                  减少工位间的负荷差异，避免出现明显的瓶颈工位，提高整体生产效率和资源利用率。
                  当前智能推荐方案的平衡率为
                  <span className="font-bold text-purple-700"> {((flowChartData.flowChartData?.balanceRate || 0)).toFixed(1)}%</span>
                  {(flowChartData.flowChartData?.balanceRate || 0) >= 90 ? '，属于优秀水平，各工位负荷非常均衡' :
                   (flowChartData.flowChartData?.balanceRate || 0) >= 80 ? '，属于良好水平，各工位负荷较为均衡' :
                   (flowChartData.flowChartData?.balanceRate || 0) >= 70 ? '，属于中等水平，存在一定改进空间' : '，建议调整工序组合或增减工位数以提高平衡率'}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h5 className="font-semibold text-gray-700 mb-4">
              生产线拉线布局（最优平衡方案 - 平衡率 {((flowChartData.flowChartData?.balanceRate || 0)).toFixed(1)}%）
            </h5>
            <div className="space-y-3">
              {workStations.map((station) => {
                const stationSeconds = station.totalHours * 3600;
                const balancePercentage = ((station.totalHours * 3600) / (flowChartData.flowChartData?.maxStationSeconds || 1)) * 100;
                return (
                  <div key={station.id} className="bg-white rounded-lg border-2 border-blue-300 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-bold text-blue-700">工位 {station.id}</span>
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                          {stationSeconds.toFixed(0)}秒
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          balancePercentage >= 90 ? 'bg-green-100 text-green-700' :
                          balancePercentage >= 80 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          负荷率: {balancePercentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {station.processes.map((process) => (
                        <div
                          key={process.id}
                          className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-3"
                        >
                          <div className="flex items-start justify-between mb-1">
                            <span className="text-xs font-semibold text-blue-800">L{process.sequence_level}</span>
                            <span className="text-xs text-blue-600">{(process.work_hours * 3600).toFixed(0)}s</span>
                          </div>
                          <p className="text-sm font-medium text-gray-800 leading-tight">{process.process_name}</p>
                          {process.description && (
                            <p className="text-xs text-gray-600 mt-1 truncate">{process.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-700 leading-relaxed">
              <span className="font-semibold text-blue-800">💡 说明：</span>
              系统基于IE工业工程理论，采用启发式算法智能生成生产线布局方案。
              算法会尝试多种工位数配置，并为每种配置计算平衡率，最终选择平衡率最高的方案。
              工位负荷率显示各工位相对于瓶颈工位的负荷比例，越接近100%表示该工位利用率越高。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
