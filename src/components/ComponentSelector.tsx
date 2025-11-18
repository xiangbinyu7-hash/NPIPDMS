import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Package } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { ProductComponent } from '../types';

interface ComponentSelectorProps {
  configurationId: string;
  selectedComponentId: string | null;
  onSelectComponent: (componentId: string | null) => void;
}

export default function ComponentSelector({
  configurationId,
  selectedComponentId,
  onSelectComponent
}: ComponentSelectorProps) {
  const [components, setComponents] = useState<ProductComponent[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newComponentName, setNewComponentName] = useState('');
  const [editComponentName, setEditComponentName] = useState('');

  useEffect(() => {
    loadComponents();
  }, [configurationId]);

  const loadComponents = async () => {
    const { data, error } = await supabase
      .from('product_components')
      .select('*')
      .eq('configuration_id', configurationId)
      .order('order_index', { ascending: true });

    if (!error && data) {
      setComponents(data);
      if (data.length > 0 && !selectedComponentId) {
        onSelectComponent(data[0].id);
      }
    }
  };

  const handleAddComponent = async () => {
    if (!newComponentName.trim()) return;

    const maxOrder = components.length > 0
      ? Math.max(...components.map(c => c.order_index))
      : -1;

    const { error } = await supabase
      .from('product_components')
      .insert({
        configuration_id: configurationId,
        component_name: newComponentName,
        order_index: maxOrder + 1,
        description: ''
      });

    if (!error) {
      setNewComponentName('');
      setIsAdding(false);
      loadComponents();
    }
  };

  const handleUpdateComponent = async (id: string) => {
    if (!editComponentName.trim()) return;

    const { error } = await supabase
      .from('product_components')
      .update({ component_name: editComponentName })
      .eq('id', id);

    if (!error) {
      setEditingId(null);
      setEditComponentName('');
      loadComponents();
    }
  };

  const handleDeleteComponent = async (id: string) => {
    if (!confirm('确定要删除此组件吗？这将删除该组件的所有工艺序列和流程图。')) return;

    const { error } = await supabase
      .from('product_components')
      .delete()
      .eq('id', id);

    if (!error) {
      if (selectedComponentId === id) {
        const remainingComponents = components.filter(c => c.id !== id);
        onSelectComponent(remainingComponents.length > 0 ? remainingComponents[0].id : null);
      }
      loadComponents();
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">产品组件</h3>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          添加组件
        </button>
      </div>

      <div className="space-y-2">
        {components.map((component) => (
          <div
            key={component.id}
            className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
              selectedComponentId === component.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300 bg-white'
            }`}
          >
            {editingId === component.id ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={editComponentName}
                  onChange={(e) => setEditComponentName(e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUpdateComponent(component.id);
                    if (e.key === 'Escape') {
                      setEditingId(null);
                      setEditComponentName('');
                    }
                  }}
                />
                <button
                  onClick={() => handleUpdateComponent(component.id)}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  保存
                </button>
                <button
                  onClick={() => {
                    setEditingId(null);
                    setEditComponentName('');
                  }}
                  className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  取消
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => onSelectComponent(component.id)}
                  className="flex-1 text-left font-medium text-gray-900"
                >
                  {component.component_name}
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingId(component.id);
                      setEditComponentName(component.component_name);
                    }}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteComponent(component.id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}

        {isAdding && (
          <div className="flex items-center gap-2 p-3 border border-blue-300 rounded-lg bg-blue-50">
            <input
              type="text"
              value={newComponentName}
              onChange={(e) => setNewComponentName(e.target.value)}
              placeholder="输入组件名称"
              className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddComponent();
                if (e.key === 'Escape') {
                  setIsAdding(false);
                  setNewComponentName('');
                }
              }}
            />
            <button
              onClick={handleAddComponent}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              添加
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setNewComponentName('');
              }}
              className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              取消
            </button>
          </div>
        )}

        {components.length === 0 && !isAdding && (
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>暂无组件，点击上方"添加组件"开始</p>
          </div>
        )}
      </div>
    </div>
  );
}
