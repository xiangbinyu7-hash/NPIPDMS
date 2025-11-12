import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TrialProduction } from '../types';
import { Beaker, Plus, Edit, Trash2 } from 'lucide-react';

interface TrialProductionModuleProps {
  configurationId: string;
}

const PHASES = ['Demon', 'EVT', 'DVT', 'PVT'] as const;

export default function TrialProductionModule({ configurationId }: TrialProductionModuleProps) {
  const [trials, setTrials] = useState<TrialProduction[]>([]);
  const [selectedPhase, setSelectedPhase] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingTrial, setEditingTrial] = useState<TrialProduction | null>(null);

  useEffect(() => {
    loadTrials();
  }, [configurationId]);

  const loadTrials = async () => {
    const { data } = await supabase
      .from('trial_production')
      .select('*')
      .eq('configuration_id', configurationId)
      .order('test_date', { ascending: false });
    if (data) setTrials(data);
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除此试产记录吗？')) {
      await supabase.from('trial_production').delete().eq('id', id);
      loadTrials();
    }
  };

  const filteredTrials = selectedPhase
    ? trials.filter((t) => t.phase === selectedPhase)
    : trials;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Beaker size={24} />
          试产管理
        </h2>
        <button
          onClick={() => {
            setEditingTrial(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          新增试产记录
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setSelectedPhase('')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            selectedPhase === ''
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          全部
        </button>
        {PHASES.map((phase) => (
          <button
            key={phase}
            onClick={() => setSelectedPhase(phase)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedPhase === phase
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {phase}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredTrials.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            暂无试产记录，点击"新增试产记录"开始记录
          </div>
        ) : (
          filteredTrials.map((trial) => (
            <div
              key={trial.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {trial.phase}
                  </span>
                  <p className="text-sm text-gray-600 mt-2">测试日期: {trial.test_date}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingTrial(trial);
                      setShowModal(true);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(trial.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">数量:</span>
                  <p className="font-semibold">{trial.quantity}</p>
                </div>
                <div>
                  <span className="text-gray-600">良率:</span>
                  <p className="font-semibold">{trial.pass_rate}%</p>
                </div>
              </div>
              {trial.notes && (
                <p className="mt-3 text-sm text-gray-700 border-t pt-3">{trial.notes}</p>
              )}
            </div>
          ))
        )}
      </div>

      {showModal && (
        <TrialModal
          configurationId={configurationId}
          trial={editingTrial}
          onClose={() => {
            setShowModal(false);
            setEditingTrial(null);
          }}
          onSave={() => {
            loadTrials();
            setShowModal(false);
            setEditingTrial(null);
          }}
        />
      )}
    </div>
  );
}

interface TrialModalProps {
  configurationId: string;
  trial: TrialProduction | null;
  onClose: () => void;
  onSave: () => void;
}

function TrialModal({ configurationId, trial, onClose, onSave }: TrialModalProps) {
  const [phase, setPhase] = useState(trial?.phase || 'Demon');
  const [testDate, setTestDate] = useState(trial?.test_date || new Date().toISOString().split('T')[0]);
  const [quantity, setQuantity] = useState(trial?.quantity || 0);
  const [passRate, setPassRate] = useState(trial?.pass_rate || 0);
  const [notes, setNotes] = useState(trial?.notes || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSave = {
        configuration_id: configurationId,
        phase,
        test_date: testDate,
        quantity,
        pass_rate: passRate,
        notes,
        updated_at: new Date().toISOString(),
      };

      if (trial) {
        await supabase
          .from('trial_production')
          .update(dataToSave)
          .eq('id', trial.id);
      } else {
        await supabase.from('trial_production').insert([dataToSave]);
      }
      onSave();
    } catch (error) {
      alert('保存失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          {trial ? '编辑试产记录' : '新增试产记录'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">阶段</label>
              <select
                value={phase}
                onChange={(e) => setPhase(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                {PHASES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">测试日期</label>
              <input
                type="date"
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">数量</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">良率 (%)</label>
              <input
                type="number"
                value={passRate}
                onChange={(e) => setPassRate(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                min="0"
                max="100"
                step="0.01"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
