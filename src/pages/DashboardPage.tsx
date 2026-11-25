import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserCheck,
  UserX,
  Building2,
  Clock,
  CalendarOff,
  CheckSquare,
  RefreshCw,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  ComposedChart,
  Area,
} from 'recharts';
import { apiClient, extractErrorMessage } from '../api/client';
import {
  ApiResponse,
  EmployeeSummaryDto,
  HrDashboardDto,
  ManagerDashboardDto,
  PagedResult,
} from '../types/api';

const PIE_COLORS = ['#1d4ed8', '#e2e8f0'];

export function DashboardPage() {
  const [hrData, setHrData] = useState<HrDashboardDto | null>(null);
  const [mgrData, setMgrData] = useState<ManagerDashboardDto | null>(null);
  const [employees, setEmployees] = useState<EmployeeSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const [hrRes, mgrRes, empRes] = await Promise.all([
        apiClient.get<ApiResponse<HrDashboardDto>>('/api/dashboard/hr'),
        apiClient.get<ApiResponse<ManagerDashboardDto>>('/api/dashboard/manager'),
        apiClient.get<ApiResponse<PagedResult<EmployeeSummaryDto>>>('/api/employees', {
          params: { pageIndex: 1, pageSize: 100 },
        }),
      ]);
      if (hrRes.data.success && hrRes.data.data) setHrData(hrRes.data.data);
      if (mgrRes.data.success && mgrRes.data.data) setMgrData(mgrRes.data.data);
      if (empRes.data.success && empRes.data.data) setEmployees(empRes.data.data.items || []);
    } catch (err) {
      setError(extractErrorMessage(err, 'Không tải được dữ liệu tổng quan.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const pieData = hrData
    ? [
        { name: 'Có mặt hôm nay', value: hrData.presentToday },
        { name: 'Chưa chấm công / Vắng', value: hrData.absentToday },
      ]
    : [];

  const deptChartData = (hrData?.departmentStats || [])
    .filter((d) => d.totalEmployees > 0)
    .slice(0, 12)
    .map((d) => ({
      name: d.departmentName,
      'Tổng nhân sự': d.totalEmployees,
      'Có mặt': d.presentToday,
      rate: d.attendanceRate,
    }));

  // Compute 6-month headcount trend from real employee join dates + active headcount
  const headcountTrend = useMemo(() => {
    const now = new Date();
    const curYear = hrData?.year || now.getFullYear();
    const curMonth = hrData?.month || now.getMonth() + 1;
    const totalActive = hrData?.totalActiveEmployees ?? employees.length;

    const months: { year: number; month: number; label: string; newHires: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(curYear, curMonth - 1 - i, 1);
      months.push({
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        label: `T${d.getMonth() + 1}/${String(d.getFullYear()).slice(-2)}`,
        newHires: 0,
      });
    }

    // Count new hires per month from employee currentDepartmentFromDate
    employees.forEach((emp) => {
      if (!emp.currentDepartmentFromDate) return;
      const dt = new Date(emp.currentDepartmentFromDate);
      if (Number.isNaN(dt.getTime())) return;
      const bucket = months.find((m) => m.year === dt.getFullYear() && m.month === dt.getMonth() + 1);
      if (bucket) bucket.newHires += 1;
    });

    // Ensure current month matches hrData.totalNewEmployeesThisMonth when available
    if (hrData && months.length > 0 && hrData.totalNewEmployeesThisMonth > months[months.length - 1].newHires) {
      months[months.length - 1].newHires = hrData.totalNewEmployeesThisMonth;
    }

    // Walk backwards from current totalActive to derive cumulative headcount per month
    const result: { label: string; 'Tổng nhân sự': number; 'Tuyển mới': number }[] = new Array(months.length);
    let runningTotal = totalActive;
    for (let i = months.length - 1; i >= 0; i--) {
      result[i] = {
        label: months[i].label,
        'Tổng nhân sự': Math.max(0, runningTotal),
        'Tuyển mới': months[i].newHires,
      };
      runningTotal = Math.max(0, runningTotal - months[i].newHires);
    }
    return result;
  }, [hrData, employees]);

  const pendingTotal =
    (mgrData?.pendingLeaveRequestsCount || 0) + (mgrData?.pendingLateEarlyRequestsCount || 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Tổng quan hệ thống</h1>
          <p className="mt-1 text-sm text-slate-500">
            Theo dõi quân số, tỷ lệ chuyên cần, biến động nhân sự và đơn chờ duyệt toàn công ty
          </p>
        </div>
        <button
          onClick={loadDashboard}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Tổng nhân sự hoạt động"
          value={hrData ? `${hrData.totalActiveEmployees}` : '—'}
          sub={`${hrData?.totalDepartments || 0} phòng ban`}
          icon={<Users className="h-5 w-5" />}
          color="blue"
        />
        <KpiCard
          title="Có mặt hôm nay"
          value={hrData ? `${hrData.presentToday}` : '—'}
          sub={`Tỷ lệ chuyên cần: ${hrData?.attendanceRate ?? 0}%`}
          icon={<UserCheck className="h-5 w-5" />}
          color="emerald"
        />
        <KpiCard
          title="Vắng / Chưa chấm công"
          value={hrData ? `${hrData.absentToday}` : '—'}
          sub={`Nghỉ phép tháng này: ${hrData?.totalLeaveDaysThisMonth ?? 0} ngày`}
          icon={<UserX className="h-5 w-5" />}
          color="amber"
        />
        <KpiCard
          title="Đơn chờ phê duyệt"
          value={`${pendingTotal}`}
          sub={`${mgrData?.pendingLeaveRequestsCount || 0} nghỉ phép · ${mgrData?.pendingLateEarlyRequestsCount || 0} giải trình`}
          icon={<CheckSquare className="h-5 w-5" />}
          color="rose"
        />
      </div>

      {/* Row 1: Attendance Charts (Polished Bar + Center-KPI Donut) */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs lg:col-span-2">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">Phân bổ nhân sự &amp; Chuyên cần theo phòng ban</h2>
              <p className="text-xs text-slate-500">So sánh tổng quân số và số nhân sự đã chấm công hôm nay</p>
            </div>
            <Link
              to="/org-chart"
              className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              Sơ đồ nhân sự <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="h-72 w-full">
            {deptChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={deptChartData}
                  margin={{ top: 10, right: 16, left: -12, bottom: 8 }}
                  barGap={8}
                >
                  <defs>
                    <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={1} />
                      <stop offset="100%" stopColor="#1e40af" stopOpacity={0.9} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="name"
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#475569', fontWeight: 600 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.1)',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} iconType="circle" />
                  <Bar
                    dataKey="Tổng nhân sự"
                    fill="#cbd5e1"
                    maxBarSize={42}
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar
                    dataKey="Có mặt"
                    fill="url(#presentGrad)"
                    maxBarSize={42}
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                {loading ? 'Đang tải biểu đồ...' : 'Chưa có dữ liệu phòng ban'}
              </div>
            )}
          </div>
        </div>

        {/* Polished Donut with Center KPI */}
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div>
            <h2 className="text-base font-bold text-slate-900">Tỷ lệ chuyên cần hôm nay</h2>
            <p className="text-xs text-slate-500">Toàn công ty</p>
          </div>
          <div className="relative mt-2 h-56 w-full">
            {hrData ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={64}
                      outerRadius={88}
                      startAngle={90}
                      endAngle={-270}
                      paddingAngle={2}
                      cornerRadius={6}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((_, idx) => (
                        <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold text-slate-900">{hrData.attendanceRate}%</span>
                  <span className="text-xs font-medium text-slate-500">Chuyên cần</span>
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                Đang tải...
              </div>
            )}
          </div>

          <div className="mt-auto grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
            <div className="rounded-xl bg-blue-50/70 p-2.5 text-center">
              <div className="text-[11px] font-semibold text-blue-700">Có mặt</div>
              <div className="text-lg font-extrabold text-blue-900">{hrData?.presentToday ?? 0}</div>
            </div>
            <div className="rounded-xl bg-slate-100/80 p-2.5 text-center">
              <div className="text-[11px] font-semibold text-slate-500">Chưa chấm công</div>
              <div className="text-lg font-extrabold text-slate-800">{hrData?.absentToday ?? 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: NEW Headcount Trend Chart (Tăng giảm nhân sự 6 tháng) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-700" />
              <h2 className="text-base font-bold text-slate-900">Biểu đồ biến động tăng / giảm nhân sự</h2>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Theo dõi quy mô tổng nhân sự và số nhân sự gia nhập mới trong 6 tháng gần nhất
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              Quy mô hiện tại: {hrData?.totalActiveEmployees ?? 0} NV
            </span>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Tháng này: +{hrData?.totalNewEmployeesThisMonth ?? 0} mới
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={headcountTrend} margin={{ top: 10, right: 16, left: -12, bottom: 4 }}>
              <defs>
                <linearGradient id="headcountArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="label"
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#475569', fontWeight: 600 }}
              />
              <YAxis
                yAxisId="left"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                allowDecimals={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#10b981' }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.1)',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} iconType="circle" />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="Tổng nhân sự"
                stroke="#1d4ed8"
                strokeWidth={2.5}
                fill="url(#headcountArea)"
                activeDot={{ r: 6, fill: '#1d4ed8', stroke: '#ffffff', strokeWidth: 2 }}
              />
              <Bar
                yAxisId="right"
                dataKey="Tuyển mới"
                fill="#10b981"
                maxBarSize={28}
                radius={[6, 6, 0, 0]}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Monthly Summary & Action Links */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">Tổng giờ tăng ca tháng</div>
              <div className="text-xl font-extrabold text-slate-900">
                {hrData?.totalOvertimeHoursThisMonth ?? 0} giờ
              </div>
            </div>
          </div>
          <Link to="/reports" className="text-xs font-semibold text-blue-700 hover:underline">
            Báo cáo
          </Link>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <CalendarOff className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">Ngày nghỉ phép tháng</div>
              <div className="text-xl font-extrabold text-slate-900">
                {hrData?.totalLeaveDaysThisMonth ?? 0} ngày
              </div>
            </div>
          </div>
          <Link to="/approvals" className="text-xs font-semibold text-blue-700 hover:underline">
            Duyệt đơn
          </Link>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">Nhân sự mới tháng này</div>
              <div className="text-xl font-extrabold text-slate-900">
                +{hrData?.totalNewEmployeesThisMonth ?? 0} người
              </div>
            </div>
          </div>
          <Link to="/employees" className="text-xs font-semibold text-blue-700 hover:underline">
            Danh sách
          </Link>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  sub,
  icon,
  color,
}: {
  title: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  color: 'blue' | 'emerald' | 'amber' | 'rose';
}) {
  const styles = {
    blue: 'bg-blue-50 text-blue-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</span>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${styles[color]}`}>{icon}</div>
      </div>
      <div className="mt-3 text-3xl font-extrabold text-slate-900">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{sub}</div>
    </div>
  );
}
