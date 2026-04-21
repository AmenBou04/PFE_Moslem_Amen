import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PrivateRoute = ({ children, requiredRole }) => {
    const { user, loading } = useAuth();
    
    if (loading) return <div>Chargement...</div>;
    if (!user) return <Navigate to="/login" />;
    if (requiredRole && user.role !== requiredRole) {
        return <Navigate to="/dashboard" />;
    }
    return children;
};

export default PrivateRoute;  // ← Export default