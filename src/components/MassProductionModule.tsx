import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MassProduction } from '../types';
import { Factory, Save, Plus, X } from 'lucide-react';

interface MassProductionModuleProps {
  configurationId: string;
}

export default function MassProductionModule({ configurationId }: MassProductionModuleProps) {
  const [massProduction, setMassProduction] = useState<MassProduction | null>(null);
  const [finalProcessFlowUrl, setFinalProcessFlowUrl] = useState('');
  const [productionSopUrl, setProductionSopUrl] = useState('');
  const [finalPfmeaUrl, setFinalPfmeaUrl] = useState('');
  const [finalControlPlanUrl, setFinalControlPlanUrl] = useState('');
  const [optimizationProjects, setOptimizationProjects] = useState<Array<{ title: string; description: string }>>([]);
  const [status, setStatus] = useState<'planning' | 'in_progress' | 'completed'>('planning');
  const [startDate, setStartDate] = useState('');
  const [loading, setLoading] = useState(false);

  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');

  useEffect(() => {
    loadMassProduction();
  }, [configurationId]);

  const loadMassProduction = async () => {
    const { data } = await supabase
      .from('mass_production')
      .select('*')
      .eq('configuration_id', configurationId)
      .maybeSingle();

    if (data) {
      setMassProduction(data);
      setFinalProcessFlowUrl(data.final_process_flow_url || '');
      setProductionSopUrl(data.production_sop_url || '');
      setFinalPfmeaUrl(data.final_pfmea_url || '');
      setFinalControlPlanUrl(data.final_control_plan_url || '');
      setOptimizationProjects(data.optimization_projects || []);
      setStatus(data.status || 'planning');
      setStartDate(data.start_date || '');
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const dataToSave = {
        configuration_id: configurationId,
        final_process_flow_url: finalProcessFlowUrl,
        production_sop_url: productionSopUrl,
        final_pfmea_url: finalPfmeaUrl,
        final_control_plan_url: finalControlPlanUrl,
        optimization_projects: optimizationProjects,
        status,
        start_date: startDate || null,
        updated_at: new Date().toISOString(),
      };

      if (massProduction) {
        await supabase
          .from('mass_production')
          .update(dataToSave)
          .eq('id', massProduction.id);
      } else {
        await supabase.from('mass_production').insert([dataToSave]);
      }
      loadMassProduction();
      alert('保存成功！');
    } catch (error) {
      alert('保存失败');
    } finally {
      setLoading(false);
    }
  };

  const addOptimizationProject = () => {
    if (newProjectTitle.trim()) {
      setOptimizationProjects([
        ...optimizationProjects,
        { title: newProjectTitle, description: newProjectDescription },
      ]);
      setNewProjectTitle('');
      setNewProjectDescription('');
    }
  };

  const removeOptimizationProject = (index: number) => {
    setOptimizationProjects(optimizationProjects.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <Factory size={24} />
        量产管理
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            确定的工艺流程图 URL
          </label>
          <input
            type="text"
            value={finalProcessFlowUrl}
            onChange={(e) => setFinalProcessFlowUrl(e.target.value)}
            placeholder="输入确定的工艺流程图文件URL"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            量产SOP URL
          </label>
          <input
            type="text"
            value={productionSopUrl}
            onChange={(e) => setProductionSopUrl(e.target.value)}
            placeholder="输入量产SOP文件URL"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            PFMEA URL
          </label>
          <input
            type="text"
            value={finalPfmeaUrl}
            onChange={(e) => setFinalPfmeaUrl(e.target.value)}
            placeholder="输入PFMEA文件URL"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CP控制计划 URL
          </label>
          <input
            type="text"
            value={finalControlPlanUrl}
            onChange={(e) => setFinalControlPlanUrl(e.target.value)}
            placeholder="输入CP控制计划文件URL"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            状态
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="planning">计划中</option>
            <option value="in_progress">进行中</option>
            <option value="completed">已完成</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            开始日期
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">优化项目</h3>

        <div className="bg-gray-50 p-4 rounded-lg mb-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">项目标题</label>
            <input
              type="text"
              value={newProjectTitle}
              onChange={(e) => setNewProjectTitle(e.target.value)}
              placeholder="输入优化项目标题"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">项目描述</label>
            <textarea
              value={newProjectDescription}
              onChange={(e) => setNewProjectDescription(e.target.value)}
              placeholder="输入优化项目描述"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={addOptimizationProject}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Plus size={18} />
            添加优化项目
          </button>
        </div>

        {optimizationProjects.length > 0 && (
          <div className="space-y-3">
            {optimizationProjects.map((project, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">{project.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                  </div>
                  <button
                    onClick={() => removeOptimizationProject(index)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
      >
        <Save size={20} />
        {loading ? '保存中...' : '保存'}
      </button>
    </div>
  );
}
