import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, CircularProgress } from '@mui/material';

const PrivateRoute = ({ children, requiredRole }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    if (!user) return <Navigate to="/login" replace />;
    const isAdminLike = user.role === 'ADMIN';

    if (requiredRole === 'ADMIN' && !isAdminLike) {
        return <Navigate to="/dashboard" replace />;
    }

    if (requiredRole && requiredRole !== 'ADMIN' && user.role !== requiredRole) {
        return <Navigate to="/dashboard" replace />;
    }
    return children;
};

export default PrivateRoute;
