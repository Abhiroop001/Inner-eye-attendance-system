import crypto from 'crypto';
import pino from 'pino';
import { env } from '../config/env.js';
import { AuditLog, AuditActorType } from '../models/AuditLog.js';
import { SecurityEvent, SecuritySeverity } from '../models/SecurityEvent.js';

export const logger = pino({
  level: env.LOG_LEVEL,
  transport:
    env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  redact: ['req.headers.authorization', 'req.headers.cookie', 'password', 'token', 'mfaSecret', 'passwordHash'],
});

export function hashIp(ip: string): string {
  if (!ip || ip === 'unknown') return '0000000000000000';
  return crypto.createHash('sha256').update(ip + env.SESSION_SECRET).digest('hex').slice(0, 16);
}

export interface RecordAuditParams {
  actorType: AuditActorType;
  actorId: string;
  role?: string;
  action: string;
  entityType: string;
  entityId: string;
  result: 'SUCCESS' | 'FAILURE' | 'DENIED';
  reasonCode?: string | null;
  requestId?: string | null;
  ip?: string | null;
  metadata?: Record<string, any>;
}

export async function logAuditEvent(params: RecordAuditParams): Promise<void> {
  const auditId = 'aud_' + crypto.randomUUID();
  const ipHash = params.ip ? hashIp(params.ip) : null;

  logger.info(
    {
      auditId,
      actor: `${params.actorType}:${params.actorId}`,
      action: params.action,
      entity: `${params.entityType}:${params.entityId}`,
      result: params.result,
      reason: params.reasonCode,
      requestId: params.requestId,
    },
    `[AUDIT] ${params.action} -> ${params.result}`
  );

  try {
    await AuditLog.create({
      auditId,
      actorType: params.actorType,
      actorId: params.actorId,
      role: params.role || 'ANONYMOUS',
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      result: params.result,
      reasonCode: params.reasonCode || null,
      requestId: params.requestId || null,
      ipHash,
      metadata: params.metadata || {},
    });
  } catch (error) {
    logger.error({ error }, 'Failed to persist audit log to MongoDB');
  }
}

export interface RecordSecurityEventParams {
  eventType: string;
  severity: SecuritySeverity;
  actorId?: string | null;
  ip: string;
  userAgent?: string | null;
  requestId?: string | null;
  details?: Record<string, any>;
}

export async function logSecurityEvent(params: RecordSecurityEventParams): Promise<void> {
  const eventId = 'sec_' + crypto.randomUUID();
  const ipHash = hashIp(params.ip);

  logger.warn(
    {
      eventId,
      eventType: params.eventType,
      severity: params.severity,
      actorId: params.actorId,
      ipHash,
      requestId: params.requestId,
      details: params.details,
    },
    `[SECURITY_EVENT] ${params.eventType} (${params.severity})`
  );

  try {
    await SecurityEvent.create({
      eventId,
      eventType: params.eventType,
      severity: params.severity,
      actorId: params.actorId || null,
      ipHash,
      userAgentSummary: params.userAgent ? params.userAgent.slice(0, 150) : null,
      requestId: params.requestId || null,
      details: params.details || {},
    });
  } catch (error) {
    logger.error({ error }, 'Failed to persist security event to MongoDB');
  }
}
