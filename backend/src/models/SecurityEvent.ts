import mongoose, { Schema, Document } from 'mongoose';

export type SecuritySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ISecurityEvent extends Document {
  eventId: string;
  eventType: string;
  severity: SecuritySeverity;
  actorId?: string | null;
  ipHash: string;
  userAgentSummary?: string | null;
  requestId?: string | null;
  details: Record<string, any>;
  timestamp: Date;
}

const SecurityEventSchema = new Schema<ISecurityEvent>(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    eventType: { type: String, required: true, index: true },
    severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], required: true, index: true },
    actorId: { type: String, default: null, index: true },
    ipHash: { type: String, required: true, index: true },
    userAgentSummary: { type: String, default: null },
    requestId: { type: String, default: null },
    details: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

SecurityEventSchema.index({ timestamp: -1, severity: 1 });

export const SecurityEvent = mongoose.model<ISecurityEvent>('SecurityEvent', SecurityEventSchema);
