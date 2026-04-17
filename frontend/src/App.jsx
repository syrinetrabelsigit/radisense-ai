import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n/config';
import { authService } from './services/authService';
import ForgotPassword from './pages/public/ForgotPassword';
import ChatWidget from './components/layout/ChatWidget';

import ScrollToTop from './components/layout/ScrollToTop';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import RadiologistAppointments from './pages/radiologist/RadiologistAppointments';
import AppointmentsManagement from './pages/admin/AppointmentsManagement';

import Landing from './pages/public/Landing';
import News from './pages/public/News';
import PathologyEncyclopedia from './pages/public/PathologyEncyclopedia';
import About from './pages/public/About';
import Pricing from './pages/public/Pricing';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import PaymentSuccess from './pages/public/PaymentSuccess';
import ChangePassword from './pages/public/ChangePassword';
import Partners from './pages/public/Partners';
import ResetPassword from './pages/public/ResetPassword';

import AccessRequests from './pages/admin/AccessRequests';
import RegisterComplete from './pages/public/RegisterComplete';
import Dashboard from './pages/radiologist/Dashboard';
import Upload from './pages/radiologist/Upload';
import Results from './pages/radiologist/Results';
import Patients from './pages/radiologist/Patients';
import Analytics from './pages/radiologist/Analytics';
import RadiologistAnalyses from './pages/radiologist/MyAnalyses';
import PendingXrays from './pages/radiologist/PendingXrays';

import PatientDashboard from './pages/patient/PatientDashboard';
import MedicalRecords from './pages/patient/MedicalRecords';
import MyAnalyses from './pages/patient/MyAnalyses';
import Appointments from './pages/patient/Appointments';
import MyRadiologists from './pages/patient/MyRadiologists';
import HealthEducation from './pages/patient/HealthEducation';
import PatientUpload from './pages/patient/PatientUpload';
import PatientResults from './pages/patient/PatientResults';

import ResearcherDashboard from './pages/researcher/ResearcherDashboard';
import Datasets from './pages/researcher/Datasets';
import Experiments from './pages/researcher/Experiments';
import ModelComparison from './pages/researcher/ModelComparison';
import Visualization from './pages/researcher/Visualization';
import Models from './pages/researcher/Models';
import Publications from './pages/researcher/Publications';
import AnalysesBrowser from './pages/researcher/AnalysesBrowser';


import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import AdminPatients from './pages/admin/AdminPatients';
import SystemMonitoring from './pages/admin/SystemMonitoring';
import ModelManagement from './pages/admin/ModelManagement';
import AuditLogs from './pages/admin/AuditLogs';
import DatabaseManagement from './pages/admin/DatabaseManagement';
import SystemSettings from './pages/admin/SystemSettings';
import ReportsGenerator from './pages/admin/ReportsGenerator';

import Profile from './pages/shared/Profile';
import AccountSettings from './pages/shared/AccountSettings';

import './styles/index.css';

// Init thème avant le premier render
const initTheme = () => {
  const saved = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  return saved;
};
const initialTheme = initTheme();

// ✅ COMPOSANT POUR REDIRIGER SI CONNECTÉ
const HomeRedirect = ({ user }) => {
  if (!user) return <Landing />;
  
  // Rediriger selon le rôle
  const dashboardRoutes = {
    radiologist: '/dashboard',
    admin: '/admin/dashboard',
    patient: '/patient/dashboard',
    researcher: '/researcher/dashboard'
  };
  
  return <Navigate to={dashboardRoutes[user.role] || '/'} replace />;
};

function App() {
  const [user, setUser] = useState(() => authService.getCurrentUser());
  const [theme, setTheme] = useState(initialTheme);

  // ✅ Callback logout : vide le user state + redirige
  const handleLogout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  // ✅ Callback login : met à jour le user state sans reload
  const handleLogin = useCallback((userData) => {
  setUser(userData);
}, []);

const handleUserUpdate = useCallback((updatedFields) => {
  setUser(prev => {
    const updated = { ...prev, ...updatedFields };
    authService.updateStoredUser(updated); // ← met à jour localStorage
    return updated;
  });
}, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <I18nextProvider i18n={i18n}>
      <div className="app">
        <ScrollToTop />
        <Navbar user={user} theme={theme} toggleTheme={toggleTheme} onLogout={handleLogout} />

        <main className="main-content">
          <Routes>
            {/* ✅ HOME AVEC REDIRECTION AUTO */}
            <Route path="/" element={<HomeRedirect user={user} />} />
            
            <Route path="/news" element={<News />} />
            <Route path="/pathologies" element={<PathologyEncyclopedia />} />
            <Route path="/about" element={<About />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/partners" element={<Partners />} />
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/register/complete" element={<RegisterComplete />} />
            <Route path="/change-password" element={<ChangePassword onLogin={handleLogin} />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/results/:id" element={
              user?.role === 'patient' ? <PatientResults /> : <Results />
            } />
            <Route path="/patients" element={<Patients />} />
            <Route path="/analytics" element={<Analytics />} />
            {/* <Route path="/radiologist/profile" element={<Profile user={user} />} /> */}
            <Route path="/radiologist/settings" element={<AccountSettings user={user} />} />
            <Route path="/appointments" element={<RadiologistAppointments />} />
            <Route path="/my-analyses" element={<RadiologistAnalyses />} />
            <Route path="/pending-xrays" element={<PendingXrays />} />
            <Route path="/radiologist/profile" element={<Profile user={user} onUserUpdate={handleUserUpdate} />} />

            <Route path="/patient/dashboard" element={<PatientDashboard />} />
            <Route path="/patient/records" element={<MedicalRecords />} />
            <Route path="/patient/analyses" element={<MyAnalyses />} />
            <Route path="/patient/appointments" element={<Appointments />} />
            <Route path="/patient/radiologists" element={<MyRadiologists />} />
            <Route path="/patient/education" element={<HealthEducation />} />
            {/* <Route path="/patient/profile" element={<Profile user={user} />} /> */}
            <Route path="/patient/settings" element={<AccountSettings user={user} />} />
            <Route path="/patient/upload" element={<PatientUpload />} />
            <Route path="/patient/results/:id" element={<PatientResults />} />
            <Route path="/patient/profile"     element={<Profile user={user} onUserUpdate={handleUserUpdate} />} />

            <Route path="/researcher/dashboard" element={<ResearcherDashboard />} />
            <Route path="/researcher/datasets" element={<Datasets />} />
            <Route path="/researcher/experiments" element={<Experiments />} />
            <Route path="/researcher/comparison" element={<ModelComparison />} />
            <Route path="/researcher/visualization" element={<Visualization />} />
            <Route path="/researcher/models" element={<Models />} />
            <Route path="/researcher/publications" element={<Publications />} />
            {/* <Route path="/researcher/profile" element={<Profile user={user} />} /> */}
            <Route path="/researcher/settings" element={<AccountSettings user={user} />} />
            <Route path="/researcher/analyses" element={<AnalysesBrowser />} />
            <Route path="/researcher/profile" element={<Profile user={user} onUserUpdate={handleUserUpdate} />} />

            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/patients" element={<AdminPatients />} />
            <Route path="/admin/monitoring" element={<SystemMonitoring />} />
            <Route path="/admin/models" element={<ModelManagement />} />
            <Route path="/admin/logs" element={<AuditLogs />} />
            <Route path="/admin/database" element={<DatabaseManagement />} />
            <Route path="/admin/settings" element={<SystemSettings />} />
            <Route path="/admin/reports" element={<ReportsGenerator />} />
            {/* <Route path="/admin/profile" element={<Profile user={user} />} /> */}
            <Route path="/admin/appointments" element={<AppointmentsManagement />} />
            <Route path="/admin/requests" element={<AccessRequests />} />
            <Route path="/admin/profile" element={<Profile user={user} onUserUpdate={handleUserUpdate} />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <Footer />
        <ChatWidget user={user} />
      </div>
    </I18nextProvider>
  );
}

export default App;