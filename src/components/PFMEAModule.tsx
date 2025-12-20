import React, { useState, useEffect } from 'react';
import { AlertTriangle, Plus, Filter, Download, Edit, Trash2, X, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx';

interface PFMEAItem {
  id?: string;
  configuration_id: string;
  process_id: string;
  process_name?: string;
  failure_mode: string;
  failure_effects: string;
  failure_causes: string;
  current_controls: string;
  severity: number;
  occurrence: number;
  detection: number;
  rpn?: number;
  recommended_actions: string;
  responsible_person: string;
  target_date: string;
  actions_taken: string;
  status: 'pending' | 'in_progress' | 'overdue' | 'completed';
  severity_after?: number;
  occurrence_after?: number;
  detection_after?: number;
  rpn_after?: number;
  created_at?: string;
  updated_at?: string;
}

interface Process {
  id: string;
  process_name: string;
}

interface PFMEAModuleProps {
  configurationId: string;
  componentId?: string;
}

export default function PFMEAModule({ configurationId, componentId }: PFMEAModuleProps) {
  const [pfmeaItems, setPfmeaItems] = useState<PFMEAItem[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<PFMEAItem | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const [formData, setFormData] = useState<PFMEAItem>({
    configuration_id: configurationId,
    process_id: '',
    failure_mode: '',
    failure_effects: '',
    failure_causes: '',
    current_controls: '',
    severity: 5,
    occurrence: 5,
    detection: 5,
    recommended_actions: '',
    responsible_person: '',
    target_date: '',
    actions_taken: '',
    status: 'pending'
  });

  useEffect(() => {
    loadData();
  }, [configurationId, componentId]);

  useEffect(() => {
    checkOverdueItems();
  }, [pfmeaItems]);

  const loadData = async () => {
    setLoading(true);
    try {
      let processQuery = supabase
        .from('process_sequences')
        .select('id, process_name')
        .eq('configuration_id', configurationId);

      if (componentId) {
        processQuery = processQuery.eq('component_id', componentId);
      }

      const { data: processData, error: processError } = await processQuery.order('order_index');

      if (processError) throw processError;
      setProcesses(processData || []);

      let pfmeaQuery = supabase
        .from('pfmea_items')
        .select(`
          *,
          process:process_sequences(process_name)
        `)
        .eq('configuration_id', configurationId);

      if (componentId) {
        const processIds = processData?.map(p => p.id) || [];
        if (processIds.length > 0) {
          pfmeaQuery = pfmeaQuery.in('process_id', processIds);
        }
      }

      const { data: pfmeaData, error: pfmeaError } = await pfmeaQuery.order('rpn', { ascending: false });

      if (pfmeaError) throw pfmeaError;

      const itemsWithProcessName = (pfmeaData || []).map(item => ({
        ...item,
        process_name: item.process?.process_name || ''
      }));

      setPfmeaItems(itemsWithProcessName);
    } catch (error) {
      console.error('Error loading PFMEA data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkOverdueItems = async () => {
    const today = new Date().toISOString().split('T')[0];
    const overdueItems = pfmeaItems.filter(
      item => item.target_date && item.target_date < today && item.status !== 'completed'
    );

    for (const item of overdueItems) {
      if (item.status !== 'overdue') {
        await supabase
          .from('pfmea_items')
          .update({ status: 'overdue' })
          .eq('id', item.id);
      }
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({
      configuration_id: configurationId,
      process_id: '',
      failure_mode: '',
      failure_effects: '',
      failure_causes: '',
      current_controls: '',
      severity: 5,
      occurrence: 5,
      detection: 5,
      recommended_actions: '',
      responsible_person: '',
      target_date: '',
      actions_taken: '',
      status: 'pending'
    });
    setShowForm(true);
  };

  const handleEdit = (item: PFMEAItem) => {
    setEditingItem(item);
    setFormData(item);
    setShowForm(true);
  };

  const handleSave = async () => {
    try {
      const dataToSave = {
        configuration_id: configurationId,
        process_id: formData.process_id,
        failure_mode: formData.failure_mode,
        failure_effects: formData.failure_effects,
        failure_causes: formData.failure_causes,
        current_controls: formData.current_controls,
        severity: formData.severity,
        occurrence: formData.occurrence,
        detection: formData.detection,
        recommended_actions: formData.recommended_actions,
        responsible_person: formData.responsible_person,
        target_date: formData.target_date || null,
        actions_taken: formData.actions_taken,
        status: formData.status,
        severity_after: formData.severity_after || null,
        occurrence_after: formData.occurrence_after || null,
        detection_after: formData.detection_after || null,
        rpn_after: formData.severity_after && formData.occurrence_after && formData.detection_after
          ? formData.severity_after * formData.occurrence_after * formData.detection_after
          : null
      };

      if (editingItem?.id) {
        const { error } = await supabase
          .from('pfmea_items')
          .update(dataToSave)
          .eq('id', editingItem.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('pfmea_items')
          .insert([dataToSave]);

        if (error) throw error;
      }

      setShowForm(false);
      await loadData();
    } catch (error) {
      console.error('Error saving PFMEA item:', error);
      alert('保存失败，请重试');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此风险项吗？')) return;

    try {
      const { error } = await supabase
        .from('pfmea_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Error deleting PFMEA item:', error);
      alert('删除失败，请重试');
    }
  };

  const handleExport = () => {
    const exportData = filteredItems.map(item => ({
      '工序': item.process_name,
      '失效模式': item.failure_mode,
      '失效后果': item.failure_effects,
      '失效原因': item.failure_causes,
      '现有控制': item.current_controls,
      '严重度(S)': item.severity,
      '发生度(O)': item.occurrence,
      '探测度(D)': item.detection,
      'RPN': item.rpn,
      '建议措施': item.recommended_actions,
      '责任人': item.responsible_person,
      '截止日期': item.target_date,
      '已采取措施': item.actions_taken,
      '状态': getStatusText(item.status)
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'PFMEA');
    XLSX.writeFile(wb, 'PFMEA风险清单.xlsx');
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: '待开始',
      in_progress: '进行中',
      overdue: '逾期',
      completed: '已完成'
    };
    return statusMap[status] || status;
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string }> = {
      pending: { bg: 'bg-gray-100', text: 'text-gray-700' },
      in_progress: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
      overdue: { bg: 'bg-red-100', text: 'text-red-700' },
      completed: { bg: 'bg-green-100', text: 'text-green-700' }
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${badge.bg} ${badge.text}`}>
        {getStatusText(status)}
      </span>
    );
  };

  const getRPNColor = (rpn: number) => {
    if (rpn > 150) return 'text-red-600 font-bold';
    if (rpn > 100) return 'text-orange-600 font-semibold';
    return 'text-gray-700';
  };

  const filteredItems = pfmeaItems.filter(item => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'high_risk') return (item.rpn || 0) > 100;
    if (filterStatus === 'critical') return (item.rpn || 0) > 150;
    return item.status === filterStatus;
  });

  const highRiskCount = pfmeaItems.filter(item => (item.rpn || 0) > 100).length;
  const criticalRiskCount = pfmeaItems.filter(item => (item.rpn || 0) > 150).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 border-b border-gray-200">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">PFMEA 风险管理与改善</h2>
            <p className="text-sm text-gray-600">
              识别潜在失效模式，分析其后果，并制定相应的预防和探测措施。重点关注 RPN &gt; 100 的高风险项。
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-900">风险列表</h3>
            {criticalRiskCount > 0 && (
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                RPN &gt; 150: {criticalRiskCount}项
              </span>
            )}
            {highRiskCount > 0 && (
              <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                RPN &gt; 100: {highRiskCount}项
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4" />
              筛选
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              导出
            </button>
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              新增风险项
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1 rounded-lg text-sm ${filterStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
              >
                全部
              </button>
              <button
                onClick={() => setFilterStatus('critical')}
                className={`px-3 py-1 rounded-lg text-sm ${filterStatus === 'critical' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
              >
                严重风险 (RPN &gt; 150)
              </button>
              <button
                onClick={() => setFilterStatus('high_risk')}
                className={`px-3 py-1 rounded-lg text-sm ${filterStatus === 'high_risk' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
              >
                高风险 (RPN &gt; 100)
              </button>
              <button
                onClick={() => setFilterStatus('pending')}
                className={`px-3 py-1 rounded-lg text-sm ${filterStatus === 'pending' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
              >
                待开始
              </button>
              <button
                onClick={() => setFilterStatus('in_progress')}
                className={`px-3 py-1 rounded-lg text-sm ${filterStatus === 'in_progress' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
              >
                进行中
              </button>
              <button
                onClick={() => setFilterStatus('overdue')}
                className={`px-3 py-1 rounded-lg text-sm ${filterStatus === 'overdue' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
              >
                逾期
              </button>
            </div>
          </div>
        )}

        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">暂无风险项</p>
            <button
              onClick={handleAdd}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              创建第一个风险项
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-y border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">工序</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">失效模式</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">严重度 (S)</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">发生度 (O)</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">探测度 (D)</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">RPN</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">责任人</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">截止日期</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">状态</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                        {item.process_name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.failure_mode}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-700 text-sm font-semibold">
                        {item.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-700 text-sm font-semibold">
                        {item.occurrence}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-700 text-sm font-semibold">
                        {item.detection}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-lg font-bold ${getRPNColor(item.rpn || 0)}`}>
                        {item.rpn}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.responsible_person}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.target_date || '-'}</td>
                    <td className="px-4 py-3">{getStatusBadge(item.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id!)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-800">
            <span className="font-semibold">说明：</span>RPN (风险优先数) = 严重度 × 发生度 × 探测度。RPN &gt; 150 需立即采取措施。
          </p>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                {editingItem ? '编辑风险项' : '新增风险项'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">关联工序 *</label>
                  <select
                    value={formData.process_id}
                    onChange={(e) => setFormData({ ...formData, process_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">请选择工序</option>
                    {processes.map((process) => (
                      <option key={process.id} value={process.id}>
                        {process.process_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">失效模式 *</label>
                  <input
                    type="text"
                    value={formData.failure_mode}
                    onChange={(e) => setFormData({ ...formData, failure_mode: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="例如：贴合对位偏差"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">失效后果</label>
                <textarea
                  value={formData.failure_effects}
                  onChange={(e) => setFormData({ ...formData, failure_effects: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="描述失效可能导致的后果"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">失效原因</label>
                <textarea
                  value={formData.failure_causes}
                  onChange={(e) => setFormData({ ...formData, failure_causes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="描述导致失效的可能原因"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">现有控制</label>
                <textarea
                  value={formData.current_controls}
                  onChange={(e) => setFormData({ ...formData, current_controls: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="描述当前的预防和探测措施"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    严重度 (S) *
                    <span className="text-xs text-gray-500 font-normal ml-1">(1-10)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    发生度 (O) *
                    <span className="text-xs text-gray-500 font-normal ml-1">(1-10)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.occurrence}
                    onChange={(e) => setFormData({ ...formData, occurrence: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    探测度 (D) *
                    <span className="text-xs text-gray-500 font-normal ml-1">(1-10)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.detection}
                    onChange={(e) => setFormData({ ...formData, detection: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">当前 RPN：</span>
                  <span className={`text-lg ml-2 ${getRPNColor(formData.severity * formData.occurrence * formData.detection)}`}>
                    {formData.severity * formData.occurrence * formData.detection}
                  </span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">建议措施</label>
                <textarea
                  value={formData.recommended_actions}
                  onChange={(e) => setFormData({ ...formData, recommended_actions: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="描述建议采取的改善措施"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">责任人</label>
                  <input
                    type="text"
                    value={formData.responsible_person}
                    onChange={(e) => setFormData({ ...formData, responsible_person: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="负责人姓名"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">截止日期</label>
                  <input
                    type="date"
                    value={formData.target_date}
                    onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">状态</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="pending">待开始</option>
                    <option value="in_progress">进行中</option>
                    <option value="completed">已完成</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">已采取措施</label>
                <textarea
                  value={formData.actions_taken}
                  onChange={(e) => setFormData({ ...formData, actions_taken: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="描述已经实施的改善措施"
                />
              </div>

              {formData.actions_taken && (
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-4">改善后预期</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        改善后严重度
                        <span className="text-xs text-gray-500 font-normal ml-1">(1-10)</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={formData.severity_after || ''}
                        onChange={(e) => setFormData({ ...formData, severity_after: parseInt(e.target.value) || undefined })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        改善后发生度
                        <span className="text-xs text-gray-500 font-normal ml-1">(1-10)</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={formData.occurrence_after || ''}
                        onChange={(e) => setFormData({ ...formData, occurrence_after: parseInt(e.target.value) || undefined })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        改善后探测度
                        <span className="text-xs text-gray-500 font-normal ml-1">(1-10)</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={formData.detection_after || ''}
                        onChange={(e) => setFormData({ ...formData, detection_after: parseInt(e.target.value) || undefined })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  {formData.severity_after && formData.occurrence_after && formData.detection_after && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        <span className="font-semibold">改善后 RPN：</span>
                        <span className="text-lg ml-2 font-bold">
                          {formData.severity_after * formData.occurrence_after * formData.detection_after}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
