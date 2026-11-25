import React, { useEffect, useState } from 'react';
import { MapPin, ExternalLink, Download, RefreshCw } from 'lucide-react';
import { apiClient, exportToCsv, extractErrorMessage } from '../api/client';
import {
  ApiResponse,
  DepartmentDto,
  MonthlyAttendanceSummaryDto,
  PagedResult,
  TimeInTimeOutDto,
} from '../types/api';

function extractGpsCoords(notes?: string | null): { lat: string; lng: string } | null {
  if (!notes) return null;
  const m = notes.match(/GPS:\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/i);
  if (!m) return null;
  return { lat: m[1], lng: m[2] };
}

export function AttendancePage() {
  const [tab, setTab] = useState<'daily' | 'monthly'>('daily');
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [departmentId, setDepartmentId] = useState('');
  const [search, setSearch] = useState('');

  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const [dailyList, setDailyList] = useState<TimeInTimeOutDto[]>([]);
  const [monthlyList, setMonthlyList] = useState<MonthlyAttendanceSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<ApiResponse<DepartmentDto[]>>('/api/departments')
      .then((res) => setDepartments(res.data.data || []))
      .catch(() => {});
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (tab === 'daily') {
        const res = await apiClient.get<ApiResponse<PagedResult<TimeInTimeOutDto>>>('/api/attendance/daily', {
          params: {
            pageIndex: 1,
            pageSize: 100,
            date,
            departmentId: departmentId || undefined,
            search: search.trim() || undefined,
          },
        });
        setDailyList(res.data.data?.items || []);
      } else {
        const res = await apiClient.get<ApiResponse<PagedResult<MonthlyAttendanceSummaryDto>>>(
          '/api/attendance/monthly-summary',
          {
            params: {
              pageIndex: 1,
              pageSize: 100,
              month,
              year,
              departmentId: departmentId || undefined,
              search: search.trim() || undefined,
            },
          }
        );
        setMonthlyList(res.data.data?.items || []);
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Lỗi tải dữ liệu chấm công.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tab, date, month, year, departmentId]);

  const handleExport = () => {
    if (tab === 'daily') {
      exportToCsv(
        `cham-cong-ngay-${date}.csv`,
        ['Mã NV', 'Họ tên', 'Phòng ban', 'Ca', 'Giờ vào', 'Giờ ra', 'Đi muộn (p)', 'Về sớm (p)', 'Vị trí GPS / Ghi chú'],
        dailyList.map((r) => [
          r.employeeCode,
          r.employeeFullName,
          r.departmentName,
          r.shiftName || r.shiftId,
          r.timeIn?.slice(11, 19) || '',
          r.timeOut?.slice(11, 19) || '',
          r.lateMinutes ?? 0,
          r.earlyMinutes ?? 0,
          r.notes || '',
        ])
      );
    } else {
      exportToCsv(
        `tong-hop-cong-T${month}-${year}.csv`,
        ['Mã NV', 'Họ tên', 'Phòng ban', 'Ngày công', 'OT thường', 'OT đêm', 'Đi muộn (p)', 'Về sớm (p)', 'Suất ăn'],
        monthlyList.map((m) => [
          m.employeeCode,
          m.employeeFullName,
          m.departmentName,
          m.totalWorkDays,
          m.totalOvertimeNormal,
          m.totalOvertimeNormalNight,
          m.totalLateMinutes,
          m.totalEarlyMinutes,
          m.totalMealAllowance,
        ])
      );
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Quản lý Chấm công &amp; Đối chiếu GPS</h1>
          <p className="mt-1 text-sm text-slate-500">
            Kiểm tra giờ vào/ra thực tế, tọa độ vị trí điểm danh của nhân viên và bảng tổng hợp công tháng
          </p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          <Download className="h-4 w-4" />
          Xuất CSV / Excel
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('daily')}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            tab === 'daily' ? 'bg-blue-700 text-white' : 'border border-slate-200 bg-white text-slate-600'
          }`}
        >
          Chấm công theo ngày (GPS)
        </button>
        <button
          onClick={() => setTab('monthly')}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            tab === 'monthly' ? 'bg-blue-700 text-white' : 'border border-slate-200 bg-white text-slate-600'
          }`}
        >
          Tổng hợp công tháng
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        {tab === 'daily' ? (
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium"
          />
        ) : (
          <div className="flex items-center gap-2">
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
          </div>
        )}

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

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && loadData()}
          placeholder="Tìm theo tên / mã NV..."
          className="min-w-[200px] flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm outline-none focus:border-blue-600 focus:bg-white"
        />

        <button
          onClick={loadData}
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Lọc
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">{error}</div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          {tab === 'daily' ? (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3.5">Nhân viên</th>
                  <th className="px-4 py-3.5">Phòng ban</th>
                  <th className="px-4 py-3.5">Giờ vào</th>
                  <th className="px-4 py-3.5">Giờ ra</th>
                  <th className="px-4 py-3.5">Trạng thái</th>
                  <th className="px-4 py-3.5">Vị trí GPS / Ghi chú đối chiếu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : dailyList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      Không có dữ liệu chấm công ngày {date}
                    </td>
                  </tr>
                ) : (
                  dailyList.map((r, i) => {
                    const gps = extractGpsCoords(r.notes);
                    return (
                      <tr key={`${r.employeeId}-${r.shiftId}-${i}`} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{r.employeeFullName}</div>
                          <div className="text-xs text-slate-400">{r.employeeCode} · {r.shiftName || r.shiftId}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{r.departmentName || '—'}</td>
                        <td className="px-4 py-3 font-mono font-semibold text-emerald-700">
                          {r.timeIn ? r.timeIn.slice(11, 19) : '--:--:--'}
                        </td>
                        <td className="px-4 py-3 font-mono font-semibold text-blue-700">
                          {r.timeOut ? r.timeOut.slice(11, 19) : '--:--:--'}
                        </td>
                        <td className="px-4 py-3">
                          {!r.timeOut ? (
                            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                              Chưa tan ca
                            </span>
                          ) : (r.lateMinutes || 0) > 0 ? (
                            <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
                              Muộn {r.lateMinutes}p
                            </span>
                          ) : (
                            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                              Đúng giờ
                            </span>
                          )}
                        </td>
                        <td className="max-w-xs px-4 py-3 text-xs text-slate-600">
                          <div className="flex items-start gap-1.5">
                            {gps && <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />}
                            <div>
                              <div className="line-clamp-2">{r.notes || '—'}</div>
                              {gps && (
                                <a
                                  href={`https://www.google.com/maps?q=${gps.lat},${gps.lng}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-1 inline-flex items-center gap-1 font-semibold text-blue-700 hover:underline"
                                >
                                  Mở Google Maps <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3.5">Nhân viên</th>
                  <th className="px-4 py-3.5">Phòng ban</th>
                  <th className="px-4 py-3.5">Ngày công</th>
                  <th className="px-4 py-3.5">OT thường</th>
                  <th className="px-4 py-3.5">OT đêm</th>
                  <th className="px-4 py-3.5">Đi muộn (p)</th>
                  <th className="px-4 py-3.5">Về sớm (p)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      Đang tải...
                    </td>
                  </tr>
                ) : monthlyList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      Chưa có bảng tổng hợp tháng {month}/{year}
                    </td>
                  </tr>
                ) : (
                  monthlyList.map((m) => (
                    <tr key={m.employeeId} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{m.employeeFullName}</div>
                        <div className="text-xs text-slate-400">{m.employeeCode}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{m.departmentName || '—'}</td>
                      <td className="px-4 py-3 font-bold text-blue-700">{m.totalWorkDays}</td>
                      <td className="px-4 py-3">{m.totalOvertimeNormal}h</td>
                      <td className="px-4 py-3">{m.totalOvertimeNormalNight}h</td>
                      <td className="px-4 py-3 text-amber-700">{m.totalLateMinutes}</td>
                      <td className="px-4 py-3 text-amber-700">{m.totalEarlyMinutes}</td>
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
