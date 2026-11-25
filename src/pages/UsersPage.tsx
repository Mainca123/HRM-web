import React, { useEffect, useState } from 'react';
import { Plus, KeyRound, Edit3, Trash2, Search, X, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { apiClient, extractErrorMessage } from '../api/client';
import { ApiResponse, EmployeeSummaryDto, PagedResult, UserGroupDto, UserSummaryDto } from '../types/api';
import { ConfirmModal } from '../components/ConfirmModal';

export function UsersPage() {
  const [users, setUsers] = useState<UserSummaryDto[]>([]);
  const [groups, setGroups] = useState<UserGroupDto[]>([]);
  const [employees, setEmployees] = useState<EmployeeSummaryDto[]>([]);
  const [empFilter, setEmpFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [newEmpId, setNewEmpId] = useState('');
  const [newGroupId, setNewGroupId] = useState('1');

  const [editUser, setEditUser] = useState<UserSummaryDto | null>(null);
  const [editGroupId, setEditGroupId] = useState('');
  const [editPermission, setEditPermission] = useState(true);

  const [resetTarget, setResetTarget] = useState<UserSummaryDto | null>(null);
  const [resetPass, setResetPass] = useState('123456');

  const [deleteTarget, setDeleteTarget] = useState<UserSummaryDto | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [uRes, gRes, eRes] = await Promise.all([
        apiClient.get<ApiResponse<PagedResult<UserSummaryDto>>>('/api/users', {
          params: { pageIndex: 1, pageSize: 100, search: search.trim() || undefined },
        }),
        apiClient.get<ApiResponse<UserGroupDto[]>>('/api/user-groups'),
        apiClient.get<ApiResponse<PagedResult<EmployeeSummaryDto>>>('/api/employees', {
          params: { pageIndex: 1, pageSize: 100 },
        }),
      ]);
      const userList = uRes.data.data?.items || [];
      setUsers(userList);
      const grps = gRes.data.data || [];
      setGroups(grps);
      if (grps.length > 0 && !newGroupId) setNewGroupId(grps[0].id);
      setEmployees(eRes.data.data?.items || []);
    } catch (err) {
      setFeedback({ type: 'err', msg: extractErrorMessage(err, 'Lỗi tải danh sách tài khoản.') });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || newPassword.length < 6 || !newEmpId) {
      setFeedback({ type: 'err', msg: 'Nhập đủ tên đăng nhập, mật khẩu (>=6 ký tự) và EmployeeId.' });
      return;
    }
    setSaving(true);
    try {
      await apiClient.post('/api/auth/users', {
        username: newUsername.trim(),
        password: newPassword,
        employeeId: Number(newEmpId),
        groupId: newGroupId,
      });
      setFeedback({ type: 'ok', msg: `Đã tạo tài khoản ${newUsername} thành công.` });
      setCreateOpen(false);
      setNewUsername('');
      setNewPassword('');
      setNewEmpId('');
      loadData();
    } catch (err) {
      setFeedback({ type: 'err', msg: extractErrorMessage(err, 'Tạo tài khoản thất bại.') });
    } finally {
      setSaving(false);
    }
  };

  const getUsername = (u?: UserSummaryDto | null) => u?.userName || u?.username || '';

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    const uname = getUsername(editUser);
    setSaving(true);
    try {
      await apiClient.put(`/api/users/${encodeURIComponent(uname)}`, {
        groupId: editGroupId,
        permission: editPermission,
        employeeId: editUser.employeeId ?? null,
      });
      setFeedback({ type: 'ok', msg: `Đã cập nhật phân quyền cho ${uname}.` });
      setEditUser(null);
      loadData();
    } catch (err) {
      setFeedback({ type: 'err', msg: extractErrorMessage(err, 'Cập nhật tài khoản thất bại.') });
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetTarget) return;
    const uname = getUsername(resetTarget);
    setSaving(true);
    try {
      await apiClient.post(`/api/users/${encodeURIComponent(uname)}/reset-password`, {
        newPassword: resetPass.trim() || '123456',
      });
      setFeedback({ type: 'ok', msg: `Đã đặt lại mật khẩu cho ${uname}.` });
      setResetTarget(null);
      setResetPass('123456');
    } catch (err) {
      setFeedback({ type: 'err', msg: extractErrorMessage(err, 'Đặt lại mật khẩu thất bại.') });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const uname = getUsername(deleteTarget);
    setSaving(true);
    try {
      await apiClient.delete(`/api/users/${encodeURIComponent(uname)}`);
      setFeedback({ type: 'ok', msg: `Đã xóa tài khoản ${uname}.` });
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      setFeedback({ type: 'err', msg: extractErrorMessage(err, 'Xóa tài khoản thất bại.') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Tài khoản &amp; Phân quyền</h1>
          <p className="mt-1 text-sm text-slate-500">Quản lý tài khoản đăng nhập, nhóm quyền và đặt lại mật khẩu</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
        >
          <Plus className="h-4 w-4" />
          Cấp tài khoản mới
        </button>
      </div>

      {feedback && (
        <div
          className={`flex items-center justify-between rounded-xl border p-3.5 text-sm ${
            feedback.type === 'ok'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          <span>{feedback.msg}</span>
          <button onClick={() => setFeedback(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadData()}
            placeholder="Tìm theo tên đăng nhập hoặc họ tên nhân viên..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-4 pl-10 text-sm outline-none focus:border-blue-600 focus:bg-white"
          />
        </div>
        <button
          onClick={loadData}
          className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Tìm
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3.5">Tên đăng nhập</th>
                <th className="px-4 py-3.5">Nhân viên liên kết</th>
                <th className="px-4 py-3.5">Nhóm quyền</th>
                <th className="px-4 py-3.5">Trạng thái</th>
                <th className="px-4 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    Đang tải...
                  </td>
                </tr>
              ) : (
                users.map((u, idx) => {
                  const uname = getUsername(u);
                  return (
                  <tr key={uname || idx} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-bold text-slate-900">{uname || '—'}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {u.employeeFullName ? (
                        <span>
                          {u.employeeFullName}{' '}
                          <span className="text-xs text-slate-400">({u.employeeCode || `#${u.employeeId}`})</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">Chưa liên kết</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {u.groupName || (u.groupId ? `Nhóm ${u.groupId}` : 'Nhân viên')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          u.permission !== false
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {u.permission !== false ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditUser(u);
                            setEditGroupId(u.groupId || groups[0]?.id || '1');
                            setEditPermission(u.permission !== false);
                          }}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                          title="Phân quyền"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setResetTarget(u)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-amber-50 hover:text-amber-600"
                          title="Đặt lại mật khẩu"
                        >
                          <KeyRound className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(u)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                          title="Xóa tài khoản"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <form onSubmit={handleCreate} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Cấp tài khoản mới</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Tên đăng nhập *</label>
                <input
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Mật khẩu (tối thiểu 6 ký tự) *</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 py-2 pr-10 pl-3 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((v) => !v)}
                    aria-label={showNewPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                    className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4 text-blue-700" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Chọn nhân viên liên kết *
                </label>
                <input
                  type="text"
                  value={empFilter}
                  onChange={(e) => setEmpFilter(e.target.value)}
                  placeholder="Lọc nhanh theo tên hoặc mã NV..."
                  className="mb-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs outline-none focus:border-blue-600 focus:bg-white"
                />
                {(() => {
                  const usedIds = new Set(users.map((u) => u.employeeId).filter((id): id is number => id != null));
                  const q = empFilter.trim().toLowerCase();
                  const available = employees.filter(
                    (emp) =>
                      !usedIds.has(emp.id) &&
                      (!q ||
                        emp.fullName.toLowerCase().includes(q) ||
                        (emp.code || '').toLowerCase().includes(q) ||
                        (emp.departmentName || '').toLowerCase().includes(q))
                  );
                  return (
                    <>
                      <select
                        value={newEmpId}
                        onChange={(e) => setNewEmpId(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600"
                      >
                        <option value="">-- Chọn nhân viên ({available.length} chưa có tài khoản) --</option>
                        {available.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.code} - {emp.fullName} ({emp.departmentName || 'Chưa phân phòng'}) [ID: {emp.id}]
                          </option>
                        ))}
                      </select>
                      {newEmpId && (
                        <div className="mt-1 text-[11px] font-medium text-blue-700">
                          Đã chọn Employee ID: #{newEmpId}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Nhóm quyền</label>
                <select
                  value={newGroupId}
                  onChange={(e) => setNewGroupId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.id} - {g.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
              >
                {saving ? 'Đang tạo...' : 'Tạo tài khoản'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <form onSubmit={handleUpdate} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Phân quyền: {getUsername(editUser)}</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Nhóm quyền</label>
                <select
                  value={editGroupId}
                  onChange={(e) => setEditGroupId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.id} - {g.name}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={editPermission}
                  onChange={(e) => setEditPermission(e.target.checked)}
                />
                Kích hoạt tài khoản
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditUser(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white"
              >
                {saving ? 'Đang lưu...' : 'Lưu phân quyền'}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmModal
        open={!!resetTarget}
        title="Đặt lại mật khẩu"
        message={`Nhập mật khẩu mới cho tài khoản ${getUsername(resetTarget)}:`}
        confirmText="Đặt lại"
        loading={saving}
        onClose={() => setResetTarget(null)}
        onConfirm={handleResetPassword}
      >
        <input
          type="text"
          value={resetPass}
          onChange={(e) => setResetPass(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
          placeholder="Mật khẩu mới"
        />
      </ConfirmModal>

      <ConfirmModal
        open={!!deleteTarget}
        title="Xác nhận xóa tài khoản"
        message={`Bạn có chắc chắn muốn xóa tài khoản "${getUsername(deleteTarget)}"?`}
        confirmText="Xóa"
        tone="danger"
        loading={saving}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
