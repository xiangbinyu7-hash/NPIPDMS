import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Plus, Trash2, Video, AlertCircle, Save, Clock, Wrench, CheckCircle,
  Eye, Edit, FileText, Search, ArrowLeft, Share2, Copy, ExternalLink, Download
} from 'lucide-react';

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
  created_at?: string;
  updated_at?: string;
  process_name?: string;
  sequence_level?: number;
  order_index?: number;
}

interface WorkInstructionWithSteps extends WorkInstruction {
  steps?: WorkInstructionStep[];
}

interface WorkInstructionModuleProps {
  configurationId: string;
  componentId?: string;
}

type ViewMode = 'list' | 'detail' | 'edit';

export default function WorkInstructionModule({ configurationId, componentId }: WorkInstructionModuleProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [instructions, setInstructions] = useState<WorkInstruction[]>([]);
  const [selectedInstruction, setSelectedInstruction] = useState<WorkInstructionWithSteps | null>(null);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  const [steps, setSteps] = useState<WorkInstructionStep[]>([]);
  const [selectedStepIndex, setSelectedStepIndex] = useState<number>(0);

  useEffect(() => {
    loadProcesses();
    loadInstructions();
  }, [configurationId, componentId]);

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
    } catch (error) {
      console.error('加载工序失败:', error);
    }
  };

  const loadInstructions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('work_instructions')
        .select(`
          *,
          process_sequences!work_instructions_process_id_fkey (
            process_name,
            sequence_level,
            order_index
          )
        `)
        .eq('configuration_id', configurationId);

      if (componentId) {
        query = query.eq('component_id', componentId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const formattedData = (data || []).map((item: any) => ({
        ...item,
        process_name: item.process_sequences?.process_name,
        sequence_level: item.process_sequences?.sequence_level ?? 9999,
        order_index: item.process_sequences?.order_index ?? 9999
      }));

      formattedData.sort((a, b) => {
        if (a.sequence_level !== b.sequence_level) {
          return a.sequence_level - b.sequence_level;
        }
        return a.order_index - b.order_index;
      });

      setInstructions(formattedData);
    } catch (error) {
      console.error('加载作业指导书失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInstructionDetail = async (instructionId: string) => {
    setLoading(true);
    try {
      const { data: instructionData, error: instructionError } = await supabase
        .from('work_instructions')
        .select('*')
        .eq('id', instructionId)
        .single();

      if (instructionError) throw instructionError;

      const { data: stepsData, error: stepsError } = await supabase
        .from('work_instruction_steps')
        .select('*')
        .eq('instruction_id', instructionId)
        .order('step_number', { ascending: true });

      if (stepsError) throw stepsError;

      setSelectedInstruction({
        ...instructionData,
        steps: stepsData || []
      });
      setSteps(stepsData || []);
    } catch (error) {
      console.error('加载作业指导书详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNewInstruction = () => {
    const newInstruction: WorkInstructionWithSteps = {
      configuration_id: configurationId,
      component_id: componentId,
      process_id: '',
      title: '新作业指导书',
      description: '',
      version: '1.0',
      status: 'draft'
    };
    setSelectedInstruction(newInstruction);
    setSteps([createEmptyStep(1)]);
    setViewMode('edit');
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

  const handleViewDetail = async (instruction: WorkInstruction) => {
    await loadInstructionDetail(instruction.id!);
    setViewMode('detail');
  };

  const handleEdit = async (instruction: WorkInstruction) => {
    await loadInstructionDetail(instruction.id!);
    setViewMode('edit');
  };

  const handleDelete = async (instructionId: string) => {
    if (!confirm('确定要删除这个作业指导书吗？')) return;

    try {
      const { error } = await supabase
        .from('work_instructions')
        .delete()
        .eq('id', instructionId);

      if (error) throw error;
      alert('删除成功');
      loadInstructions();
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败');
    }
  };

  const handleShare = (instruction: WorkInstruction) => {
    const url = `${window.location.origin}/share/work-instruction/${instruction.id}`;
    setShareUrl(url);
    setShowShareDialog(true);
  };

  const copyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    alert('链接已复制到剪贴板');
  };

  const handleSave = async () => {
    if (!selectedInstruction) return;

    setSaving(true);
    try {
      let instructionId = selectedInstruction.id;

      if (!instructionId) {
        const { data, error } = await supabase
          .from('work_instructions')
          .insert({
            configuration_id: selectedInstruction.configuration_id,
            component_id: selectedInstruction.component_id,
            process_id: selectedInstruction.process_id,
            title: selectedInstruction.title,
            description: selectedInstruction.description,
            version: selectedInstruction.version,
            status: selectedInstruction.status
          })
          .select()
          .single();

        if (error) throw error;
        instructionId = data.id;
        setSelectedInstruction({ ...selectedInstruction, id: instructionId });
      } else {
        const { error } = await supabase
          .from('work_instructions')
          .update({
            title: selectedInstruction.title,
            description: selectedInstruction.description,
            version: selectedInstruction.version,
            status: selectedInstruction.status,
            process_id: selectedInstruction.process_id,
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
      loadInstructions();
      setViewMode('list');
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

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; class: string }> = {
      draft: { label: '草稿', class: 'bg-gray-500' },
      published: { label: '已发布', class: 'bg-green-500' },
      archived: { label: '已归档', class: 'bg-yellow-500' }
    };
    const config = statusConfig[status] || statusConfig.draft;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${config.class}`}>
        {config.label}
      </span>
    );
  };

  const filteredInstructions = instructions.filter(instruction => {
    const matchesSearch = instruction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         instruction.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || instruction.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  if (viewMode === 'detail' && selectedInstruction) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setViewMode('list')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              返回列表
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => handleShare(selectedInstruction)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                分享
              </button>
              <button
                onClick={() => setViewMode('edit')}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="w-4 h-4" />
                编辑
              </button>
            </div>
          </div>

          <div className="border-b border-gray-200 pb-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{selectedInstruction.title}</h1>
                <p className="text-gray-600">{selectedInstruction.description}</p>
              </div>
              {getStatusBadge(selectedInstruction.status)}
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">版本：</span>
                <span className="text-gray-900 font-medium">{selectedInstruction.version}</span>
              </div>
              <div>
                <span className="text-gray-500">创建时间：</span>
                <span className="text-gray-900 font-medium">{formatDate(selectedInstruction.created_at)}</span>
              </div>
              <div>
                <span className="text-gray-500">更新时间：</span>
                <span className="text-gray-900 font-medium">{formatDate(selectedInstruction.updated_at)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {selectedInstruction.steps?.map((step, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                    {step.step_number}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{step.step_title}</h3>
                    {step.duration_seconds > 0 && (
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        预计耗时: {step.duration_seconds}秒
                      </p>
                    )}
                  </div>
                </div>

                {step.step_description && (
                  <div className="mb-4">
                    <p className="text-gray-700">{step.step_description}</p>
                  </div>
                )}

                {step.video_url && (
                  <div className="mb-4 bg-black rounded-lg overflow-hidden">
                    <video src={step.video_url} controls className="w-full" style={{ maxHeight: '400px' }}>
                      您的浏览器不支持视频播放
                    </video>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {step.tools.length > 0 && (
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-blue-600" />
                        工具清单
                      </h4>
                      <ul className="space-y-2">
                        {step.tools.map((tool, i) => (
                          <li key={i} className="text-sm text-gray-700">
                            • {tool.name} {tool.spec && `(${tool.spec})`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {step.key_points.length > 0 && (
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-orange-600" />
                        作业要点
                      </h4>
                      <ul className="space-y-2">
                        {step.key_points.map((point, i) => (
                          <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className={`px-2 py-0.5 rounded text-xs text-white ${
                              point.priority === 'high' ? 'bg-red-500' :
                              point.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                            }`}>
                              {point.priority === 'high' ? '高' : point.priority === 'medium' ? '中' : '低'}
                            </span>
                            {point.point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {Object.keys(step.parameters).length > 0 && (
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">工艺参数</h4>
                      <div className="space-y-2">
                        {Object.entries(step.parameters).map(([key, value]) => (
                          <div key={key} className="text-sm text-gray-700">
                            <span className="text-gray-500 font-medium">{key}:</span> {value}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {step.quality_checkpoints.length > 0 && (
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        质量检查点
                      </h4>
                      <ul className="space-y-2">
                        {step.quality_checkpoints.map((check, i) => (
                          <li key={i} className="text-sm text-gray-700">
                            • {check.item}: {check.standard}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {step.safety_notes && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      安全注意事项
                    </h4>
                    <p className="text-sm text-red-600">{step.safety_notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'edit' && selectedInstruction) {
    const currentStep = steps[selectedStepIndex];

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => {
                if (confirm('确定要取消编辑吗？未保存的更改将丢失。')) {
                  setViewMode('list');
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? '保存中...' : '保存'}
            </button>
          </div>

          <div className="mb-6 pb-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">基本信息</h2>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                选择工序 *
                <span className="text-gray-500 text-xs font-normal ml-2">
                  （作业指导书名称将自动生成为：工序名 - 标准作业指导书）
                </span>
              </label>
              <select
                value={selectedInstruction.process_id || ''}
                onChange={(e) => {
                  const processId = e.target.value;
                  const process = processes.find(p => p.id === processId);
                  const newTitle = process ? `${process.process_name} - 标准作业指导书` : '';
                  setSelectedInstruction({
                    ...selectedInstruction,
                    process_id: processId,
                    title: newTitle
                  });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">请选择工序</option>
                {processes.map(process => (
                  <option key={process.id} value={process.id}>
                    {process.process_name} - 标准作业指导书
                  </option>
                ))}
              </select>
              {selectedInstruction.title && (
                <div className="mt-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <span className="text-sm text-blue-700">
                    <span className="font-semibold">当前作业指导书：</span>{selectedInstruction.title}
                  </span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">版本</label>
                <input
                  type="text"
                  value={selectedInstruction.version}
                  onChange={(e) => setSelectedInstruction({ ...selectedInstruction, version: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">状态</label>
                <select
                  value={selectedInstruction.status}
                  onChange={(e) => setSelectedInstruction({ ...selectedInstruction, status: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="draft">草稿</option>
                  <option value="published">已发布</option>
                  <option value="archived">已归档</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">描述</label>
              <textarea
                value={selectedInstruction.description}
                onChange={(e) => setSelectedInstruction({ ...selectedInstruction, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-5 gap-6">
            <div className="col-span-1 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">步骤列表</h3>
                <button
                  onClick={addStep}
                  className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"
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
                        ? 'bg-blue-100 border-2 border-blue-500'
                        : 'bg-white border border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-800">步骤 {index + 1}</div>
                      <div className="text-xs text-gray-500 truncate">{step.step_title}</div>
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
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">步骤描述</label>
                        <textarea
                          value={currentStep.step_description}
                          onChange={(e) => updateStep(selectedStepIndex, 'step_description', e.target.value)}
                          rows={4}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="font-semibold text-lg text-gray-800 mb-4 flex items-center gap-2">
                      <Video className="w-5 h-5 text-blue-600" />
                      视频作业指导
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">视频URL</label>
                        <input
                          type="text"
                          value={currentStep.video_url}
                          onChange={(e) => updateStep(selectedStepIndex, 'video_url', e.target.value)}
                          placeholder="输入视频链接（支持MP4、YouTube、Bilibili等）"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      {currentStep.video_url && (
                        <div className="bg-black rounded-lg overflow-hidden">
                          <video src={currentStep.video_url} controls className="w-full" style={{ maxHeight: '400px' }}>
                            您的浏览器不支持视频播放
                          </video>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
                        <Wrench className="w-5 h-5 text-blue-600" />
                        工具清单
                      </h3>
                      <button
                        onClick={() => addTool(selectedStepIndex)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm flex items-center gap-1"
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
                              className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                            <input
                              type="text"
                              value={tool.spec}
                              onChange={(e) => updateTool(selectedStepIndex, toolIndex, 'spec', e.target.value)}
                              placeholder="规格型号"
                              className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <FileText className="w-7 h-7 text-blue-600" />
              标准作业指导书 (SOP)
            </h2>
            <p className="text-gray-600 mt-1">管理产线标准操作规范，确保生产一致性与安全性</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={createNewInstruction}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              创建新 SOP
            </button>
          </div>
        </div>

        <div className="mb-6 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="搜索作业指导书..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">全部状态</option>
            <option value="draft">草稿</option>
            <option value="published">已发布</option>
            <option value="archived">已归档</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : filteredInstructions.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">暂无作业指导书，点击上方按钮创建</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInstructions.map((instruction) => (
              <div
                key={instruction.id}
                className="bg-white rounded-lg p-6 border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  {getStatusBadge(instruction.status)}
                </div>

                {instruction.process_name && (
                  <div className="mb-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200">
                      {instruction.process_name}
                    </span>
                  </div>
                )}

                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
                  {instruction.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2 h-10">
                  {instruction.description || '暂无描述'}
                </p>

                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4 pb-4 border-b border-gray-100">
                  <span>版本 {instruction.version}</span>
                  <span>•</span>
                  <span>{formatDate(instruction.updated_at)}</span>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      onClick={() => handleViewDetail(instruction)}
                      className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      查看
                    </button>
                    <button
                      onClick={() => handleShare(instruction)}
                      className="flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      <Share2 className="w-4 h-4" />
                      分享
                    </button>
                    <button
                      onClick={() => handleEdit(instruction)}
                      className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Edit className="w-4 h-4" />
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(instruction.id!)}
                      className="flex items-center justify-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showShareDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowShareDialog(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">分享作业指导书</h3>
              <button
                onClick={() => setShowShareDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              复制以下链接，即可在手机或其他设备上查看这份作业指导书
            </p>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
              />
              <button
                onClick={copyShareUrl}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                复制
              </button>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <ExternalLink className="w-4 h-4" />
              <span>此链接可以在任何设备上访问，无需登录</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
