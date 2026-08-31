import { Router } from 'express';
import {
  getDashboard,
  createEmployee,
  listEmployees,
  getEmployeeDetail,
  updateEmployee,
  listAttendance,
  listLeaveRequests,
  approveLeave,
  rejectLeave,
  listExceptions,
  adjudicateException,
  listAuditLogs,
  downloadDocument,
  clearCache,
  generateActivationLink,
} from '../controllers/hrController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// All /api/hr endpoints require authentication and HR role
router.use(requireAuth);
router.use(requireRole(['HR']));

router.get('/dashboard', getDashboard);
router.post('/cache/clear', clearCache);

router.post('/employees', createEmployee);
router.get('/employees', listEmployees);
router.get('/employees/:employeeId', getEmployeeDetail);
router.patch('/employees/:employeeId', updateEmployee);
router.post('/employees/:employeeId/activation-link', generateActivationLink);

router.get('/attendance', listAttendance);

router.get('/leave', listLeaveRequests);
router.post('/leave/:id/approve', approveLeave);
router.post('/leave/:id/reject', rejectLeave);

router.get('/exceptions', listExceptions);
router.post('/exceptions/:id/adjudicate', adjudicateException);

router.get('/audit', listAuditLogs);
router.get('/documents/:id/download', downloadDocument);

export default router;
