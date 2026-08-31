import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, Search, Filter, Mail, ExternalLink, ShieldCheck } from 'lucide-react';
import { apiRequest } from '../services/api.js';
import { EmployeeProfile } from '../types/index.js';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { LoadingSpinner } from '../components/common/LoadingSpinner.js';
import { Modal } from '../components/common/Modal.js';
import { Link } from 'react-router-dom';

export const HREmployeesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State for employee provisioning
  const [legalName, setLegalName] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [designation, setDesignation] = useState('Software Engineer');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);

  const { data, isLoading } = useQuery<{
    employees: EmployeeProfile[];
    total: number;
  }>({
    queryKey: ['hrEmployees', search, departmentFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (departmentFilter) params.append('department', departmentFilter);
      return apiRequest(`/hr/employees?${params.toString()}`);
    },
  });

  const createEmployeeMutation = useMutation({
    mutationFn: () =>
      apiRequest('/hr/employees', {
        method: 'POST',
        body: JSON.stringify({
          legalName,
          preferredName: preferredName || undefined,
          workEmail,
          department,
          designation,
          joiningDate,
          workScheduleId: 'SCH-GEN-01',
          leavePolicyId: 'LP-STD-2026',
        }),
      }),
    onSuccess: () => {
      setIsCreateModalOpen(false);
      setLegalName('');
      setPreferredName('');
      setWorkEmail('');
      queryClient.invalidateQueries({ queryKey: ['hrEmployees'] });
      queryClient.invalidateQueries({ queryKey: ['hrDashboard'] });
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to provision employee profile.');
    },
  });

  const employees = data?.employees || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">Employee Master Directory</h1>
          <p className="text-xs text-slate-500 mt-1">Manage personnel records, onboarding statuses, and security clearance</p>
        </div>

        <button
          onClick={() => {
            setFormError(null);
            setIsCreateModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition"
        >
          <Plus className="h-4 w-4 text-amber-400" />
          <span>Provision Employee</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-subtle flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by name, employee ID, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-9 pr-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none"
            />
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          </div>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-700 focus:bg-white focus:outline-none"
          >
            <option value="">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Product">Product</option>
            <option value="Operations">Operations</option>
            <option value="Security">Security</option>
            <option value="Human Resources">Human Resources</option>
            <option value="Finance">Finance</option>
            <option value="Legal">Legal</option>
          </select>
        </div>

        <span className="text-xs text-slate-500 font-semibold">
          Showing {employees.length} of {data?.total || 0} Personnel
        </span>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-subtle overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="Querying employee directory..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Employee Details</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Designation</th>
                  <th className="px-6 py-4">Joining Date</th>
                  <th className="px-6 py-4">Account Status</th>
                  <th className="px-6 py-4">Employment</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {employees.map((emp) => (
                  <tr key={emp.employeeId} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-bold text-slate-900 block">{emp.legalName}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{emp.employeeId} • {emp.workEmail}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">{emp.department}</td>
                    <td className="px-6 py-4 text-slate-600">{emp.designation}</td>
                    <td className="px-6 py-4 font-mono text-slate-600">{emp.joiningDate}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={emp.accountStatus} size="sm" />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={emp.employmentStatus} size="sm" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/employees/${emp.employeeId}`}
                        className="inline-flex items-center gap-1 font-bold text-slate-900 hover:text-amber-700 transition"
                      >
                        <span>Inspect</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Provision Employee Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Provision New Employee Profile"
        subtitle="Generates unique employee ID and one-time token"
        maxWidth="lg"
      >
        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
            {formError}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            createEmployeeMutation.mutate();
          }}
          className="space-y-4 text-xs"
        >
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Full Legal Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Johnathan Doe"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Corporate Work Email</label>
            <input
              type="email"
              required
              placeholder="e.g. john.doe@company.local"
              value={workEmail}
              onChange={(e) => setWorkEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none"
              >
                <option value="Engineering">Engineering</option>
                <option value="Product">Product</option>
                <option value="Operations">Operations</option>
                <option value="Security">Security</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Finance">Finance</option>
                <option value="Legal">Legal</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Designation</label>
              <input
                type="text"
                required
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createEmployeeMutation.isPending}
              className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-md hover:bg-slate-800 transition disabled:opacity-50"
            >
              {createEmployeeMutation.isPending ? 'Provisioning...' : 'Complete Provisioning'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
