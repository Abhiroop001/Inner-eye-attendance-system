import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../audit/auditLogger.js';

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public fields?: Record<string, any>;

  constructor(message: string, statusCode = 400, code = 'APPLICATION_ERROR', fields?: Record<string, any>) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.fields = fields;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  const requestId = req.id || 'unknown_req';

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    const formattedFields: Record<string, string> = {};
    err.errors.forEach((e) => {
      const field = e.path.join('.');
      formattedFields[field] = e.message;
    });

    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data provided.',
        fields: formattedFields,
      },
      requestId,
    });
    return;
  }

  // Handle Explicit AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        fields: err.fields,
      },
      requestId,
    });
    return;
  }

  // Log unhandled unexpected errors without exposing stack traces to client
  logger.error(
    {
      requestId,
      method: req.method,
      url: req.originalUrl,
      errMessage: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    },
    'Unhandled Server Error'
  );

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal error occurred. Please contact system support.',
    },
    requestId,
  });
}
