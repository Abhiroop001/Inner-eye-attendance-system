import mongoose, { Schema, Document } from 'mongoose';

export type EmploymentStatus = 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'TERMINATED';
export type AccountStatus = 'NOT_REGISTERED' | 'ACTIVATION_PENDING' | 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';

export interface IEmployee extends Document {
  employeeId: string;
  employeeNumber?: string;
  legalName: string;
  preferredName?: string;
  workEmail: string;
  personalEmail?: string;
  phone?: string;
  department: string;
  designation: string;
  managerId?: string | null;
  joiningDate: string;
  employmentStatus: EmploymentStatus;
  accountStatus: AccountStatus;
  workScheduleId: string;
  leavePolicyId: string;
  timezone: string;
  location: string;
  allowedAttendanceMethods: string[];
  registrationCompletedAt?: Date | null;
  lastLoginAt?: Date | null;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSchema = new Schema<IEmployee>(
  {
    employeeId: { type: String, required: true, unique: true, index: true },
    employeeNumber: { type: String, sparse: true, index: true },
    legalName: { type: String, required: true },
    preferredName: { type: String },
    workEmail: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    personalEmail: { type: String },
    phone: { type: String },
    department: { type: String, required: true, index: true },
    designation: { type: String, required: true },
    managerId: { type: String, default: null, index: true },
    joiningDate: { type: String, required: true },
    employmentStatus: {
      type: String,
      enum: ['ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED'],
      default: 'ACTIVE',
      index: true,
    },
    accountStatus: {
      type: String,
      enum: ['NOT_REGISTERED', 'ACTIVATION_PENDING', 'ACTIVE', 'SUSPENDED', 'TERMINATED'],
      default: 'NOT_REGISTERED',
      index: true,
    },
    workScheduleId: { type: String, required: true, default: 'SCH-GEN-01' },
    leavePolicyId: { type: String, required: true, default: 'POL-LEAVE-STD' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    location: { type: String, default: 'Headquarters' },
    allowedAttendanceMethods: { type: [String], default: ['WEB_PORTAL', 'MOBILE_APP'] },
    registrationCompletedAt: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
    createdBy: { type: String, default: 'HR-ADMIN' },
  },
  { timestamps: true }
);

EmployeeSchema.index({ accountStatus: 1, department: 1 });

export const Employee = mongoose.model<IEmployee>('Employee', EmployeeSchema);
