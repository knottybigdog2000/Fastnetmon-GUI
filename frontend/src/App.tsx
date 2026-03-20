import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import MainLayout from '@/layouts/MainLayout';
import LoginPage from '@/pages/Login';
import ServersPage from '@/pages/Servers';
import DashboardPage from '@/pages/Dashboard';
import SettingsPage from '@/pages/Settings';
import MitigationPage from '@/pages/Mitigation';
import UsersPage from '@/pages/Users';
import HostgroupsPage from '@/pages/Hostgroups';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!token) return <Navigate to="/login" replace />;
  
  return <MainLayout>{children}</MainLayout>;
};

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/servers" element={<ProtectedRoute><ServersPage /></ProtectedRoute>} />
              <Route path="/mitigation" element={<ProtectedRoute><MitigationPage /></ProtectedRoute>} />
              <Route path="/hostgroups" element={<ProtectedRoute><HostgroupsPage /></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />

              <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );

};

export default App;
