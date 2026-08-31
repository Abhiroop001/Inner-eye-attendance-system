import mongoose, { Schema, Document } from 'mongoose';

export type AuditActorType = 'EMPLOYEE' | 'HR' | 'SYSTEM' | 'ANONYMOUS';

export interface IAuditLog extends Document {
  auditId: string;
  actorType: AuditActorType;
  actorId: string;
  role?: string;
  action: string;
  entityType: string;
  entityId: string;
  result: 'SUCCESS' | 'FAILURE' | 'DENIED';
  reasonCode?: string | null;
  requestId?: string | null;
  ipHash?: string | null;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    auditId: { type: String, required: true, unique: true, index: true },
    actorType: { type: String, enum: ['EMPLOYEE', 'HR', 'SYSTEM', 'ANONYMOUS'], required: true },
    actorId: { type: String, required: true, index: true },
    role: { type: String, default: 'ANONYMOUS' },
    action: { type: String, required: true, index: true },
    entityType: { type: String, required: true, index: true },
    entityId: { type: String, required: true, index: true },
    result: { type: String, enum: ['SUCCESS', 'FAILURE', 'DENIED'], required: true, index: true },
    reasonCode: { type: String, default: null },
    requestId: { type: String, default: null },
    ipHash: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AuditLogSchema.index({ createdAt: -1, action: 1 });
AuditLogSchema.index({ actorId: 1, createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
