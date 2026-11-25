import React, { useEffect, useState } from 'react';
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  RefreshCw,
  X,
  User,
  Briefcase,
  AlertCircle,
} from 'lucide-react';
import { apiClient, extractErrorMessage } from '../api/client';
import {
  ApiResponse,
  DepartmentDto,
  EmployeeSummaryDto,
  PagedResult,
  PositionDto,
} from '../types/api';
import { ConfirmModal } from '../components/ConfirmModal';

interface EmployeeDetailResponse extends EmployeeSummaryDto {
  notes?: string | null;
}

export function EmployeesPage() {
  const [items, setItems] = useState<EmployeeSummaryDto[]>([]);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [positions, setPositions] = useState<PositionDto[]>([]);
  const [pageIndex, setPageIndex] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  // Modal state
  const [formModal, setFormModal] = useState(false);
  const [editing, setEditing] = useState<EmployeeSummaryDto | null>(null);
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formBirthDate, setFormBirthDate] = useState('');
  const [formSex, setFormSex] = useState<boolean>(true);
  const [formEmail, setFormEmail] = useState('');
  const [formDeptId, setFormDeptId] = useState('');
  const [formPosId, setFormPosId] = useState('');
  const [formJoinDate, setFormJoinDate] = useState(new Date().toISOString().slice(0, 10));
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<EmployeeSummaryDto | null>(null);

  const loadCatalogs = async () => {
    try {
      const [dRes, pRes] = await Promise.all([
        apiClient.get<ApiResponse<DepartmentDto[]>>('/api/departments'),
        apiClient.get<ApiResponse<PositionDto[]>>('/api/positions'),
      ]);
      setDepartments(dRes.data.data || []);
      setPositions(pRes.data.data || []);
    } catch {
      // ignore
    }
  };

  const loadEmployees = async (page = pageIndex) => {
    setLoading(true);
    try {
      const res = await apiClient.get<ApiResponse<PagedResult<EmployeeSummaryDto>>>('/api/employees', {
        params: {
          pageIndex: page,
          pageSize: 15,
          search: search.trim() || undefined,
          departmentId: departmentId || undefined,
        },
      });
      if (res.data.success && res.data.data) {
        setItems(res.data.data.items);
        setTotalPages(Math.max(1, res.data.data.totalPages));
        setTotalCount(res.data.data.totalCount);
      }
    } catch (err) {
      setFeedback({ type: 'err', msg: extractErrorMessage(err, 'Lỗi tải danh sách nhân viên') });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalogs();
  }, []);

  useEffect(() => {
    loadEmployees(pageIndex);
  }, [pageIndex, departmentId]);

  const openCreate = () => {
    setEditing(null);
    setFormError(null);
    setFormCode('');
    setFormName('');
    setFormBirthDate('');
    setFormSex(true);
    setFormEmail('');
    setFormDeptId(departments[0]?.id || '');
    setFormPosId(positions.find((p) => p.name.toLowerCase() === 'staff')?.id || positions[0]?.id || '');
    setFormJoinDate(new Date().toISOString().slice(0, 10));
    setFormNotes('');
    setFormModal(true);
  };

  const openEdit = async (emp: EmployeeSummaryDto) => {
    setEditing(emp);
    setFormError(null);
    setFormCode(emp.code || '');
    setFormName(emp.fullName || '');
    setFormBirthDate(emp.birthDate ? emp.birthDate.slice(0, 10) : '');
    setFormSex(emp.sex ?? true);
    setFormEmail(emp.email || '');
    setFormDeptId(emp.departmentId || departments[0]?.id || '');
    setFormPosId(emp.positionId || positions[0]?.id || '');
    setFormJoinDate(emp.currentDepartmentFromDate ? emp.currentDepartmentFromDate.slice(0, 10) : '');
    setFormNotes('');
    setFormModal(true);

    // Fetch full detail to prefill birthDate, notes, departmentId, positionId accurately
    try {
      const detailRes = await apiClient.get<ApiResponse<EmployeeDetailResponse>>(`/api/employees/${emp.id}`);
      const d = detailRes.data.data;
      if (d) {
        setFormCode(d.code || emp.code);
        setFormName(d.fullName || emp.fullName);
        setFormBirthDate(d.birthDate ? d.birthDate.slice(0, 10) : '');
        setFormSex(d.sex ?? true);
        setFormEmail(d.email || '');
        if (d.departmentId) setFormDeptId(d.departmentId);
        if (d.positionId) setFormPosId(d.positionId);
        if (d.currentDepartmentFromDate) setFormJoinDate(d.currentDepartmentFromDate.slice(0, 10));
        setFormNotes(d.notes || '');
      }
    } catch {
      // keep summary fallback
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const codeTrim = formCode.trim();
    const nameTrim = formName.trim();
    const emailTrim = formEmail.trim();

    if (!codeTrim) {
      setFormError('Mã nhân viên không được để trống.');
      return;
    }
    if (codeTrim.length > 15) {
      setFormError('Mã nhân viên tối đa 15 ký tự.');
      return;
    }
    if (!nameTrim) {
      setFormError('Họ và tên không được để trống.');
      return;
    }
    if (emailTrim && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      setFormError('Email không đúng định dạng.');
      return;
    }
    if (!formDeptId || !formPosId) {
      setFormError('Vui lòng chọn đầy đủ Phòng ban và Chức vụ.');
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await apiClient.put(`/api/employees/${editing.id}`, {
          code: codeTrim,
          fullName: nameTrim,
          birthDate: formBirthDate || null,
          sex: formSex,
          email: emailTrim || null,
          notes: formNotes.trim() || null,
          departmentId: formDeptId,
          positionId: formPosId,
        });
        setFeedback({ type: 'ok', msg: `Đã cập nhật hồ sơ nhân viên ${nameTrim} (${codeTrim}).` });
      } else {
        await apiClient.post('/api/employees', {
          code: codeTrim,
          fullName: nameTrim,
          birthDate: formBirthDate || null,
          sex: formSex,
          email: emailTrim || null,
          departmentId: formDeptId,
          positionId: formPosId,
          joinDate: formJoinDate || null,
          notes: formNotes.trim() || null,
        });
        setFeedback({ type: 'ok', msg: `Đã thêm mới nhân viên ${nameTrim} (${codeTrim}).` });
      }
      setFormModal(false);
      loadEmployees(pageIndex);
    } catch (err) {
      setFormError(extractErrorMessage(err, 'Lưu thông tin nhân viên thất bại.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await apiClient.delete(`/api/employees/${deleteTarget.id}`);
      setFeedback({ type: 'ok', msg: `Đã xóa nhân viên ${deleteTarget.fullName}.` });
      setDeleteTarget(null);
      loadEmployees(pageIndex);
    } catch (err) {
      setFeedback({ type: 'err', msg: extractErrorMessage(err, 'Xóa nhân viên thất bại.') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Quản lý Nhân viên</h1>
          <p className="mt-1 text-sm text-slate-500">Tổng số {totalCount} hồ sơ nhân sự trong hệ thống</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
        >
          <Plus className="h-4 w-4" />
          Thêm nhân viên
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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (setPageIndex(1), loadEmployees(1))}
            placeholder="Tìm theo tên hoặc mã nhân viên..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-4 pl-10 text-sm outline-none focus:border-blue-600 focus:bg-white"
          />
        </div>
        <select
          value={departmentId}
          onChange={(e) => {
            setDepartmentId(e.target.value);
            setPageIndex(1);
          }}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-600"
        >
          <option value="">Tất cả phòng ban</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <button
          onClick={() => {
            setPageIndex(1);
            loadEmployees(1);
          }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Tìm kiếm
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3.5">Mã NV</th>
                <th className="px-4 py-3.5">Họ và tên</th>
                <th className="px-4 py-3.5">Phòng ban</th>
                <th className="px-4 py-3.5">Chức vụ</th>
                <th className="px-4 py-3.5">Email</th>
                <th className="px-4 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    Đang tải danh sách nhân viên...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    Không tìm thấy nhân viên nào
                  </td>
                </tr>
              ) : (
                items.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-semibold text-blue-700">{emp.code}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{emp.fullName}</td>
                    <td className="px-4 py-3 text-slate-600">{emp.departmentName || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{emp.positionName || '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{emp.email || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => openEdit(emp)}
                          className="rounded-lg p-1.5 text-slate-500 transition hover:bg-blue-50 hover:text-blue-700"
                          title="Chỉnh sửa"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(emp)}
                          className="rounded-lg p-1.5 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                          title="Xóa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
          <span>
            Trang {pageIndex} / {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={pageIndex <= 1}
              onClick={() => setPageIndex((p) => p - 1)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              Trước
            </button>
            <button
              disabled={pageIndex >= totalPages}
              onClick={() => setPageIndex((p) => p + 1)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      {/* Modern Create / Edit Employee Modal */}
      {formModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px]">
          <form
            onSubmit={handleSave}
            className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  {editing ? 'Cập nhật hồ sơ nhân viên' : 'Thêm hồ sơ nhân viên mới'}
                </h3>
                <p className="text-xs text-slate-500">
                  {editing
                    ? `Chỉnh sửa thông tin nhân sự #${editing.id} — thay đổi phòng ban/chức vụ sẽ tự lưu lịch sử`
                    : 'Tạo nhân sự mới kèm phân bổ phòng ban & chức vụ khởi đầu'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFormModal(false)}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="space-y-5 overflow-y-auto px-6 py-5">
              {formError && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Section 1: Personal Info */}
              <div>
                <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700">
                  <User className="h-3.5 w-3.5" />
                  Thông tin cá nhân
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Mã nhân viên <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={15}
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value)}
                      placeholder="VD: NV00300"
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={150}
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Nguyễn Văn Bình"
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">Ngày sinh</label>
                    <input
                      type="date"
                      value={formBirthDate}
                      onChange={(e) => setFormBirthDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">Giới tính</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormSex(true)}
                        className={`rounded-xl border py-2.5 text-sm font-semibold transition ${
                          formSex
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Nam
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormSex(false)}
                        className={`rounded-xl border py-2.5 text-sm font-semibold transition ${
                          !formSex
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Nữ
                      </button>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-semibold text-slate-700">Email liên lạc</label>
                    <input
                      type="email"
                      maxLength={100}
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="binh.nguyen@company.com"
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Org Assignment */}
              <div className="border-t border-slate-100 pt-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700">
                  <Briefcase className="h-3.5 w-3.5" />
                  Tổ chức &amp; Công việc
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Phòng ban <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formDeptId}
                      onChange={(e) => setFormDeptId(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:bg-white"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Chức vụ <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formPosId}
                      onChange={(e) => setFormPosId(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:bg-white"
                    >
                      {positions.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {!editing && (
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">Ngày vào làm</label>
                      <input
                        type="date"
                        value={formJoinDate}
                        onChange={(e) => setFormJoinDate(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:bg-white"
                      />
                    </div>
                  )}
                  <div className={editing ? 'sm:col-span-2' : ''}>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">Ghi chú hồ sơ</label>
                    <input
                      type="text"
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      placeholder="Ghi chú thêm (tùy chọn)"
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
              <button
                type="button"
                onClick={() => setFormModal(false)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:opacity-50"
              >
                {saving ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Thêm nhân viên'}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Xác nhận xóa nhân viên"
        message={`Bạn có chắc chắn muốn xóa hồ sơ nhân viên ${deleteTarget?.fullName} (${deleteTarget?.code})?`}
        confirmText="Xóa"
        tone="danger"
        loading={saving}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
