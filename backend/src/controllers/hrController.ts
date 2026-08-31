import { Request, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { Employee } from '../models/Employee.js';
import { Attendance } from '../models/Attendance.js';
import { LateReason } from '../models/LateReason.js';
import { LeaveRequest } from '../models/LeaveRequest.js';
import { LeaveBalance } from '../models/LeaveBalance.js';
import { SupportingDocument } from '../models/SupportingDocument.js';
import { AuditLog } from '../models/AuditLog.js';
import { ActivationChallenge } from '../models/ActivationChallenge.js';
import { getGridFSBucket } from '../config/database.js';
import { getHRDashboardData } from '../services/dashboardService.js';
import { validateAndDeductLeaveBalance } from '../services/leaveEngine.js';
import { logAuditEvent } from '../audit/auditLogger.js';
import { cacheDel, cacheFlush } from '../config/redis.js';
import { AppError } from '../middleware/errorHandler.js';
import { env } from '../config/env.js';
import { DateTime } from 'luxon';

const CreateEmployeeSchema = z.object({
  employeeId: z.string().min(3, 'Employee ID must be at least 3 characters'),
  legalName: z.string().min(2, 'Legal Name is required'),
  preferredName: z.string().optional(),
  workEmail: z.string().email('Valid official email required'),
  department: z.string().min(2, 'Department is required'),
  designation: z.string().min(2, 'Designation is required'),
  managerId: z.string().nullable().optional(),
  joiningDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format must be YYYY-MM-DD'),
  workScheduleId: z.string().default('SCH-GEN-01'),
  leavePolicyId: z.string().default('POL-LEAVE-STD'),
  timezone: z.string().default('Asia/Kolkata'),
  location: z.string().default('Bengaluru HQ'),
});

export async function getDashboard(req: Request, res: Response): Promise<void> {
  const data = await getHRDashboardData();
  res.status(200).json({ success: true, data, requestId: req.id });
}

export async function createEmployee(req: Request, res: Response): Promise<void> {
  const validated = CreateEmployeeSchema.parse(req.body);
  const normalizedEmail = validated.workEmail.trim().toLowerCase();
  const normalizedId = validated.employeeId.trim().toUpperCase();

  const existing = await Employee.findOne({
    $or: [{ employeeId: normalizedId }, { workEmail: normalizedEmail }],
  });

  if (existing) {
    throw new AppError('An employee with this Employee ID or official email already exists.', 409, 'EMPLOYEE_EXISTS');
  }

  const employee = await Employee.create({
    ...validated,
    employeeId: normalizedId,
    workEmail: normalizedEmail,
    employmentStatus: 'ACTIVE',
    accountStatus: 'NOT_REGISTERED',
    createdBy: req.user?.accountId || 'HR-ADMIN',
  });

  // Initialize Standard Leave Balances
  const todayStr = DateTime.now().toFormat('yyyy-MM-dd');
  await LeaveBalance.insertMany([
    { employeeId: normalizedId, leaveType: 'CASUAL', openingBalance: 18, credited: 0, consumed: 0, adjusted: 0, available: 18, asOfDate: todayStr },
    { employeeId: normalizedId, leaveType: 'SICK', openingBalance: 12, credited: 0, consumed: 0, adjusted: 0, available: 12, asOfDate: todayStr },
    { employeeId: normalizedId, leaveType: 'EMERGENCY', openingBalance: 5, credited: 0, consumed: 0, adjusted: 0, available: 5, asOfDate: todayStr },
  ]);

  await cacheDel('dashboard:hr:overview');

  await logAuditEvent({
    actorType: 'HR',
    actorId: req.user?.accountId || 'HR-ADMIN',
    action: 'EMPLOYEE_MASTER_CREATED',
    entityType: 'Employee',
    entityId: normalizedId,
    result: 'SUCCESS',
    ip: req.ip,
    requestId: req.id,
    metadata: {
      employeeId: normalizedId,
      workEmail: normalizedEmail,
      department: validated.department,
    },
  });

  res.status(201).json({
    success: true,
    data: employee,
    requestId: req.id,
  });
}

export async function listEmployees(req: Request, res: Response): Promise<void> {
  const { search, department, status, limit = 50, page = 1 } = req.query;
  const filter: Record<string, any> = {};

  if (search) {
    const s = String(search).trim();
    filter.$or = [
      { employeeId: { $regex: s, $options: 'i' } },
      { legalName: { $regex: s, $options: 'i' } },
      { workEmail: { $regex: s, $options: 'i' } },
      { designation: { $regex: s, $options: 'i' } },
    ];
  }
  if (department) filter.department = department;
  if (status) filter.employmentStatus = status;

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Employee.countDocuments(filter);
  const employees = await Employee.find(filter).sort({ employeeId: 1 }).skip(skip).limit(Number(limit));

  res.status(200).json({
    success: true,
    data: { employees, total, page: Number(page), limit: Number(limit) },
    requestId: req.id,
  });
}

export async function getEmployeeDetail(req: Request, res: Response): Promise<void> {
  const employeeId = String(req.params.employeeId);
  const employee = await Employee.findOne({ employeeId });
  if (!employee) throw new AppError('Employee profile not found.', 404);

  // 90-day attendance history
  const recentAttendance = await Attendance.find({ employeeId }).sort({ attendanceDate: -1 }).limit(90);
  const leaveBalances = await LeaveBalance.find({ employeeId });
  const lateReasons = await LateReason.find({ employeeId }).sort({ submittedAt: -1 });
  const documents = await SupportingDocument.find({ employeeId }).sort({ uploadedAt: -1 });

  res.status(200).json({
    success: true,
    data: {
      employee,
      recentAttendance,
      leaveBalances,
      lateReasons,
      documents,
    },
    requestId: req.id,
  });
}

export async function updateEmployee(req: Request, res: Response): Promise<void> {
  const employeeId = String(req.params.employeeId);
  const updateData = req.body;

  const employee = await Employee.findOneAndUpdate({ employeeId }, { $set: updateData }, { new: true });
  if (!employee) throw new AppError('Employee not found', 404);

  await cacheDel(`dashboard:emp:${employeeId}`);
  await cacheDel('dashboard:hr:overview');

  await logAuditEvent({
    actorType: 'HR',
    actorId: req.user?.accountId || 'HR-ADMIN',
    action: 'EMPLOYEE_MASTER_UPDATED',
    entityType: 'Employee',
    entityId: employeeId,
    result: 'SUCCESS',
    ip: req.ip,
    requestId: req.id,
    metadata: { updatedFields: Object.keys(updateData) },
  });

  res.status(200).json({ success: true, data: employee, requestId: req.id });
}

export async function listAttendance(req: Request, res: Response): Promise<void> {
  const { date, department, status, limit = 50, page = 1 } = req.query;
  const filter: Record<string, any> = {};

  if (date) {
    filter.attendanceDate = date;
  }
  if (status) {
    filter.status = status;
  }

  let employeeIds: string[] | null = null;
  if (department) {
    const emps = await Employee.find({ department }).select('employeeId');
    employeeIds = emps.map((e) => e.employeeId);
    filter.employeeId = { $in: employeeIds };
  }

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Attendance.countDocuments(filter);
  const records = await Attendance.find(filter).sort({ attendanceDate: -1, checkInAt: -1 }).skip(skip).limit(Number(limit));

  // Join employee details
  const empMap = new Map();
  const foundEmps = await Employee.find({
    employeeId: { $in: records.map((r) => r.employeeId) },
  });
  foundEmps.forEach((e) => empMap.set(e.employeeId, e));

  const enriched = records.map((r) => {
    const emp = empMap.get(r.employeeId);
    return {
      ...r.toObject(),
      employeeName: emp ? emp.legalName : 'Unknown',
      department: emp ? emp.department : 'General',
      designation: emp ? emp.designation : '',
    };
  });

  res.status(200).json({
    success: true,
    data: { records: enriched, total, page: Number(page), limit: Number(limit) },
    requestId: req.id,
  });
}

export async function listLeaveRequests(req: Request, res: Response): Promise<void> {
  const { status, limit = 50, page = 1 } = req.query;
  const filter: Record<string, any> = {};
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const total = await LeaveRequest.countDocuments(filter);
  const requests = await LeaveRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit));

  const empMap = new Map();
  const foundEmps = await Employee.find({
    employeeId: { $in: requests.map((r) => r.employeeId) },
  });
  foundEmps.forEach((e) => empMap.set(e.employeeId, e));

  const enriched = requests.map((r) => ({
    ...r.toObject(),
    employeeName: empMap.get(r.employeeId)?.legalName || 'Unknown',
    department: empMap.get(r.employeeId)?.department || 'General',
  }));

  res.status(200).json({
    success: true,
    data: { requests: enriched, total, page: Number(page), limit: Number(limit) },
    requestId: req.id,
  });
}

export async function approveLeave(req: Request, res: Response): Promise<void> {
  const leaveRequestId = String(req.params.id);
  const leaveReq = await LeaveRequest.findOne({ leaveRequestId });
  if (!leaveReq) throw new AppError('Leave request not found.', 404);

  if (leaveReq.status !== 'PENDING') {
    throw new AppError(`Leave request has already been ${leaveReq.status}.`, 400);
  }

  // Deduct balance deterministically
  await validateAndDeductLeaveBalance(leaveReq.employeeId, leaveReq.leaveType, leaveReq.totalDays);

  leaveReq.status = 'APPROVED';
  leaveReq.reviewedBy = req.user?.accountId || 'HR-ADMIN';
  leaveReq.reviewedAt = new Date();
  leaveReq.reviewerComment = req.body.comment || 'Approved by HR Operations';
  await leaveReq.save();

  // Populate ON_LEAVE in attendance records
  const start = DateTime.fromISO(leaveReq.startDate);
  const end = DateTime.fromISO(leaveReq.endDate);
  let cursor = start;
  while (cursor <= end) {
    const dStr = cursor.toFormat('yyyy-MM-dd');
    await Attendance.findOneAndUpdate(
      { employeeId: leaveReq.employeeId, attendanceDate: dStr },
      {
        attendanceId: 'att_' + crypto.randomUUID(),
        employeeId: leaveReq.employeeId,
        attendanceDate: dStr,
        status: 'ON_LEAVE',
        notes: `Approved Leave: ${leaveReq.leaveType}`,
      },
      { upsert: true }
    );
    cursor = cursor.plus({ days: 1 });
  }

  await cacheDel(`dashboard:emp:${leaveReq.employeeId}`);
  await cacheDel('dashboard:hr:overview');

  await logAuditEvent({
    actorType: 'HR',
    actorId: req.user?.accountId || 'HR-ADMIN',
    action: 'LEAVE_REQUEST_APPROVED',
    entityType: 'LeaveRequest',
    entityId: leaveRequestId,
    result: 'SUCCESS',
    ip: req.ip,
    requestId: req.id,
    metadata: {
      employeeId: leaveReq.employeeId,
      leaveType: leaveReq.leaveType,
      days: leaveReq.totalDays,
    },
  });

  res.status(200).json({ success: true, data: leaveReq, requestId: req.id });
}

export async function rejectLeave(req: Request, res: Response): Promise<void> {
  const leaveRequestId = String(req.params.id);
  const leaveReq = await LeaveRequest.findOne({ leaveRequestId });
  if (!leaveReq) throw new AppError('Leave request not found.', 404);

  if (leaveReq.status !== 'PENDING') {
    throw new AppError(`Leave request has already been ${leaveReq.status}.`, 400);
  }

  leaveReq.status = 'REJECTED';
  leaveReq.reviewedBy = req.user?.accountId || 'HR-ADMIN';
  leaveReq.reviewedAt = new Date();
  leaveReq.reviewerComment = req.body.comment || 'Rejected by HR Operations';
  await leaveReq.save();

  await cacheDel('dashboard:hr:overview');

  await logAuditEvent({
    actorType: 'HR',
    actorId: req.user?.accountId || 'HR-ADMIN',
    action: 'LEAVE_REQUEST_REJECTED',
    entityType: 'LeaveRequest',
    entityId: leaveRequestId,
    result: 'SUCCESS',
    ip: req.ip,
    requestId: req.id,
    metadata: { employeeId: leaveReq.employeeId, reason: leaveReq.reviewerComment },
  });

  res.status(200).json({ success: true, data: leaveReq, requestId: req.id });
}

export async function listExceptions(req: Request, res: Response): Promise<void> {
  const { status, limit = 50, page = 1 } = req.query;
  const filter: Record<string, any> = {};
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const total = await LateReason.countDocuments(filter);
  const lateReasons = await LateReason.find(filter).sort({ submittedAt: -1 }).skip(skip).limit(Number(limit));

  const empMap = new Map();
  const attMap = new Map();
  const docMap = new Map();

  const emps = await Employee.find({ employeeId: { $in: lateReasons.map((lr) => lr.employeeId) } });
  emps.forEach((e) => empMap.set(e.employeeId, e));

  const atts = await Attendance.find({ attendanceId: { $in: lateReasons.map((lr) => lr.attendanceId) } });
  atts.forEach((a) => attMap.set(a.attendanceId, a));

  const allDocIds = lateReasons.flatMap((lr) => lr.supportingDocumentIds || []);
  const docs = await SupportingDocument.find({ documentId: { $in: allDocIds } });
  docs.forEach((d) => docMap.set(d.documentId, d));

  const enriched = lateReasons.map((lr) => {
    const emp = empMap.get(lr.employeeId);
    const att = attMap.get(lr.attendanceId);
    return {
      ...lr.toObject(),
      employeeName: emp?.legalName || 'Unknown',
      department: emp?.department || 'General',
      attendanceDate: att?.attendanceDate || '',
      lateMinutes: att?.lateMinutes || 0,
      documents: (lr.supportingDocumentIds || []).map((id) => docMap.get(id)).filter(Boolean),
    };
  });

  res.status(200).json({
    success: true,
    data: { exceptions: enriched, total, page: Number(page), limit: Number(limit) },
    requestId: req.id,
  });
}

export async function adjudicateException(req: Request, res: Response): Promise<void> {
  const lateReasonId = String(req.params.id);
  const { action, comment } = req.body; // action: "APPROVE" | "REJECT" | "REQUEST_INFO"

  const lateReason = await LateReason.findOne({ lateReasonId });
  if (!lateReason) throw new AppError('Late reason record not found.', 404);

  const attendance = await Attendance.findOne({ attendanceId: lateReason.attendanceId });
  if (!attendance) throw new AppError('Associated attendance record not found.', 404);

  if (action === 'APPROVE') {
    lateReason.status = 'ACCEPTED';
    attendance.status = 'PRESENT'; // Waive late penalty to PRESENT
    attendance.isAdjusted = true;
    attendance.adjustedBy = req.user?.accountId || 'HR-ADMIN';
    attendance.adjustedAt = new Date();
  } else if (action === 'REJECT') {
    lateReason.status = 'REJECTED';
    attendance.status = 'LATE'; // Late penalty stands
  } else if (action === 'REQUEST_INFO') {
    lateReason.status = 'NEEDS_MORE_INFO';
  } else {
    throw new AppError('Invalid adjudication action.', 400);
  }

  lateReason.reviewedBy = req.user?.accountId || 'HR-ADMIN';
  lateReason.reviewedAt = new Date();
  lateReason.reviewerComment = comment || `Adjudicated as ${lateReason.status}`;

  await lateReason.save();
  await attendance.save();

  await cacheDel(`dashboard:emp:${lateReason.employeeId}`);
  await cacheDel('dashboard:hr:overview');

  await logAuditEvent({
    actorType: 'HR',
    actorId: req.user?.accountId || 'HR-ADMIN',
    action: `LATE_EXCEPTION_${action}`,
    entityType: 'LateReason',
    entityId: lateReasonId,
    result: 'SUCCESS',
    ip: req.ip,
    requestId: req.id,
    metadata: {
      employeeId: lateReason.employeeId,
      action,
      comment,
      newAttendanceStatus: attendance.status,
    },
  });

  res.status(200).json({
    success: true,
    data: { lateReason, attendance },
    requestId: req.id,
  });
}

export async function listAuditLogs(req: Request, res: Response): Promise<void> {
  const { action, actorId, entityType, limit = 50, page = 1 } = req.query;
  const filter: Record<string, any> = {};

  if (action) filter.action = action;
  if (actorId) filter.actorId = actorId;
  if (entityType) filter.entityType = entityType;

  const skip = (Number(page) - 1) * Number(limit);
  const total = await AuditLog.countDocuments(filter);
  const logs = await AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit));

  res.status(200).json({
    success: true,
    data: { logs, total, page: Number(page), limit: Number(limit) },
    requestId: req.id,
  });
}

export async function downloadDocument(req: Request, res: Response): Promise<void> {
  const documentId = String(req.params.id);
  const doc = await SupportingDocument.findOne({ documentId });

  if (!doc) {
    throw new AppError('Supporting document not found.', 404);
  }

  // Verify access authorization
  if (req.user?.role !== 'HR' && req.user?.employeeId !== doc.employeeId) {
    throw new AppError('You do not possess permission to access this document.', 403);
  }

  const bucket = getGridFSBucket();
  const downloadStream = bucket.openDownloadStreamByName(doc.safeFilename);

  res.setHeader('Content-Type', doc.mimeType);
  res.setHeader('Content-Disposition', `inline; filename="${doc.originalFilename}"`);
  res.setHeader('Content-Length', doc.sizeBytes);

  downloadStream.pipe(res).on('error', (err) => {
    res.status(404).json({ success: false, error: { code: 'FILE_STREAM_ERROR', message: 'Unable to stream file' } });
  });
}

export async function clearCache(req: Request, res: Response): Promise<void> {
  const result = await cacheFlush();

  await logAuditEvent({
    actorType: 'HR',
    actorId: req.user?.accountId || 'HR-ADMIN',
    action: 'CACHE_FLUSHED',
    entityType: 'SystemCache',
    entityId: 'ALL_KEYS',
    result: 'SUCCESS',
    ip: req.ip,
    requestId: req.id,
    metadata: {
      flushedKeysCount: result.flushedKeysCount,
    },
  });

  res.status(200).json({
    success: true,
    data: {
      message: 'Redis and in-memory cache successfully cleared.',
      flushedKeysCount: result.flushedKeysCount,
      timestamp: new Date().toISOString(),
    },
    requestId: req.id,
  });
}

export async function generateActivationLink(req: Request, res: Response): Promise<void> {
  const employeeId = String(req.params.employeeId);
  const employee = await Employee.findOne({ employeeId });
  if (!employee) throw new AppError('Employee profile not found.', 404);

  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const challengeId = 'ch_' + crypto.randomUUID();

  await ActivationChallenge.create({
    challengeId,
    employeeId: employee.employeeId,
    tokenHash,
    status: 'ISSUED',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    maxAttempts: 5,
    attemptCount: 0,
    requestedIp: req.ip || '127.0.0.1',
    userAgent: req.headers['user-agent'] || 'HR_CONSOLE',
  });

  const activationUrl = `${env.WEB_URL}/activate?challengeId=${challengeId}&token=${token}`;

  await logAuditEvent({
    actorType: 'HR',
    actorId: req.user?.accountId || 'HR-ADMIN',
    action: 'ACTIVATION_TOKEN_ISSUED',
    entityType: 'Employee',
    entityId: employeeId,
    result: 'SUCCESS',
    ip: req.ip,
    requestId: req.id,
  });

  res.status(200).json({
    success: true,
    data: {
      challengeId,
      token,
      activationUrl,
      expiresIn: '24 Hours',
    },
    requestId: req.id,
  });
}
