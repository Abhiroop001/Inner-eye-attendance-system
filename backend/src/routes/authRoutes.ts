import { Router } from 'express';
import { login, verifyMfa, refresh, logout, getMe, changePassword } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { loginRateLimiter } from '../security/rateLimiter.js';

const router = Router();

router.post('/login', loginRateLimiter, login);
router.post('/mfa/verify', loginRateLimiter, verifyMfa);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', requireAuth, getMe);
router.post('/change-password', requireAuth, changePassword);

export default router;
