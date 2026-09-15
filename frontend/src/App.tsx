import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Chatbot from './components/Chatbot';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ScanHistory from './pages/ScanHistory';
import NewScan from './pages/NewScan';
import ScanDetail from './pages/ScanDetail';
import ReviewQueue from './pages/ReviewQueue';
import AdminUsers from './pages/AdminUsers';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const { isAuthenticated, role } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="scans" element={<ScanHistory />} />
            <Route path="scans/new" element={<NewScan mode="image" />} />
            <Route path="scans/new/batch" element={<NewScan mode="batch" />} />
            <Route path="scans/new/ecommerce" element={<NewScan mode="ecommerce" />} />
            <Route path="scans/:id" element={<ScanDetail />} />
            
            {/* Officer & Admin routes */}
            <Route path="review-queue" element={
              <ProtectedRoute allowedRoles={['enforcement_officer', 'admin']}>
                <ReviewQueue />
              </ProtectedRoute>
            } />
            <Route path="analytics" element={
              <ProtectedRoute allowedRoles={['enforcement_officer', 'admin']}>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            {/* Admin only routes */}
            <Route path="admin/users" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminUsers />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
        
        {/* Render Chatbot unconditionally inside AuthProvider so it can be used anywhere, 
            or restrict it to authenticated users if you prefer. I'll put it outside Routes 
            but we can use `useAuth` inside it if we need to. */}
        <AuthContextChatbotWrapper />
      </BrowserRouter>
    </AuthProvider>
  );
}

// A simple wrapper to only show Chatbot if authenticated
function AuthContextChatbotWrapper() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return null;
  return <Chatbot />;
}
