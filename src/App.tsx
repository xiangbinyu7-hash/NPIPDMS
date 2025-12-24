import { useState, useEffect } from 'react';
import ProductSelector from './components/ProductSelector';
import BasicInfoModule from './components/BasicInfoModule';
import ProcessDevelopmentModule from './components/ProcessDevelopmentModule';
import TrialProductionModule from './components/TrialProductionModule';
import EngineeringCostModule from './components/EngineeringCostModule';
import MassProductionModule from './components/MassProductionModule';
import ShareWorkInstruction from './components/ShareWorkInstruction';
import Login from './components/Login';
import UserManagement from './components/UserManagement';
import { useAuth, getRoleName, hasPermission } from './lib/auth';
import { PackageOpen, LogOut, User as UserIcon, Users } from 'lucide-react';

type ModuleType = 'basic' | 'process' | 'trial' | 'cost' | 'mass' | 'users';

export default function App() {
  const { user, logout, isLoading } = useAuth();
  const [selectedConfiguration, setSelectedConfiguration] = useState<string>('');
  const [activeModule, setActiveModule] = useState<ModuleType>('basic');
  const [isShareView, setIsShareView] = useState(false);
  const [shareInstructionId, setShareInstructionId] = useState<string>('');

  useEffect(() => {
    const path = window.location.pathname;
    const shareMatch = path.match(/^\/share\/work-instruction\/(.+)$/);
    if (shareMatch) {
      setIsShareView(true);
      setShareInstructionId(shareMatch[1]);
    }
  }, []);

  const modules = [
    { id: 'basic' as ModuleType, name: '产品基础信息' },
    { id: 'process' as ModuleType, name: '工艺开发' },
    { id: 'trial' as ModuleType, name: '试产管理' },
    { id: 'cost' as ModuleType, name: '工程造价' },
    { id: 'mass' as ModuleType, name: '量产管理' },
  ];

  if (isShareView && shareInstructionId) {
    return <ShareWorkInstruction instructionId={shareInstructionId} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">加载中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PackageOpen size={32} className="text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  新产品导入和工艺开发管理系统
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  NPI & Process Development Management System
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="flex items-center gap-2 text-gray-900 font-medium">
                  <UserIcon size={18} />
                  {user.full_name}
                </div>
                <div className="text-sm text-gray-600">{getRoleName(user.role)}</div>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700"
              >
                <LogOut size={18} />
                退出
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="h-[calc(100vh-140px)] px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6 h-full max-w-[1920px] mx-auto">
          {activeModule !== 'users' && (
            <aside className="w-80 flex-shrink-0">
              <div className="bg-white rounded-lg shadow-md p-6 h-full overflow-y-auto">
                <ProductSelector onConfigurationSelect={setSelectedConfiguration} />
              </div>
            </aside>
          )}

          <div className="flex-1 flex flex-col min-w-0">
            {activeModule === 'users' ? (
              <div className="flex-1 overflow-y-auto">
                <UserManagement />
              </div>
            ) : selectedConfiguration ? (
              <>
                <div className="bg-white rounded-lg shadow-md p-4 mb-4 flex-shrink-0">
                  <div className="flex flex-wrap gap-2">
                    {modules.map((module) => (
                      <button
                        key={module.id}
                        onClick={() => setActiveModule(module.id)}
                        className={`px-6 py-3 rounded-lg font-medium transition-all ${
                          activeModule === module.id
                            ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {module.name}
                      </button>
                    ))}
                    {hasPermission(user, 'manage_users') && (
                      <button
                        onClick={() => setActiveModule('users')}
                        className="ml-auto px-6 py-3 rounded-lg font-medium transition-all bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-2"
                      >
                        <Users size={18} />
                        用户管理
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {activeModule === 'basic' && (
                    <BasicInfoModule configurationId={selectedConfiguration} />
                  )}
                  {activeModule === 'process' && (
                    <ProcessDevelopmentModule configurationId={selectedConfiguration} />
                  )}
                  {activeModule === 'trial' && (
                    <TrialProductionModule configurationId={selectedConfiguration} />
                  )}
                  {activeModule === 'cost' && (
                    <EngineeringCostModule configurationId={selectedConfiguration} />
                  )}
                  {activeModule === 'mass' && (
                    <MassProductionModule configurationId={selectedConfiguration} />
                  )}
                </div>
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center h-full flex flex-col items-center justify-center">
                <PackageOpen size={64} className="text-gray-300 mb-4" />
                <h2 className="text-2xl font-semibold text-gray-600 mb-2">
                  开始管理您的新产品
                </h2>
                <p className="text-gray-500">
                  请先选择产品系列、子系列和配置，然后开始使用各个功能模块
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="mt-12 py-6 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            新产品导入和工艺开发管理系统 - 用于机器人电子产品的工艺管理
          </p>
        </div>
      </footer>
    </div>
  );
}
