import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Factory, Plus, Calendar, Package, TrendingUp, Eye, X, Save } from 'lucide-react';
import ProductionBatchDetail from './ProductionBatchDetail';

interface ProductionBatch {
  id: string;
  batch_number: string;
  production_date: string;
  planned_quantity: number;
  actual_quantity: number;
  qualified_quantity: number;
  defect_rate: number;
  notes: string;
  status: string;
  created_at: string;
}

interface MassProductionModuleProps {
  configurationId: string;
}

export default function MassProductionModule({ configurationId }: MassProductionModuleProps) {
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    batch_number: '',
    production_date: new Date().toISOString().split('T')[0],
    planned_quantity: 0,
    notes: ''
  });

  useEffect(() => {
    loadBatches();
  }, [configurationId]);

  const loadBatches = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('production_batches')
        .select('*')
        .eq('configuration_id', configurationId)
        .order('production_date', { ascending: false });

      if (error) throw error;
      setBatches(data || []);
    } catch (error) {
      console.error('Error loading batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBatch = async () => {
    try {
      const { error } = await supabase
        .from('production_batches')
        .insert([{
          configuration_id: configurationId,
          batch_number: formData.batch_number,
          production_date: formData.production_date,
          planned_quantity: formData.planned_quantity,
          notes: formData.notes,
          status: 'planning',
          actual_quantity: 0,
          qualified_quantity: 0,
          defect_rate: 0
        }]);

      if (error) throw error;
      setShowForm(false);
      setFormData({
        batch_number: '',
        production_date: new Date().toISOString().split('T')[0],
        planned_quantity: 0,
        notes: ''
      });
      await loadBatches();
    } catch (error) {
      console.error('Error creating batch:', error);
      alert('创建失败，请重试');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      planning: { bg: 'bg-gray-100', text: 'text-gray-700', label: '计划中' },
      in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', label: '进行中' },
      completed: { bg: 'bg-green-100', text: 'text-green-700', label: '已完成' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: '已取消' }
    };
    const badge = badges[status] || badges.planning;
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  if (selectedBatchId) {
    return (
      <ProductionBatchDetail
        batchId={selectedBatchId}
        onBack={() => {
          setSelectedBatchId(null);
          loadBatches();
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Factory size={24} />
            量产管理
          </h2>
          <p className="text-sm text-gray-600 mt-1">记录每次量产的详细信息，包括不良品、异常问题、补料耗损、优化和变更等</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
        >
          <Plus className="w-5 h-5" />
          新建量产批次
        </button>
      </div>

      {batches.length === 0 ? (
        <div className="text-center py-20">
          <Factory className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-6">暂无量产批次记录</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            创建第一个量产批次
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4">
            {batches.map((batch) => (
              <div
                key={batch.id}
                className="border border-gray-200 rounded-lg p-6 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
                onClick={() => setSelectedBatchId(batch.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">批次 {batch.batch_number}</h3>
                      {getStatusBadge(batch.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {batch.production_date}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBatchId(batch.id);
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    查看详情
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Package className="w-4 h-4 text-gray-500" />
                      <span className="text-xs text-gray-500">计划产量</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{batch.planned_quantity}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Package className="w-4 h-4 text-blue-600" />
                      <span className="text-xs text-blue-600">实际产量</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-700">{batch.actual_quantity}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="text-xs text-green-600">合格产量</span>
                    </div>
                    <p className="text-2xl font-bold text-green-700">{batch.qualified_quantity}</p>
                  </div>
                  <div className={`rounded-lg p-4 ${batch.defect_rate > 5 ? 'bg-red-50' : batch.defect_rate > 2 ? 'bg-orange-50' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Package className={`w-4 h-4 ${batch.defect_rate > 5 ? 'text-red-600' : batch.defect_rate > 2 ? 'text-orange-600' : 'text-gray-500'}`} />
                      <span className={`text-xs ${batch.defect_rate > 5 ? 'text-red-600' : batch.defect_rate > 2 ? 'text-orange-600' : 'text-gray-500'}`}>不良率</span>
                    </div>
                    <p className={`text-2xl font-bold ${batch.defect_rate > 5 ? 'text-red-700' : batch.defect_rate > 2 ? 'text-orange-700' : 'text-gray-900'}`}>
                      {batch.defect_rate}%
                    </p>
                  </div>
                </div>

                {batch.notes && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 line-clamp-2">{batch.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">提示：</span>点击任意批次卡片可查看和管理该批次的详细信息，包括不良品记录、异常问题、待补充物品、补料耗损、优化记录和工艺物料变更。
            </p>
          </div>
        </>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">新建量产批次</h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  批次号 *
                </label>
                <input
                  type="text"
                  value={formData.batch_number}
                  onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例如：20250122-001"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  生产日期 *
                </label>
                <input
                  type="date"
                  value={formData.production_date}
                  onChange={(e) => setFormData({ ...formData, production_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  计划产量 *
                </label>
                <input
                  type="number"
                  value={formData.planned_quantity}
                  onChange={(e) => setFormData({ ...formData, planned_quantity: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="输入计划产量"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  备注
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="输入备注信息"
                />
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateBatch}
                disabled={!formData.batch_number || !formData.production_date}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4" />
                创建批次
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
