import React from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { User, Mail, Building, Briefcase, Calendar, MapPin, Globe, Shield } from 'lucide-react';

export const EmployeeProfilePage: React.FC = () => {
  const { employeeProfile, user } = useAuth();

  if (!employeeProfile) {
    return <div className="p-8 text-center text-xs text-slate-500">Employee record not loaded.</div>;
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 font-display">Employee Master Profile</h1>
        <p className="text-xs text-slate-500 mt-1">Authoritative profile details maintained by Human Resources</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-subtle flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-900 text-white font-bold text-2xl font-display shadow-md">
            {employeeProfile.legalName.charAt(0)}
          </div>
          <h2 className="mt-4 text-lg font-bold text-slate-900 font-display">{employeeProfile.legalName}</h2>
          <p className="text-xs text-slate-500 font-mono">{employeeProfile.employeeId}</p>
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {employeeProfile.employmentStatus}
          </span>

          <div className="mt-6 w-full border-t border-slate-100 pt-4 text-left text-xs space-y-2.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Official Email:</span>
              <span className="font-mono text-slate-800">{employeeProfile.workEmail}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Department:</span>
              <span className="font-semibold text-slate-800">{employeeProfile.department}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Designation:</span>
              <span className="font-semibold text-slate-800">{employeeProfile.designation}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Joining Date:</span>
              <span className="font-mono text-slate-800">{employeeProfile.joiningDate}</span>
            </div>
          </div>
        </div>

        {/* Schedule & Policy Assignments */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-subtle">
            <h3 className="text-sm font-bold text-slate-900 font-display mb-4">Assigned Work Schedule & Shift Parameters</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500">Schedule Template ID</span>
                <p className="mt-1 font-bold text-slate-900 font-mono">{employeeProfile.workScheduleId}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500">Operational Timezone</span>
                <p className="mt-1 font-bold text-slate-900">{employeeProfile.timezone}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500">Daily Grace Period</span>
                <p className="mt-1 font-bold text-slate-900">15 minutes (to 09:15 AM)</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500">Assigned Branch / Location</span>
                <p className="mt-1 font-bold text-slate-900">{employeeProfile.location}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-subtle">
            <h3 className="text-sm font-bold text-slate-900 font-display mb-4">Leave Policy & Entitlement Framework</h3>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Policy ID:</span>
                <span className="font-mono text-slate-900">{employeeProfile.leavePolicyId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Casual / Privilege Leave:</span>
                <span className="font-bold text-slate-900">18 days / annum (Quarterly accrual)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Sick / Medical Leave:</span>
                <span className="font-bold text-slate-900">12 days / annum</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Emergency Leave:</span>
                <span className="font-bold text-slate-900">5 days / annum</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
