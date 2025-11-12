import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ProductSeries, ProductSubseries, ProductConfiguration } from '../types';
import { ChevronRight, Plus } from 'lucide-react';

interface ProductSelectorProps {
  onConfigurationSelect: (configId: string) => void;
}

export default function ProductSelector({ onConfigurationSelect }: ProductSelectorProps) {
  const [series, setSeries] = useState<ProductSeries[]>([]);
  const [subseries, setSubseries] = useState<ProductSubseries[]>([]);
  const [configurations, setConfigurations] = useState<ProductConfiguration[]>([]);

  const [selectedSeries, setSelectedSeries] = useState<string>('');
  const [selectedSubseries, setSelectedSubseries] = useState<string>('');
  const [selectedConfiguration, setSelectedConfiguration] = useState<string>('');

  const [showNewSeriesModal, setShowNewSeriesModal] = useState(false);
  const [showNewSubseriesModal, setShowNewSubseriesModal] = useState(false);
  const [showNewConfigModal, setShowNewConfigModal] = useState(false);

  useEffect(() => {
    loadSeries();
  }, []);

  useEffect(() => {
    if (selectedSeries) {
      loadSubseries(selectedSeries);
      setSelectedSubseries('');
      setSelectedConfiguration('');
    }
  }, [selectedSeries]);

  useEffect(() => {
    if (selectedSubseries) {
      loadConfigurations(selectedSubseries);
      setSelectedConfiguration('');
    }
  }, [selectedSubseries]);

  const loadSeries = async () => {
    try {
      const { data, error } = await supabase
        .from('product_series')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error loading series:', error);
        alert('加载产品系列失败: ' + error.message);
      } else if (data) {
        setSeries(data);
      }
    } catch (err) {
      console.error('Exception loading series:', err);
    }
  };

  const loadSubseries = async (seriesId: string) => {
    try {
      const { data, error } = await supabase
        .from('product_subseries')
        .select('*')
        .eq('series_id', seriesId)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error loading subseries:', error);
      } else if (data) {
        setSubseries(data);
      }
    } catch (err) {
      console.error('Exception loading subseries:', err);
    }
  };

  const loadConfigurations = async (subseriesId: string) => {
    try {
      const { data, error } = await supabase
        .from('product_configurations')
        .select('*')
        .eq('subseries_id', subseriesId)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error loading configurations:', error);
      } else if (data) {
        setConfigurations(data);
      }
    } catch (err) {
      console.error('Exception loading configurations:', err);
    }
  };

  const createSeries = async (name: string, description: string) => {
    try {
      const { data, error } = await supabase
        .from('product_series')
        .insert([{ name, description }])
        .select()
        .single();
      if (error) {
        console.error('Error creating series:', error);
        alert('创建产品系列失败: ' + error.message);
      } else if (data) {
        await loadSeries();
        setShowNewSeriesModal(false);
        alert('产品系列创建成功！');
      }
    } catch (err) {
      console.error('Exception creating series:', err);
      alert('创建产品系列时发生错误');
    }
  };

  const createSubseries = async (name: string, description: string) => {
    try {
      const { data, error } = await supabase
        .from('product_subseries')
        .insert([{ series_id: selectedSeries, name, description }])
        .select()
        .single();
      if (error) {
        console.error('Error creating subseries:', error);
        alert('创建产品子系列失败: ' + error.message);
      } else if (data) {
        await loadSubseries(selectedSeries);
        setShowNewSubseriesModal(false);
        alert('产品子系列创建成功！');
      }
    } catch (err) {
      console.error('Exception creating subseries:', err);
      alert('创建产品子系列时发生错误');
    }
  };

  const createConfiguration = async (name: string, description: string) => {
    try {
      const { data, error } = await supabase
        .from('product_configurations')
        .insert([{ subseries_id: selectedSubseries, name, description }])
        .select()
        .single();
      if (error) {
        console.error('Error creating configuration:', error);
        alert('创建产品配置失败: ' + error.message);
      } else if (data) {
        await loadConfigurations(selectedSubseries);
        setShowNewConfigModal(false);
        alert('产品配置创建成功！');
      }
    } catch (err) {
      console.error('Exception creating configuration:', err);
      alert('创建产品配置时发生错误');
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-700">产品系列</h3>
            <button
              onClick={() => setShowNewSeriesModal(true)}
              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="新增产品系列"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
            {series.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 text-center">暂无产品系列</div>
            ) : (
              series.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSeries(s.id)}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                    selectedSeries === s.id
                      ? 'bg-blue-100 text-blue-800 font-medium'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {s.name}
                </button>
              ))
            )}
          </div>
        </div>

        {selectedSeries && (
          <div className="space-y-2 pl-4 border-l-2 border-blue-300">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-gray-700">产品子系列</h3>
              <button
                onClick={() => setShowNewSubseriesModal(true)}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="新增产品子系列"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
              {subseries.length === 0 ? (
                <div className="p-3 text-sm text-gray-500 text-center">暂无产品子系列</div>
              ) : (
                subseries.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSubseries(s.id)}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      selectedSubseries === s.id
                        ? 'bg-blue-100 text-blue-800 font-medium'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {s.name}
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {selectedSubseries && (
          <div className="space-y-2 pl-8 border-l-2 border-blue-300">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-gray-700">产品配置</h3>
              <button
                onClick={() => setShowNewConfigModal(true)}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="新增产品配置"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
              {configurations.length === 0 ? (
                <div className="p-3 text-sm text-gray-500 text-center">暂无产品配置</div>
              ) : (
                configurations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedConfiguration(c.id);
                      onConfigurationSelect(c.id);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      selectedConfiguration === c.id
                        ? 'bg-blue-100 text-blue-800 font-medium'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {c.name}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {showNewSeriesModal && (
        <Modal
          title="新增产品系列"
          onClose={() => setShowNewSeriesModal(false)}
          onSubmit={createSeries}
        />
      )}

      {showNewSubseriesModal && (
        <Modal
          title="新增产品子系列"
          onClose={() => setShowNewSubseriesModal(false)}
          onSubmit={createSubseries}
        />
      )}

      {showNewConfigModal && (
        <Modal
          title="新增产品配置"
          onClose={() => setShowNewConfigModal(false)}
          onSubmit={createConfiguration}
        />
      )}
    </div>
  );
}

interface ModalProps {
  title: string;
  onClose: () => void;
  onSubmit: (name: string, description: string) => void;
}

function Modal({ title, onClose, onSubmit }: ModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name, description);
      setName('');
      setDescription('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              创建
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
