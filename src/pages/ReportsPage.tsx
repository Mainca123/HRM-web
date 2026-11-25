import React, { useEffect, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { apiClient, exportToCsv, extractErrorMessage } from '../api/client';
import {
  ApiResponse,
  DepartmentDto,
  LeaveSummaryReportDto,
  OvertimeSummaryReportDto,
} from '../types/api';

export function ReportsPage() {
  const [tab, setTab] = useState<'leave' | 'ot'>('leave');
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [departmentId, setDepartmentId] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const [leaveReport, setLeaveReport] = useState<LeaveSummaryReportDto[]>([]);
  const [otReport, setOtReport] = useState<OvertimeSummaryReportDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<ApiResponse<DepartmentDto[]>>('/api/departments')
      .then((res) => setDepartments(res.data.data || []))
      .catch(() => {});
  }, []);

  const loadReport = async () => {
    setLoading(true);
    setError(null);
    try {
      if (tab === 'leave') {
        const fromDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const toDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        const res = await apiClient.get<ApiResponse<LeaveSummaryReportDto[]>>('/api/reports/leave-summary', {
          params: { fromDate, toDate, departmentId: departmentId || undefined },
        });
        setLeaveReport(res.data.data || []);
      } else {
        const res = await apiClient.get<ApiResponse<OvertimeSummaryReportDto[]>>('/api/reports/overtime-summary', {
          params: { month, year, departmentId: departmentId || undefined },
        });
        setOtReport(res.data.data || []);
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Không tải được báo cáo.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [tab, month, year, departmentId]);

  const handleExport = () => {
    if (tab === 'leave') {
      exportToCsv(
        `bao-cao-nghi-phep-T${month}-${year}.csv`,
        ['Mã NV', 'Họ tên', 'Phòng ban', 'Phép năm', 'Nghỉ ốm', 'Không lương', 'Thai sản', 'Khác', 'Tổng ngày'],
        leaveReport.map((r) => [
          r.employeeCode,
          r.employeeFullName,
          r.departmentName,
          r.annualLeaveDays,
          r.sickLeaveDays,
          r.unpaidLeaveDays,
          r.maternityLeaveDays,
          r.otherLeaveDays,
          r.totalLeaveDays,
        ])
      );
    } else {
      exportToCsv(
        `bao-cao-tang-ca-T${month}-${year}.csv`,
        ['Mã NV', 'Họ tên', 'Phòng ban', 'OT thường', 'OT đêm', 'OT cuối tuần', 'OT lễ', 'Tổng giờ'],
        otReport.map((r) => [
          r.employeeCode,
          r.employeeFullName,
          r.departmentName,
          r.normalOvertimeHours,
          r.nightOvertimeHours,
          r.weekendOvertimeHours,
          r.holidayOvertimeHours,
          r.totalOvertimeHours,
        ])
      );
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Báo cáo &amp; Xuất dữ liệu</h1>
          <p className="mt-1 text-sm text-slate-500">Tổng hợp số ngày nghỉ phép và giờ tăng ca theo phòng ban, xuất file Excel/CSV</p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          <Download className="h-4 w-4" />
          Xuất CSV / Excel
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setTab('leave')}
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${
            tab === 'leave' ? 'bg-blue-700 text-white' : 'border border-slate-200 bg-white text-slate-600'
          }`}
        >
          Báo cáo Nghỉ phép
        </button>
        <button
          onClick={() => setTab('ot')}
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${
            tab === 'ot' ? 'bg-blue-700 text-white' : 'border border-slate-200 bg-white text-slate-600'
          }`}
        >
          Báo cáo Tăng ca (OT)
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>
              Tháng {m}
            </option>
          ))}
        </select>
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="w-24 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium"
        />
        <select
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium"
        >
          <option value="">Tất cả phòng ban</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <button
          onClick={loadReport}
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Xem báo cáo
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">{error}</div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          {tab === 'leave' ? (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3.5">Nhân viên</th>
                  <th className="px-4 py-3.5">Phòng ban</th>
                  <th className="px-4 py-3.5">Phép năm</th>
                  <th className="px-4 py-3.5">Nghỉ ốm</th>
                  <th className="px-4 py-3.5">Không lương</th>
                  <th className="px-4 py-3.5">Tổng ngày</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      Đang tải...
                    </td>
                  </tr>
                ) : leaveReport.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      Không có dữ liệu nghỉ phép tháng {month}/{year}
                    </td>
                  </tr>
                ) : (
                  leaveReport.map((r) => (
                    <tr key={r.employeeId} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{r.employeeFullName}</div>
                        <div className="text-xs text-slate-400">{r.employeeCode}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{r.departmentName || '—'}</td>
                      <td className="px-4 py-3">{r.annualLeaveDays}</td>
                      <td className="px-4 py-3">{r.sickLeaveDays}</td>
                      <td className="px-4 py-3">{r.unpaidLeaveDays}</td>
                      <td className="px-4 py-3 font-bold text-blue-700">{r.totalLeaveDays}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3.5">Nhân viên</th>
                  <th className="px-4 py-3.5">Phòng ban</th>
                  <th className="px-4 py-3.5">OT thường</th>
                  <th className="px-4 py-3.5">OT đêm</th>
                  <th className="px-4 py-3.5">OT cuối tuần</th>
                  <th className="px-4 py-3.5">OT lễ</th>
                  <th className="px-4 py-3.5">Tổng giờ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      Đang tải...
                    </td>
                  </tr>
                ) : otReport.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      Không có dữ liệu tăng ca tháng {month}/{year}
                    </td>
                  </tr>
                ) : (
                  otReport.map((r) => (
                    <tr key={r.employeeId} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{r.employeeFullName}</div>
                        <div className="text-xs text-slate-400">{r.employeeCode}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{r.departmentName || '—'}</td>
                      <td className="px-4 py-3">{r.normalOvertimeHours}h</td>
                      <td className="px-4 py-3">{r.nightOvertimeHours}h</td>
                      <td className="px-4 py-3">{r.weekendOvertimeHours}h</td>
                      <td className="px-4 py-3">{r.holidayOvertimeHours}h</td>
                      <td className="px-4 py-3 font-bold text-blue-700">{r.totalOvertimeHours}h</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
