import React, { useState } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { Navbar } from '../components/common/Navbar.js';
import { Sidebar } from '../components/common/Sidebar.js';
import { LoadingSpinner } from '../components/common/LoadingSpinner.js';

// Public Pages
import { LandingPage } from '../pages/public/LandingPage.js';
import { LoginPage } from '../pages/public/LoginPage.js';
import { RegisterPage } from '../pages/public/RegisterPage.js';
import { ActivatePage } from '../pages/public/ActivatePage.js';
import { ForgotPasswordPage } from '../pages/public/ForgotPasswordPage.js';

// Employee Pages
import { EmployeeDashboardPage } from '../pages/employee/EmployeeDashboardPage.js';
import { EmployeeAttendancePage } from '../pages/employee/EmployeeAttendancePage.js';
import { EmployeeLeavePage } from '../pages/employee/EmployeeLeavePage.js';
import { EmployeeExceptionsPage } from '../pages/employee/EmployeeExceptionsPage.js';
import { EmployeeDocumentsPage } from '../pages/employee/EmployeeDocumentsPage.js';
import { EmployeeProfilePage } from '../pages/employee/EmployeeProfilePage.js';
import { EmployeeSecurityPage } from '../pages/employee/EmployeeSecurityPage.js';

const EmployeeProtectedLayout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner message="Verifying session credentials..." />
      </div>
    );
  }

  if (!user) {
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
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/activate" element={<ActivatePage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Employee Protected Routes */}
      <Route element={<EmployeeProtectedLayout />}>
        <Route path="/employee/dashboard" element={<EmployeeDashboardPage />} />
        <Route path="/employee/attendance" element={<EmployeeAttendancePage />} />
        <Route path="/employee/leave" element={<EmployeeLeavePage />} />
        <Route path="/employee/exceptions" element={<EmployeeExceptionsPage />} />
        <Route path="/employee/documents" element={<EmployeeDocumentsPage />} />
        <Route path="/employee/profile" element={<EmployeeProfilePage />} />
        <Route path="/employee/security" element={<EmployeeSecurityPage />} />
        <Route path="/employee" element={<Navigate to="/employee/dashboard" replace />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
