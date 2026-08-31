import { Router } from 'express';
import { askEmployeeAssistant, getHRInsights } from '../controllers/aiController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { aiAssistantRateLimiter } from '../security/rateLimiter.js';

const router = Router();

router.use(requireAuth);

router.post('/employee-assistant', aiAssistantRateLimiter, askEmployeeAssistant);
router.post('/hr-insights', requireRole(['HR']), aiAssistantRateLimiter, getHRInsights);

export default router;
