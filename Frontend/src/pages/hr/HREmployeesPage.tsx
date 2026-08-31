import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, UserPlus, Search, Building, ArrowRight, ShieldCheck, Mail } from 'lucide-react';
import { apiRequest } from '../../services/api.js';
import { EmployeeProfile } from '../../types/index.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.js';
import { Modal } from '../../components/common/Modal.js';

export const HREmployeesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Employee Form State
  const [employeeId, setEmployeeId] = useState('');
  const [legalName, setLegalName] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [formDept, setFormDept] = useState('Engineering');
  const [designation, setDesignation] = useState('');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().slice(0, 10));
  const [location, setLocation] = useState('Bengaluru HQ');
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{
    employees: EmployeeProfile[];
    total: number;
  }>({
    queryKey: ['hrEmployees', search, department],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (department) params.append('department', department);
      return apiRequest(`/hr/employees?${params.toString()}`);
    },
  });

  const createEmployeeMutation = useMutation({
    mutationFn: () =>
      apiRequest('/hr/employees', {
        method: 'POST',
        body: JSON.stringify({
          employeeId: employeeId.trim().toUpperCase(),
          legalName,
          workEmail: workEmail.trim().toLowerCase(),
          department: formDept,
          designation,
          joiningDate,
          location,
        }),
      }),
    onSuccess: () => {
      setIsAddModalOpen(false);
      setEmployeeId('');
      setLegalName('');
      setWorkEmail('');
      setDesignation('');
      queryClient.invalidateQueries({ queryKey: ['hrEmployees'] });
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to create employee master');
    },
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-display">Authoritative Employee Master</h1>
          <p className="text-xs text-slate-500 mt-1">
            Maintain authoritative records. Direct public registration without HR master creation is prohibited.
          </p>
        </div>

        <button
          onClick={() => {
            setFormError(null);
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition"
        >
          <UserPlus className="h-4 w-4 text-amber-400" />
          <span>Provision New Employee</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-subtle flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 max-w-lg">
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by name, ID, email, designation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-9 pr-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none"
            />
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          </div>

          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none"
          >
            <option value="">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Product">Product</option>
            <option value="Security">Security</option>
            <option value="Design">Design</option>
            <option value="Human Resources">Human Resources</option>
            <option value="Finance">Finance</option>
            <option value="Operations">Operations</option>
            <option value="Marketing">Marketing</option>
            <option value="Sales">Sales</option>
          </select>
        </div>

        <span className="text-xs text-slate-500 font-semibold">{data?.total || 0} Total Employees Found</span>
      </div>

      {/* Employee Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-subtle overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="Querying employee directory..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Employee</th>
                  <th className="px-6 py-3.5">Department</th>
                  <th className="px-6 py-3.5">Designation</th>
                  <th className="px-6 py-3.5">Account Status</th>
                  <th className="px-6 py-3.5">Location</th>
                  <th className="px-6 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {data?.employees.map((emp) => (
                  <tr key={emp.employeeId} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-bold text-slate-900 block">{emp.legalName}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{emp.employeeId} • {emp.workEmail}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">{emp.department}</td>
                    <td className="px-6 py-4 text-slate-600">{emp.designation}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={emp.accountStatus} size="sm" />
                    </td>
                    <td className="px-6 py-4 text-slate-500">{emp.location}</td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/hr/employees/${emp.employeeId}`}
                        className="inline-flex items-center gap-1.5 font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition"
                      >
                        <span>Profile & 90d Audit</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Provision New Employee Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Authoritative Employee Provisioning"
        subtitle="Creates master record and enables one-time employee activation challenge"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Employee ID</label>
              <input
                type="text"
                required
                placeholder="EMP-1026"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 font-mono uppercase"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Legal Full Name</label>
              <input
                type="text"
                required
                placeholder="First and Last Name"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Official Work Email</label>
            <input
              type="email"
              required
              placeholder="first.last@company.local"
              value={workEmail}
              onChange={(e) => setWorkEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Department</label>
              <select
                value={formDept}
                onChange={(e) => setFormDept(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900"
              >
                <option value="Engineering">Engineering</option>
                <option value="Product">Product</option>
                <option value="Security">Security</option>
                <option value="Design">Design</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Finance">Finance</option>
                <option value="Operations">Operations</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Sales</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Designation</label>
              <input
                type="text"
                required
                placeholder="Senior Engineer..."
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Joining Date</label>
              <input
                type="date"
                required
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Office Location</label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createEmployeeMutation.isPending || !employeeId || !legalName || !workEmail}
              className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 disabled:opacity-50"
            >
              {createEmployeeMutation.isPending ? 'Provisioning...' : 'Save Authoritative Record'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
