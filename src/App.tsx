import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/AuthContext';
import { DataProvider } from './store/DataContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import PromoterDashboard from './pages/promoter/PromoterDashboard';
import ValidityControl from './pages/promoter/ValidityControl';
import FormsList from './pages/promoter/FormsList';
import RequestsList from './pages/promoter/RequestsList';
import FormExecution from './pages/promoter/FormExecution';
import SupervisorDashboard from './pages/supervisor/SupervisorDashboard';
import TeamManagement from './pages/supervisor/TeamManagement';
import StoreManagement from './pages/supervisor/StoreManagement';
import FormsManagement from './pages/supervisor/FormsManagement';
import MaterialRequestsManagement from './pages/supervisor/MaterialRequestsManagement';

// Protected Route Wrapper
function ProtectedRoute({ children, allowedRole }: { children: React.ReactNode, allowedRole?: 'promoter' | 'supervisor' }) {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={user.role === 'promoter' ? '/promoter/dashboard' : '/supervisor/dashboard'} replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to={user.role === 'promoter' ? '/promoter/dashboard' : '/supervisor/dashboard'} replace />} />
      
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        {/* Default redirect */}
        <Route index element={<Navigate to={user?.role === 'promoter' ? '/promoter/dashboard' : '/supervisor/dashboard'} replace />} />
        
        {/* Promoter Routes */}
        <Route path="promoter">
          <Route path="dashboard" element={<ProtectedRoute allowedRole="promoter"><PromoterDashboard /></ProtectedRoute>} />
          <Route path="validity" element={<ProtectedRoute allowedRole="promoter"><ValidityControl /></ProtectedRoute>} />
          <Route path="forms" element={<ProtectedRoute allowedRole="promoter"><FormsList /></ProtectedRoute>} />
          <Route path="forms/:taskId" element={<ProtectedRoute allowedRole="promoter"><FormExecution /></ProtectedRoute>} />
          <Route path="requests" element={<ProtectedRoute allowedRole="promoter"><RequestsList /></ProtectedRoute>} />
        </Route>

        {/* Supervisor Routes */}
        <Route path="supervisor">
          <Route path="dashboard" element={<ProtectedRoute allowedRole="supervisor"><SupervisorDashboard /></ProtectedRoute>} />
          <Route path="team" element={<ProtectedRoute allowedRole="supervisor"><TeamManagement /></ProtectedRoute>} />
          <Route path="stores" element={<ProtectedRoute allowedRole="supervisor"><StoreManagement /></ProtectedRoute>} />
          <Route path="forms" element={<ProtectedRoute allowedRole="supervisor"><FormsManagement /></ProtectedRoute>} />
          <Route path="requests" element={<ProtectedRoute allowedRole="supervisor"><MaterialRequestsManagement /></ProtectedRoute>} />
        </Route>
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </DataProvider>
    </AuthProvider>
  );
}
