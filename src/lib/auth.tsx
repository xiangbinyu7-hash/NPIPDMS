import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';

export type UserRole = 'process_engineer' | 'rd_engineer' | 'quality_engineer' | 'pm' | 'management';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  full_name: string;
  email: string;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyStoredUser = async () => {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          const { data, error } = await supabase
            .from('app_users')
            .select('id, username, role, full_name, email, is_active')
            .eq('id', userData.id)
            .eq('is_active', true)
            .maybeSingle();

          if (error || !data) {
            localStorage.removeItem('currentUser');
            setUser(null);
          } else {
            setUser(data);
          }
        } catch (error) {
          localStorage.removeItem('currentUser');
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    verifyStoredUser();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('id, username, role, full_name, email, is_active')
        .eq('username', username)
        .eq('password_hash', password)
        .eq('is_active', true)
        .maybeSingle();

      if (error || !data) {
        return false;
      }

      await supabase
        .from('app_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.id);

      const userData: User = data;
      setUser(userData);
      localStorage.setItem('currentUser', JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const getRoleName = (role: UserRole): string => {
  const roleNames: Record<UserRole, string> = {
    process_engineer: '工艺工程师',
    rd_engineer: '研发工程师',
    quality_engineer: '品质工程师',
    pm: 'PM',
    management: '管理层'
  };
  return roleNames[role] || role;
};

export type Permission =
  | 'edit_basic_info'
  | 'edit_process_development'
  | 'edit_process_flow'
  | 'edit_line_balance'
  | 'edit_work_instruction'
  | 'edit_pfmea'
  | 'edit_control_plan'
  | 'edit_trial_production'
  | 'edit_engineering_cost'
  | 'edit_mass_production'
  | 'view_all'
  | 'manage_users';

const rolePermissions: Record<UserRole, Permission[]> = {
  process_engineer: [
    'edit_basic_info',
    'edit_process_development',
    'edit_process_flow',
    'edit_line_balance',
    'edit_work_instruction',
    'edit_pfmea',
    'edit_control_plan',
    'edit_trial_production',
    'edit_engineering_cost',
    'edit_mass_production',
    'view_all',
    'manage_users'
  ],
  rd_engineer: [
    'edit_basic_info',
    'view_all'
  ],
  quality_engineer: [
    'edit_pfmea',
    'edit_control_plan',
    'view_all'
  ],
  pm: [
    'view_all'
  ],
  management: [
    'view_all'
  ]
};

export const hasPermission = (user: User | null, permission: Permission): boolean => {
  if (!user) return false;
  return rolePermissions[user.role]?.includes(permission) || false;
};

export const canEdit = (user: User | null, module: string): boolean => {
  if (!user) return false;

  const permissionMap: Record<string, Permission> = {
    'basic_info': 'edit_basic_info',
    'process_development': 'edit_process_development',
    'process_flow': 'edit_process_flow',
    'line_balance': 'edit_line_balance',
    'work_instruction': 'edit_work_instruction',
    'pfmea': 'edit_pfmea',
    'control_plan': 'edit_control_plan',
    'trial_production': 'edit_trial_production',
    'engineering_cost': 'edit_engineering_cost',
    'mass_production': 'edit_mass_production'
  };

  const permission = permissionMap[module];
  if (!permission) return false;

  return hasPermission(user, permission);
};
