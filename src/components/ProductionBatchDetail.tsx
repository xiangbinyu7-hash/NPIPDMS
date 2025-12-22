import React, { useState, useEffect } from 'react';
import {
  AlertCircle, Package, Wrench, Box, TrendingUp, FileEdit,
  Plus, Edit, Trash2, Save, X, ArrowLeft
} from 'lucide-react';
import { supabase } from '../lib/supabase';

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
}

interface Defect {
  id?: string;
  defect_type: string;
  quantity: number;
  description: string;
  root_cause: string;
  corrective_action: string;
}

interface Issue {
  id?: string;
  issue_type: string;
  description: string;
  severity: string;
  status: string;
  responsible_person: string;
  resolution: string;
}

interface Tool {
  id?: string;
  item_name: string;
  category: string;
  quantity: number;
  priority: string;
  status: string;
  notes: string;
}

interface Material {
  id?: string;
  material_name: string;
  material_type: string;
  planned_quantity: number;
  actual_quantity: number;
  wastage: number;
  unit: string;
  notes: string;
}

interface Optimization {
  id?: string;
  optimization_type: string;
  title: string;
  description: string;
  status: string;
  expected_benefit: string;
  actual_benefit: string;
}

interface Change {
  id?: string;
  change_type: string;
  change_description: string;
  reason: string;
  approval_status: string;
  implemented_date: string;
  notes: string;
}

interface ProductionBatchDetailProps {
  batchId: string;
  onBack: () => void;
}

type TabType = 'overview' | 'defects' | 'issues' | 'tools' | 'materials' | 'optimizations' | 'changes';

export default function ProductionBatchDetail({ batchId, onBack }: ProductionBatchDetailProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [batch, setBatch] = useState<ProductionBatch | null>(null);
  const [defects, setDefects] = useState<Defect[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [optimizations, setOptimizations] = useState<Optimization[]>([]);
  const [changes, setChanges] = useState<Change[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [batchId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: batchData } = await supabase
        .from('production_batches')
        .select('*')
        .eq('id', batchId)
        .single();

      if (batchData) setBatch(batchData);

      const { data: defectsData } = await supabase
        .from('production_defects')
        .select('*')
        .eq('batch_id', batchId);
      setDefects(defectsData || []);

      const { data: issuesData } = await supabase
        .from('production_issues')
        .select('*')
        .eq('batch_id', batchId);
      setIssues(issuesData || []);

      const { data: toolsData } = await supabase
        .from('production_tools_needed')
        .select('*')
        .eq('batch_id', batchId);
      setTools(toolsData || []);

      const { data: materialsData } = await supabase
        .from('production_materials')
        .select('*')
        .eq('batch_id', batchId);
      setMaterials(materialsData || []);

      const { data: optimizationsData } = await supabase
        .from('production_optimizations')
        .select('*')
        .eq('batch_id', batchId);
      setOptimizations(optimizationsData || []);

      const { data: changesData } = await supabase
        .from('production_changes')
        .select('*')
        .eq('batch_id', batchId);
      setChanges(changesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview' as TabType, name: '批次概况', icon: Package, color: 'blue' },
    { id: 'defects' as TabType, name: '不良品记录', icon: AlertCircle, color: 'red' },
    { id: 'issues' as TabType, name: '异常问题', icon: AlertCircle, color: 'orange' },
    { id: 'tools' as TabType, name: '待补充物品', icon: Wrench, color: 'green' },
    { id: 'materials' as TabType, name: '补料/耗损', icon: Box, color: 'purple' },
    { id: 'optimizations' as TabType, name: '优化记录', icon: TrendingUp, color: 'teal' },
    { id: 'changes' as TabType, name: '工艺/物料变更', icon: FileEdit, color: 'indigo' }
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-gray-500">加载中...</div></div>;
  }

  if (!batch) {
    return <div className="text-center py-12 text-gray-500">未找到批次信息</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回列表
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">批次 {batch.batch_number}</h2>
          <p className="text-sm text-gray-600">生产日期：{batch.production_date}</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.name}
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {activeTab === 'overview' && <OverviewTab batch={batch} setBatch={setBatch} loadData={loadData} />}
        {activeTab === 'defects' && <DefectsTab batchId={batchId} defects={defects} loadData={loadData} />}
        {activeTab === 'issues' && <IssuesTab batchId={batchId} issues={issues} loadData={loadData} />}
        {activeTab === 'tools' && <ToolsTab batchId={batchId} tools={tools} loadData={loadData} />}
        {activeTab === 'materials' && <MaterialsTab batchId={batchId} materials={materials} loadData={loadData} />}
        {activeTab === 'optimizations' && <OptimizationsTab batchId={batchId} optimizations={optimizations} loadData={loadData} />}
        {activeTab === 'changes' && <ChangesTab batchId={batchId} changes={changes} loadData={loadData} />}
      </div>
    </div>
  );
}

function OverviewTab({ batch, setBatch, loadData }: any) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ ...batch });

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('production_batches')
        .update({
          planned_quantity: formData.planned_quantity,
          actual_quantity: formData.actual_quantity,
          qualified_quantity: formData.qualified_quantity,
          defect_rate: formData.defect_rate,
          notes: formData.notes,
          status: formData.status
        })
        .eq('id', batch.id);

      if (error) throw error;
      setEditing(false);
      await loadData();
    } catch (error) {
      console.error('Error updating batch:', error);
      alert('保存失败');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">批次概况</h3>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
          >
            <Edit className="w-4 h-4" />
            编辑
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditing(false);
                setFormData({ ...batch });
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Save className="w-4 h-4" />
              保存
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">批次号</label>
          <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">{batch.batch_number}</div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">生产日期</label>
          <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">{batch.production_date}</div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">计划产量</label>
          {editing ? (
            <input
              type="number"
              value={formData.planned_quantity}
              onChange={(e) => setFormData({ ...formData, planned_quantity: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          ) : (
            <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">{batch.planned_quantity}</div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">实际产量</label>
          {editing ? (
            <input
              type="number"
              value={formData.actual_quantity}
              onChange={(e) => setFormData({ ...formData, actual_quantity: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          ) : (
            <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">{batch.actual_quantity}</div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">合格产量</label>
          {editing ? (
            <input
              type="number"
              value={formData.qualified_quantity}
              onChange={(e) => setFormData({ ...formData, qualified_quantity: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          ) : (
            <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">{batch.qualified_quantity}</div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">不良率 (%)</label>
          {editing ? (
            <input
              type="number"
              step="0.01"
              value={formData.defect_rate}
              onChange={(e) => setFormData({ ...formData, defect_rate: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          ) : (
            <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">{batch.defect_rate}%</div>
          )}
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">状态</label>
          {editing ? (
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="planning">计划中</option>
              <option value="in_progress">进行中</option>
              <option value="completed">已完成</option>
              <option value="cancelled">已取消</option>
            </select>
          ) : (
            <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">{batch.status}</div>
          )}
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">备注</label>
          {editing ? (
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          ) : (
            <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900 min-h-[80px]">{batch.notes || '无'}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function DefectsTab({ batchId, defects, loadData }: any) {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Defect | null>(null);
  const [formData, setFormData] = useState<Defect>({
    defect_type: '',
    quantity: 1,
    description: '',
    root_cause: '',
    corrective_action: ''
  });

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({ defect_type: '', quantity: 1, description: '', root_cause: '', corrective_action: '' });
    setShowForm(true);
  };

  const handleEdit = (item: Defect) => {
    setEditingItem(item);
    setFormData(item);
    setShowForm(true);
  };

  const handleSave = async () => {
    try {
      if (editingItem?.id) {
        await supabase.from('production_defects').update(formData).eq('id', editingItem.id);
      } else {
        await supabase.from('production_defects').insert([{ ...formData, batch_id: batchId }]);
      }
      setShowForm(false);
      await loadData();
    } catch (error) {
      console.error('Error saving defect:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除吗？')) return;
    try {
      await supabase.from('production_defects').delete().eq('id', id);
      await loadData();
    } catch (error) {
      console.error('Error deleting defect:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">不良品记录</h3>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          <Plus className="w-4 h-4" />
          添加不良品记录
        </button>
      </div>

      {defects.length === 0 ? (
        <div className="text-center py-12 text-gray-500">暂无不良品记录</div>
      ) : (
        <div className="space-y-3">
          {defects.map((item: Defect) => (
            <div key={item.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="font-semibold text-gray-900">{item.defect_type}</span>
                  <span className="ml-2 px-2 py-1 bg-red-100 text-red-700 text-xs rounded">数量: {item.quantity}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(item)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(item.id!)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-2">{item.description}</p>
              {item.root_cause && (
                <p className="text-sm text-gray-600"><span className="font-medium">根本原因：</span>{item.root_cause}</p>
              )}
              {item.corrective_action && (
                <p className="text-sm text-gray-600"><span className="font-medium">纠正措施：</span>{item.corrective_action}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">{editingItem ? '编辑不良品' : '添加不良品'}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">不良类型 *</label>
                <input
                  type="text"
                  value={formData.defect_type}
                  onChange={(e) => setFormData({ ...formData, defect_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">数量 *</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">根本原因</label>
                <textarea
                  value={formData.root_cause}
                  onChange={(e) => setFormData({ ...formData, root_cause: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">纠正措施</label>
                <textarea
                  value={formData.corrective_action}
                  onChange={(e) => setFormData({ ...formData, corrective_action: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100">
                取消
              </button>
              <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
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

function IssuesTab({ batchId, issues, loadData }: any) {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Issue | null>(null);
  const [formData, setFormData] = useState<Issue>({
    issue_type: '',
    description: '',
    severity: 'medium',
    status: 'open',
    responsible_person: '',
    resolution: ''
  });

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({ issue_type: '', description: '', severity: 'medium', status: 'open', responsible_person: '', resolution: '' });
    setShowForm(true);
  };

  const handleEdit = (item: Issue) => {
    setEditingItem(item);
    setFormData(item);
    setShowForm(true);
  };

  const handleSave = async () => {
    try {
      if (editingItem?.id) {
        await supabase.from('production_issues').update(formData).eq('id', editingItem.id);
      } else {
        await supabase.from('production_issues').insert([{ ...formData, batch_id: batchId }]);
      }
      setShowForm(false);
      await loadData();
    } catch (error) {
      console.error('Error saving issue:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除吗？')) return;
    try {
      await supabase.from('production_issues').delete().eq('id', id);
      await loadData();
    } catch (error) {
      console.error('Error deleting issue:', error);
    }
  };

  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      low: 'bg-green-100 text-green-700',
      medium: 'bg-yellow-100 text-yellow-700',
      high: 'bg-orange-100 text-orange-700',
      critical: 'bg-red-100 text-red-700'
    };
    return <span className={`px-2 py-1 rounded text-xs ${colors[severity]}`}>{severity}</span>;
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-red-100 text-red-700',
      in_progress: 'bg-yellow-100 text-yellow-700',
      resolved: 'bg-blue-100 text-blue-700',
      closed: 'bg-green-100 text-green-700'
    };
    const labels: Record<string, string> = {
      open: '待处理',
      in_progress: '处理中',
      resolved: '已解决',
      closed: '已关闭'
    };
    return <span className={`px-2 py-1 rounded text-xs ${colors[status]}`}>{labels[status]}</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">异常问题追踪</h3>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
        >
          <Plus className="w-4 h-4" />
          添加异常问题
        </button>
      </div>

      {issues.length === 0 ? (
        <div className="text-center py-12 text-gray-500">暂无异常问题</div>
      ) : (
        <div className="space-y-3">
          {issues.map((item: Issue) => (
            <div key={item.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{item.issue_type}</span>
                  {getSeverityBadge(item.severity)}
                  {getStatusBadge(item.status)}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(item)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(item.id!)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-2">{item.description}</p>
              {item.responsible_person && (
                <p className="text-sm text-gray-600"><span className="font-medium">责任人：</span>{item.responsible_person}</p>
              )}
              {item.resolution && (
                <p className="text-sm text-gray-600"><span className="font-medium">解决方案：</span>{item.resolution}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">{editingItem ? '编辑异常问题' : '添加异常问题'}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">问题类型 *</label>
                <input
                  type="text"
                  value={formData.issue_type}
                  onChange={(e) => setFormData({ ...formData, issue_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">问题描述 *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">严重程度</label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="low">低</option>
                    <option value="medium">中</option>
                    <option value="high">高</option>
                    <option value="critical">严重</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">状态</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="open">待处理</option>
                    <option value="in_progress">处理中</option>
                    <option value="resolved">已解决</option>
                    <option value="closed">已关闭</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">责任人</label>
                <input
                  type="text"
                  value={formData.responsible_person}
                  onChange={(e) => setFormData({ ...formData, responsible_person: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">解决方案</label>
                <textarea
                  value={formData.resolution}
                  onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100">
                取消
              </button>
              <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
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

function ToolsTab({ batchId, tools, loadData }: any) {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Tool | null>(null);
  const [formData, setFormData] = useState<Tool>({
    item_name: '',
    category: 'tool',
    quantity: 1,
    priority: 'medium',
    status: 'pending',
    notes: ''
  });

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({ item_name: '', category: 'tool', quantity: 1, priority: 'medium', status: 'pending', notes: '' });
    setShowForm(true);
  };

  const handleEdit = (item: Tool) => {
    setEditingItem(item);
    setFormData(item);
    setShowForm(true);
  };

  const handleSave = async () => {
    try {
      if (editingItem?.id) {
        await supabase.from('production_tools_needed').update(formData).eq('id', editingItem.id);
      } else {
        await supabase.from('production_tools_needed').insert([{ ...formData, batch_id: batchId }]);
      }
      setShowForm(false);
      await loadData();
    } catch (error) {
      console.error('Error saving tool:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除吗？')) return;
    try {
      await supabase.from('production_tools_needed').delete().eq('id', id);
      await loadData();
    } catch (error) {
      console.error('Error deleting tool:', error);
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-100 text-gray-700',
      medium: 'bg-blue-100 text-blue-700',
      high: 'bg-orange-100 text-orange-700',
      urgent: 'bg-red-100 text-red-700'
    };
    const labels: Record<string, string> = {
      low: '低',
      medium: '中',
      high: '高',
      urgent: '紧急'
    };
    return <span className={`px-2 py-1 rounded text-xs ${colors[priority]}`}>{labels[priority]}</span>;
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      ordered: 'bg-blue-100 text-blue-700',
      received: 'bg-green-100 text-green-700',
      cancelled: 'bg-gray-100 text-gray-700'
    };
    const labels: Record<string, string> = {
      pending: '待订购',
      ordered: '已订购',
      received: '已收货',
      cancelled: '已取消'
    };
    return <span className={`px-2 py-1 rounded text-xs ${colors[status]}`}>{labels[status]}</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">待补充工具/物品</h3>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Plus className="w-4 h-4" />
          添加物品
        </button>
      </div>

      {tools.length === 0 ? (
        <div className="text-center py-12 text-gray-500">暂无待补充物品</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-y border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">物品名称</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">类别</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">数量</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">优先级</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">状态</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tools.map((item: Tool) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{item.item_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.category}</td>
                  <td className="px-4 py-3 text-center text-sm text-gray-900">{item.quantity}</td>
                  <td className="px-4 py-3 text-center">{getPriorityBadge(item.priority)}</td>
                  <td className="px-4 py-3 text-center">{getStatusBadge(item.status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleEdit(item)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(item.id!)} className="p-1 text-red-600 hover:bg-red-50 rounded">
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

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">{editingItem ? '编辑物品' : '添加物品'}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">物品名称 *</label>
                <input
                  type="text"
                  value={formData.item_name}
                  onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">类别</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="tool">工具</option>
                    <option value="equipment">设备</option>
                    <option value="material">物料</option>
                    <option value="other">其他</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">数量</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">优先级</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="low">低</option>
                    <option value="medium">中</option>
                    <option value="high">高</option>
                    <option value="urgent">紧急</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">状态</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="pending">待订购</option>
                  <option value="ordered">已订购</option>
                  <option value="received">已收货</option>
                  <option value="cancelled">已取消</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">备注</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 border-t flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100">
                取消
              </button>
              <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
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

function MaterialsTab({ batchId, materials, loadData }: any) {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Material | null>(null);
  const [formData, setFormData] = useState<Material>({
    material_name: '',
    material_type: 'raw',
    planned_quantity: 0,
    actual_quantity: 0,
    wastage: 0,
    unit: '',
    notes: ''
  });

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({ material_name: '', material_type: 'raw', planned_quantity: 0, actual_quantity: 0, wastage: 0, unit: '', notes: '' });
    setShowForm(true);
  };

  const handleEdit = (item: Material) => {
    setEditingItem(item);
    setFormData(item);
    setShowForm(true);
  };

  const handleSave = async () => {
    try {
      if (editingItem?.id) {
        await supabase.from('production_materials').update(formData).eq('id', editingItem.id);
      } else {
        await supabase.from('production_materials').insert([{ ...formData, batch_id: batchId }]);
      }
      setShowForm(false);
      await loadData();
    } catch (error) {
      console.error('Error saving material:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除吗？')) return;
    try {
      await supabase.from('production_materials').delete().eq('id', id);
      await loadData();
    } catch (error) {
      console.error('Error deleting material:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">补料/耗损记录</h3>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <Plus className="w-4 h-4" />
          添加物料记录
        </button>
      </div>

      {materials.length === 0 ? (
        <div className="text-center py-12 text-gray-500">暂无物料记录</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-y border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">物料名称</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">类型</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">计划用量</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">实际用量</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">耗损</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">单位</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {materials.map((item: Material) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{item.material_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.material_type}</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-900">{item.planned_quantity}</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-900">{item.actual_quantity}</td>
                  <td className="px-4 py-3 text-right text-sm text-red-600 font-medium">{item.wastage}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.unit}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleEdit(item)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(item.id!)} className="p-1 text-red-600 hover:bg-red-50 rounded">
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

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">{editingItem ? '编辑物料' : '添加物料'}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">物料名称 *</label>
                <input
                  type="text"
                  value={formData.material_name}
                  onChange={(e) => setFormData({ ...formData, material_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">物料类型</label>
                  <select
                    value={formData.material_type}
                    onChange={(e) => setFormData({ ...formData, material_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="raw">原材料</option>
                    <option value="auxiliary">辅料</option>
                    <option value="packaging">包装材料</option>
                    <option value="other">其他</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">单位</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="kg, m, 个等"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">计划用量</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.planned_quantity}
                    onChange={(e) => setFormData({ ...formData, planned_quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">实际用量</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.actual_quantity}
                    onChange={(e) => setFormData({ ...formData, actual_quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">耗损</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.wastage}
                    onChange={(e) => setFormData({ ...formData, wastage: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">备注</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 border-t flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100">
                取消
              </button>
              <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
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

function OptimizationsTab({ batchId, optimizations, loadData }: any) {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Optimization | null>(null);
  const [formData, setFormData] = useState<Optimization>({
    optimization_type: 'current',
    title: '',
    description: '',
    status: 'proposed',
    expected_benefit: '',
    actual_benefit: ''
  });

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({ optimization_type: 'current', title: '', description: '', status: 'proposed', expected_benefit: '', actual_benefit: '' });
    setShowForm(true);
  };

  const handleEdit = (item: Optimization) => {
    setEditingItem(item);
    setFormData(item);
    setShowForm(true);
  };

  const handleSave = async () => {
    try {
      if (editingItem?.id) {
        await supabase.from('production_optimizations').update(formData).eq('id', editingItem.id);
      } else {
        await supabase.from('production_optimizations').insert([{ ...formData, batch_id: batchId }]);
      }
      setShowForm(false);
      await loadData();
    } catch (error) {
      console.error('Error saving optimization:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除吗？')) return;
    try {
      await supabase.from('production_optimizations').delete().eq('id', id);
      await loadData();
    } catch (error) {
      console.error('Error deleting optimization:', error);
    }
  };

  const currentOptimizations = optimizations.filter((o: Optimization) => o.optimization_type === 'current');
  const nextOptimizations = optimizations.filter((o: Optimization) => o.optimization_type === 'next');

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      proposed: 'bg-gray-100 text-gray-700',
      in_progress: 'bg-blue-100 text-blue-700',
      implemented: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700'
    };
    const labels: Record<string, string> = {
      proposed: '提议中',
      in_progress: '进行中',
      implemented: '已实施',
      rejected: '已拒绝'
    };
    return <span className={`px-2 py-1 rounded text-xs ${colors[status]}`}>{labels[status]}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">优化记录</h3>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          <Plus className="w-4 h-4" />
          添加优化项
        </button>
      </div>

      <div>
        <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
          本次优化
        </h4>
        {currentOptimizations.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">暂无本次优化记录</div>
        ) : (
          <div className="space-y-3">
            {currentOptimizations.map((item: Optimization) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{item.title}</span>
                    {getStatusBadge(item.status)}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(item)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(item.id!)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                {item.expected_benefit && (
                  <p className="text-sm text-gray-600"><span className="font-medium">预期效益：</span>{item.expected_benefit}</p>
                )}
                {item.actual_benefit && (
                  <p className="text-sm text-green-600"><span className="font-medium">实际效益：</span>{item.actual_benefit}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-orange-600 rounded-full"></span>
          下次优化计划
        </h4>
        {nextOptimizations.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">暂无下次优化计划</div>
        ) : (
          <div className="space-y-3">
            {nextOptimizations.map((item: Optimization) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4 bg-orange-50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{item.title}</span>
                    {getStatusBadge(item.status)}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(item)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(item.id!)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                {item.expected_benefit && (
                  <p className="text-sm text-gray-600"><span className="font-medium">预期效益：</span>{item.expected_benefit}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">{editingItem ? '编辑优化项' : '添加优化项'}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">优化类型</label>
                <select
                  value={formData.optimization_type}
                  onChange={(e) => setFormData({ ...formData, optimization_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="current">本次优化</option>
                  <option value="next">下次优化计划</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">优化标题 *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">优化描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">状态</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="proposed">提议中</option>
                  <option value="in_progress">进行中</option>
                  <option value="implemented">已实施</option>
                  <option value="rejected">已拒绝</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">预期效益</label>
                <textarea
                  value={formData.expected_benefit}
                  onChange={(e) => setFormData({ ...formData, expected_benefit: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">实际效益</label>
                <textarea
                  value={formData.actual_benefit}
                  onChange={(e) => setFormData({ ...formData, actual_benefit: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="实施后填写"
                />
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 border-t flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100">
                取消
              </button>
              <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
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

function ChangesTab({ batchId, changes, loadData }: any) {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Change | null>(null);
  const [formData, setFormData] = useState<Change>({
    change_type: 'process',
    change_description: '',
    reason: '',
    approval_status: 'pending',
    implemented_date: '',
    notes: ''
  });

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({ change_type: 'process', change_description: '', reason: '', approval_status: 'pending', implemented_date: '', notes: '' });
    setShowForm(true);
  };

  const handleEdit = (item: Change) => {
    setEditingItem(item);
    setFormData(item);
    setShowForm(true);
  };

  const handleSave = async () => {
    try {
      if (editingItem?.id) {
        await supabase.from('production_changes').update(formData).eq('id', editingItem.id);
      } else {
        await supabase.from('production_changes').insert([{ ...formData, batch_id: batchId }]);
      }
      setShowForm(false);
      await loadData();
    } catch (error) {
      console.error('Error saving change:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除吗？')) return;
    try {
      await supabase.from('production_changes').delete().eq('id', id);
      await loadData();
    } catch (error) {
      console.error('Error deleting change:', error);
    }
  };

  const getApprovalBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700'
    };
    const labels: Record<string, string> = {
      pending: '待审批',
      approved: '已批准',
      rejected: '已拒绝'
    };
    return <span className={`px-2 py-1 rounded text-xs ${colors[status]}`}>{labels[status]}</span>;
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      process: 'bg-blue-100 text-blue-700',
      material: 'bg-green-100 text-green-700',
      equipment: 'bg-purple-100 text-purple-700',
      other: 'bg-gray-100 text-gray-700'
    };
    const labels: Record<string, string> = {
      process: '工艺',
      material: '物料',
      equipment: '设备',
      other: '其他'
    };
    return <span className={`px-2 py-1 rounded text-xs ${colors[type]}`}>{labels[type]}</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">工艺/物料变更</h3>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" />
          添加变更记录
        </button>
      </div>

      {changes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">暂无变更记录</div>
      ) : (
        <div className="space-y-3">
          {changes.map((item: Change) => (
            <div key={item.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getTypeBadge(item.change_type)}
                  {getApprovalBadge(item.approval_status)}
                  {item.implemented_date && (
                    <span className="text-xs text-gray-500">实施日期: {item.implemented_date}</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(item)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(item.id!)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-900 font-medium mb-1">{item.change_description}</p>
              {item.reason && (
                <p className="text-sm text-gray-600 mb-1"><span className="font-medium">变更原因：</span>{item.reason}</p>
              )}
              {item.notes && (
                <p className="text-sm text-gray-600"><span className="font-medium">备注：</span>{item.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">{editingItem ? '编辑变更' : '添加变更'}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">变更类型</label>
                <select
                  value={formData.change_type}
                  onChange={(e) => setFormData({ ...formData, change_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="process">工艺变更</option>
                  <option value="material">物料变更</option>
                  <option value="equipment">设备变更</option>
                  <option value="other">其他变更</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">变更描述 *</label>
                <textarea
                  value={formData.change_description}
                  onChange={(e) => setFormData({ ...formData, change_description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">变更原因</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">审批状态</label>
                  <select
                    value={formData.approval_status}
                    onChange={(e) => setFormData({ ...formData, approval_status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="pending">待审批</option>
                    <option value="approved">已批准</option>
                    <option value="rejected">已拒绝</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">实施日期</label>
                  <input
                    type="date"
                    value={formData.implemented_date}
                    onChange={(e) => setFormData({ ...formData, implemented_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">备注</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 border-t flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100">
                取消
              </button>
              <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
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
