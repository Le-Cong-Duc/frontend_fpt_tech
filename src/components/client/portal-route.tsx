import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '@/redux/hooks';
import Loading from '@/components/share/loading';
import NotPermitted from '@/components/share/protected-route.ts/not-permitted';
import { canAccessPortalPath, isBackofficeRole } from '@/config/portal';

interface PortalRouteProps {
    path?: string;
    children: ReactNode;
}

const PortalRoute = ({ path, children }: PortalRouteProps) => {
    const { isAuthenticated, isLoading, user } = useAppSelector(state => state.account);

    if (isLoading) return <Loading />;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (isBackofficeRole(user.role?.name)) return <Navigate to="/admin" replace />;
    if (path && !canAccessPortalPath(user.role?.name, path)) return <NotPermitted />;

    return <>{children}</>;
};

export default PortalRoute;
