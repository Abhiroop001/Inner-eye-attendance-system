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

// Explicit CORS Configuration
app.use(
  cors({
    origin: [
      env.WEB_URL,
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5174',
      'http://localhost:3000',
    ],
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
