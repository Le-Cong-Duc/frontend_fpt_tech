import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createBrowserRouter, Navigate, Outlet, RouterProvider, useLocation } from 'react-router-dom';
import NotFound from 'components/share/not.found';
import LoginPage from 'pages/auth/login';
import RegisterPage from 'pages/auth/register';
import LayoutAdmin from 'components/admin/layout.admin';
import Header from 'components/client/header.client';
import Footer from 'components/client/footer.client';
import HomePage from 'pages/home';
import styles from 'styles/app.module.scss';
import DashboardPage from './pages/admin/dashboard';
import PermissionPage from './pages/admin/permission';
import RolePage from './pages/admin/role';
import UserPage from './pages/admin/user';
import LayoutApp from './components/share/layout.app';
import UserDashboard from './pages/user/dashboard';

const BackendModulePage = ({ title, endpoint }: { title: string; endpoint: string }) => (
    <div style={{ padding: 24 }}>
        <h1>{title}</h1>
        <p>Module route is ready for the {endpoint} API.</p>
    </div>
);

const ProtectedModuleRoute = ({ children }: { children: ReactNode }) => <>{children}</>;

const LayoutClient = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const location = useLocation();
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        rootRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [location]);

    return (
        <div className="layout-app" ref={rootRef}>
            <Header searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            <div className={styles['content-app']}>
                <Outlet context={[searchTerm, setSearchTerm]} />
            </div>
            <Footer />
        </div>
    );
};

export default function App() {
    const router = createBrowserRouter([
        {
            path: '/',
            element: <Navigate to="/login" replace />,
        },
        {
            path: '/admin',
            element: <LayoutApp><LayoutAdmin /></LayoutApp>,
            errorElement: <NotFound />,
            children: [
                { index: true, element: <ProtectedModuleRoute><DashboardPage /></ProtectedModuleRoute> },
                { path: 'users', element: <ProtectedModuleRoute><UserPage /></ProtectedModuleRoute> },
                { path: 'roles', element: <ProtectedModuleRoute><RolePage /></ProtectedModuleRoute> },
                { path: 'permissions', element: <ProtectedModuleRoute><PermissionPage /></ProtectedModuleRoute> },
                { path: 'courses', element: <ProtectedModuleRoute><BackendModulePage title="Courses" endpoint="/courses" /></ProtectedModuleRoute> },
                { path: 'classrooms', element: <ProtectedModuleRoute><BackendModulePage title="Classrooms" endpoint="/classrooms" /></ProtectedModuleRoute> },
                { path: 'enrollments', element: <ProtectedModuleRoute><BackendModulePage title="Enrollments" endpoint="/enrollments" /></ProtectedModuleRoute> },
                { path: 'invoices', element: <ProtectedModuleRoute><BackendModulePage title="Invoices" endpoint="/invoices" /></ProtectedModuleRoute> },
                { path: 'payments', element: <ProtectedModuleRoute><BackendModulePage title="Payments" endpoint="/payments" /></ProtectedModuleRoute> },
                { path: 'leads', element: <ProtectedModuleRoute><BackendModulePage title="Leads" endpoint="/leads" /></ProtectedModuleRoute> },
                { path: 'conversations', element: <ProtectedModuleRoute><BackendModulePage title="Conversations" endpoint="/conversations" /></ProtectedModuleRoute> },
                { path: 'messages', element: <ProtectedModuleRoute><BackendModulePage title="Messages" endpoint="/messages" /></ProtectedModuleRoute> },
                { path: 'notifications', element: <ProtectedModuleRoute><BackendModulePage title="Notifications" endpoint="/notifications" /></ProtectedModuleRoute> },
            ],
        },
        {
            path: '/user',
            element: <LayoutClient />,
            errorElement: <NotFound />,
            children: [{ index: true, element: <UserDashboard /> }],
        },
        {
            path: '/manager',
            element: <LayoutApp><LayoutAdmin /></LayoutApp>,
            errorElement: <NotFound />,
            children: [
                { index: true, element: <ProtectedModuleRoute><DashboardPage /></ProtectedModuleRoute> },
            ],
        },
        { path: '/login', element: <LoginPage /> },
        { path: '/register', element: <RegisterPage /> },
    ]);

    return <RouterProvider router={router} />;
}
