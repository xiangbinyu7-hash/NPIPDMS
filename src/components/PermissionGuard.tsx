import React from 'react';
import { Shield } from 'lucide-react';
import { useAuth, canEdit } from '../lib/auth';

interface PermissionGuardProps {
  module: string;
  children: React.ReactNode;
  readOnlyMessage?: string;
}

export default function PermissionGuard({ module, children, readOnlyMessage }: PermissionGuardProps) {
  const { user } = useAuth();
  const hasEditPermission = canEdit(user, module);

  if (!hasEditPermission) {
    return (
      <div className="relative">
        <div className="absolute inset-0 bg-gray-100 bg-opacity-50 backdrop-blur-sm z-10 rounded-lg flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-4 text-center">
            <Shield className="w-12 h-12 text-orange-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">只读模式</h3>
            <p className="text-sm text-gray-600">
              {readOnlyMessage || '您当前的角色只能查看此模块，无法进行编辑操作。'}
            </p>
          </div>
        </div>
        <div className="pointer-events-none opacity-60">
          {children}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
