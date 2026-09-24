import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createBrowserRouter, Navigate, Outlet, RouterProvider, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import NotFound from 'components/share/not.found';
import LoginPage from 'pages/auth/login';
import RegisterPage from 'pages/auth/register';
import LayoutAdmin from 'components/admin/layout.admin';
import ProtectedRoute from 'components/share/protected-route.ts';
import Header from 'components/client/header.client';
import Footer from 'components/client/footer.client';
import HomePage from 'pages/home';
import styles from 'styles/app.module.scss';
import DashboardPage from './pages/admin/dashboard';
import PermissionPage from './pages/admin/permission';
import RolePage from './pages/admin/role';
import UserPage from './pages/admin/user';
import { fetchAccount } from './redux/slice/accountSlide';
import LayoutApp from './components/share/layout.app';
import CoursePage from './pages/admin/course';
import ClassroomPage from './pages/admin/classroom';
import EnrollmentPage from './pages/admin/enrollment';
import InvoicePage from './pages/admin/invoice';
import PaymentPage from './pages/admin/payment';
import LeadPage from './pages/admin/lead';
import CourseDetailPage from './pages/course/detail';
import PortalPage from './pages/portal';
import ClassDetailPage from './pages/portal/class-detail';
import PortalRoute from './components/client/portal-route';
import Loading from './components/share/loading';
import NotPermitted from './components/share/protected-route.ts/not-permitted';
import { isAccountantRole } from './config/portal';
import AccountantDashboard from './pages/client/accountant/AccountantDashboard';
import AccountantTuition from './pages/client/accountant/AccountantTuition';
import AccountantInvoices from './pages/client/accountant/AccountantInvoices';
import AccountantPayments from './pages/client/accountant/AccountantPayments';
import AccountantRevenue from './pages/client/accountant/AccountantRevenue';
import ConsultantDashboard from './pages/client/consultant/ConsultantDashboard';
import ConsultantCustomers from './pages/client/consultant/ConsultantCustomers';
import ConsultantCourses from './pages/client/consultant/ConsultantCourses';
import ConsultantEnrollments from './pages/client/consultant/ConsultantEnrollments';
import ConsultantFollowUp from './pages/client/consultant/ConsultantFollowUp';
import ConsultantChat from './pages/client/consultant/ConsultantChat';
import ClientDashboard from './pages/client/dashboard/ClientDashboard';
import { getPortalRole, isBackofficeRole } from './config/portal';
import ClientLayout from './pages/client/layout/ClientLayout';

const BackendModulePage = ({ title, endpoint }: { title: string; endpoint: string }) => (
    <div style={{ padding: 24 }}>
        <h1>{title}</h1>
        <p>Module route is ready for the {endpoint} API.</p>
    </div>
);

const ProtectedModuleRoute = ({ children }: { children: ReactNode }) => (
    <ProtectedRoute>{children}</ProtectedRoute>
);

const AccountantRoute = ({ children }: { children: ReactNode }) => {
    const { isAuthenticated, isLoading, user } = useAppSelector(state => state.account);
    if (isLoading) return <Loading />;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (!isAccountantRole(user.role?.name)) return <NotPermitted />;
    return <>{children}</>;
};

const ConsultantRoute = ({ children }: { children: ReactNode }) => {
    const { isAuthenticated, isLoading, user } = useAppSelector(state => state.account);
    if (isLoading) return <Loading />;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (getPortalRole(user.role?.name) !== 'CONSULTANT') return <NotPermitted />;
    return <>{children}</>;
};

const ClientRoute = ({ children }: { children: ReactNode }) => {
    const { isAuthenticated, isLoading, user } = useAppSelector(state => state.account);
    if (isLoading) return <Loading />;
    if (!isAuthenticated) return <Navigate to="/login?callback=/client" replace />;
    if (isBackofficeRole(user.role?.name)) return <Navigate to="/admin" replace />;
    if (!['STUDENT', 'TEACHER', 'CONSULTANT', 'ACCOUNTANT', 'MANAGER'].includes(getPortalRole(user.role?.name))) return <NotPermitted />;
    return <>{children}</>;
};

const LayoutClient = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const location = useLocation();
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        rootRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [location]);

    return (
        <div className="layout-app" ref={rootRef}>
            <Header />
            <div className={styles['content-app']}>
                <Outlet context={[searchTerm, setSearchTerm]} />
            </div>
            <Footer />
        </div>
    );
};

export default function App() {
    const dispatch = useAppDispatch();

    useEffect(() => {
        if (!['/login', '/register'].includes(window.location.pathname)) {
            dispatch(fetchAccount());
        }
    }, [dispatch]);

    const router = createBrowserRouter([
        {
            path: '/',
            element: <LayoutApp><LayoutClient /></LayoutApp>,
            errorElement: <NotFound />,
            children: [{ index: true, element: <HomePage /> }],
        },
        { path: '/courses/:id', element: <LayoutApp><LayoutClient /></LayoutApp>, errorElement: <NotFound />, children: [{ index: true, element: <CourseDetailPage /> }] },
        { path: '/client', element: <LayoutApp><ClientLayout /></LayoutApp>, errorElement: <NotFound />, children: [{ index: true, element: <ClientRoute><ClientDashboard /></ClientRoute> }] },
        {
            path: '/portal',
            element: <LayoutApp><ClientLayout /></LayoutApp>,
            errorElement: <NotFound />,
            children: [
                { index: true, element: <PortalRoute><PortalPage screen="home" /></PortalRoute> },
                { path: 'my-courses', element: <PortalRoute path="/portal/my-courses"><PortalPage screen="my-courses" /></PortalRoute> },
                { path: 'classes', element: <PortalRoute path="/portal/classes"><PortalPage screen="classes" /></PortalRoute> },
                { path: 'classes/:id', element: <PortalRoute><ClassDetailPage /></PortalRoute> },
                { path: 'schedule', element: <PortalRoute path="/portal/schedule"><PortalPage screen="schedule" /></PortalRoute> },
                { path: 'invoices', element: <PortalRoute path="/portal/invoices"><PortalPage screen="invoices" /></PortalRoute> },
                { path: 'payments', element: <PortalRoute path="/portal/payments"><PortalPage screen="payments" /></PortalRoute> },
                { path: 'students', element: <PortalRoute path="/portal/students"><PortalPage screen="students" /></PortalRoute> },
                { path: 'teachers', element: <PortalRoute path="/portal/teachers"><PortalPage screen="teachers" /></PortalRoute> },
                { path: 'courses', element: <PortalRoute path="/portal/courses"><PortalPage screen="courses" /></PortalRoute> },
                { path: 'leads', element: <PortalRoute path="/portal/leads"><PortalPage screen="leads" /></PortalRoute> },
                { path: 'profile', element: <PortalRoute path="/portal/profile"><PortalPage screen="profile" /></PortalRoute> },
            ],
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
                { path: 'courses', element: <ProtectedModuleRoute><CoursePage /></ProtectedModuleRoute> },
                { path: 'classrooms', element: <ProtectedModuleRoute><ClassroomPage /></ProtectedModuleRoute> },
                { path: 'enrollments', element: <ProtectedModuleRoute><EnrollmentPage /></ProtectedModuleRoute> },
                { path: 'invoices', element: <ProtectedModuleRoute><InvoicePage /></ProtectedModuleRoute> },
                { path: 'payments', element: <ProtectedModuleRoute><PaymentPage /></ProtectedModuleRoute> },
                { path: 'leads', element: <ProtectedModuleRoute><LeadPage /></ProtectedModuleRoute> },
                { path: 'conversations', element: <ProtectedModuleRoute><BackendModulePage title="Conversations" endpoint="/conversations" /></ProtectedModuleRoute> },
                { path: 'messages', element: <ProtectedModuleRoute><BackendModulePage title="Messages" endpoint="/messages" /></ProtectedModuleRoute> },
                { path: 'notifications', element: <ProtectedModuleRoute><BackendModulePage title="Notifications" endpoint="/notifications" /></ProtectedModuleRoute> },
            ],
        },
        {
            path: '/client/accountant',
            element: <LayoutApp><ClientLayout /></LayoutApp>,
            errorElement: <NotFound />,
            children: [
                { index: true, element: <AccountantRoute><AccountantDashboard /></AccountantRoute> },
                { path: 'tuition', element: <AccountantRoute><AccountantTuition /></AccountantRoute> },
                { path: 'invoices', element: <AccountantRoute><AccountantInvoices /></AccountantRoute> },
                { path: 'payments', element: <AccountantRoute><AccountantPayments /></AccountantRoute> },
                { path: 'revenue', element: <AccountantRoute><AccountantRevenue /></AccountantRoute> },
                { path: 'profile', element: <AccountantRoute><PortalPage screen="profile" /></AccountantRoute> },
            ],
        },
        {
            path: '/client/consultant',
            element: <LayoutApp><ClientLayout /></LayoutApp>,
            errorElement: <NotFound />,
            children: [
                { index: true, element: <ConsultantRoute><ConsultantDashboard /></ConsultantRoute> },
                { path: 'customers', element: <ConsultantRoute><ConsultantCustomers /></ConsultantRoute> },
                { path: 'courses', element: <ConsultantRoute><ConsultantCourses /></ConsultantRoute> },
                { path: 'enrollments', element: <ConsultantRoute><ConsultantEnrollments /></ConsultantRoute> },
                { path: 'follow-up', element: <ConsultantRoute><ConsultantFollowUp /></ConsultantRoute> },
                { path: 'chat', element: <ConsultantRoute><ConsultantChat /></ConsultantRoute> },
                { path: 'profile', element: <ConsultantRoute><PortalPage screen="profile" /></ConsultantRoute> },
            ],
        },
        { path: '/login', element: <LoginPage /> },
        { path: '/register', element: <RegisterPage /> },
    ]);

    return <RouterProvider router={router} />;
}
