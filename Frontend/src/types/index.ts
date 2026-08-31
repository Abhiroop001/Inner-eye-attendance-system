export type UserRole = 'EMPLOYEE' | 'HR';

export interface UserAccount {
  accountId: string;
  employeeId?: string | null;
  hrUserId?: string | null;
  role: UserRole;
  username: string;
  email: string;
  mfaEnabled: boolean;
}

export interface EmployeeProfile {
  employeeId: string;
  employeeNumber?: string;
  legalName: string;
  preferredName?: string;
  workEmail: string;
  department: string;
  designation: string;
  managerId?: string | null;
  joiningDate: string;
  employmentStatus: 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'TERMINATED';
  accountStatus: 'NOT_REGISTERED' | 'ACTIVATION_PENDING' | 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';
  workScheduleId: string;
  leavePolicyId: string;
  timezone: string;
  location: string;
  registrationCompletedAt?: string | null;
  lastLoginAt?: string | null;
}

export type AttendanceStatus =
  | 'PRESENT'
  | 'LATE'
  | 'ABSENT'
  | 'HALF_DAY'
  | 'ON_LEAVE'
  | 'PENDING_EXCEPTION'
  | 'HOLIDAY'
  | 'WEEK_OFF'
  | 'INCOMPLETE_SESSION';

export interface AttendanceRecord {
  attendanceId: string;
  employeeId: string;
  attendanceDate: string;
  checkInAt?: string | null;
  checkOutAt?: string | null;
  workingMinutes: number;
  scheduledMinutes: number;
  overtimeMinutes: number;
  lateMinutes: number;
  earlyDepartureMinutes: number;
  status: AttendanceStatus;
  checkInSource: string;
  checkOutSource?: string | null;
  lateReasonId?: string | null;
  notes?: string;
  isAdjusted?: boolean;
  employeeName?: string;
  department?: string;
  designation?: string;
}

export interface LateReasonRecord {
  lateReasonId: string;
  employeeId: string;
  attendanceId: string;
  reasonCategory: 'MEDICAL' | 'TRAFFIC_TRANSIT' | 'FAMILY_EMERGENCY' | 'CLIENT_MEETING' | 'TECHNICAL_GLITCH' | 'OTHER';
  employeeExplanation: string;
  supportingDocumentIds: string[];
  submittedAt: string;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED' | 'NEEDS_MORE_INFO';
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewerComment?: string | null;
  aiRecommendation?: string | null;
  aiReasoning?: string | null;
  employeeName?: string;
  department?: string;
  attendanceDate?: string;
  lateMinutes?: number;
  documents?: SupportingDocumentRecord[];
}

export interface SupportingDocumentRecord {
  documentId: string;
  employeeId: string;
  attendanceId?: string | null;
  originalFilename: string;
  safeFilename: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  scanStatus: 'CLEAN' | 'INFECTED' | 'PENDING' | 'SKIPPED';
  uploadedAt: string;
}

export interface LeaveBalanceRecord {
  employeeId: string;
  leaveType: 'CASUAL' | 'SICK' | 'EMERGENCY' | 'MATERNITY' | 'PATERNITY' | 'LOP';
  openingBalance: number;
  credited: number;
  consumed: number;
  adjusted: number;
  available: number;
  asOfDate: string;
}

export interface LeaveRequestRecord {
  leaveRequestId: string;
  employeeId: string;
  leaveType: 'CASUAL' | 'SICK' | 'EMERGENCY' | 'MATERNITY' | 'PATERNITY' | 'LOP';
  startDate: string;
  endDate: string;
  totalDays: number;
  isHalfDay: boolean;
  halfDaySession?: 'FIRST_HALF' | 'SECOND_HALF' | null;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewerComment?: string | null;
  employeeName?: string;
  department?: string;
  createdAt: string;
}

export interface AuditLogRecord {
  auditId: string;
  actorType: 'EMPLOYEE' | 'HR' | 'SYSTEM' | 'ANONYMOUS';
  actorId: string;
  role: string;
  action: string;
  entityType: string;
  entityId: string;
  result: 'SUCCESS' | 'FAILURE' | 'DENIED';
  reasonCode?: string | null;
  requestId?: string | null;
  ipHash?: string | null;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface EmployeeDashboardData {
  employee: EmployeeProfile;
  today: AttendanceRecord;
  kpi: {
    weeklyHours: string;
    monthlyAttendanceRate: number;
    monthlyLateCount: number;
    totalWorkingHoursMonth: string;
  };
  leaveBalances: LeaveBalanceRecord[];
  pendingLateReasons: LateReasonRecord[];
  recentHistory: AttendanceRecord[];
  monthRecords: AttendanceRecord[];
}

export interface HRDashboardData {
  kpi: {
    totalEmployees: number;
    presentToday: number;
    lateToday: number;
    halfDayToday: number;
    onLeaveToday: number;
    absentToday: number;
    pendingExceptions: number;
    pendingLeaves: number;
    averageAttendanceRate: number;
  };
  departmentStats: Array<{ department: string; count: number }>;
  trend7Days: Array<{ date: string; present: number; late: number; absent: number }>;
}

export interface AIAssistantResponse {
  answer: string;
  citations: Array<{ documentId: string; title: string }>;
  isPolicyGrounded: boolean;
  suggestedActions?: string[];
}

export interface HRInsightsResponse {
  summary: string;
  keyObservations: string[];
  punctualityRiskDepartments: string[];
  actionRecommendations: string[];
  suggestedFocusAreas: string[];
}
