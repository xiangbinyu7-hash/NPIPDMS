import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Video, Image as ImageIcon, AlertCircle, Save, Clock, Wrench, CheckCircle, PlayCircle } from 'lucide-react';

interface Process {
  id: string;
  process_name: string;
  sequence_level: number;
  order_index: number;
}

interface Tool {
  name: string;
  spec: string;
}

interface KeyPoint {
  point: string;
  priority: 'high' | 'medium' | 'low';
}

interface QualityCheckpoint {
  item: string;
  standard: string;
}

interface WorkInstructionStep {
  id?: string;
  instruction_id?: string;
  step_number: number;
  step_title: string;
  step_description: string;
  tools: Tool[];
  key_points: KeyPoint[];
  parameters: Record<string, string>;
  video_url: string;
  video_thumbnail: string;
  images: string[];
  duration_seconds: number;
  safety_notes: string;
  quality_checkpoints: QualityCheckpoint[];
}

interface WorkInstruction {
  id?: string;
  configuration_id: string;
  component_id?: string;
  process_id?: string;
  title: string;
  description: string;
  version: string;
  status: 'draft' | 'published' | 'archived';
  steps?: WorkInstructionStep[];
}

interface WorkInstructionModuleProps {
  configurationId: string;
  componentId?: string;
}

export default function WorkInstructionModule({ configurationId, componentId }: WorkInstructionModuleProps) {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [selectedProcessId, setSelectedProcessId] = useState<string>('');
  const [instruction, setInstruction] = useState<WorkInstruction | null>(null);
  const [steps, setSteps] = useState<WorkInstructionStep[]>([]);
  const [selectedStepIndex, setSelectedStepIndex] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProcesses();
  }, [configurationId, componentId]);

  useEffect(() => {
    if (selectedProcessId) {
      loadInstruction();
    }
  }, [selectedProcessId]);

  const loadProcesses = async () => {
    try {
      let query = supabase
        .from('process_sequences')
        .select('*')
        .eq('configuration_id', configurationId)
        .order('sequence_level', { ascending: true })
        .order('order_index', { ascending: true });

      if (componentId) {
        query = query.eq('component_id', componentId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setProcesses(data || []);
      if (data && data.length > 0 && !selectedProcessId) {
        setSelectedProcessId(data[0].id);
      }
    } catch (error) {
      console.error('加载工序失败:', error);
    }
  };

  const loadInstruction = async () => {
    if (!selectedProcessId) return;

    setLoading(true);
    try {
      const { data: instructionData, error: instructionError } = await supabase
        .from('work_instructions')
        .select('*')
        .eq('configuration_id', configurationId)
        .eq('process_id', selectedProcessId)
        .maybeSingle();

      if (instructionError) throw instructionError;

      if (instructionData) {
        setInstruction(instructionData);

        const { data: stepsData, error: stepsError } = await supabase
          .from('work_instruction_steps')
          .select('*')
          .eq('instruction_id', instructionData.id)
          .order('step_number', { ascending: true });

        if (stepsError) throw stepsError;
        setSteps(stepsData || []);
      } else {
        const process = processes.find(p => p.id === selectedProcessId);
        setInstruction({
          configuration_id: configurationId,
          component_id: componentId,
          process_id: selectedProcessId,
          title: process ? `${process.process_name} - 作业指导书` : '作业指导书',
          description: '',
          version: '1.0',
          status: 'draft'
        });
        setSteps([createEmptyStep(1)]);
      }
    } catch (error) {
      console.error('加载作业指导书失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const createEmptyStep = (stepNumber: number): WorkInstructionStep => ({
    step_number: stepNumber,
    step_title: `步骤 ${stepNumber}`,
    step_description: '',
    tools: [],
    key_points: [],
    parameters: {},
    video_url: '',
    video_thumbnail: '',
    images: [],
    duration_seconds: 0,
    safety_notes: '',
    quality_checkpoints: []
  });

  const handleSave = async () => {
    if (!instruction) return;

    setSaving(true);
    try {
      let instructionId = instruction.id;

      if (!instructionId) {
        const { data, error } = await supabase
          .from('work_instructions')
          .insert({
            configuration_id: instruction.configuration_id,
            component_id: instruction.component_id,
            process_id: instruction.process_id,
            title: instruction.title,
            description: instruction.description,
            version: instruction.version,
            status: instruction.status
          })
          .select()
          .single();

        if (error) throw error;
        instructionId = data.id;
        setInstruction({ ...instruction, id: instructionId });
      } else {
        const { error } = await supabase
          .from('work_instructions')
          .update({
            title: instruction.title,
            description: instruction.description,
            version: instruction.version,
            status: instruction.status,
            updated_at: new Date().toISOString()
          })
          .eq('id', instructionId);

        if (error) throw error;
      }

      await supabase
        .from('work_instruction_steps')
        .delete()
        .eq('instruction_id', instructionId);

      if (steps.length > 0) {
        const stepsToInsert = steps.map((step, index) => ({
          instruction_id: instructionId,
          step_number: index + 1,
          step_title: step.step_title,
          step_description: step.step_description,
          tools: step.tools,
          key_points: step.key_points,
          parameters: step.parameters,
          video_url: step.video_url,
          video_thumbnail: step.video_thumbnail,
          images: step.images,
          duration_seconds: step.duration_seconds,
          safety_notes: step.safety_notes,
          quality_checkpoints: step.quality_checkpoints
        }));

        const { error } = await supabase
          .from('work_instruction_steps')
          .insert(stepsToInsert);

        if (error) throw error;
      }

      alert('保存成功！');
      loadInstruction();
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const addStep = () => {
    const newStep = createEmptyStep(steps.length + 1);
    setSteps([...steps, newStep]);
    setSelectedStepIndex(steps.length);
  };

  const deleteStep = (index: number) => {
    if (steps.length === 1) {
      alert('至少需要保留一个步骤');
      return;
    }
    const newSteps = steps.filter((_, i) => i !== index);
    setSteps(newSteps);
    if (selectedStepIndex >= newSteps.length) {
      setSelectedStepIndex(newSteps.length - 1);
    }
  };

  const updateStep = (index: number, field: keyof WorkInstructionStep, value: any) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  const addTool = (stepIndex: number) => {
    const newSteps = [...steps];
    newSteps[stepIndex].tools.push({ name: '', spec: '' });
    setSteps(newSteps);
  };

  const updateTool = (stepIndex: number, toolIndex: number, field: 'name' | 'spec', value: string) => {
    const newSteps = [...steps];
    newSteps[stepIndex].tools[toolIndex][field] = value;
    setSteps(newSteps);
  };

  const deleteTool = (stepIndex: number, toolIndex: number) => {
    const newSteps = [...steps];
    newSteps[stepIndex].tools = newSteps[stepIndex].tools.filter((_, i) => i !== toolIndex);
    setSteps(newSteps);
  };

  const addKeyPoint = (stepIndex: number) => {
    const newSteps = [...steps];
    newSteps[stepIndex].key_points.push({ point: '', priority: 'medium' });
    setSteps(newSteps);
  };

  const updateKeyPoint = (stepIndex: number, pointIndex: number, field: 'point' | 'priority', value: any) => {
    const newSteps = [...steps];
    newSteps[stepIndex].key_points[pointIndex][field] = value;
    setSteps(newSteps);
  };

  const deleteKeyPoint = (stepIndex: number, pointIndex: number) => {
    const newSteps = [...steps];
    newSteps[stepIndex].key_points = newSteps[stepIndex].key_points.filter((_, i) => i !== pointIndex);
    setSteps(newSteps);
  };

  const addParameter = (stepIndex: number) => {
    const key = prompt('输入参数名称:');
    if (key) {
      const newSteps = [...steps];
      newSteps[stepIndex].parameters[key] = '';
      setSteps(newSteps);
    }
  };

  const updateParameterValue = (stepIndex: number, key: string, value: string) => {
    const newSteps = [...steps];
    newSteps[stepIndex].parameters[key] = value;
    setSteps(newSteps);
  };

  const deleteParameter = (stepIndex: number, key: string) => {
    const newSteps = [...steps];
    delete newSteps[stepIndex].parameters[key];
    setSteps(newSteps);
  };

  const addQualityCheckpoint = (stepIndex: number) => {
    const newSteps = [...steps];
    newSteps[stepIndex].quality_checkpoints.push({ item: '', standard: '' });
    setSteps(newSteps);
  };

  const updateQualityCheckpoint = (stepIndex: number, checkIndex: number, field: 'item' | 'standard', value: string) => {
    const newSteps = [...steps];
    newSteps[stepIndex].quality_checkpoints[checkIndex][field] = value;
    setSteps(newSteps);
  };

  const deleteQualityCheckpoint = (stepIndex: number, checkIndex: number) => {
    const newSteps = [...steps];
    newSteps[stepIndex].quality_checkpoints = newSteps[stepIndex].quality_checkpoints.filter((_, i) => i !== checkIndex);
    setSteps(newSteps);
  };

  const currentStep = steps[selectedStepIndex];

  if (loading) {
    return <div className="p-6 text-center text-gray-500">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <CheckCircle className="w-7 h-7 text-purple-600" />
            标准作业指导书
          </h2>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? '保存中...' : '保存'}
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">选择工序</label>
          <select
            value={selectedProcessId}
            onChange={(e) => setSelectedProcessId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">请选择工序</option>
            {processes.map(process => (
              <option key={process.id} value={process.id}>
                {process.process_name}
              </option>
            ))}
          </select>
        </div>

        {instruction && (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">标题</label>
                <input
                  type="text"
                  value={instruction.title}
                  onChange={(e) => setInstruction({ ...instruction, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">版本</label>
                <input
                  type="text"
                  value={instruction.version}
                  onChange={(e) => setInstruction({ ...instruction, version: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">描述</label>
              <textarea
                value={instruction.description}
                onChange={(e) => setInstruction({ ...instruction, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-5 gap-6">
              <div className="col-span-1 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">步骤列表</h3>
                  <button
                    onClick={addStep}
                    className="p-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {steps.map((step, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedStepIndex(index)}
                      className={`p-3 rounded-lg cursor-pointer flex items-center justify-between ${
                        selectedStepIndex === index
                          ? 'bg-purple-100 border-2 border-purple-500'
                          : 'bg-white border border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-800">
                          步骤 {index + 1}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {step.step_title}
                        </div>
                      </div>
                      {steps.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteStep(index);
                          }}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="col-span-4 space-y-6">
                {currentStep && (
                  <>
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                      <h3 className="font-semibold text-lg text-gray-800 mb-4">步骤 {selectedStepIndex + 1} - 基本信息</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">步骤标题</label>
                          <input
                            type="text"
                            value={currentStep.step_title}
                            onChange={(e) => updateStep(selectedStepIndex, 'step_title', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">步骤描述</label>
                          <textarea
                            value={currentStep.step_description}
                            onChange={(e) => updateStep(selectedStepIndex, 'step_description', e.target.value)}
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            预计耗时（秒）
                          </label>
                          <input
                            type="number"
                            value={currentStep.duration_seconds}
                            onChange={(e) => updateStep(selectedStepIndex, 'duration_seconds', parseInt(e.target.value) || 0)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                      <h3 className="font-semibold text-lg text-gray-800 mb-4 flex items-center gap-2">
                        <Video className="w-5 h-5 text-purple-600" />
                        视频作业指导
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">视频URL</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={currentStep.video_url}
                              onChange={(e) => updateStep(selectedStepIndex, 'video_url', e.target.value)}
                              placeholder="输入视频链接（支持MP4、YouTube、Bilibili等）"
                              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </div>
                          {currentStep.video_url && (
                            <div className="mt-4 bg-gray-900 rounded-lg overflow-hidden">
                              <video
                                src={currentStep.video_url}
                                controls
                                className="w-full"
                                style={{ maxHeight: '400px' }}
                              >
                                您的浏览器不支持视频播放
                              </video>
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">视频缩略图URL</label>
                          <input
                            type="text"
                            value={currentStep.video_thumbnail}
                            onChange={(e) => updateStep(selectedStepIndex, 'video_thumbnail', e.target.value)}
                            placeholder="输入缩略图链接"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
                          <Wrench className="w-5 h-5 text-purple-600" />
                          工具清单
                        </h3>
                        <button
                          onClick={() => addTool(selectedStepIndex)}
                          className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          添加工具
                        </button>
                      </div>
                      <div className="space-y-3">
                        {currentStep.tools.map((tool, toolIndex) => (
                          <div key={toolIndex} className="flex gap-3 items-start p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1 grid grid-cols-2 gap-3">
                              <input
                                type="text"
                                value={tool.name}
                                onChange={(e) => updateTool(selectedStepIndex, toolIndex, 'name', e.target.value)}
                                placeholder="工具名称"
                                className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                              />
                              <input
                                type="text"
                                value={tool.spec}
                                onChange={(e) => updateTool(selectedStepIndex, toolIndex, 'spec', e.target.value)}
                                placeholder="规格型号"
                                className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                              />
                            </div>
                            <button
                              onClick={() => deleteTool(selectedStepIndex, toolIndex)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        {currentStep.tools.length === 0 && (
                          <div className="text-sm text-gray-400 text-center py-4">暂无工具，点击上方按钮添加</div>
                        )}
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 text-orange-600" />
                          作业要点
                        </h3>
                        <button
                          onClick={() => addKeyPoint(selectedStepIndex)}
                          className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          添加要点
                        </button>
                      </div>
                      <div className="space-y-3">
                        {currentStep.key_points.map((point, pointIndex) => (
                          <div key={pointIndex} className="flex gap-3 items-start p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1 grid grid-cols-3 gap-3">
                              <textarea
                                value={point.point}
                                onChange={(e) => updateKeyPoint(selectedStepIndex, pointIndex, 'point', e.target.value)}
                                placeholder="作业要点内容"
                                rows={2}
                                className="col-span-2 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                              />
                              <select
                                value={point.priority}
                                onChange={(e) => updateKeyPoint(selectedStepIndex, pointIndex, 'priority', e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                              >
                                <option value="high">高优先级</option>
                                <option value="medium">中优先级</option>
                                <option value="low">低优先级</option>
                              </select>
                            </div>
                            <button
                              onClick={() => deleteKeyPoint(selectedStepIndex, pointIndex)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        {currentStep.key_points.length === 0 && (
                          <div className="text-sm text-gray-400 text-center py-4">暂无作业要点，点击上方按钮添加</div>
                        )}
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-lg text-gray-800">工艺参数</h3>
                        <button
                          onClick={() => addParameter(selectedStepIndex)}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          添加参数
                        </button>
                      </div>
                      <div className="space-y-3">
                        {Object.entries(currentStep.parameters).map(([key, value]) => (
                          <div key={key} className="flex gap-3 items-center p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1 grid grid-cols-2 gap-3">
                              <div className="font-medium text-gray-700 flex items-center px-3 py-2 bg-white border border-gray-200 rounded">
                                {key}
                              </div>
                              <input
                                type="text"
                                value={value}
                                onChange={(e) => updateParameterValue(selectedStepIndex, key, e.target.value)}
                                placeholder="参数值"
                                className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              />
                            </div>
                            <button
                              onClick={() => deleteParameter(selectedStepIndex, key)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        {Object.keys(currentStep.parameters).length === 0 && (
                          <div className="text-sm text-gray-400 text-center py-4">暂无参数，点击上方按钮添加</div>
                        )}
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          质量检查点
                        </h3>
                        <button
                          onClick={() => addQualityCheckpoint(selectedStepIndex)}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          添加检查点
                        </button>
                      </div>
                      <div className="space-y-3">
                        {currentStep.quality_checkpoints.map((checkpoint, checkIndex) => (
                          <div key={checkIndex} className="flex gap-3 items-start p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1 grid grid-cols-2 gap-3">
                              <input
                                type="text"
                                value={checkpoint.item}
                                onChange={(e) => updateQualityCheckpoint(selectedStepIndex, checkIndex, 'item', e.target.value)}
                                placeholder="检查项目"
                                className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                              />
                              <input
                                type="text"
                                value={checkpoint.standard}
                                onChange={(e) => updateQualityCheckpoint(selectedStepIndex, checkIndex, 'standard', e.target.value)}
                                placeholder="质量标准"
                                className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                              />
                            </div>
                            <button
                              onClick={() => deleteQualityCheckpoint(selectedStepIndex, checkIndex)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        {currentStep.quality_checkpoints.length === 0 && (
                          <div className="text-sm text-gray-400 text-center py-4">暂无质量检查点，点击上方按钮添加</div>
                        )}
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                      <h3 className="font-semibold text-lg text-gray-800 mb-4 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        安全注意事项
                      </h3>
                      <textarea
                        value={currentStep.safety_notes}
                        onChange={(e) => updateStep(selectedStepIndex, 'safety_notes', e.target.value)}
                        rows={4}
                        placeholder="输入安全注意事项..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
