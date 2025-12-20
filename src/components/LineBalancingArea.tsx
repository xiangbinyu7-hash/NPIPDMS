import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Zap, Edit2, Check } from 'lucide-react';
import ProcessFlowLayoutEditor from './ProcessFlowLayoutEditor';

interface ProcessSequence {
  id: string;
  process_name: string;
  sequence_level: number;
  work_seconds: number;
  order_index: number;
  description: string;
}

interface WorkStation {
  id: number;
  processes: ProcessSequence[];
  totalSeconds: number;
}

interface LineBalancingAreaProps {
  configurationId: string;
  componentId: string | null;
}

export default function LineBalancingArea({ configurationId, componentId }: LineBalancingAreaProps) {
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
      balanceRate: number;
      maxStationSeconds: number;
    };
  } | null>(null);
  const [manualStationCount, setManualStationCount] = useState<number | null>(null);
  const [manualTaktTime, setManualTaktTime] = useState<number | null>(null);
  const [isEditingStationCount, setIsEditingStationCount] = useState(false);
  const [isEditingTaktTime, setIsEditingTaktTime] = useState(false);

  useEffect(() => {
    console.log('Component changed, componentId:', componentId);
    if (componentId) {
      console.log('Loading sequences and flow chart for component:', componentId);
      loadSequences();
      loadFlowChart();
    } else {
      console.log('No component selected, clearing data');
      setSequences([]);
      setWorkStations([]);
      setFlowChartData(null);
    }
  }, [configurationId, componentId]);

  const loadSequences = async () => {
    if (!componentId) {
      setSequences([]);
      return;
    }

    console.log('Loading sequences for component:', componentId);
    const { data } = await supabase
      .from('process_sequences')
      .select('*')
      .eq('configuration_id', configurationId)
      .eq('component_id', componentId)
      .order('sequence_level')
      .order('order_index');

    console.log('Loaded sequences:', data?.length || 0, 'sequences');
    if (data) {
      setSequences(data);
    } else {
      setSequences([]);
    }
  };

  const loadFlowChart = async () => {
    if (!componentId) {
      setFlowChartData(null);
      setWorkStations([]);
      return;
    }

    console.log('Loading flow chart for component:', componentId);
    const { data } = await supabase
      .from('process_flow_charts')
      .select('*')
      .eq('configuration_id', configurationId)
      .eq('component_id', componentId)
      .maybeSingle();

    console.log('Flow chart data:', data ? 'Found' : 'Not found');
    if (data) {
      const totalSeconds = data.flow_chart_data?.totalSeconds || 0;
      const maxStationSeconds = data.flow_chart_data?.maxStationSeconds || 0;

      setFlowChartData({
        totalWorkers: data.total_workers,
        taktTime: data.takt_time,
        flowChartData: {
          totalSeconds,
          balanceRate: data.flow_chart_data?.balanceRate || 0,
          maxStationSeconds
        }
      });

      if (data.flow_chart_data?.workStations) {
        console.log('Setting work stations:', data.flow_chart_data.workStations.length);
        setWorkStations(data.flow_chart_data.workStations);
      } else {
        console.log('No work stations in flow chart data');
        setWorkStations([]);
      }
    } else {
      console.log('Clearing flow chart data');
      setFlowChartData(null);
      setWorkStations([]);
    }
  };

  const addProcess = async () => {
    if (!componentId) {
      alert('请先选择一个组件');
      return;
    }

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
          component_id: componentId,
          process_name: newProcess.name,
          sequence_level: newProcess.level,
          work_seconds: newProcess.seconds,
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
      setTempLevel('');
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
      setTempLevel('');
      await loadSequences();
    } catch (error) {
      alert('更新等级失败');
    } finally {
      setLoading(false);
    }
  };

  const startEditWorkTime = (seq: ProcessSequence) => {
    setEditingWorkTimeId(seq.id);
    setTempWorkTime(seq.work_seconds.toString());
  };

  const handleWorkTimeChange = async (id: string) => {
    const newSeconds = parseFloat(tempWorkTime);
    if (isNaN(newSeconds) || newSeconds < 0) {
      alert('请输入有效的工时（秒）');
      setEditingWorkTimeId(null);
      setTempWorkTime('');
      return;
    }

    setLoading(true);
    try {
      const newHours = newSeconds / 3600;
      console.log(`更新工时: ${newSeconds}秒 = ${newHours}小时`);

      const { data, error } = await supabase
        .from('process_sequences')
        .update({ work_seconds: newHours * 3600 })
        .eq('id', id)
        .select();

      if (error) {
        console.error('更新工时失败:', error);
        alert('更新工时失败: ' + error.message);
        return;
      }

      console.log('更新成功:', data);
      setEditingWorkTimeId(null);
      setTempWorkTime('');
      await loadSequences();
    } catch (error) {
      console.error('更新工时异常:', error);
      alert('更新工时失败');
    } finally {
      setLoading(false);
    }
  };

  const recalculateWithManualParams = async () => {
    if (!manualStationCount && !manualTaktTime) {
      alert('请输入工位数或节拍时间');
      return;
    }

    setLoading(true);
    try {
      await generateFlowChartWithParams(manualStationCount, manualTaktTime);
      setIsEditingStationCount(false);
      setIsEditingTaktTime(false);
    } catch (error) {
      console.error('重新计算失败:', error);
      alert('重新计算失败');
    } finally {
      setLoading(false);
    }
  };

  const generateFlowChartWithParams = async (targetStations: number | null = null, targetTaktTime: number | null = null) => {
    const sortedSequences = [...sequences].sort((a, b) => {
      if (a.sequence_level !== b.sequence_level) {
        return a.sequence_level - b.sequence_level;
      }
      return a.order_index - b.order_index;
    });

    const totalSeconds = sequences.reduce((sum, s) => sum + s.work_seconds, 0);
    const maxProcess = sequences.reduce((max, seq) =>
      seq.work_seconds > max.work_seconds ? seq : max
    , sequences[0]);

    let taktTimeConstraint = targetTaktTime || maxProcess.work_seconds;

    console.log('手动参数:', { targetStations, targetTaktTime });
    console.log('约束条件:', { taktTimeConstraint });

    const finalStations = distributeProcessesToStations(
      sortedSequences,
      maxProcess,
      taktTimeConstraint,
      targetStations
    );

    if (finalStations.length === 0) {
      alert('无法在给定约束下生成有效方案，请调整参数');
      return;
    }

    const maxStationSeconds = Math.max(...finalStations.map(s => s.totalSeconds));
    const actualTaktTime = maxStationSeconds;
    const balanceRate = (totalSeconds / (finalStations.length * maxStationSeconds)) * 100;

    const { data: existing } = await supabase
      .from('process_flow_charts')
      .select('id')
      .eq('configuration_id', configurationId)
      .eq('component_id', componentId)
      .maybeSingle();

    const flowData = {
      total_workers: finalStations.length,
      takt_time: actualTaktTime,
      flow_chart_data: {
        sequences: sortedSequences,
        totalSeconds,
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
          component_id: componentId,
          ...flowData
        }]);
    }

    setWorkStations(finalStations);
    setFlowChartData({
      totalWorkers: finalStations.length,
      taktTime: actualTaktTime,
      flowChartData: {
        totalSeconds,
        balanceRate,
        maxStationSeconds
      }
    });
  };

  const distributeProcessesToStations = (
    sortedSequences: ProcessSequence[],
    bottleneckProcess: ProcessSequence,
    taktTime: number,
    targetStationCount: number | null
  ): WorkStation[] => {
    const otherProcesses = sortedSequences.filter(p => p.id !== bottleneckProcess.id);

    if (targetStationCount) {
      return distributeWithFixedStations(sortedSequences, bottleneckProcess, taktTime, targetStationCount);
    } else {
      return findOptimalStationsWithTakt(sortedSequences, bottleneckProcess, taktTime);
    }
  };

  const distributeWithFixedStations = (
    processes: ProcessSequence[],
    bottleneckProcess: ProcessSequence,
    taktTime: number,
    targetCount: number
  ): WorkStation[] => {
    if (targetCount < 1) return [];

    const otherProcesses = processes.filter(p => p.id !== bottleneckProcess.id);
    const stations: WorkStation[] = [];

    for (let i = 0; i < targetCount; i++) {
      stations.push({ id: i + 1, processes: [], totalSeconds: 0 });
    }

    let bottleneckInserted = false;
    let currentStationIndex = 0;

    for (const process of processes) {
      if (process.id === bottleneckProcess.id) {
        const emptyStationIndex = stations.findIndex(s => s.processes.length === 0);
        if (emptyStationIndex !== -1) {
          stations[emptyStationIndex].processes.push(process);
          stations[emptyStationIndex].totalSeconds = process.work_seconds;
          bottleneckInserted = true;
          currentStationIndex = emptyStationIndex + 1;
        } else {
          if (currentStationIndex >= stations.length) currentStationIndex = 0;
          const station = stations[currentStationIndex];
          if (station.totalSeconds + process.work_seconds <= taktTime) {
            station.processes.push(process);
            station.totalSeconds += process.work_seconds;
          } else {
            return [];
          }
        }
        continue;
      }

      let placed = false;
      for (let attempt = 0; attempt < stations.length; attempt++) {
        const stationIdx = (currentStationIndex + attempt) % stations.length;
        const station = stations[stationIdx];

        if (station.totalSeconds + process.work_seconds <= taktTime) {
          station.processes.push(process);
          station.totalSeconds += process.work_seconds;
          placed = true;
          currentStationIndex = stationIdx;
          break;
        }
      }

      if (!placed) {
        return [];
      }
    }

    return stations;
  };

  const findOptimalStationsWithTakt = (
    processes: ProcessSequence[],
    bottleneckProcess: ProcessSequence,
    taktTime: number
  ): WorkStation[] => {
    const otherProcesses = processes.filter(p => p.id !== bottleneckProcess.id);
    const n = otherProcesses.length;

    if (n === 0) {
      return [{
        id: 1,
        processes: [bottleneckProcess],
        totalSeconds: bottleneckProcess.work_seconds
      }];
    }

    const levelGroups = new Map<number, ProcessSequence[]>();
    otherProcesses.forEach(p => {
      if (!levelGroups.has(p.sequence_level)) {
        levelGroups.set(p.sequence_level, []);
      }
      levelGroups.get(p.sequence_level)!.push(p);
    });

    let allSolutions: { stations: WorkStation[], variance: number, workloads: number[], stationCount: number, balanceRate: number }[] = [];

    function validateLevelOrder(stations: WorkStation[]): boolean {
      for (let i = 0; i < stations.length - 1; i++) {
        const currentMaxLevel = Math.max(...stations[i].processes.map(p => p.sequence_level));
        const nextMinLevel = Math.min(...stations[i + 1].processes.map(p => p.sequence_level));

        if (currentMaxLevel > nextMinLevel) {
          return false;
        }
      }
      return true;
    }

    function enumerate(index: number, currentStations: WorkStation[], processOrder: ProcessSequence[]) {
      if (index === n) {
        const allValid = currentStations.every(s => s.totalSeconds <= taktTime);
        if (!allValid) return;

        if (!validateLevelOrder(currentStations)) {
          return;
        }

        let insertPosition = 0;
        for (let i = 0; i < currentStations.length; i++) {
          const maxLevel = Math.max(...currentStations[i].processes.map(p => p.sequence_level));
          const maxOrder = Math.max(...currentStations[i].processes
            .filter(p => p.sequence_level === maxLevel)
            .map(p => p.order_index));

          if (maxLevel < bottleneckProcess.sequence_level ||
              (maxLevel === bottleneckProcess.sequence_level && maxOrder < bottleneckProcess.order_index)) {
            insertPosition = i + 1;
          }
        }

        const fullStations = [...currentStations];
        const bottleneckStation: WorkStation = {
          id: 0,
          processes: [bottleneckProcess],
          totalSeconds: bottleneckProcess.work_seconds
        };
        fullStations.splice(insertPosition, 0, bottleneckStation);
        fullStations.forEach((s, idx) => s.id = idx + 1);

        if (!validateLevelOrder(fullStations)) {
          return;
        }

        const totalSeconds = processes.reduce((sum, p) => sum + p.work_seconds, 0);
        const workloads = fullStations.map(s => s.totalSeconds);
        const variance = workloads.reduce((sum, w, _, arr) => {
          const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
          return sum + Math.pow(w - mean, 2);
        }, 0) / workloads.length;
        const stationCount = fullStations.length;
        const maxWorkload = Math.max(...workloads);
        const balanceRate = (totalSeconds / (stationCount * maxWorkload)) * 100;

        allSolutions.push({
          stations: fullStations.map(s => ({
            ...s,
            processes: [...s.processes]
          })),
          variance: variance,
          workloads: [...workloads],
          stationCount: stationCount,
          balanceRate: balanceRate
        });

        return;
      }

      const currentProcess = processOrder[index];
      const currentProcessSeconds = currentProcess.work_seconds;
      const currentLevel = currentProcess.sequence_level;

      for (let i = 0; i < currentStations.length; i++) {
        const station = currentStations[i];
        const newTotal = station.totalSeconds + currentProcessSeconds;

        if (newTotal <= taktTime) {
          let canAdd = true;
          if (i < currentStations.length - 1) {
            const nextMinLevel = Math.min(...currentStations[i + 1].processes.map(p => p.sequence_level));
            if (currentLevel > nextMinLevel) {
              canAdd = false;
            }
          }

          if (canAdd) {
            station.processes.push(currentProcess);
            station.totalSeconds += currentProcess.work_seconds;
            enumerate(index + 1, currentStations, processOrder);
            station.processes.pop();
            station.totalSeconds -= currentProcess.work_seconds;
          }
        }
      }

      currentStations.push({
        id: currentStations.length + 1,
        processes: [currentProcess],
        totalSeconds: currentProcess.work_seconds
      });

      enumerate(index + 1, currentStations, processOrder);
      currentStations.pop();
    }

    enumerate(0, [], otherProcesses);

    if (allSolutions.length === 0) {
      console.log('未找到有效方案');
      return [];
    }

    allSolutions.sort((a, b) => {
      const balanceDiff = b.balanceRate - a.balanceRate;
      if (Math.abs(balanceDiff) > 0.1) {
        return balanceDiff;
      }
      return a.variance - b.variance;
    });

    return allSolutions[0].stations;
  };

  const generateFlowChart = async () => {
    if (sequences.length === 0) {
      alert('请先添加工序');
      return;
    }

    setLoading(true);
    try {
      const totalSeconds = sequences.reduce((sum, s) => sum + s.work_seconds, 0);
      const totalHours = totalSeconds / 3600; // for display purposes

      const sortedSequences = [...sequences].sort((a, b) => {
        if (a.sequence_level !== b.sequence_level) {
          return a.sequence_level - b.sequence_level;
        }
        return a.order_index - b.order_index;
      });

      // IE工程核心算法：线平衡优化（遵循五大逻辑）
      // 逻辑1: 严格遵循工序等级排序+工序层后顺序（原则）
      // 逻辑2: 工时最长的工序即为瓶颈工序，独立作为一个工位，不和其他工序共享工位
      // 逻辑3: 目标是平衡率最优，推算出最优人数
      // 逻辑4: 全员仅效，计算各方案工位门的的方差并选择最优小方差情况方案
      // 逻辑5: 同一级别的工序，可以在同一个工位，并且互相允许调换

      // 找出瓶颈工序（工时最长的工序）
      const maxProcess = sequences.reduce((max, seq) =>
        seq.work_seconds > max.work_seconds ? seq : max
      , sequences[0]);
      const bottleneckSeconds = maxProcess.work_seconds;

      console.log(`\n瓶颈工序: ${maxProcess.process_name}, 工时: ${bottleneckSeconds}秒`);
      console.log('该工序将独立作为一个工位\n');

      // 计算方差的辅助函数
      function calculateVariance(workloads: number[]): number {
        if (workloads.length === 0) return Infinity;
        const mean = workloads.reduce((sum, w) => sum + w, 0) / workloads.length;
        return workloads.reduce((sum, w) => sum + Math.pow(w - mean, 2), 0) / workloads.length;
      }

      // 计算标准差（更直观）
      function calculateStdDev(workloads: number[]): number {
        return Math.sqrt(calculateVariance(workloads));
      }

      // 完全枚举算法：遵循五大逻辑的线平衡优化
      function findOptimalStations(processes: ProcessSequence[], bottleneckProcess: ProcessSequence): WorkStation[] {
        // 分离瓶颈工序和其他工序（逻辑2）
        const otherProcesses = processes.filter(p => p.id !== bottleneckProcess.id);
        const n = otherProcesses.length;

        if (n === 0) {
          // 只有瓶颈工序
          return [{
            id: 1,
            processes: [bottleneckProcess],
            totalSeconds: bottleneckProcess.work_seconds
          }];
        }

        // 将工序按等级分组（逻辑5）
        const levelGroups = new Map<number, ProcessSequence[]>();
        otherProcesses.forEach(p => {
          if (!levelGroups.has(p.sequence_level)) {
            levelGroups.set(p.sequence_level, []);
          }
          levelGroups.get(p.sequence_level)!.push(p);
        });

        console.log(`\n===== 开始智能线平衡优化 (${n}个非瓶颈工序 + 1个瓶颈工序) =====`);
        console.log('瓶颈工序:', `${bottleneckProcess.process_name}(${bottleneckProcess.work_seconds}s) - 独立工位`);
        console.log('工序分组（按等级）:');
        Array.from(levelGroups.entries()).sort((a, b) => a[0] - b[0]).forEach(([level, procs]) => {
          console.log(`  等级${level}: ${procs.map(p => `${p.process_name}(${p.work_seconds}s)`).join(', ')}`);
        });
        console.log('节拍时间约束:', bottleneckSeconds + 's');
        console.log('逻辑5: 同一等级工序可以互相调换顺序以优化平衡率\n');

        let allSolutions: { stations: WorkStation[], variance: number, workloads: number[], stationCount: number, balanceRate: number }[] = [];

        // 生成同级别工序的所有排列组合
        function generatePermutations<T>(arr: T[]): T[][] {
          if (arr.length <= 1) return [arr];
          const result: T[][] = [];
          for (let i = 0; i < arr.length; i++) {
            const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
            const perms = generatePermutations(rest);
            for (const perm of perms) {
              result.push([arr[i], ...perm]);
            }
          }
          return result;
        }

        // 为每个等级生成所有可能的排列
        const levelPermutations = new Map<number, ProcessSequence[][]>();
        levelGroups.forEach((procs, level) => {
          // 限制排列数量，避免组合爆炸（同一等级不超过6个工序才全排列）
          if (procs.length <= 6) {
            levelPermutations.set(level, generatePermutations(procs));
          } else {
            // 工序太多时只使用原始顺序
            levelPermutations.set(level, [procs]);
          }
        });

        const totalPermutations = Array.from(levelPermutations.values())
          .reduce((acc, perms) => acc * perms.length, 1);
        console.log(`同级别工序排列组合数: ${totalPermutations}\n`);

        // 验证工位等级顺序：确保后面的工位的最小等级 >= 前面工位的最大等级
        function validateLevelOrder(stations: WorkStation[]): boolean {
          for (let i = 0; i < stations.length - 1; i++) {
            const currentMaxLevel = Math.max(...stations[i].processes.map(p => p.sequence_level));
            const nextMinLevel = Math.min(...stations[i + 1].processes.map(p => p.sequence_level));

            if (currentMaxLevel > nextMinLevel) {
              return false; // 违反等级顺序
            }
          }
          return true;
        }

        // 递归枚举：每个工序可以加入到任意已存在的工位，或开启新工位
        function enumerate(index: number, currentStations: WorkStation[], processOrder: ProcessSequence[]) {
          // 所有非瓶颈工序已分配完成
          if (index === n) {
            // 检查所有工位是否满足节拍时间约束
            const allValid = currentStations.every(s => s.totalSeconds <= bottleneckSeconds);
            if (!allValid) return;

            // 验证工位等级顺序
            if (!validateLevelOrder(currentStations)) {
              return; // 不符合等级顺序要求，丢弃此方案
            }

            // 现在需要插入瓶颈工序（独立工位）到正确位置（逻辑1+逻辑2）
            // 找到瓶颈工序应该插入的位置（基于sequence_level和order_index）
            let insertPosition = 0;
            for (let i = 0; i < currentStations.length; i++) {
              const maxLevel = Math.max(...currentStations[i].processes.map(p => p.sequence_level));
              const maxOrder = Math.max(...currentStations[i].processes
                .filter(p => p.sequence_level === maxLevel)
                .map(p => p.order_index));

              // 如果当前工位的最大等级小于瓶颈工序，或等级相同但order小于瓶颈工序
              if (maxLevel < bottleneckProcess.sequence_level ||
                  (maxLevel === bottleneckProcess.sequence_level && maxOrder < bottleneckProcess.order_index)) {
                insertPosition = i + 1;
              }
            }

            // 创建包含瓶颈工序的完整工位列表
            const fullStations = [...currentStations];
            const bottleneckStation: WorkStation = {
              id: 0, // 临时ID，稍后重新编号
              processes: [bottleneckProcess],
              totalSeconds: bottleneckProcess.work_seconds
            };
            fullStations.splice(insertPosition, 0, bottleneckStation);

            // 重新编号工位
            fullStations.forEach((s, idx) => s.id = idx + 1);

            // 最终验证工位顺序
            if (!validateLevelOrder(fullStations)) {
              return;
            }

            // 计算完整方案的工位工时（包含瓶颈工位）
            const workloads = fullStations.map(s => s.totalSeconds);
            const variance = calculateVariance(workloads);
            const stationCount = fullStations.length;
            const maxWorkload = Math.max(...workloads);
            const balanceRate = (totalSeconds / (stationCount * maxWorkload)) * 100;

            // 保存这个有效方案（深拷贝）
            allSolutions.push({
              stations: fullStations.map(s => ({
                ...s,
                processes: [...s.processes]
              })),
              variance: variance,
              workloads: [...workloads],
              stationCount: stationCount,
              balanceRate: balanceRate
            });

            return;
          }

          const currentProcess = processOrder[index];
          const currentProcessSeconds = currentProcess.work_seconds;
          const currentLevel = currentProcess.sequence_level;

          // 选择1：尝试加入到每一个已存在的工位
          for (let i = 0; i < currentStations.length; i++) {
            const station = currentStations[i];
            const newTotal = station.totalSeconds + currentProcessSeconds;

            if (newTotal <= bottleneckSeconds) {
              // 检查加入后是否会违反等级顺序
              const stationMaxLevel = station.processes.length > 0
                ? Math.max(...station.processes.map(p => p.sequence_level))
                : 0;

              // 如果当前工位后面还有工位，检查等级约束
              let canAdd = true;
              if (i < currentStations.length - 1) {
                const nextMinLevel = Math.min(...currentStations[i + 1].processes.map(p => p.sequence_level));
                // 加入当前工序后，本工位的最大等级不能超过下一个工位的最小等级
                if (currentLevel > nextMinLevel) {
                  canAdd = false;
                }
              }

              if (canAdd) {
                station.processes.push(currentProcess);
                station.totalSeconds += currentProcess.work_seconds;

                enumerate(index + 1, currentStations, processOrder);

                // 回溯
                station.processes.pop();
                station.totalSeconds -= currentProcess.work_seconds;
              }
            }
          }

          // 选择2：开启新工位
          currentStations.push({
            id: currentStations.length + 1,
            processes: [currentProcess],
            totalSeconds: currentProcess.work_seconds
          });

          enumerate(index + 1, currentStations, processOrder);

          // 回溯
          currentStations.pop();
        }

        // 生成所有可能的工序排列组合（逻辑5）
        function generateAllProcessOrders(): ProcessSequence[][] {
          const sortedLevels = Array.from(levelGroups.keys()).sort((a, b) => a - b);
          const levelPermsArray: ProcessSequence[][][] = sortedLevels.map(level =>
            levelPermutations.get(level)!
          );

          // 笛卡尔积：组合所有等级的排列
          function cartesianProduct(arrays: ProcessSequence[][][]): ProcessSequence[][] {
            if (arrays.length === 0) return [[]];
            const [first, ...rest] = arrays;
            const restProduct = cartesianProduct(rest);
            const result: ProcessSequence[][] = [];
            for (const firstItem of first) {
              for (const restItem of restProduct) {
                result.push([...firstItem, ...restItem]);
              }
            }
            return result;
          }

          return cartesianProduct(levelPermsArray);
        }

        const allProcessOrders = generateAllProcessOrders();
        console.log(`将尝试 ${allProcessOrders.length} 种工序排列组合\n`);

        // 对每种排列组合进行枚举
        for (let orderIdx = 0; orderIdx < allProcessOrders.length; orderIdx++) {
          const processOrder = allProcessOrders[orderIdx];

          // 限制总方案数，避免运行时间过长
          if (allSolutions.length > 10000) {
            console.log('已生成足够多的方案，停止枚举');
            break;
          }

          // 开始枚举这个排列
          enumerate(0, [], processOrder);
        }

        console.log(`\n总共找到 ${allSolutions.length} 种有效方案\n`);

        if (allSolutions.length === 0) {
          console.log('未找到有效方案！');
          return [];
        }

        // 应用逻辑3和逻辑4：优先平衡率，其次方差
        // 按平衡率降序（高到低），平衡率相同时按方差升序（小到大）
        allSolutions.sort((a, b) => {
          // 优先比较平衡率（高的优先）
          const balanceDiff = b.balanceRate - a.balanceRate;
          if (Math.abs(balanceDiff) > 0.1) { // 平衡率差异超过0.1%才认为有显著区别
            return balanceDiff;
          }
          // 平衡率接近时，比较方差（小的优先）
          return a.variance - b.variance;
        });

        // 输出前10个最优方案
        const topN = Math.min(10, allSolutions.length);
        console.log(`前 ${topN} 个最优方案（按平衡率↓、方差↑排序）：\n`);
        for (let i = 0; i < topN; i++) {
          const sol = allSolutions[i];
          console.log(`方案 ${i+1} - 工位数=${sol.stationCount}, 平衡率=${sol.balanceRate.toFixed(2)}%, 方差=${sol.variance.toFixed(2)}:`);
          sol.stations.forEach((s, idx) => {
            const processNames = s.processes.map(p => p.process_name).join('、');
            const isBottleneck = s.processes.some(p => p.id === bottleneckProcess.id);
            const mark = isBottleneck ? ' [瓶颈工位]' : '';
            console.log(`  工位${idx+1}: ${processNames} = ${sol.workloads[idx].toFixed(0)}s${mark}`);
          });
          console.log('');
        }

        console.log(`===== 选择最优方案：工位数=${allSolutions[0].stationCount}, 平衡率=${allSolutions[0].balanceRate.toFixed(2)}%, 方差=${allSolutions[0].variance.toFixed(2)} =====\n`);

        return allSolutions[0].stations;
      }

      // 贪心算法（备用）- 也遵循四大逻辑
      function greedyAlgorithm(processes: ProcessSequence[], bottleneckProcess: ProcessSequence, maxSeconds: number): WorkStation[] {
        // 分离瓶颈工序和其他工序
        const otherProcesses = processes.filter(p => p.id !== bottleneckProcess.id);

        const stations: WorkStation[] = [];

        // 为其他工序分配工位
        if (otherProcesses.length > 0) {
          stations.push({
            id: 1,
            processes: [],
            totalSeconds: 0
          });

          for (const seq of otherProcesses) {
            const seqSeconds = seq.work_seconds;
            const currentStation = stations[stations.length - 1];
            const currentSeconds = currentStation.totalSeconds;

            if (currentSeconds + seqSeconds <= maxSeconds) {
              currentStation.processes.push(seq);
              currentStation.totalSeconds += seq.work_seconds;
            } else {
              stations.push({
                id: stations.length + 1,
                processes: [seq],
                totalSeconds: seq.work_seconds
              });
            }
          }
        }

        // 插入瓶颈工序（独立工位）到正确位置
        let insertPosition = 0;
        for (let i = 0; i < stations.length; i++) {
          const maxLevel = Math.max(...stations[i].processes.map(p => p.sequence_level));
          const maxOrder = Math.max(...stations[i].processes
            .filter(p => p.sequence_level === maxLevel)
            .map(p => p.order_index));

          if (maxLevel < bottleneckProcess.sequence_level ||
              (maxLevel === bottleneckProcess.sequence_level && maxOrder < bottleneckProcess.order_index)) {
            insertPosition = i + 1;
          }
        }

        const bottleneckStation: WorkStation = {
          id: 0,
          processes: [bottleneckProcess],
          totalSeconds: bottleneckProcess.work_seconds
        };
        stations.splice(insertPosition, 0, bottleneckStation);

        // 重新编号
        stations.forEach((s, idx) => s.id = idx + 1);

        return stations;
      }

      // 执行优化
      let finalStations: WorkStation[];

      // 对于工序较少的情况（≤12），使用精确算法
      if (sortedSequences.length <= 12) {
        console.log('使用智能线平衡算法（精确解）');
        finalStations = findOptimalStations(sortedSequences, maxProcess);

        if (finalStations.length === 0) {
          // 回退到贪心算法
          console.warn('智能算法未找到解，使用贪心算法');
          finalStations = greedyAlgorithm(sortedSequences, maxProcess, bottleneckSeconds);
        }
      } else {
        // 工序较多时，使用贪心算法
        console.log('工序数量较多，使用贪心算法');
        finalStations = greedyAlgorithm(sortedSequences, maxProcess, bottleneckSeconds);
      }

      // 验证：确保工序顺序正确
      for (let i = 0; i < finalStations.length - 1; i++) {
        const maxLevelInCurrent = Math.max(...finalStations[i].processes.map(p => p.sequence_level));
        const maxOrderInCurrent = Math.max(...finalStations[i].processes
          .filter(p => p.sequence_level === maxLevelInCurrent)
          .map(p => p.order_index));

        const minLevelInNext = Math.min(...finalStations[i + 1].processes.map(p => p.sequence_level));
        const minOrderInNext = Math.min(...finalStations[i + 1].processes
          .filter(p => p.sequence_level === minLevelInNext)
          .map(p => p.order_index));

        if (maxLevelInCurrent > minLevelInNext ||
            (maxLevelInCurrent === minLevelInNext && maxOrderInCurrent >= minOrderInNext)) {
          console.error('工序顺序错误！工位', i + 1, '的最后工序在工位', i + 2, '的第一个工序之后');
        }
      }

      // 输出优化结果
      console.log('线平衡优化结果:');
      finalStations.forEach(s => {
        console.log(`工位${s.id}: ${s.processes.map(p => p.process_name).join('、')} = ${s.totalSeconds}s`);
      });
      const workloads = finalStations.map(s => s.totalSeconds);
      console.log('方差:', calculateVariance(workloads).toFixed(2));
      console.log('标准差:', calculateStdDev(workloads).toFixed(2) + 's');

      const maxStationSeconds = Math.max(...finalStations.map(s => s.totalSeconds));
      const actualTaktTime = maxStationSeconds;
      const balanceRate = (totalSeconds / (finalStations.length * maxStationSeconds)) * 100;

      const { data: existing } = await supabase
        .from('process_flow_charts')
        .select('id')
        .eq('configuration_id', configurationId)
        .eq('component_id', componentId)
        .maybeSingle();

      const flowData = {
        total_workers: finalStations.length,
        takt_time: actualTaktTime,
        flow_chart_data: {
          sequences: sortedSequences,
          totalSeconds,
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
            component_id: componentId,
            ...flowData
          }]);
      }

      setWorkStations(finalStations);
      setFlowChartData({
        totalWorkers: finalStations.length,
        taktTime: actualTaktTime,
        flowChartData: {
          totalSeconds,
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

  if (!componentId) {
    return (
      <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-lg mb-2">请先选择或添加一个产品组件</p>
        <p className="text-sm">每个组件可以有独立的工艺序列和流程图</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 工作流程指示器 */}
      <div className="bg-gradient-to-r from-blue-50 via-green-50 to-purple-50 border-2 border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">1</div>
            <div>
              <p className="font-semibold text-blue-800">工艺序列表</p>
              <p className="text-xs text-blue-600">确定工序顺序</p>
            </div>
          </div>
          <div className="text-2xl text-gray-400">→</div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-lg">2</div>
            <div>
              <p className="font-semibold text-green-800">工艺展开流程图</p>
              <p className="text-xs text-green-600">人数与节拍计算</p>
            </div>
          </div>
          <div className="text-2xl text-gray-400">→</div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-lg">3</div>
            <div>
              <p className="font-semibold text-purple-800">Layout图</p>
              <p className="text-xs text-purple-600">现场布局规划</p>
            </div>
          </div>
        </div>
      </div>

      {/* 第一步：工艺序列表 */}
      <div className="border-4 border-blue-300 rounded-xl overflow-hidden shadow-lg">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white text-blue-600 flex items-center justify-center font-bold">1</div>
            <h3 className="text-xl font-bold">工艺序列表</h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
            >
              <Plus size={18} />
              添加工序
            </button>
            <button
              onClick={generateFlowChart}
              disabled={loading || sequences.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors font-medium"
            >
              <Zap size={18} />
              {loading ? '生成中...' : '生成流程图 →'}
            </button>
          </div>
        </div>
        <div className="bg-blue-50 p-6">
      {showAddForm && (
        <div className="bg-white border-2 border-blue-200 rounded-lg p-4 space-y-3 mb-4">
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
                                    min="1"
                                    value={tempLevel}
                                    onChange={(e) => setTempLevel(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleLevelChange(seq.id);
                                      }
                                      if (e.key === 'Escape') {
                                        setEditingLevelId(null);
                                        setTempLevel('');
                                      }
                                    }}
                                    className="w-16 px-2 py-1 border border-blue-500 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleLevelChange(seq.id)}
                                    disabled={loading}
                                    className="p-1 text-white bg-green-600 hover:bg-green-700 rounded disabled:bg-gray-400 transition-colors"
                                    title="确认修改"
                                  >
                                    <Check size={14} />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingLevelId(null);
                                      setTempLevel('');
                                    }}
                                    className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                    title="取消"
                                  >
                                    ✕
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
                                    min="0"
                                    value={tempWorkTime}
                                    onChange={(e) => setTempWorkTime(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleWorkTimeChange(seq.id);
                                      }
                                      if (e.key === 'Escape') {
                                        setEditingWorkTimeId(null);
                                        setTempWorkTime('');
                                      }
                                    }}
                                    className="w-20 px-2 py-1 border border-blue-500 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    autoFocus
                                  />
                                  <span className="text-xs text-gray-500">秒</span>
                                  <button
                                    onClick={() => handleWorkTimeChange(seq.id)}
                                    disabled={loading}
                                    className="p-1 text-white bg-green-600 hover:bg-green-700 rounded disabled:bg-gray-400 transition-colors"
                                    title="确认修改"
                                  >
                                    <Check size={14} />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingWorkTimeId(null);
                                      setTempWorkTime('');
                                    }}
                                    className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                    title="取消"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => startEditWorkTime(seq)}
                                  className="text-xs font-medium text-blue-700 hover:text-blue-900 flex items-center gap-1"
                                >
                                  工时: {seq.work_seconds}秒
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
        <p className="text-sm text-blue-700 bg-white rounded p-3 border border-blue-200">
          💡 提示：点击工序卡片中的"等级"或"工时"可编辑。等级输入小数（如2.5）可将工序插入到对应等级之间。
        </p>
        </div>
        </div>
      </div>

      {/* 第二步：工艺展开流程图 */}
      {flowChartData && workStations.length > 0 && (
        <div className="border-4 border-green-300 rounded-xl overflow-hidden shadow-lg">
          <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white text-green-600 flex items-center justify-center font-bold">2</div>
                <h3 className="text-xl font-bold">工艺展开流程图</h3>
                <div className="ml-4 bg-white/20 px-3 py-1 rounded-full text-sm">
                  ✨ 已自动优化至最佳平衡率
                </div>
              </div>
              <div className="text-sm bg-white/10 px-3 py-1.5 rounded-lg">
                💡 点击工位数或节拍时间右侧的 <Edit2 size={14} className="inline" /> 图标可手动调整
              </div>
            </div>
          </div>
          <div className="bg-green-50 p-6 space-y-6">

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 shadow border-2 border-blue-200 hover:border-blue-400 transition-all">
              <p className="text-sm text-gray-600 mb-2 flex items-center justify-between">
                <span>工位数</span>
                {!isEditingStationCount && (
                  <button
                    onClick={() => {
                      setIsEditingStationCount(true);
                      setManualStationCount(flowChartData.totalWorkers);
                    }}
                    className="text-blue-600 hover:text-blue-800"
                    title="点击修改"
                  >
                    <Edit2 size={16} />
                  </button>
                )}
              </p>
              {isEditingStationCount ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={manualStationCount || ''}
                    onChange={(e) => setManualStationCount(parseInt(e.target.value) || null)}
                    className="w-20 px-2 py-1 border-2 border-blue-500 rounded text-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <span className="text-sm text-gray-600">人</span>
                  <button
                    onClick={recalculateWithManualParams}
                    disabled={loading}
                    className="p-1 text-white bg-green-600 hover:bg-green-700 rounded disabled:bg-gray-400"
                    title="应用"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingStationCount(false);
                      setManualStationCount(null);
                    }}
                    className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                    title="取消"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <p className="text-3xl font-bold text-blue-600">{flowChartData.totalWorkers || 0} 人</p>
              )}
            </div>
            <div className="bg-white rounded-lg p-4 shadow border-2 border-green-200 hover:border-green-400 transition-all">
              <p className="text-sm text-gray-600 mb-2 flex items-center justify-between">
                <span>节拍时间</span>
                {!isEditingTaktTime && (
                  <button
                    onClick={() => {
                      setIsEditingTaktTime(true);
                      setManualTaktTime(flowChartData.taktTime);
                    }}
                    className="text-green-600 hover:text-green-800"
                    title="点击修改"
                  >
                    <Edit2 size={16} />
                  </button>
                )}
              </p>
              {isEditingTaktTime ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={manualTaktTime || ''}
                    onChange={(e) => setManualTaktTime(parseFloat(e.target.value) || null)}
                    className="w-24 px-2 py-1 border-2 border-green-500 rounded text-xl font-bold focus:outline-none focus:ring-2 focus:ring-green-500"
                    autoFocus
                  />
                  <span className="text-sm text-gray-600">秒</span>
                  <button
                    onClick={recalculateWithManualParams}
                    disabled={loading}
                    className="p-1 text-white bg-green-600 hover:bg-green-700 rounded disabled:bg-gray-400"
                    title="应用"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingTaktTime(false);
                      setManualTaktTime(null);
                    }}
                    className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                    title="取消"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <p className="text-3xl font-bold text-green-600">{(flowChartData.taktTime || 0).toFixed(2)} 秒</p>
              )}
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

          <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4">
            <p className="text-sm text-amber-800 font-medium mb-2">🔧 手动调整说明：</p>
            <ul className="text-sm text-amber-700 space-y-1 ml-4">
              <li>• <span className="font-semibold">修改工位数</span>：系统将按照您指定的工位数重新分配工序，并尽可能提高平衡率</li>
              <li>• <span className="font-semibold">修改节拍时间</span>：系统将以新的节拍时间为约束，重新优化工位数和工序分配</li>
              <li>• 修改后将自动重新计算工艺展开流程图，保持最高平衡率原则</li>
            </ul>
          </div>

          <details className="bg-white rounded-lg shadow border-l-4 border-green-500">
            <summary className="cursor-pointer p-4 font-semibold text-gray-800 hover:bg-gray-50 flex items-center gap-2">
              <span className="text-green-600">📊</span> 查看详细计算逻辑与公式
            </summary>
            <div className="px-4 pb-4 space-y-3 text-sm text-gray-700">
              <div className="bg-blue-50 p-3 rounded">
                <p className="font-semibold text-blue-800 mb-1">平衡率 = (总工时 ÷ (工位数 × 最大工位工时)) × 100%</p>
                <p className="mt-1 text-gray-600">
                  = ({((flowChartData.flowChartData?.totalSeconds || 0)).toFixed(0)}秒 ÷ ({flowChartData.totalWorkers || 0} × {((flowChartData.flowChartData?.maxStationSeconds || 0)).toFixed(0)}秒)) × 100%
                  = <span className="font-bold text-blue-700">{((flowChartData.flowChartData?.balanceRate || 0)).toFixed(1)}%</span>
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <p className="font-semibold text-green-800 mb-1">实际节拍时间 = 最大工位工时 = {(flowChartData.taktTime || 0).toFixed(0)}秒/件</p>
              </div>
              <div className="bg-amber-50 p-3 rounded">
                <p className="font-semibold text-amber-800 mb-1">智能优化策略：</p>
                <ul className="list-disc list-inside space-y-1 text-gray-600 ml-2 text-xs">
                  <li>遍历所有可能的工位数量，计算每种方案的平衡率</li>
                  <li>按工序等级顺序分配，使每个工位工时接近目标平均值</li>
                  <li>自动选择平衡率最高的方案</li>
                  <li>当平衡率达到98%以上时提前终止（已达最优）</li>
                  <li className="font-semibold text-amber-900">结果：推荐的工位数能让生产线达到最佳平衡</li>
                </ul>
              </div>
            </div>
          </details>

          <div>
            <h5 className="font-semibold text-gray-800 mb-3 text-lg">各工位详细分配</h5>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {workStations.map((station) => {
                const stationSeconds = station.totalSeconds;
                const balancePercentage = (station.totalSeconds / (flowChartData.flowChartData?.maxStationSeconds || 1)) * 100;
                return (
                  <div key={station.id} className="bg-white rounded-lg border border-green-200 p-3 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-base font-bold text-green-700">工位 {station.id}</span>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                          {stationSeconds.toFixed(0)}秒
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          balancePercentage >= 90 ? 'bg-green-100 text-green-700' :
                          balancePercentage >= 80 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {balancePercentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {station.processes.map((process) => (
                        <div
                          key={process.id}
                          className="bg-green-50 border border-green-200 rounded p-2"
                        >
                          <div className="flex items-start justify-between mb-0.5">
                            <span className="text-xs font-semibold text-green-700">L{process.sequence_level}</span>
                            <span className="text-xs text-green-600">{process.work_seconds}s</span>
                          </div>
                          <p className="text-xs font-medium text-gray-800 leading-tight">{process.process_name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          </div>
        </div>
      )}

      {/* 第三步：Layout图 */}
      {flowChartData && workStations.length > 0 && (
        <div className="border-4 border-purple-300 rounded-xl overflow-hidden shadow-lg">
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white text-purple-600 flex items-center justify-center font-bold">3</div>
              <h3 className="text-xl font-bold">Layout图</h3>
              <span className="text-sm opacity-90">（现场布局规划）</span>
            </div>
          </div>
          <div className="bg-purple-50 p-6">
            <ProcessFlowLayoutEditor
              workStations={workStations}
              componentId={componentId || ''}
              onSave={async (nodes, connections) => {
                console.log('Saving layout:', { nodes, connections });
                const { data: existing } = await supabase
                  .from('process_flow_charts')
                  .select('id')
                  .eq('configuration_id', configurationId)
                  .eq('component_id', componentId)
                  .maybeSingle();

                const layoutData = {
                  layout_nodes: nodes,
                  layout_connections: connections,
                  updated_at: new Date().toISOString()
                };

                if (existing) {
                  const currentFlowData = flowChartData?.flowChartData || {};
                  await supabase
                    .from('process_flow_charts')
                    .update({
                      flow_chart_data: {
                        ...currentFlowData,
                        ...layoutData
                      },
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', existing.id);
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
