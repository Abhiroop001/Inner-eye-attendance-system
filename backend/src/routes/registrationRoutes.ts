import { Router } from 'express';
import {
  submitRegistrationRequest,
  verifyActivationToken,
  completeActivation,
} from '../controllers/registrationController.js';
import { registrationRateLimiter } from '../security/rateLimiter.js';

const router = Router();

router.post('/request', registrationRateLimiter, submitRegistrationRequest);
router.post('/verify', registrationRateLimiter, verifyActivationToken);
router.post('/activate', registrationRateLimiter, completeActivation);

export default router;
