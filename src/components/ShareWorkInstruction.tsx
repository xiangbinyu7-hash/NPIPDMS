import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Clock, Wrench, AlertCircle, CheckCircle, FileText, ArrowLeft } from 'lucide-react';

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
}

interface WorkInstructionWithSteps extends WorkInstruction {
  steps?: WorkInstructionStep[];
}

interface ShareWorkInstructionProps {
  instructionId: string;
}

export default function ShareWorkInstruction({ instructionId }: ShareWorkInstructionProps) {
  const [instruction, setInstruction] = useState<WorkInstructionWithSteps | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInstruction();
  }, [instructionId]);

  const loadInstruction = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: instructionData, error: instructionError } = await supabase
        .from('work_instructions')
        .select('*')
        .eq('id', instructionId)
        .single();

      if (instructionError) throw instructionError;

      if (!instructionData) {
        setError('作业指导书不存在');
        return;
      }

      const { data: stepsData, error: stepsError } = await supabase
        .from('work_instruction_steps')
        .select('*')
        .eq('instruction_id', instructionId)
        .order('step_number', { ascending: true });

      if (stepsError) throw stepsError;

      setInstruction({
        ...instructionData,
        steps: stepsData || []
      });
    } catch (err) {
      console.error('加载作业指导书失败:', err);
      setError('加载失败，请检查链接是否正确');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !instruction) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">无法加载</h2>
          <p className="text-gray-600 mb-4">{error || '作业指导书不存在'}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-600 text-white p-4 sticky top-0 z-10 shadow-md">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6" />
            <div className="flex-1">
              <h1 className="text-lg font-bold">{instruction.title}</h1>
              <p className="text-sm text-blue-100">标准作业指导书 (SOP)</p>
            </div>
            {getStatusBadge(instruction.status)}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 pb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
          <p className="text-gray-700 mb-4">{instruction.description}</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">版本：</span>
              <span className="text-gray-900 font-medium">{instruction.version}</span>
            </div>
            <div>
              <span className="text-gray-500">更新时间：</span>
              <span className="text-gray-900 font-medium">{formatDate(instruction.updated_at)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {instruction.steps?.map((step, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-4">
                <div className="flex items-center gap-3 text-white">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center font-bold">
                    {step.step_number}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{step.step_title}</h3>
                    {step.duration_seconds > 0 && (
                      <p className="text-sm text-blue-100 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        预计耗时: {step.duration_seconds}秒
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4">
                {step.step_description && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-700">{step.step_description}</p>
                  </div>
                )}

                {step.video_url && (
                  <div className="mb-4 bg-black rounded-lg overflow-hidden">
                    <video src={step.video_url} controls className="w-full" playsInline>
                      您的浏览器不支持视频播放
                    </video>
                  </div>
                )}

                {step.tools.length > 0 && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-blue-600" />
                      工具清单
                    </h4>
                    <ul className="space-y-1">
                      {step.tools.map((tool, i) => (
                        <li key={i} className="text-sm text-gray-700">
                          • {tool.name} {tool.spec && `(${tool.spec})`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {step.key_points.length > 0 && (
                  <div className="mb-4 p-4 bg-orange-50 rounded-lg border border-orange-100">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-600" />
                      作业要点
                    </h4>
                    <ul className="space-y-2">
                      {step.key_points.map((point, i) => (
                        <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs text-white flex-shrink-0 ${
                            point.priority === 'high' ? 'bg-red-500' :
                            point.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                          }`}>
                            {point.priority === 'high' ? '高' : point.priority === 'medium' ? '中' : '低'}
                          </span>
                          <span>{point.point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {Object.keys(step.parameters).length > 0 && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">工艺参数</h4>
                    <div className="space-y-1">
                      {Object.entries(step.parameters).map(([key, value]) => (
                        <div key={key} className="text-sm text-gray-700">
                          <span className="text-gray-500 font-medium">{key}:</span> {value}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {step.quality_checkpoints.length > 0 && (
                  <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-100">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      质量检查点
                    </h4>
                    <ul className="space-y-1">
                      {step.quality_checkpoints.map((check, i) => (
                        <li key={i} className="text-sm text-gray-700">
                          • {check.item}: {check.standard}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {step.safety_notes && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      安全注意事项
                    </h4>
                    <p className="text-sm text-red-600">{step.safety_notes}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>NPI & 工艺开发管理系统</p>
          <p className="mt-1">本文档仅供内部使用</p>
        </div>
      </div>
    </div>
  );
}
