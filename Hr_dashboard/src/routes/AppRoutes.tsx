import React, { useState } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { Navbar } from '../components/common/Navbar.js';
import { Sidebar } from '../components/common/Sidebar.js';
import { LoadingSpinner } from '../components/common/LoadingSpinner.js';

import { LoginPage } from '../pages/LoginPage.js';
import { HRDashboardPage } from '../pages/HRDashboardPage.js';
import { HREmployeesPage } from '../pages/HREmployeesPage.js';
import { HREmployeeDetailPage } from '../pages/HREmployeeDetailPage.js';
import { HRAttendancePage } from '../pages/HRAttendancePage.js';
import { HRLeavePage } from '../pages/HRLeavePage.js';
import { HRExceptionsPage } from '../pages/HRExceptionsPage.js';
import { HRAuditPage } from '../pages/HRAuditPage.js';
import { HRSecurityPage } from '../pages/HRSecurityPage.js';
import { HRSettingsPage } from '../pages/HRSettingsPage.js';

const HRProtectedLayout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <LoadingSpinner message="Verifying HR Administrator credentials..." />
      </div>
    );
  }

  if (!user || user.role !== 'HR') {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Protected HR Administrative Routes */}
      <Route element={<HRProtectedLayout />}>
        <Route path="/dashboard" element={<HRDashboardPage />} />
        <Route path="/employees" element={<HREmployeesPage />} />
        <Route path="/employees/:employeeId" element={<HREmployeeDetailPage />} />
        <Route path="/attendance" element={<HRAttendancePage />} />
        <Route path="/leave" element={<HRLeavePage />} />
        <Route path="/exceptions" element={<HRExceptionsPage />} />
        <Route path="/audit" element={<HRAuditPage />} />
        <Route path="/security" element={<HRSecurityPage />} />
        <Route path="/settings" element={<HRSettingsPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
};
