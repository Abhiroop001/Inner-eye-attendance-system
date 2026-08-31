import { DateTime } from 'luxon';
import { Attendance } from '../models/Attendance.js';
import { Employee } from '../models/Employee.js';
import { LeaveBalance } from '../models/LeaveBalance.js';
import { LeaveRequest } from '../models/LeaveRequest.js';
import { LateReason } from '../models/LateReason.js';
import { cacheGet, cacheSet } from '../config/redis.js';

export async function getEmployeeDashboardData(employeeId: string, timezone = 'Asia/Kolkata') {
  const cacheKey = `dashboard:emp:${employeeId}`;
  const cached = await cacheGet(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {}
  }

  const now = DateTime.now().setZone(timezone);
  const todayStr = now.toFormat('yyyy-MM-dd');
  const monthStartStr = now.startOf('month').toFormat('yyyy-MM-dd');
  const monthEndStr = now.endOf('month').toFormat('yyyy-MM-dd');
  const weekStartStr = now.startOf('week').toFormat('yyyy-MM-dd');

  // 1. Employee Profile
  const employee = await Employee.findOne({ employeeId });
  if (!employee) return null;

  // 2. Today's Attendance
  const todayAttendance = await Attendance.findOne({ employeeId, attendanceDate: todayStr });

  // 3. This Month Attendance Records
  const monthRecords = await Attendance.find({
    employeeId,
    attendanceDate: { $gte: monthStartStr, $lte: monthEndStr },
  }).sort({ attendanceDate: -1 });

  // 4. This Week Records
  const weekRecords = await Attendance.find({
    employeeId,
    attendanceDate: { $gte: weekStartStr, $lte: todayStr },
  });

  const weeklyWorkingMinutes = weekRecords.reduce((acc, curr) => acc + (curr.workingMinutes || 0), 0);
  const monthlyLateCount = monthRecords.filter((r) => r.status === 'LATE').length;
  const totalDaysRecorded = monthRecords.length;
  const presentDays = monthRecords.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
  const attendanceRate = totalDaysRecorded > 0 ? Math.round((presentDays / totalDaysRecorded) * 100) : 100;

  // 5. Leave Balances
  const leaveBalances = await LeaveBalance.find({ employeeId });

  // 6. Recent Pending Late Reasons
  const pendingLateReasons = await LateReason.find({
    employeeId,
    status: { $in: ['SUBMITTED', 'UNDER_REVIEW', 'NEEDS_MORE_INFO'] },
  }).sort({ submittedAt: -1 });

  // 7. Recent 14-day history for charts
  const recent14Days = await Attendance.find({
    employeeId,
    attendanceDate: { $gte: now.minus({ days: 14 }).toFormat('yyyy-MM-dd') },
  }).sort({ attendanceDate: 1 });

  const result = {
    employee: {
      employeeId: employee.employeeId,
      legalName: employee.legalName,
      preferredName: employee.preferredName || employee.legalName,
      workEmail: employee.workEmail,
      department: employee.department,
      designation: employee.designation,
      timezone: employee.timezone,
      location: employee.location,
    },
    today: todayAttendance || {
      attendanceDate: todayStr,
      status: 'ABSENT',
      checkInAt: null,
      checkOutAt: null,
      workingMinutes: 0,
      lateMinutes: 0,
    },
    kpi: {
      weeklyHours: (weeklyWorkingMinutes / 60).toFixed(1),
      monthlyAttendanceRate: attendanceRate,
      monthlyLateCount,
      totalWorkingHoursMonth: (monthRecords.reduce((acc, curr) => acc + (curr.workingMinutes || 0), 0) / 60).toFixed(1),
    },
    leaveBalances,
    pendingLateReasons,
    recentHistory: recent14Days,
    monthRecords: monthRecords.slice(0, 30),
  };

  // Cache for 60 seconds
  await cacheSet(cacheKey, JSON.stringify(result), 60);
  return result;
}

export async function getHRDashboardData(timezone = 'Asia/Kolkata') {
  const cacheKey = 'dashboard:hr:overview';
  const cached = await cacheGet(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {}
  }

  const now = DateTime.now().setZone(timezone);
  const todayStr = now.toFormat('yyyy-MM-dd');

  // Total active employees
  const totalEmployees = await Employee.countDocuments({ employmentStatus: 'ACTIVE' });

  // Today's attendance breakdown
  const todayRecords = await Attendance.find({ attendanceDate: todayStr });
  const presentCount = todayRecords.filter((r) => r.status === 'PRESENT').length;
  const lateCount = todayRecords.filter((r) => r.status === 'LATE').length;
  const halfDayCount = todayRecords.filter((r) => r.status === 'HALF_DAY').length;
  const onLeaveCount = todayRecords.filter((r) => r.status === 'ON_LEAVE').length;
  const absentCount = Math.max(0, totalEmployees - (presentCount + lateCount + halfDayCount + onLeaveCount));

  // Pending Actions
  const pendingLateReasons = await LateReason.countDocuments({ status: { $in: ['SUBMITTED', 'UNDER_REVIEW'] } });
  const pendingLeaves = await LeaveRequest.countDocuments({ status: 'PENDING' });

  // Department-wise breakdown
  const deptAggregation = await Employee.aggregate([
    { $match: { employmentStatus: 'ACTIVE' } },
    { $group: { _id: '$department', total: { $sum: 1 } } },
  ]);

  // Recent 7 days trend
  const past7Days = [];
  for (let i = 6; i >= 0; i--) {
    const dStr = now.minus({ days: i }).toFormat('yyyy-MM-dd');
    const dayRecords = await Attendance.find({ attendanceDate: dStr });
    past7Days.push({
      date: dStr,
      present: dayRecords.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length,
      late: dayRecords.filter((r) => r.status === 'LATE').length,
      absent: Math.max(0, totalEmployees - dayRecords.length),
    });
  }

  const result = {
    kpi: {
      totalEmployees,
      presentToday: presentCount,
      lateToday: lateCount,
      halfDayToday: halfDayCount,
      onLeaveToday: onLeaveCount,
      absentToday: absentCount,
      pendingExceptions: pendingLateReasons,
      pendingLeaves,
      averageAttendanceRate: totalEmployees > 0 ? Math.round(((presentCount + lateCount) / totalEmployees) * 100) : 100,
    },
    departmentStats: deptAggregation.map((d) => ({ department: d._id, count: d.total })),
    trend7Days: past7Days,
  };

  // Cache for 30 seconds
  await cacheSet(cacheKey, JSON.stringify(result), 30);
  return result;
}
