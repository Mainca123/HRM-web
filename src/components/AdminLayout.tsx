import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Network,
  ShieldCheck,
  Clock,
  CheckSquare,
  BarChart3,
  Building2,
  LogOut,
  Menu,
  X,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiClient, extractErrorMessage } from '../api/client';
import { ConfirmModal } from './ConfirmModal';

const navItems = [
  { to: '/', label: 'Tổng quan', icon: LayoutDashboard, end: true },
  { to: '/org-chart', label: 'Sơ đồ nhân sự', icon: Network },
  { to: '/employees', label: 'Nhân viên', icon: Users },
  { to: '/users', label: 'Tài khoản & Quyền', icon: ShieldCheck },
  { to: '/attendance', label: 'Chấm công & GPS', icon: Clock },
  { to: '/approvals', label: 'Phê duyệt đơn từ', icon: CheckSquare },
  { to: '/reports', label: 'Báo cáo & Xuất file', icon: BarChart3 },
  { to: '/catalogs', label: 'Phòng ban & Chức vụ', icon: Building2 },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);
  const [profileModal, setProfileModal] = useState(false);

  // Change password inside profile modal
  const [showChangePass, setShowChangePass] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState({ cur: false, nw: false, cf: false });
  const [passSaving, setPassSaving] = useState(false);
  const [passMsg, setPassMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const initials = (user?.fullName || user?.username || 'AD')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

  const roleLabel =
    user?.role === '4' || user?.role?.toUpperCase() === 'HR'
      ? 'Nhân sự (HR)'
      : 'Quản trị viên (Admin)';

  const openProfileModal = () => {
    setShowChangePass(false);
    setPassMsg(null);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setProfileModal(true);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg(null);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPassMsg({ type: 'err', text: 'Vui lòng nhập đầy đủ các trường mật khẩu.' });
      return;
    }
    if (newPassword.length < 6) {
      setPassMsg({ type: 'err', text: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassMsg({ type: 'err', text: 'Mật khẩu xác nhận không khớp.' });
      return;
    }
    setPassSaving(true);
    try {
      await apiClient.post('/api/auth/change-password', {
        currentPassword,
        newPassword,
      });
      setPassMsg({ type: 'ok', text: 'Đổi mật khẩu thành công!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPassMsg({ type: 'err', text: extractErrorMessage(err, 'Đổi mật khẩu thất bại.') });
    } finally {
      setPassSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Fixed/Sticky Full-Viewport Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white transition-transform lg:sticky lg:top-0 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-700 font-bold text-white shadow-sm">
              HR
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">HRM Admin</div>
              <div className="text-[11px] font-medium text-slate-500">Quản trị hệ thống</div>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-blue-50 font-semibold text-blue-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Pinned Account Box at Bottom */}
        <div className="shrink-0 border-t border-slate-200 p-3">
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2 transition hover:bg-blue-50/70">
            <button
              type="button"
              onClick={openProfileModal}
              title="Xem thông tin tài khoản đang đăng nhập"
              className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-700 text-xs font-bold text-white">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-slate-900">
                  {user?.fullName || user?.username}
                </div>
                <div className="truncate text-xs font-medium text-blue-700">{roleLabel}</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setLogoutModal(true)}
              title="Đăng xuất"
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden text-sm text-slate-500 lg:block">
            Hệ thống Quản lý Nhân sự &amp; Chấm công Trực tuyến
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openProfileModal}
              className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700 sm:inline-flex"
            >
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              {user?.username}
            </button>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Kết nối Server Live
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Current Account Modal */}
      {profileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-lg font-extrabold text-slate-900">Tài khoản đang đăng nhập</h3>
              <button
                type="button"
                onClick={() => setProfileModal(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-700 text-lg font-extrabold text-white shadow-md shadow-blue-700/20">
                  {initials}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-lg font-bold text-slate-900">
                    {user?.fullName || user?.username}
                  </div>
                  <div className="mt-0.5 inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                    {roleLabel}
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-2.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Tên đăng nhập</span>
                  <span className="font-bold text-slate-900">{user?.username || '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Mã nhân viên</span>
                  <span className="font-semibold text-slate-800">{user?.employeeCode || '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Employee ID</span>
                  <span className="font-semibold text-slate-800">{user?.employeeId ?? '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Nhóm quyền (Role)</span>
                  <span className="font-semibold text-blue-700">{user?.role || '—'}</span>
                </div>
              </div>

              {/* Change Password Toggle */}
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePass((v) => !v);
                    setPassMsg(null);
                  }}
                  className="inline-flex items-center gap-2 text-xs font-bold text-blue-700 hover:underline"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  {showChangePass ? 'Ẩn biểu mẫu đổi mật khẩu' : 'Đổi mật khẩu tài khoản này'}
                </button>

                {showChangePass && (
                  <form onSubmit={handleChangePassword} className="mt-3 space-y-2.5 rounded-2xl border border-slate-200 p-4">
                    {passMsg && (
                      <div
                        className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium ${
                          passMsg.type === 'ok'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {passMsg.type === 'ok' ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0" />
                        ) : (
                          <AlertCircle className="h-4 w-4 shrink-0" />
                        )}
                        <span>{passMsg.text}</span>
                      </div>
                    )}

                    <div className="relative">
                      <input
                        type={showPass.cur ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Mật khẩu hiện tại"
                        className="w-full rounded-xl border border-slate-300 py-2 pr-10 pl-3 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass((s) => ({ ...s, cur: !s.cur }))}
                        className="absolute top-1/2 right-2.5 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                      >
                        {showPass.cur ? <EyeOff className="h-4 w-4 text-blue-700" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type={showPass.nw ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                        className="w-full rounded-xl border border-slate-300 py-2 pr-10 pl-3 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass((s) => ({ ...s, nw: !s.nw }))}
                        className="absolute top-1/2 right-2.5 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                      >
                        {showPass.nw ? <EyeOff className="h-4 w-4 text-blue-700" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type={showPass.cf ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Xác nhận mật khẩu mới"
                        className="w-full rounded-xl border border-slate-300 py-2 pr-10 pl-3 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass((s) => ({ ...s, cf: !s.cf }))}
                        className="absolute top-1/2 right-2.5 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                      >
                        {showPass.cf ? <EyeOff className="h-4 w-4 text-blue-700" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={passSaving}
                      className="w-full rounded-xl bg-blue-700 py-2 text-xs font-bold text-white hover:bg-blue-800 disabled:opacity-50"
                    >
                      {passSaving ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                    </button>
                  </form>
                )}
              </div>

              <div className="mt-5 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setProfileModal(false);
                    setLogoutModal(true);
                  }}
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
                >
                  Đăng xuất
                </button>
                <button
                  type="button"
                  onClick={() => setProfileModal(false)}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={logoutModal}
        title="Xác nhận đăng xuất"
        message="Bạn có chắc chắn muốn đăng xuất khỏi cổng quản trị HRM Admin không?"
        confirmText="Đăng xuất"
        tone="danger"
        onClose={() => setLogoutModal(false)}
        onConfirm={() => {
          setLogoutModal(false);
          logout();
          navigate('/login');
        }}
      />
    </div>
  );
}
