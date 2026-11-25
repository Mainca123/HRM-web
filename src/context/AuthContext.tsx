import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient, extractErrorMessage } from '../api/client';
import { ApiResponse, LoginResponse, UserProfile } from '../types/api';

interface AuthContextValue {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function isAdminOrHrRole(role?: string | null): boolean {
  if (!role) return false;
  const r = role.trim().toUpperCase();
  return r === '1' || r === '4' || r === 'ADMIN' || r === 'ADMINISTRATION' || r === 'HR';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('hrm_admin_token'));
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('hrm_admin_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(!!token && !user);

  useEffect(() => {
    if (token && !user) {
      apiClient
        .get<ApiResponse<UserProfile>>('/api/auth/me')
        .then((res) => {
          if (res.data.success && res.data.data) {
            setUser(res.data.data);
            localStorage.setItem('hrm_admin_user', JSON.stringify(res.data.data));
          }
        })
        .catch(() => {
          localStorage.removeItem('hrm_admin_token');
          localStorage.removeItem('hrm_admin_user');
          setToken(null);
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    }
  }, [token, user]);

  const login = async (username: string, password: string) => {
    try {
      const res = await apiClient.post<ApiResponse<LoginResponse>>('/api/auth/login', {
        username,
        password,
      });
      if (!res.data.success || !res.data.data) {
        return { ok: false, error: res.data.message || 'Đăng nhập thất bại.' };
      }
      const { token: jwt, user: profile } = res.data.data;
      if (!isAdminOrHrRole(profile.role)) {
        return {
          ok: false,
          error: 'Cổng này chỉ dành cho Quản trị viên (Admin) hoặc Nhân sự (HR). Tài khoản nhân viên vui lòng sử dụng App di động.',
        };
      }
      localStorage.setItem('hrm_admin_token', jwt);
      localStorage.setItem('hrm_admin_user', JSON.stringify(profile));
      setToken(jwt);
      setUser(profile);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: extractErrorMessage(err, 'Sai tên đăng nhập hoặc mật khẩu.') };
    }
  };

  const logout = () => {
    apiClient.post('/api/auth/logout').catch(() => {});
    localStorage.removeItem('hrm_admin_token');
    localStorage.removeItem('hrm_admin_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAdmin: isAdminOrHrRole(user?.role),
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
