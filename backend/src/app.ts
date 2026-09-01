import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { requestContextMiddleware } from './middleware/requestContext.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import registrationRoutes from './routes/registrationRoutes.js';
import meRoutes from './routes/meRoutes.js';
import hrRoutes from './routes/hrRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import systemRoutes from './routes/systemRoutes.js';

export const app = express();

// Security Headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        scriptSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// Explicit CORS Configuration with Vercel and Local Support
app.use(
  cors({
    origin: (requestOrigin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!requestOrigin) return callback(null, true);

      const staticAllowed = [
        env.WEB_URL,
        env.HR_WEB_URL,
        'https://inner-eye-attendance-system-fronten-iota.vercel.app',
        'https://inner-eye-attendance-system-hr-dash.vercel.app',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5174',
        'http://localhost:3000',
      ];

      if (staticAllowed.includes(requestOrigin) || requestOrigin.endsWith('.vercel.app')) {
        return callback(null, true);
      }

      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Correlation ID and Request Context
app.use(requestContextMiddleware);

// Root Gateway & Monitoring Health Endpoints (Supports GET & HEAD)
app.get(['/', '/health'], (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Enterprise Attendance Management System API Gateway is Live & Operational',
    service: 'enterprise-attendance-backend',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      employee: '/api/me',
      hr: '/api/hr',
      ai: '/api/ai',
    },
  });
});

// API Route Mount Points
app.use('/api/auth', authRoutes);
app.use('/api/registration', registrationRoutes);
app.use('/api/me', meRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api', systemRoutes);

// Catch-all 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `The requested endpoint ${req.method} ${req.originalUrl} does not exist.`,
    },
    requestId: req.id,
  });
});

// Centralized Error Handling Envelope
app.use(errorHandler);
