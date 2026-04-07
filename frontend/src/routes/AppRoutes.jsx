import { Routes, Route } from 'react-router-dom';
import { PrivateRoute, AdminRoute } from '../context/AuthContext';
import { LandingPage } from '../pages/LandingPage';
import { LoginPage } from '../pages/Login';
import { SignupPage } from '../pages/Signup';
import { DashboardPage } from '../pages/Dashboard';
import { AdminPage } from '../pages/Admin';
import { PrivacyPage } from '../pages/Privacy';
import { TermsPage } from '../pages/Terms';
import { NotFoundPage } from '../pages/NotFound';

export function AppRoutes({ toast }) {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage toast={toast} />} />
      <Route path="/signup" element={<SignupPage toast={toast} />} />
      <Route path="/dashboard" element={<PrivateRoute><DashboardPage toast={toast} /></PrivateRoute>} />
      <Route path="/v1/admin" element={<AdminRoute><AdminPage toast={toast} /></AdminRoute>} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
