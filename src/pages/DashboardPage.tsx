import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { apiClient, extractErrorMessage } from '../api/client';
import { ApiResponse, HrDashboardDto, ManagerDashboardDto } from '../types/api';

const PIE_COLORS = ['#1d4ed8', '#e2e8f0'];

export function DashboardPage() {
  const [hrData, setHrData] = useState<HrDashboardDto | null>(null);
  const [mgrData, setMgrData] = useState<ManagerDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const [hrRes, mgrRes] = await Promise.all([
        apiClient.get<ApiResponse<HrDashboardDto>>('/api/dashboard/hr'),
        apiClient.get<ApiResponse<ManagerDashboardDto>>('/api/dashboard/manager'),
      ]);
      if (hrRes.data.success && hrRes.data.data) setHrData(hrRes.data.data);
      if (mgrRes.data.success && mgrRes.data.data) setMgrData(mgrRes.data.data);
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
      'Tổng NV': d.totalEmployees,
      'Có mặt': d.presentToday,
    }));

  const pendingTotal =
    (mgrData?.pendingLeaveRequestsCount || 0) + (mgrData?.pendingLateEarlyRequestsCount || 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Tổng quan hệ thống</h1>
          <p className="mt-1 text-sm text-slate-500">
            Theo dõi quân số, tỷ lệ chuyên cần và đơn chờ duyệt toàn công ty theo thời gian thực
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

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Phân bổ nhân sự &amp; Có mặt theo phòng ban</h2>
              <p className="text-xs text-slate-500">So sánh tổng quân số và số người đã chấm công hôm nay</p>
            </div>
            <Link
              to="/org-chart"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline"
            >
              Xem sơ đồ nhân sự <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="h-72 w-full">
            {deptChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptChartData} margin={{ top: 8, right: 12, left: -12, bottom: 20 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Tổng NV" fill="#94a3b8" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Có mặt" fill="#1d4ed8" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                {loading ? 'Đang tải biểu đồ...' : 'Chưa có dữ liệu phòng ban'}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="text-base font-bold text-slate-900">Tỷ lệ chuyên cần hôm nay</h2>
          <p className="text-xs text-slate-500">Toàn công ty</p>
          <div className="mt-2 h-64 w-full">
            {hrData ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="48%"
                    innerRadius={56}
                    outerRadius={82}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                Đang tải...
              </div>
            )}
          </div>
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
