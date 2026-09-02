import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const user = localStorage.getItem('user');
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    try {
        const parsed = JSON.parse(user);
        if (!parsed?.access_token) {
            return <Navigate to="/login" replace />;
        }
    } catch {
        return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
};

export default ProtectedRoute;
