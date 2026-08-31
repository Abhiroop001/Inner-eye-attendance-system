import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

declare global {
  namespace Express {
    interface Request {
      id: string;
      startTime: number;
    }
  }
}

export function requestContextMiddleware(req: Request, res: Response, next: NextFunction): void {
  const reqId = (req.headers['x-request-id'] as string) || 'req_' + crypto.randomUUID();
  req.id = reqId;
  req.startTime = Date.now();
  res.setHeader('X-Request-ID', reqId);
  next();
}
