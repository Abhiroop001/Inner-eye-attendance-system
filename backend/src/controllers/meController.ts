import { Request, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { DateTime } from 'luxon';
import { Employee } from '../models/Employee.js';
import { Attendance } from '../models/Attendance.js';
import { AttendanceEvent } from '../models/AttendanceEvent.js';
import { LateReason } from '../models/LateReason.js';
import { LeaveRequest } from '../models/LeaveRequest.js';
import { LeaveBalance } from '../models/LeaveBalance.js';
import { WorkSchedule } from '../models/WorkSchedule.js';
import { HolidayCalendar } from '../models/HolidayCalendar.js';
import { calculateAttendanceMetrics } from '../services/attendanceEngine.js';
import { calculateWorkingDays } from '../services/leaveEngine.js';
import { storeSupportingDocument } from '../services/uploadService.js';
import { getEmployeeDashboardData } from '../services/dashboardService.js';
import { evaluateLateArrivalExplanation } from '../ai/langgraph/lateAssistantGraph.js';
import { acquireLock, releaseLock, cacheDel } from '../config/redis.js';
import { logAuditEvent } from '../audit/auditLogger.js';
import { AppError } from '../middleware/errorHandler.js';

const LateReasonSubmitSchema = z.object({
  reasonCategory: z.enum([
    'MEDICAL',
    'TRAFFIC_TRANSIT',
    'FAMILY_EMERGENCY',
    'CLIENT_MEETING',
    'TECHNICAL_GLITCH',
    'OTHER',
  ]),
  employeeExplanation: z.string().min(10, 'Explanation must be at least 10 characters long'),
  supportingDocumentIds: z.array(z.string()).optional().default([]),
});

const LeaveApplySchema = z.object({
  leaveType: z.enum(['CASUAL', 'SICK', 'EMERGENCY', 'MATERNITY', 'PATERNITY', 'LOP']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format must be YYYY-MM-DD'),
  isHalfDay: z.boolean().optional().default(false),
  halfDaySession: z.enum(['FIRST_HALF', 'SECOND_HALF']).nullable().optional(),
  reason: z.string().min(5, 'Reason must be at least 5 characters long'),
});

export async function getDashboard(req: Request, res: Response): Promise<void> {
  const employeeId = req.user?.employeeId;
  if (!employeeId) {
    if (req.user?.role === 'HR') {
      throw new AppError('Administrative accounts do not hold personal employee attendance cards. Please visit /hr/dashboard.', 403, 'HR_ROLE_NO_PERSONAL_ATTENDANCE');
    }
    throw new AppError('No employee ID associated with this account', 400, 'MISSING_EMPLOYEE_ID');
  }

  const data = await getEmployeeDashboardData(employeeId);
  if (!data) throw new AppError('Employee profile not found in master records', 404, 'EMPLOYEE_NOT_FOUND');
  res.status(200).json({ success: true, data, requestId: req.id });
}

export async function getAttendance(req: Request, res: Response): Promise<void> {
  const employeeId = req.user?.employeeId;
  if (!employeeId) {
    if (req.user?.role === 'HR') {
      throw new AppError('Administrative accounts do not hold personal employee attendance records.', 403, 'HR_ROLE_NO_PERSONAL_ATTENDANCE');
    }
    throw new AppError('No employee ID associated with this account', 400, 'MISSING_EMPLOYEE_ID');
  }

  const { startDate, endDate, status, limit = 50, page = 1 } = req.query;
  const filter: Record<string, any> = { employeeId };

  if (startDate || endDate) {
    filter.attendanceDate = {};
    if (startDate) filter.attendanceDate.$gte = startDate;
    if (endDate) filter.attendanceDate.$lte = endDate;
  }
  if (status) {
    filter.status = status;
  }

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Attendance.countDocuments(filter);
  const records = await Attendance.find(filter).sort({ attendanceDate: -1 }).skip(skip).limit(Number(limit));

  res.status(200).json({
    success: true,
    data: { records, total, page: Number(page), limit: Number(limit) },
    requestId: req.id,
  });
}

export async function checkIn(req: Request, res: Response): Promise<void> {
  const employeeId = req.user?.employeeId;
  if (!employeeId) throw new AppError('No employee ID associated with this account', 400);

  const employee = await Employee.findOne({ employeeId });
  if (!employee) throw new AppError('Employee profile not found', 404);

  const schedule = (await WorkSchedule.findOne({ scheduleId: employee.workScheduleId })) || {
    expectedStartTime: '09:00',
    expectedEndTime: '17:00',
    graceMinutes: 15,
    unpaidBreakMinutes: 60,
    minimumWorkingMinutes: 420,
    timezone: employee.timezone || 'Asia/Kolkata',
  };

  const tz = employee.timezone || 'Asia/Kolkata';
  const now = DateTime.now().setZone(tz);
  const todayStr = now.toFormat('yyyy-MM-dd');

  // Distributed Lock to prevent duplicate concurrent check-ins
  const lockAcquired = await acquireLock(`attendance:${employeeId}:${todayStr}`, 5);
  if (!lockAcquired) {
    throw new AppError('A check-in operation is already in progress.', 429, 'CONCURRENT_REQUEST');
  }

  try {
    const existing = await Attendance.findOne({ employeeId, attendanceDate: todayStr });
    if (existing && existing.checkInAt) {
      throw new AppError('You have already checked in for today’s session.', 409, 'ALREADY_CHECKED_IN');
    }

    const checkInDate = new Date();
    const metrics = calculateAttendanceMetrics({
      checkInAt: checkInDate,
      schedule: {
        expectedStartTime: schedule.expectedStartTime,
        expectedEndTime: schedule.expectedEndTime,
        graceMinutes: schedule.graceMinutes,
        unpaidBreakMinutes: schedule.unpaidBreakMinutes,
        minimumWorkingMinutes: schedule.minimumWorkingMinutes,
        timezone: tz,
      },
    });

    const attendanceId = 'att_' + crypto.randomUUID();
    const attendance = await Attendance.create({
      attendanceId,
      employeeId,
      attendanceDate: todayStr,
      checkInAt: checkInDate,
      workingMinutes: 0,
      scheduledMinutes: metrics.scheduledMinutes,
      overtimeMinutes: 0,
      lateMinutes: metrics.lateMinutes,
      earlyDepartureMinutes: 0,
      status: metrics.status,
      checkInSource: 'WEB_PORTAL',
    });

    // Create immutable event
    await AttendanceEvent.create({
      eventId: 'evt_' + crypto.randomUUID(),
      employeeId,
      attendanceId,
      eventType: 'CHECK_IN',
      eventAt: checkInDate,
      requestId: req.id,
      userAgentSummary: req.headers['user-agent']?.slice(0, 100),
    });

    // Invalidate dashboard cache
    await cacheDel(`dashboard:emp:${employeeId}`);
    await cacheDel('dashboard:hr:overview');

    await logAuditEvent({
      actorType: 'EMPLOYEE',
      actorId: employeeId,
      action: 'ATTENDANCE_CHECK_IN',
      entityType: 'Attendance',
      entityId: attendanceId,
      result: 'SUCCESS',
      ip: req.ip,
      requestId: req.id,
      metadata: { status: metrics.status, lateMinutes: metrics.lateMinutes },
    });

    res.status(200).json({
      success: true,
      data: attendance,
      requestId: req.id,
    });
  } finally {
    await releaseLock(`attendance:${employeeId}:${todayStr}`);
  }
}

export async function checkOut(req: Request, res: Response): Promise<void> {
  const employeeId = req.user?.employeeId;
  if (!employeeId) throw new AppError('No employee ID associated with this account', 400);

  const employee = await Employee.findOne({ employeeId });
  if (!employee) throw new AppError('Employee profile not found', 404);

  const schedule = (await WorkSchedule.findOne({ scheduleId: employee.workScheduleId })) || {
    expectedStartTime: '09:00',
    expectedEndTime: '17:00',
    graceMinutes: 15,
    unpaidBreakMinutes: 60,
    minimumWorkingMinutes: 420,
    timezone: employee.timezone || 'Asia/Kolkata',
  };

  const tz = employee.timezone || 'Asia/Kolkata';
  const now = DateTime.now().setZone(tz);
  const todayStr = now.toFormat('yyyy-MM-dd');

  const attendance = await Attendance.findOne({ employeeId, attendanceDate: todayStr });
  if (!attendance || !attendance.checkInAt) {
    throw new AppError('No active check-in record found for today. Please check in first.', 400, 'NO_ACTIVE_SESSION');
  }

  if (attendance.checkOutAt) {
    throw new AppError('You have already completed check-out for today.', 409, 'ALREADY_CHECKED_OUT');
  }

  const checkOutDate = new Date();
  const metrics = calculateAttendanceMetrics({
    checkInAt: attendance.checkInAt,
    checkOutAt: checkOutDate,
    schedule: {
      expectedStartTime: schedule.expectedStartTime,
      expectedEndTime: schedule.expectedEndTime,
      graceMinutes: schedule.graceMinutes,
      unpaidBreakMinutes: schedule.unpaidBreakMinutes,
      minimumWorkingMinutes: schedule.minimumWorkingMinutes,
      timezone: tz,
    },
  });

  attendance.checkOutAt = checkOutDate;
  attendance.workingMinutes = metrics.workingMinutes;
  attendance.overtimeMinutes = metrics.overtimeMinutes;
  attendance.earlyDepartureMinutes = metrics.earlyDepartureMinutes;
  attendance.status = metrics.status;
  attendance.checkOutSource = 'WEB_PORTAL';
  await attendance.save();

  // Create immutable event
  await AttendanceEvent.create({
    eventId: 'evt_' + crypto.randomUUID(),
    employeeId,
    attendanceId: attendance.attendanceId,
    eventType: 'CHECK_OUT',
    eventAt: checkOutDate,
    requestId: req.id,
    userAgentSummary: req.headers['user-agent']?.slice(0, 100),
  });

  // Invalidate cache
  await cacheDel(`dashboard:emp:${employeeId}`);
  await cacheDel('dashboard:hr:overview');

  await logAuditEvent({
    actorType: 'EMPLOYEE',
    actorId: employeeId,
    action: 'ATTENDANCE_CHECK_OUT',
    entityType: 'Attendance',
    entityId: attendance.attendanceId,
    result: 'SUCCESS',
    ip: req.ip,
    requestId: req.id,
    metadata: {
      workingMinutes: metrics.workingMinutes,
      overtimeMinutes: metrics.overtimeMinutes,
      status: metrics.status,
    },
  });

  res.status(200).json({
    success: true,
    data: attendance,
    requestId: req.id,
  });
}

export async function getLeave(req: Request, res: Response): Promise<void> {
  const employeeId = req.user?.employeeId;
  if (!employeeId) throw new AppError('No employee ID associated', 400);

  const balances = await LeaveBalance.find({ employeeId });
  const requests = await LeaveRequest.find({ employeeId }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: { balances, requests },
    requestId: req.id,
  });
}

export async function applyLeave(req: Request, res: Response): Promise<void> {
  const employeeId = req.user?.employeeId;
  if (!employeeId) throw new AppError('No employee ID associated', 400);

  const { leaveType, startDate, endDate, isHalfDay, halfDaySession, reason } = LeaveApplySchema.parse(req.body);

  const employee = await Employee.findOne({ employeeId });
  if (!employee) throw new AppError('Employee record not found', 404);

  // Fetch holiday calendar
  const holidaysDoc = await HolidayCalendar.findOne({ holidayCalendarId: 'CAL-IN-2026' });
  const holidayDates = holidaysDoc ? holidaysDoc.holidays.map((h) => h.date) : [];

  // Calculate working days deterministically
  const totalDays = calculateWorkingDays({
    startDate,
    endDate,
    isHalfDay: !!isHalfDay,
    weeklyPattern: [1, 2, 3, 4, 5],
    holidayDates,
  });

  if (totalDays <= 0) {
    throw new AppError('Selected date range contains 0 working days (all selected dates fall on weekends or public holidays).', 400, 'NO_WORKING_DAYS');
  }

  // Check balance availability
  const balanceDoc = await LeaveBalance.findOne({ employeeId, leaveType });
  if (!balanceDoc || balanceDoc.available < totalDays) {
    throw new AppError(
      `Insufficient ${leaveType} leave balance. Requested: ${totalDays} days, Available: ${balanceDoc?.available || 0} days.`,
      400,
      'INSUFFICIENT_LEAVE_BALANCE'
    );
  }

  const leaveRequestId = 'lvr_' + crypto.randomUUID();
  const leaveReq = await LeaveRequest.create({
    leaveRequestId,
    employeeId,
    leaveType,
    startDate,
    endDate,
    totalDays,
    isHalfDay: !!isHalfDay,
    halfDaySession: halfDaySession || null,
    reason,
    status: 'PENDING',
  });

  await logAuditEvent({
    actorType: 'EMPLOYEE',
    actorId: employeeId,
    action: 'LEAVE_APPLICATION_SUBMITTED',
    entityType: 'LeaveRequest',
    entityId: leaveRequestId,
    result: 'SUCCESS',
    ip: req.ip,
    requestId: req.id,
    metadata: { leaveType, totalDays, startDate, endDate },
  });

  res.status(201).json({
    success: true,
    data: leaveReq,
    requestId: req.id,
  });
}

export async function getExceptions(req: Request, res: Response): Promise<void> {
  const employeeId = req.user?.employeeId;
  if (!employeeId) throw new AppError('No employee ID associated', 400);

  const lateAttendances = await Attendance.find({
    employeeId,
    status: { $in: ['LATE', 'PENDING_EXCEPTION'] },
  }).sort({ attendanceDate: -1 });

  const lateReasons = await LateReason.find({ employeeId });
  const mappedReasons = new Map(lateReasons.map((lr) => [lr.attendanceId, lr]));

  const exceptions = lateAttendances.map((att) => ({
    attendance: att,
    lateReason: mappedReasons.get(att.attendanceId) || null,
  }));

  res.status(200).json({
    success: true,
    data: exceptions,
    requestId: req.id,
  });
}

export async function submitLateReason(req: Request, res: Response): Promise<void> {
  const employeeId = req.user?.employeeId;
  const attendanceId = String(req.params.id);
  if (!employeeId) throw new AppError('No employee ID associated', 400);

  const { reasonCategory, employeeExplanation, supportingDocumentIds } = LateReasonSubmitSchema.parse(req.body);

  const attendance = await Attendance.findOne({ attendanceId, employeeId });
  if (!attendance) {
    throw new AppError('Attendance session record not found or does not belong to you.', 404, 'NOT_FOUND');
  }

  // Evaluate via LangGraph Late Assistant Graph
  const aiAssessment = await evaluateLateArrivalExplanation({
    employeeId,
    attendanceId,
    lateMinutes: attendance.lateMinutes || 0,
    reasonCategory,
    employeeExplanation,
    hasSupportingDocument: supportingDocumentIds.length > 0,
  });

  const lateReasonId = 'ltr_' + crypto.randomUUID();
  const lateReason = await LateReason.findOneAndUpdate(
    { attendanceId },
    {
      lateReasonId,
      employeeId,
      attendanceId,
      reasonCategory,
      employeeExplanation,
      supportingDocumentIds,
      submittedAt: new Date(),
      status: 'UNDER_REVIEW',
      aiRecommendation: aiAssessment.recommendation,
      aiReasoning: aiAssessment.reason,
    },
    { upsert: true, new: true }
  );

  attendance.lateReasonId = lateReason.lateReasonId;
  await attendance.save();

  // Invalidate cache
  await cacheDel(`dashboard:emp:${employeeId}`);
  await cacheDel('dashboard:hr:overview');

  await logAuditEvent({
    actorType: 'EMPLOYEE',
    actorId: employeeId,
    action: 'LATE_REASON_SUBMITTED',
    entityType: 'LateReason',
    entityId: lateReasonId,
    result: 'SUCCESS',
    ip: req.ip,
    requestId: req.id,
    metadata: {
      attendanceId,
      category: reasonCategory,
      aiRecommendation: aiAssessment.recommendation,
    },
  });

  res.status(200).json({
    success: true,
    data: {
      lateReason,
      advisoryEvaluation: {
        recommendation: aiAssessment.recommendation,
        reason: aiAssessment.reason,
        requiresDocument: aiAssessment.requiresDocument,
      },
    },
    requestId: req.id,
  });
}

export async function uploadDocument(req: Request, res: Response): Promise<void> {
  const employeeId = req.user?.employeeId;
  if (!employeeId) throw new AppError('No employee ID associated', 400);

  const file = (req as any).file;
  if (!file) {
    throw new AppError('No file attachment uploaded.', 400, 'NO_FILE');
  }

  const attendanceId = req.params.id ? String(req.params.id) : null;

  const doc = await storeSupportingDocument({
    employeeId,
    originalFilename: file.originalname,
    mimeType: file.mimetype,
    buffer: file.buffer,
    attendanceId,
    uploadedBy: employeeId,
  });

  await logAuditEvent({
    actorType: 'EMPLOYEE',
    actorId: employeeId,
    action: 'DOCUMENT_UPLOADED',
    entityType: 'SupportingDocument',
    entityId: doc.documentId,
    result: 'SUCCESS',
    ip: req.ip,
    requestId: req.id,
    metadata: {
      documentId: doc.documentId,
      sha256: doc.sha256,
      sizeBytes: doc.sizeBytes,
    },
  });

  res.status(201).json({
    success: true,
    data: {
      documentId: doc.documentId,
      originalFilename: doc.originalFilename,
      mimeType: doc.mimeType,
      sizeBytes: doc.sizeBytes,
      sha256: doc.sha256,
    },
    requestId: req.id,
  });
}
