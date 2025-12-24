import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, Save, X, Shield, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { UserRole, getRoleName, useAuth, hasPermission } from '../lib/auth';

interface AppUser {
  id: string;
  username: string;
  role: UserRole;
  full_name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'rd_engineer' as UserRole,
    full_name: '',
    email: '',
    is_active: true
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      role: 'rd_engineer',
      full_name: '',
      email: '',
      is_active: true
    });
    setShowForm(true);
  };

  const handleEdit = (user: AppUser) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      role: user.role,
      full_name: user.full_name,
      email: user.email,
      is_active: user.is_active
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    try {
      if (editingUser) {
        const updateData: any = {
          role: formData.role,
          full_name: formData.full_name,
          email: formData.email,
          is_active: formData.is_active
        };

        if (formData.password) {
          updateData.password_hash = formData.password;
        }

        const { error } = await supabase
          .from('app_users')
          .update(updateData)
          .eq('id', editingUser.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('app_users')
          .insert([{
            username: formData.username,
            password_hash: formData.password,
            role: formData.role,
            full_name: formData.full_name,
            email: formData.email,
            is_active: formData.is_active
          }]);

        if (error) throw error;
      }

      setShowForm(false);
      await loadUsers();
    } catch (error: any) {
      console.error('Error saving user:', error);
      if (error.code === '23505') {
        alert('用户名已存在');
      } else {
        alert('保存失败，请重试');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此用户吗？')) return;

    try {
      const { error } = await supabase
        .from('app_users')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('删除失败，请重试');
    }
  };

  const toggleActive = async (user: AppUser) => {
    try {
      const { error } = await supabase
        .from('app_users')
        .update({ is_active: !user.is_active })
        .eq('id', user.id);

      if (error) throw error;
      await loadUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      alert('操作失败，请重试');
    }
  };

  if (!hasPermission(currentUser, 'manage_users')) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-12">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">您没有权限访问用户管理</p>
        </div>
      </div>
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
            <Users size={24} />
            用户管理
          </h2>
          <p className="text-sm text-gray-600 mt-1">管理系统用户和权限</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          添加用户
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-y border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">用户名</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">姓名</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">角色</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">邮箱</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">状态</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">最后登录</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <span className="font-medium text-gray-900">{user.username}</span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">{user.full_name}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-700 text-xs font-medium">
                    {getRoleName(user.role)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{user.email || '-'}</td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => toggleActive(user)}
                    className="inline-flex items-center gap-1 text-xs"
                  >
                    {user.is_active ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-green-700">启用</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span className="text-red-700">禁用</span>
                      </>
                    )}
                  </button>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {user.last_login ? new Date(user.last_login).toLocaleString('zh-CN') : '从未登录'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleEdit(user)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      disabled={user.id === currentUser?.id}
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

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">角色权限说明：</h3>
        <ul className="space-y-1 text-sm text-blue-800">
          <li><span className="font-medium">工艺工程师：</span>编辑任何模块和功能</li>
          <li><span className="font-medium">研发工程师：</span>编辑基础资料、查看工艺流程</li>
          <li><span className="font-medium">品质工程师：</span>编辑PFMEA和控制计划</li>
          <li><span className="font-medium">PM：</span>审核全流程内容（只读）</li>
          <li><span className="font-medium">管理层：</span>只读所有记录</li>
        </ul>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                {editingUser ? '编辑用户' : '添加用户'}
              </h3>
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
                  用户名 *
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入用户名"
                  disabled={!!editingUser}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  密码 {editingUser ? '(留空表示不修改)' : '*'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={editingUser ? '留空表示不修改密码' : '请输入密码'}
                  required={!editingUser}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  姓名 *
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入姓名"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  角色 *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="process_engineer">工艺工程师</option>
                  <option value="rd_engineer">研发工程师</option>
                  <option value="quality_engineer">品质工程师</option>
                  <option value="pm">PM</option>
                  <option value="management">管理层</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  邮箱
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入邮箱"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                  启用账号
                </label>
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
                onClick={handleSave}
                disabled={!formData.username || (!editingUser && !formData.password) || !formData.full_name}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
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
