import React, { useEffect, useState } from 'react';
import { Building2, Briefcase, Clock, Shield } from 'lucide-react';
import { apiClient } from '../api/client';
import { ApiResponse, DepartmentDto, PositionDto, ShiftDto, UserGroupDto } from '../types/api';

export function CatalogsPage() {
  const formatShiftTime = (val?: string | null) => {
    if (!val) return '--:--';
    const timePart = val.includes('T') ? val.split('T')[1] : val.includes(' ') ? val.split(' ')[1] : val;
    return timePart.slice(0, 5);
  };
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [positions, setPositions] = useState<PositionDto[]>([]);
  const [shifts, setShifts] = useState<ShiftDto[]>([]);
  const [groups, setGroups] = useState<UserGroupDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiClient.get<ApiResponse<DepartmentDto[]>>('/api/departments'),
      apiClient.get<ApiResponse<PositionDto[]>>('/api/positions'),
      apiClient.get<ApiResponse<ShiftDto[]>>('/api/attendance/shifts'),
      apiClient.get<ApiResponse<UserGroupDto[]>>('/api/user-groups'),
    ])
      .then(([d, p, s, g]) => {
        setDepartments(d.data.data || []);
        setPositions(p.data.data || []);
        setShifts(s.data.data || []);
        setGroups(g.data.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-400">
        Đang tải danh mục hệ thống...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Danh mục Tổ chức &amp; Ca làm việc</h1>
        <p className="mt-1 text-sm text-slate-500">Toàn bộ Phòng ban, Chức vụ, Ca làm việc và Nhóm quyền đang cấu hình</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Departments */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
            <Building2 className="h-5 w-5 text-blue-700" />
            Phòng ban ({departments.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {departments.map((d) => (
              <span
                key={d.id}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
              >
                <span className="text-blue-700">#{d.id}</span> · {d.name}
              </span>
            ))}
          </div>
        </div>

        {/* Positions */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
            <Briefcase className="h-5 w-5 text-emerald-700" />
            Chức vụ ({positions.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {positions.map((p) => (
              <span
                key={p.id}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
              >
                <span className="text-emerald-700">#{p.id}</span> · {p.name}
              </span>
            ))}
          </div>
        </div>

        {/* Shifts */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
            <Clock className="h-5 w-5 text-amber-600" />
            Ca làm việc ({shifts.length})
          </div>
          <div className="divide-y divide-slate-100">
            {shifts.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <span className="font-bold text-slate-900">{s.name}</span>
                  <span className="ml-2 text-xs text-slate-400">({s.id})</span>
                  {s.isDefault && (
                    <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                      Mặc định
                    </span>
                  )}
                </div>
                <span className="font-mono text-xs font-semibold text-slate-600">
                  {formatShiftTime(s.normalTimeIn)} → {formatShiftTime(s.normalTimeOut)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* User Groups */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
            <Shield className="h-5 w-5 text-purple-700" />
            Nhóm quyền ({groups.length})
          </div>
          <div className="divide-y divide-slate-100">
            {groups.map((g) => (
              <div key={g.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="font-semibold text-slate-900">{g.name}</span>
                <span className="rounded-lg bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                  ID: {g.id}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
