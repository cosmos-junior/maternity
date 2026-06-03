import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientDetail from './pages/PatientDetail';
import Appointments from './pages/Appointments';
import Postnatal from './pages/Postnatal';
import Reminders from './pages/Reminders';
import Partograph from './pages/Partograph';
import Alerts from './pages/Alerts';
import AdminUsers from './pages/AdminUsers';
import AuditLog from './pages/AuditLog';
import ClinicalNotes from './pages/ClinicalNotes';
import Documents from './pages/Documents';
import CreateTicket from './pages/CreateTicket';
import TicketDashboard from './pages/TicketDashboard';
import Notifications from './pages/Notifications';
import Nutrition from './pages/Nutrition';
import Procedures from './pages/Procedures';
import ChildProfile from './pages/ChildProfile';
import Children from './pages/Children';
import UserProfile from './pages/UserProfile';

function PrivateRoute({ children }: { children: React.ReactElement }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

/**
 * RoleRoute — only renders children if the user's role is in the allowed list.
 * Redirects to Dashboard otherwise.
 */
function RoleRoute({ roles, children }: { roles: string[]; children: React.ReactElement }) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="profile" element={<UserProfile />} />
        <Route path="patients" element={<Patients />} />
        <Route path="patients/:id" element={<PatientDetail />} />
        <Route path="patients/:id/partograph" element={<Partograph />} />
        <Route path="patients/:id/nutrition" element={<Nutrition />} />
        <Route path="children" element={<Children />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="postnatal" element={<Postnatal />} />
        <Route path="children/:id" element={<ChildProfile />} />
        <Route path="reminders" element={<Reminders />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="clinical-notes" element={<ClinicalNotes />} />
        <Route path="documents" element={<Documents />} />
        <Route path="procedures" element={<Procedures />} />
        {/* Admin-only routes */}
        <Route path="admin/users" element={
          <RoleRoute roles={['ADMIN']}><AdminUsers /></RoleRoute>
        } />
        <Route path="admin/audit" element={
          <RoleRoute roles={['ADMIN']}><AuditLog /></RoleRoute>
        } />
        <Route path="tickets/create" element={
          <RoleRoute roles={['DOCTOR', 'NURSE']}><CreateTicket /></RoleRoute>
        } />
        <Route path="tickets" element={
          <RoleRoute roles={['ADMIN']}><TicketDashboard /></RoleRoute>
        } />
        <Route path="notifications" element={
          <RoleRoute roles={['ADMIN']}><Notifications /></RoleRoute>
        } />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
