import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

type ProtectedRouteProps = {
    children: React.ReactNode;
    allowedRoles?: string[];
};

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user, profile, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 font-bold uppercase tracking-widest text-xs">Authenticating...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        // Redirect them to the /login page, but save the current location they were
        // trying to go to when they were redirected. This allows us to send them
        // along to that page after they login, which is a nicer user experience.
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If specific roles are required and the user doesn't have the permission
    if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
        // Redirect to a specific dashboard or just the home page based on their actual role
        if (profile.role === 'admin') return <Navigate to="/admin" replace />;
        if (profile.role === 'seller') return <Navigate to="/seller/dashboard" replace />;
        if (profile.role === 'news_publisher') return <Navigate to="/publisher" replace />;
        return <Navigate to="/marketplace" replace />;
    }

    return <>{children}</>;
}
