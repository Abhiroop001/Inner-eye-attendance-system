import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';

const router = Router();

router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'enterprise-attendance-backend',
  });
});

router.get('/ready', (req: Request, res: Response) => {
  const isDbReady = mongoose.connection.readyState === 1;
  if (!isDbReady) {
    res.status(503).json({ status: 'not_ready', database: 'disconnected' });
    return;
  }

  res.status(200).json({
    status: 'ready',
    database: 'connected',
    timestamp: new Date().toISOString(),
  });
});

export default router;
