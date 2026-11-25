export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  errors?: string[] | null;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
}

export interface UserProfile {
  username: string;
  employeeId?: number | null;
  employeeCode?: string | null;
  fullName: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  expiresAt?: string;
  user: UserProfile;
}

export interface DepartmentStatDto {
  departmentId: string;
  departmentName: string;
  totalEmployees: number;
  presentToday: number;
  attendanceRate: number;
}

export interface HrDashboardDto {
  reportDate: string;
  totalActiveEmployees: number;
  totalDepartments: number;
  presentToday: number;
  absentToday: number;
  attendanceRate: number;
  month: number;
  year: number;
  totalNewEmployeesThisMonth: number;
  totalOvertimeHoursThisMonth: number;
  totalLeaveDaysThisMonth: number;
  departmentStats: DepartmentStatDto[];
}

export interface ManagerDashboardDto {
  departmentId?: string | null;
  departmentName?: string | null;
  reportDate: string;
  totalDepartmentEmployees: number;
  presentToday: number;
  absentToday: number;
  attendanceRate: number;
  pendingLeaveRequestsCount: number;
  pendingLateEarlyRequestsCount: number;
  pendingLeaves: LeaveRequestDto[];
  pendingLateEarlies: RegisterLateEarlyDto[];
}

export interface EmployeeSummaryDto {
  id: number;
  code: string;
  fullName: string;
  email?: string | null;
  sex?: boolean | null;
  birthDate?: string | null;
  departmentId?: string | null;
  departmentName?: string | null;
  positionId?: string | null;
  positionName?: string | null;
  userName?: string | null;
  currentDepartmentFromDate?: string | null;
}

export interface DepartmentDto {
  id: string;
  name: string;
  isActive?: boolean;
  employeeCount?: number;
}

export interface PositionDto {
  id: string;
  name: string;
}

export interface UserGroupDto {
  id: string;
  name: string;
}

export interface UserSummaryDto {
  userName?: string;
  username?: string;
  groupId?: string | null;
  groupName?: string | null;
  permission?: boolean;
  employeeId?: number | null;
  employeeCode?: string | null;
  employeeFullName?: string | null;
}

export interface ShiftDto {
  id: string;
  name: string;
  isDefault?: boolean;
  normalTimeIn?: string | null;
  normalTimeOut?: string | null;
  lateComing?: number | null;
  earlyReturning?: number | null;
}

export interface TimeInTimeOutDto {
  employeeId: number;
  employeeCode?: string | null;
  employeeFullName: string;
  departmentName?: string | null;
  workingDay: string;
  shiftId: string;
  shiftName?: string | null;
  timeIn?: string | null;
  timeOut?: string | null;
  status?: number | null;
  notes?: string | null;
  lateMinutes?: number | null;
  earlyMinutes?: number | null;
  workingHours?: number | null;
}

export interface MonthlyAttendanceSummaryDto {
  employeeId: number;
  employeeCode?: string | null;
  employeeFullName: string;
  departmentId?: string | null;
  departmentName?: string | null;
  month: number;
  year: number;
  totalWorkDays: number;
  totalOvertimeNormal: number;
  totalOvertimeNormalNight: number;
  totalOvertimeWeekend: number;
  totalOvertimeWeekendNight: number;
  totalOvertimeHoliday: number;
  totalOvertimeHolidayNight: number;
  totalLateMinutes: number;
  totalEarlyMinutes: number;
  totalMealAllowance: number;
}

export interface LeaveRequestDto {
  employeeId: number;
  employeeCode?: string | null;
  employeeFullName?: string | null;
  departmentName?: string | null;
  fromDate: string;
  toDate?: string | null;
  unit?: number | null;
  absenceId: string;
  absenceName?: string | null;
  notes?: string | null;
  status?: number | null;
  createdDate?: string | null;
  approvedUserName?: string | null;
  approvedDate?: string | null;
}

export interface OvertimeRequestDto {
  employeeId: number;
  employeeCode?: string | null;
  employeeFullName: string;
  departmentName?: string | null;
  fromDate: string;
  toDate?: string | null;
  type: number;
  value?: number | null;
  createdUserName?: string | null;
  createdDate?: string | null;
  modifiedUserName?: string | null;
  modifiedDate?: string | null;
}

export interface RegisterLateEarlyDto {
  employeeId: number;
  employeeCode?: string | null;
  employeeFullName: string;
  departmentName?: string | null;
  fromDate: string;
  toDate?: string | null;
  type: boolean;
  typeName?: string | null;
  value?: number | null;
  reason?: string | null;
  createdUserName?: string | null;
  createdDate?: string | null;
  modifiedUserName?: string | null;
  modifiedDate?: string | null;
}

export interface LeaveSummaryReportDto {
  employeeId: number;
  employeeCode?: string | null;
  employeeFullName: string;
  departmentId?: string | null;
  departmentName?: string | null;
  annualLeaveDays: number;
  sickLeaveDays: number;
  unpaidLeaveDays: number;
  maternityLeaveDays: number;
  otherLeaveDays: number;
  totalLeaveDays: number;
}

export interface OvertimeSummaryReportDto {
  employeeId: number;
  employeeCode?: string | null;
  employeeFullName: string;
  departmentId?: string | null;
  departmentName?: string | null;
  normalOvertimeHours: number;
  nightOvertimeHours: number;
  weekendOvertimeHours: number;
  holidayOvertimeHours: number;
  totalOvertimeHours: number;
}
