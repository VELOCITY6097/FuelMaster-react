import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app'; 
import { AuthProvider, useAuth } from './context/AuthContext';
import { Lock } from 'lucide-react';

// Pages
import Login from './pages/auth/Login';
import ClientDashboard from './pages/client/ClientDashboard';
import Density from './pages/client/Density';
import Stocks from './pages/client/Stocks';
import Variance from './pages/client/Variance';
import Staff from './pages/client/Staff';
import Compliance from './pages/client/Compliance'; // <--- NEW IMPORT
import About from './pages/client/About';           // <--- NEW IMPORT

const ProtectedRoute = ({ children }) => {
  const { user, maintenance } = useAuth();
  
  // Maintenance Lock Screen
  if (maintenance?.active) {
    return (
        <div id="maintenance-overlay">
            <div className="lock-card animate__animated animate__fadeIn">
                <div className="lock-icon-circle">
                    <Lock size={32} />
                </div>
                <h2>System Maintenance</h2>
                <p>The station has been temporarily locked by the administrator for scheduled updates.</p>
                <div className="loader-track"><div className="loader-bar"></div></div>
                <div style={{marginTop:15, fontSize:'0.75rem', color:'#94a3b8', fontWeight:600, textTransform:'uppercase'}}>
                    Update in Progress
                </div>
            </div>
        </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const AppRoutes = () => {
    // Hardware Back Button Logic
    useEffect(() => {
        CapacitorApp.addListener('backButton', ({ canGoBack }) => {
            if (canGoBack) {
                window.history.back();
            } else {
                CapacitorApp.exitApp();
            }
        });
    }, []);

    return (
        <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            
            {/* Protected Dashboard & Tools */}
            <Route path="/dashboard" element={<ProtectedRoute><ClientDashboard /></ProtectedRoute>} />
            <Route path="/density" element={<ProtectedRoute><Density /></ProtectedRoute>} />
            <Route path="/stocks" element={<ProtectedRoute><Stocks /></ProtectedRoute>} />
            <Route path="/variance" element={<ProtectedRoute><Variance /></ProtectedRoute>} />
            <Route path="/staff" element={<ProtectedRoute><Staff /></ProtectedRoute>} />
            
            {/* New Routes */}
            <Route path="/compliance" element={<ProtectedRoute><Compliance /></ProtectedRoute>} />
            <Route path="/about" element={<ProtectedRoute><About /></ProtectedRoute>} />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
};

const App = () => (
  <AuthProvider>
    <Router>
      <AppRoutes />
    </Router>
  </AuthProvider>
);

export default App;