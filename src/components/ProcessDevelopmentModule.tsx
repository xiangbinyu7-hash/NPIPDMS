import { useState } from 'react';
import { Settings, Workflow, BarChart3, FileText, Shield, ClipboardCheck, FolderOpen } from 'lucide-react';
import ProcessFlowChartArea from './ProcessFlowChartArea';
import LineBalancingArea from './LineBalancingArea';
import ComponentSelector from './ComponentSelector';

interface ProcessDevelopmentModuleProps {
  configurationId: string;
}

type SubArea = 'flow' | 'balance' | 'instruction' | 'pfmea' | 'control' | 'attachments';

export default function ProcessDevelopmentModule({ configurationId }: ProcessDevelopmentModuleProps) {
  const [activeSubArea, setActiveSubArea] = useState<SubArea | null>(null);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);

  const subAreas = [
    { id: 'flow' as SubArea, name: '工艺流程图', icon: Workflow, color: 'blue' },
    { id: 'balance' as SubArea, name: '线体平衡图', icon: BarChart3, color: 'green' },
    { id: 'instruction' as SubArea, name: '标准作业指导书', icon: FileText, color: 'purple' },
    { id: 'pfmea' as SubArea, name: 'PFMEA', icon: Shield, color: 'red' },
    { id: 'control' as SubArea, name: '控制计划', icon: ClipboardCheck, color: 'orange' },
    { id: 'attachments' as SubArea, name: '其他生产附加文件', icon: FolderOpen, color: 'gray' }
  ];

  const getColorClasses = (color: string, active: boolean) => {
    const colors: Record<string, { bg: string; hover: string; activeBg: string; text: string }> = {
      blue: { bg: 'bg-blue-50', hover: 'hover:bg-blue-100', activeBg: 'bg-blue-600', text: 'text-blue-600' },
      green: { bg: 'bg-green-50', hover: 'hover:bg-green-100', activeBg: 'bg-green-600', text: 'text-green-600' },
      purple: { bg: 'bg-purple-50', hover: 'hover:bg-purple-100', activeBg: 'bg-purple-600', text: 'text-purple-600' },
      red: { bg: 'bg-red-50', hover: 'hover:bg-red-100', activeBg: 'bg-red-600', text: 'text-red-600' },
      orange: { bg: 'bg-orange-50', hover: 'hover:bg-orange-100', activeBg: 'bg-orange-600', text: 'text-orange-600' },
      gray: { bg: 'bg-gray-50', hover: 'hover:bg-gray-100', activeBg: 'bg-gray-600', text: 'text-gray-600' }
    };

    const colorSet = colors[color] || colors.blue;

    if (active) {
      return `${colorSet.activeBg} text-white shadow-lg`;
    }
    return `${colorSet.bg} ${colorSet.text} ${colorSet.hover}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <Settings size={24} />
        工艺开发
      </h2>

      {!activeSubArea ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {subAreas.map((area) => {
            const Icon = area.icon;
            return (
              <button
                key={area.id}
                onClick={() => setActiveSubArea(area.id)}
                className={`p-6 rounded-lg border-2 border-transparent transition-all ${getColorClasses(area.color, false)} hover:scale-105 hover:border-current`}
              >
                <Icon size={32} className="mx-auto mb-3" />
                <p className="text-center font-semibold">{area.name}</p>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-4 pb-4 border-b">
            <button
              onClick={() => setActiveSubArea(null)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              ← 返回
            </button>
            <h3 className="text-xl font-semibold text-gray-800">
              {subAreas.find(a => a.id === activeSubArea)?.name}
            </h3>
          </div>

          {activeSubArea === 'flow' && (
            <ComponentSelector
              configurationId={configurationId}
              selectedComponentId={selectedComponentId}
              onSelectComponent={setSelectedComponentId}
            />
          )}

          {activeSubArea === 'balance' && (
            <ComponentSelector
              configurationId={configurationId}
              selectedComponentId={selectedComponentId}
              onSelectComponent={setSelectedComponentId}
            />
          )}

          <div className="min-h-[400px]">
            {activeSubArea === 'flow' && (
              <ProcessFlowChartArea
                configurationId={configurationId}
                componentId={selectedComponentId}
              />
            )}
            {activeSubArea === 'balance' && (
              <LineBalancingArea
                configurationId={configurationId}
                componentId={selectedComponentId}
              />
            )}
            {activeSubArea === 'instruction' && (
              <div className="text-center py-12 text-gray-500">
                标准作业指导书功能开发中...
              </div>
            )}
            {activeSubArea === 'pfmea' && (
              <div className="text-center py-12 text-gray-500">
                PFMEA功能开发中...
              </div>
            )}
            {activeSubArea === 'control' && (
              <div className="text-center py-12 text-gray-500">
                控制计划功能开发中...
              </div>
            )}
            {activeSubArea === 'attachments' && (
              <div className="text-center py-12 text-gray-500">
                其他生产附加文件功能开发中...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
