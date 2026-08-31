import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'EMPLOYEE' | 'HR';
export type UserStatus = 'ACTIVE' | 'LOCKED' | 'SUSPENDED';

export interface IUserAccount extends Document {
  accountId: string;
  employeeId?: string | null;
  hrUserId?: string | null;
  role: UserRole;
  username: string;
  email: string;
  passwordHash: string;
  mfaEnabled: boolean;
  mfaSecret?: string | null;
  mfaRecoveryCodes?: string[];
  mfaMethod?: 'TOTP' | 'NONE';
  status: UserStatus;
  failedLoginCount: number;
  lockUntil?: Date | null;
  passwordChangedAt: Date;
  lastSecurityReviewAt?: Date | null;
  currentRefreshFamilyId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserAccountSchema = new Schema<IUserAccount>(
  {
    accountId: { type: String, required: true, unique: true, index: true },
    employeeId: { type: String, default: null, sparse: true, index: true },
    hrUserId: { type: String, default: null, sparse: true, index: true },
    role: { type: String, enum: ['EMPLOYEE', 'HR'], required: true, index: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    mfaEnabled: { type: Boolean, default: false },
    mfaSecret: { type: String, default: null },
    mfaRecoveryCodes: { type: [String], default: [] },
    mfaMethod: { type: String, enum: ['TOTP', 'NONE'], default: 'NONE' },
    status: { type: String, enum: ['ACTIVE', 'LOCKED', 'SUSPENDED'], default: 'ACTIVE', index: true },
    failedLoginCount: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    passwordChangedAt: { type: Date, default: Date.now },
    lastSecurityReviewAt: { type: Date, default: null },
    currentRefreshFamilyId: { type: String, default: null },
  },
  { timestamps: true }
);

export const UserAccount = mongoose.model<IUserAccount>('UserAccount', UserAccountSchema);
