import { Router } from 'express';
import multer from 'multer';
import {
  getDashboard,
  getAttendance,
  checkIn,
  checkOut,
  getLeave,
  applyLeave,
  getExceptions,
  submitLateReason,
  uploadDocument,
} from '../controllers/meController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { uploadRateLimiter } from '../security/rateLimiter.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// All /api/me endpoints require EMPLOYEE or HR role
router.use(requireAuth);

router.get('/dashboard', getDashboard);
router.get('/attendance', getAttendance);
router.post('/attendance/check-in', checkIn);
router.post('/attendance/check-out', checkOut);

router.get('/leave', getLeave);
router.post('/leave', applyLeave);

router.get('/exceptions', getExceptions);
router.post('/exceptions/:id/reason', submitLateReason);
router.post('/exceptions/:id/documents', uploadRateLimiter, upload.single('file'), uploadDocument);

export default router;
