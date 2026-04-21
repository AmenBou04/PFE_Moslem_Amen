import React, { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UiFeedbackProvider, useUiFeedback } from './contexts/UiFeedbackContext';
import theme from './theme';
import api from './services/api';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import PrivateRoute from './components/PrivateRoute';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminZones from './pages/admin/AdminZones';
import AdminCameras from './pages/admin/AdminCameras';
import AdminAlertes from './pages/admin/AdminAlertes';
import SystemLogs from './pages/admin/SystemLogs';

// Operator pages
import OperatorDashboard from './pages/operator/OperatorDashboard';
import OperatorAlertes from './pages/operator/OperatorAlertes';
import OperatorHistorique from './pages/operator/OperatorHistorique';

// User pages
import ProfileSettings from './pages/ProfileSettings';

const GlobalAlertPopupWatcher = () => {
    const { user } = useAuth();
    const { showAlertPopup } = useUiFeedback();
    const lastAlertIdRef = useRef(null);
    const initializedRef = useRef(false);

    useEffect(() => {
        if (!user) {
            initializedRef.current = false;
            lastAlertIdRef.current = null;
            return undefined;
        }

        let isMounted = true;

        const pollLatestAlerte = async () => {
            try {
                const response = await api.get('/alertes?limit=1');
                const latestAlerte = response.data?.[0];

                if (!isMounted || !latestAlerte?._id) {
                    return;
                }

                if (!initializedRef.current) {
                    initializedRef.current = true;
                    lastAlertIdRef.current = latestAlerte._id;
                    return;
                }

                if (latestAlerte._id !== lastAlertIdRef.current) {
                    lastAlertIdRef.current = latestAlerte._id;
                    showAlertPopup(latestAlerte);
                }
            } catch (error) {
                // Keep polling silent to avoid noisy UX when backend is temporarily unavailable.
            }
        };

        pollLatestAlerte();
        const intervalId = window.setInterval(pollLatestAlerte, 4000);

        return () => {
            isMounted = false;
            window.clearInterval(intervalId);
        };
    }, [user, showAlertPopup]);

    return null;
};

const AppRoutes = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';

    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/dashboard" element={
                <PrivateRoute>
                    {isAdmin ? <AdminDashboard /> : <OperatorDashboard />}
                </PrivateRoute>
            } />
            
            <Route path="/users" element={
                <PrivateRoute requiredRole="ADMIN">
                    <AdminUsers />
                </PrivateRoute>
            } />
            
            <Route path="/zones" element={
                <PrivateRoute requiredRole="ADMIN">
                    <AdminZones />
                </PrivateRoute>
            } />
            
            <Route path="/cameras" element={
                <PrivateRoute requiredRole="ADMIN">
                    <AdminCameras />
                </PrivateRoute>
            } />
            
            <Route path="/alertes" element={
                <PrivateRoute>
                    {isAdmin ? <AdminAlertes /> : <OperatorAlertes />}
                </PrivateRoute>
            } />

            <Route path="/historique" element={
                <PrivateRoute requiredRole="OPERATEUR">
                    <OperatorHistorique />
                </PrivateRoute>
            } />

            <Route path="/system-logs" element={
                <PrivateRoute requiredRole="ADMIN">
                    <SystemLogs />
                </PrivateRoute>
            } />
            
            <Route path="/profile" element={
                <PrivateRoute>
                    <ProfileSettings />
                </PrivateRoute>
            } />
            
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
};

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <BrowserRouter>
                <AuthProvider>
                    <UiFeedbackProvider>
                        <GlobalAlertPopupWatcher />
                        <AppRoutes />
                    </UiFeedbackProvider>
                </AuthProvider>
            </BrowserRouter>
        </ThemeProvider>
    );
}

export default App;