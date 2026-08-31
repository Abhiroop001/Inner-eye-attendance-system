import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from backend directory or parent
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  APP_URL: z.string().default('http://localhost:5000'),
  WEB_URL: z.string().default('http://localhost:5173'),
  API_URL: z.string().default('http://localhost:5000/api'),

  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/attendance_db?directConnection=true'),
  MONGODB_DB_NAME: z.string().default('attendance_db'),

  REDIS_URL: z.string().default('redis://127.0.0.1:6379'),

  GROQ_API_KEY: z.string().optional().default(''),
  GROQ_MODEL: z.string().default('llama-3.3-70b-versatile'),

  HF_TOKEN: z.string().optional().default(''),
  HF_EMBEDDING_MODEL: z.string().default('sentence-transformers/all-MiniLM-L6-v2'),

  SESSION_SECRET: z.string().min(16).default('dev_enterprise_session_secret_32_chars_min_length_secure!'),
  JWT_ACCESS_SECRET: z.string().min(16).default('dev_jwt_access_secret_32_chars_min_length_secure!'),
  JWT_REFRESH_SECRET: z.string().min(16).default('dev_jwt_refresh_secret_32_chars_min_length_secure!'),

  COOKIE_DOMAIN: z.string().default('localhost'),
  COOKIE_SECURE: z.coerce.boolean().default(false),

  MFA_ISSUER: z.string().default('EnterpriseHR_Security'),

  STORAGE_PROVIDER: z.enum(['gridfs', 'local']).default('gridfs'),
  MALWARE_SCAN_ENABLED: z.coerce.boolean().default(true),
  MAX_UPLOAD_SIZE_MB: z.coerce.number().default(10),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  DEV_SHOW_ACTIVATION_LINKS: z.coerce.boolean().default(true),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:', parsed.error.format());
  throw new Error('Environment variable validation failed');
}

export const env = parsed.data;
