import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Search,
  Users,
  ChevronDown,
  ChevronRight,
  Mail,
  Briefcase,
  UserCheck,
  Crown,
  Layers,
  X,
} from 'lucide-react';
import { apiClient, extractErrorMessage } from '../api/client';
import { ApiResponse, DepartmentDto, EmployeeSummaryDto, PagedResult } from '../types/api';

function getPositionRank(positionName?: string | null): number {
  const p = (positionName || '').toLowerCase();
  if (p.includes('director') || p.includes('giám đốc')) return 1;
  if (p.includes('manager') || p.includes('trưởng phòng') || p.includes('quản lý')) return 2;
  if (p.includes('supervisor') || p.includes('leader') || p.includes('trưởng nhóm') || p.includes('tổ trưởng')) return 3;
  if (p.includes('senior') || p.includes('expert') || p.includes('chính')) return 4;
  return 5;
}

function getTierBadge(rank: number): { label: string; cls: string } {
  switch (rank) {
    case 1:
      return { label: 'Ban Giám đốc', cls: 'bg-purple-100 text-purple-800 border-purple-200' };
    case 2:
      return { label: 'Quản lý', cls: 'bg-blue-100 text-blue-800 border-blue-200' };
    case 3:
      return { label: 'Trưởng nhóm / Giám sát', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    case 4:
      return { label: 'Chuyên viên cao cấp', cls: 'bg-amber-100 text-amber-800 border-amber-200' };
    default:
      return { label: 'Nhân viên', cls: 'bg-slate-100 text-slate-700 border-slate-200' };
  }
}

export function OrgChartPage() {
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [employees, setEmployees] = useState<EmployeeSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('ALL');
  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({});
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeSummaryDto | null>(null);

  useEffect(() => {
    const loadOrgData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [deptRes, empRes] = await Promise.all([
          apiClient.get<ApiResponse<DepartmentDto[]>>('/api/departments'),
          apiClient.get<ApiResponse<PagedResult<EmployeeSummaryDto>>>('/api/employees', {
            params: { pageIndex: 1, pageSize: 100 },
          }),
        ]);
        const depts = deptRes.data.data || [];
        const emps = empRes.data.data?.items || [];
        setDepartments(depts);
        setEmployees(emps);

        // Expand departments that have employees by default
        const initialExpanded: Record<string, boolean> = {};
        depts.forEach((d) => {
          initialExpanded[d.id] = true;
        });
        initialExpanded['UNASSIGNED'] = true;
        setExpandedDepts(initialExpanded);
      } catch (err) {
        setError(extractErrorMessage(err, 'Không tải được sơ đồ nhân sự.'));
      } finally {
        setLoading(false);
      }
    };
    loadOrgData();
  }, []);

  const query = search.trim().toLowerCase();

  // Group employees by department, sorted by hierarchy rank
  const orgBranches = useMemo(() => {
    const map = new Map<string, { deptId: string; deptName: string; members: EmployeeSummaryDto[] }>();

    departments.forEach((d) => {
      map.set(d.id, { deptId: d.id, deptName: d.name, members: [] });
    });

    employees.forEach((emp) => {
      const deptKey = emp.departmentId || 'UNASSIGNED';
      const deptName = emp.departmentName || 'Chưa phân phòng ban';
      if (!map.has(deptKey)) {
        map.set(deptKey, { deptId: deptKey, deptName, members: [] });
      }
      map.get(deptKey)!.members.push(emp);
    });

    return Array.from(map.values())
      .map((branch) => {
        const sortedMembers = [...branch.members].sort((a, b) => {
          const diff = getPositionRank(a.positionName) - getPositionRank(b.positionName);
          if (diff !== 0) return diff;
          return a.fullName.localeCompare(b.fullName);
        });
        return { ...branch, members: sortedMembers };
      })
      .filter((branch) => {
        if (selectedDeptId !== 'ALL' && branch.deptId !== selectedDeptId) return false;
        if (!query) return branch.members.length > 0;
        const deptMatch = branch.deptName.toLowerCase().includes(query);
        const memberMatch = branch.members.some(
          (m) =>
            m.fullName.toLowerCase().includes(query) ||
            (m.code || '').toLowerCase().includes(query) ||
            (m.positionName || '').toLowerCase().includes(query)
        );
        return deptMatch || memberMatch;
      })
      .sort((a, b) => b.members.length - a.members.length);
  }, [departments, employees, selectedDeptId, query]);

  const matchedEmployees = useMemo(() => {
    if (!query) return [];
    return employees.filter(
      (m) =>
        m.fullName.toLowerCase().includes(query) ||
        (m.code || '').toLowerCase().includes(query) ||
        (m.positionName || '').toLowerCase().includes(query)
    );
  }, [employees, query]);

  const toggleDept = (deptId: string) => {
    setExpandedDepts((prev) => ({ ...prev, [deptId]: !prev[deptId] }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Sơ đồ tổ chức &amp; Vị trí nhân sự</h1>
          <p className="mt-1 text-sm text-slate-500">
            Trực quan hóa cơ cấu Công ty → Phòng ban → Cấp bậc / Chức vụ để tra cứu nhanh vị trí từng nhân sự
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800">
          <Users className="h-4 w-4" />
          <span>{employees.length} nhân sự · {orgBranches.length} phòng ban có nhân sự</span>
        </div>
      </div>

      {/* Search & Department Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="relative min-w-[260px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm nhân viên theo tên, mã NV hoặc chức vụ để định vị trong công ty..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-9 pl-10 text-sm text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <select
          value={selectedDeptId}
          onChange={(e) => setSelectedDeptId(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-600 focus:bg-white"
        >
          <option value="ALL">Tất cả phòng ban</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {/* Instant Locate Banner when searching */}
      {query && matchedEmployees.length > 0 && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4">
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-blue-800">
            Định vị nhanh ({matchedEmployees.length} kết quả khớp)
          </div>
          <div className="flex flex-wrap gap-2">
            {matchedEmployees.slice(0, 8).map((emp) => (
              <button
                key={emp.id}
                onClick={() => setSelectedEmployee(emp)}
                className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs transition hover:border-blue-500 hover:text-blue-700"
              >
                <span className="font-bold text-blue-700">{emp.fullName}</span>
                <span className="text-slate-400">({emp.code})</span>
                <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[11px] text-blue-700">
                  {emp.departmentName || 'Chưa phân phòng'} · {emp.positionName || 'Nhân viên'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {/* Visual Org Tree */}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
          Đang dựng sơ đồ cơ cấu tổ chức...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Root Node: Company */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-blue-800 to-blue-700 px-6 py-4 text-white shadow-lg shadow-blue-800/20">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                <Crown className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xs font-medium text-blue-100">TỔNG CÔNG TY</div>
                <div className="text-lg font-extrabold">Hệ thống Doanh nghiệp HRM</div>
              </div>
            </div>
            <div className="h-6 w-0.5 bg-slate-300" />
          </div>

          {/* Department Branches Grid */}
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {orgBranches.map((branch) => {
              const isOpen = expandedDepts[branch.deptId] ?? true;
              return (
                <div
                  key={branch.deptId}
                  className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs"
                >
                  <button
                    onClick={() => toggleDept(branch.deptId)}
                    className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3.5 text-left transition hover:bg-slate-100/70"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">{branch.deptName}</div>
                        <div className="text-xs text-slate-500">{branch.members.length} thành viên</div>
                      </div>
                    </div>
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="divide-y divide-slate-100 p-2">
                      {branch.members.map((emp) => {
                        const rank = getPositionRank(emp.positionName);
                        const tier = getTierBadge(rank);
                        const isHighlighted =
                          !!query &&
                          (emp.fullName.toLowerCase().includes(query) ||
                            (emp.code || '').toLowerCase().includes(query));

                        return (
                          <button
                            key={emp.id}
                            onClick={() => setSelectedEmployee(emp)}
                            className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left transition ${
                              isHighlighted
                                ? 'bg-blue-50 ring-2 ring-blue-500'
                                : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex min-w-0 items-center gap-2.5">
                              <div
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                  rank <= 2
                                    ? 'bg-blue-700 text-white'
                                    : rank === 3
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {emp.fullName.trim().slice(0, 1).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="truncate text-sm font-semibold text-slate-900">
                                  {emp.fullName}
                                </div>
                                <div className="truncate text-xs text-slate-500">
                                  {emp.code} · {emp.positionName || 'Nhân viên'}
                                </div>
                              </div>
                            </div>
                            <span
                              className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${tier.cls}`}
                            >
                              {tier.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Employee Location Detail Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-700 text-base font-bold text-white">
                  {selectedEmployee.fullName.trim().slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedEmployee.fullName}</h3>
                  <p className="text-xs font-semibold text-blue-700">{selectedEmployee.code}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Position Path Breadcrumb */}
            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/70 p-3.5">
              <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase text-blue-700">
                <Layers className="h-3.5 w-3.5" />
                Vị trí trong cơ cấu công ty
              </div>
              <div className="text-sm font-semibold text-slate-800">
                Tổng công ty →{' '}
                <span className="text-blue-700">{selectedEmployee.departmentName || 'Chưa phân phòng'}</span> →{' '}
                <span>{selectedEmployee.positionName || 'Nhân viên'}</span>
              </div>
            </div>

            <div className="mt-4 space-y-2.5 text-sm">
              <div className="flex items-center justify-between border-b border-slate-100 py-2">
                <span className="flex items-center gap-2 text-slate-500">
                  <Building2 className="h-4 w-4" /> Phòng ban
                </span>
                <span className="font-semibold text-slate-900">
                  {selectedEmployee.departmentName || 'Chưa cập nhật'}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 py-2">
                <span className="flex items-center gap-2 text-slate-500">
                  <Briefcase className="h-4 w-4" /> Chức vụ
                </span>
                <span className="font-semibold text-slate-900">
                  {selectedEmployee.positionName || 'Chưa cập nhật'}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 py-2">
                <span className="flex items-center gap-2 text-slate-500">
                  <Mail className="h-4 w-4" /> Email
                </span>
                <span className="font-semibold text-slate-900">
                  {selectedEmployee.email || 'Chưa cập nhật'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="flex items-center gap-2 text-slate-500">
                  <UserCheck className="h-4 w-4" /> Tài khoản hệ thống
                </span>
                <span className="font-semibold text-slate-900">
                  {selectedEmployee.userName || 'Chưa cấp tài khoản'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedEmployee(null)}
              className="mt-5 w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
