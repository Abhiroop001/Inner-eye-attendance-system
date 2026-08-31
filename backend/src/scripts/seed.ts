import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DateTime } from 'luxon';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { Employee } from '../models/Employee.js';
import { UserAccount } from '../models/UserAccount.js';
import { WorkSchedule } from '../models/WorkSchedule.js';
import { LeavePolicy } from '../models/LeavePolicy.js';
import { HolidayCalendar } from '../models/HolidayCalendar.js';
import { Attendance } from '../models/Attendance.js';
import { AttendanceEvent } from '../models/AttendanceEvent.js';
import { LateReason } from '../models/LateReason.js';
import { LeaveBalance } from '../models/LeaveBalance.js';
import { LeaveRequest } from '../models/LeaveRequest.js';
import { SupportingDocument } from '../models/SupportingDocument.js';
import { AuditLog } from '../models/AuditLog.js';
import { hashPassword } from '../security/password.js';

export async function runSeed() {
  console.log('🌱 Initializing Database Seed Pipeline...');
  await connectDatabase();

  // Clear existing collections
  console.log('🧹 Clearing existing collections...');
  await Promise.all([
    Employee.deleteMany({}),
    UserAccount.deleteMany({}),
    WorkSchedule.deleteMany({}),
    LeavePolicy.deleteMany({}),
    HolidayCalendar.deleteMany({}),
    Attendance.deleteMany({}),
    AttendanceEvent.deleteMany({}),
    LateReason.deleteMany({}),
    LeaveBalance.deleteMany({}),
    LeaveRequest.deleteMany({}),
    SupportingDocument.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);

  const kbDir = path.resolve(process.cwd(), '../rag/knowledge-base');

  // 1. Seed Work Schedules
  const schedulesRaw = fs.readFileSync(path.join(kbDir, '14_demo_work_schedules.json'), 'utf-8');
  const schedules = JSON.parse(schedulesRaw);
  await WorkSchedule.insertMany(schedules);
  console.log(`  ✅ Seeded ${schedules.length} Work Schedules`);

  // 2. Seed Leave Policies
  const leavePoliciesRaw = fs.readFileSync(path.join(kbDir, '15_demo_leave_policies.json'), 'utf-8');
  const leavePolicies = JSON.parse(leavePoliciesRaw);
  await LeavePolicy.insertMany(leavePolicies);
  console.log(`  ✅ Seeded ${leavePolicies.length} Leave Policies`);

  // 3. Seed Holiday Calendar
  const holidayCalendarRaw = fs.readFileSync(path.join(kbDir, '16_demo_holiday_calendar.json'), 'utf-8');
  const holidayCalendar = JSON.parse(holidayCalendarRaw);
  await HolidayCalendar.create(holidayCalendar);
  console.log(`  ✅ Seeded Holiday Calendar (${holidayCalendar.holidays.length} Holidays)`);

  // 4. Seed HR User & Account
  const hrUsersRaw = fs.readFileSync(path.join(kbDir, '13_demo_hr_users.json'), 'utf-8');
  const hrUsers = JSON.parse(hrUsersRaw);
  const defaultHrPasswordHash = await hashPassword('AdminSecurePass123!');

  for (const hr of hrUsers) {
    const accountId = 'acc_hr_' + hr.hrUserId.toLowerCase();
    await UserAccount.create({
      accountId,
      hrUserId: hr.hrUserId,
      role: 'HR',
      username: hr.username,
      email: hr.workEmail,
      passwordHash: defaultHrPasswordHash,
      mfaEnabled: false,
      status: 'ACTIVE',
    });
  }
  console.log(`  ✅ Seeded ${hrUsers.length} HR Administrators (Default pass: AdminSecurePass123!)`);

  // 5. Seed Employees & Employee User Accounts
  const employeesRaw = fs.readFileSync(path.join(kbDir, '12_demo_employee_master.json'), 'utf-8');
  const employeesData = JSON.parse(employeesRaw);
  const defaultEmpPasswordHash = await hashPassword('EmployeePass123!');

  await Employee.insertMany(employeesData);

  // Create accounts for the first 20 employees (active), leave 5 as NOT_REGISTERED for registration tests
  for (let i = 0; i < 20; i++) {
    const emp = employeesData[i];
    const accountId = 'acc_' + emp.employeeId.toLowerCase();
    const username = emp.workEmail.split('@')[0].replace('.', '_');

    await UserAccount.create({
      accountId,
      employeeId: emp.employeeId,
      role: 'EMPLOYEE',
      username,
      email: emp.workEmail,
      passwordHash: defaultEmpPasswordHash,
      mfaEnabled: false,
      status: 'ACTIVE',
    });

    // Initialize Leave Balances
    const todayStr = DateTime.now().toFormat('yyyy-MM-dd');
    await LeaveBalance.insertMany([
      { employeeId: emp.employeeId, leaveType: 'CASUAL', openingBalance: 18, credited: 0, consumed: 2, adjusted: 0, available: 16, asOfDate: todayStr },
      { employeeId: emp.employeeId, leaveType: 'SICK', openingBalance: 12, credited: 0, consumed: 1, adjusted: 0, available: 11, asOfDate: todayStr },
      { employeeId: emp.employeeId, leaveType: 'EMERGENCY', openingBalance: 5, credited: 0, consumed: 0, adjusted: 0, available: 5, asOfDate: todayStr },
    ]);
  }
  console.log(`  ✅ Seeded ${employeesData.length} Employee Masters (${employeesData.length - 5} Active, 5 Unregistered)`);

  // 6. Generate 90 Days of Realistic Attendance History
  console.log('⏳ Generating 90 days of deterministic attendance history...');
  const now = DateTime.now().setZone('Asia/Kolkata');
  const attendanceBatch: any[] = [];
  const attendanceEventsBatch: any[] = [];
  const lateReasonsBatch: any[] = [];
  const holidayDates = new Set(holidayCalendar.holidays.map((h: any) => h.date));

  const activeEmployees = employeesData.slice(0, 20);

  for (let d = 89; d >= 0; d--) {
    const currentDay = now.minus({ days: d });
    const dateStr = currentDay.toFormat('yyyy-MM-dd');
    const dayOfWeek = currentDay.weekday; // 1=Mon, 7=Sun

    const isWeekend = dayOfWeek === 6 || dayOfWeek === 7;
    const isHoliday = holidayDates.has(dateStr);

    for (let eIdx = 0; eIdx < activeEmployees.length; eIdx++) {
      const emp = activeEmployees[eIdx];
      const attendanceId = `att_${emp.employeeId}_${dateStr.replace(/-/g, '')}`;

      if (isHoliday) {
        attendanceBatch.push({
          attendanceId,
          employeeId: emp.employeeId,
          attendanceDate: dateStr,
          status: 'HOLIDAY',
          scheduledMinutes: 480,
          workingMinutes: 0,
          notes: 'Public Holiday',
        });
        continue;
      }

      if (isWeekend) {
        attendanceBatch.push({
          attendanceId,
          employeeId: emp.employeeId,
          attendanceDate: dateStr,
          status: 'WEEK_OFF',
          scheduledMinutes: 480,
          workingMinutes: 0,
          notes: 'Weekly Rest Day',
        });
        continue;
      }

      // Business day simulation (Deterministic pseudo-random)
      const seedHash = (d * 31 + eIdx * 17) % 100;

      let status: any = 'PRESENT';
      let checkInHour = 8;
      let checkInMin = 50 + (seedHash % 15); // 08:50 to 09:05 (on-time)
      let checkOutHour = 17;
      let checkOutMin = 5 + (seedHash % 25); // 17:05 to 17:30
      let lateMins = 0;
      let workingMins = 480 + (seedHash % 30);
      let overtimeMins = (seedHash % 30);

      if (seedHash < 10) {
        // Late arrival (10% chance)
        status = 'LATE';
        checkInHour = 9;
        checkInMin = 25 + (seedHash % 35); // 09:25 to 09:59
        lateMins = (checkInMin - 15); // >15 mins grace
        workingMins = Math.max(380, 480 - lateMins);

        // Generate late reason submission
        const lateReasonId = `ltr_${attendanceId}`;
        lateReasonsBatch.push({
          lateReasonId,
          employeeId: emp.employeeId,
          attendanceId,
          reasonCategory: seedHash < 5 ? 'TRAFFIC_TRANSIT' : 'MEDICAL',
          employeeExplanation: seedHash < 5 ? 'Heavy metro signal delay at central interchange station.' : 'Emergency dental appointment.',
          supportingDocumentIds: [],
          submittedAt: currentDay.set({ hour: 10, minute: 0 }).toJSDate(),
          status: d > 5 ? 'ACCEPTED' : 'UNDER_REVIEW',
          aiRecommendation: 'ACCEPT',
          aiReasoning: 'Operational transit delay with clear explanation.',
        });
      } else if (seedHash < 14) {
        // Approved Leave (4% chance)
        status = 'ON_LEAVE';
        attendanceBatch.push({
          attendanceId,
          employeeId: emp.employeeId,
          attendanceDate: dateStr,
          status: 'ON_LEAVE',
          scheduledMinutes: 480,
          workingMinutes: 0,
          notes: 'Approved Casual Leave',
        });
        continue;
      }

      const checkInDate = currentDay.set({ hour: checkInHour, minute: checkInMin, second: 0 }).toJSDate();
      const checkOutDate = currentDay.set({ hour: checkOutHour, minute: checkOutMin, second: 0 }).toJSDate();

      attendanceBatch.push({
        attendanceId,
        employeeId: emp.employeeId,
        attendanceDate: dateStr,
        checkInAt: checkInDate,
        checkOutAt: d === 0 ? null : checkOutDate, // Leave today's session open for demo check-out!
        scheduledMinutes: 480,
        workingMinutes: d === 0 ? 0 : workingMins,
        overtimeMinutes: d === 0 ? 0 : overtimeMins,
        lateMinutes: lateMins,
        earlyDepartureMinutes: 0,
        status,
        checkInSource: 'WEB_PORTAL',
      });

      attendanceEventsBatch.push({
        eventId: 'evt_in_' + attendanceId,
        employeeId: emp.employeeId,
        attendanceId,
        eventType: 'CHECK_IN',
        eventAt: checkInDate,
      });

      if (d !== 0) {
        attendanceEventsBatch.push({
          eventId: 'evt_out_' + attendanceId,
          employeeId: emp.employeeId,
          attendanceId,
          eventType: 'CHECK_OUT',
          eventAt: checkOutDate,
        });
      }
    }
  }

  await Attendance.insertMany(attendanceBatch);
  await AttendanceEvent.insertMany(attendanceEventsBatch);
  if (lateReasonsBatch.length > 0) {
    await LateReason.insertMany(lateReasonsBatch);
  }

  console.log(`  ✅ Seeded ${attendanceBatch.length} Attendance records across 90 days`);
  console.log(`  ✅ Seeded ${attendanceEventsBatch.length} Immutable Attendance Events`);
  console.log(`  ✅ Seeded ${lateReasonsBatch.length} Late Reason exceptions`);

  console.log(`\n======================================================`);
  console.log(`  🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!`);
  console.log(`  🔑 HR Login: hr.admin@company.local / AdminSecurePass123!`);
  console.log(`  🔑 Emp Login: aarav.sharma@company.local / EmployeePass123!`);
  console.log(`======================================================\n`);

  await disconnectDatabase();
}

if (process.argv[1]?.includes('seed.ts')) {
  runSeed().then(() => process.exit(0)).catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  });
}
