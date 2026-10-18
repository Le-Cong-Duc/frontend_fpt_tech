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
import CourseCard from './components/client/card/course.card';
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
import CourseDetail from './pages/client/common/CourseDetail';
import CourseCheckout from './pages/client/common/CourseCheckout';
import Loading from './components/share/loading';
import NotPermitted from './components/share/protected-route.ts/not-permitted';
import { getDefaultRouteForRole, getPortalRole, isAccountantRole, isBackofficeRole } from './config/portal';
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
import TeacherDashboard from './pages/client/dashboard/TeacherDashboard';
import TeacherCourses from './pages/client/teacher/TeacherCourses';
import TeacherClasses from './pages/client/teacher/TeacherClasses';
import TeacherStudents from './pages/client/teacher/TeacherStudents';
import TeacherSchedule from './pages/client/teacher/TeacherSchedule';
import TeacherChat from './pages/client/teacher/TeacherChat';
import ManagerDashboard from './pages/client/manager/ManagerDashboard';
import ManagerClasses from './pages/client/manager/ManagerClasses';
import ManagerTeachers from './pages/client/manager/ManagerTeachers';
import ManagerStudents from './pages/client/manager/ManagerStudents';
import ManagerCourses from './pages/client/manager/ManagerCourses';
import ManagerSchedule from './pages/client/manager/ManagerSchedule';
import ClientDashboard from './pages/client/dashboard/ClientDashboard';
import ClientLayout from './pages/client/layout/ClientLayout';
import StudentCourses from './pages/client/student/StudentCourses';
import StudentSchedule from './pages/client/student/StudentSchedule';
import StudentInvoices from './pages/client/student/StudentInvoices';
import StudentPayments from './pages/client/student/StudentPayments';
import StudentProfile from './pages/client/student/StudentProfile';
import StudentClasses from './pages/client/student/StudentClasses';
import Profile from './pages/client/common/Profile';
import ChatPage from './pages/client/common/Chat';
import ManagerClassDetail from './pages/client/manager/ManagerClassDetail';

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
    if (!isAccountantRole(user.role?.name)) return <Navigate to={getDefaultRouteForRole(user.role?.name)} replace />;
    return <>{children}</>;
};

const ConsultantRoute = ({ children }: { children: ReactNode }) => {
    const { isAuthenticated, isLoading, user } = useAppSelector(state => state.account);
    if (isLoading) return <Loading />;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (getPortalRole(user.role?.name) !== 'CONSULTANT') return <Navigate to={getDefaultRouteForRole(user.role?.name)} replace />;
    return <>{children}</>;
};

const ManagerRoute = ({ children }: { children: ReactNode }) => {
    const { isAuthenticated, isLoading, user } = useAppSelector(state => state.account);
    if (isLoading) return <Loading />;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (getPortalRole(user.role?.name) !== 'MANAGER') return <Navigate to={getDefaultRouteForRole(user.role?.name)} replace />;
    return <>{children}</>;
};

const TeacherRoute = ({ children }: { children: ReactNode }) => {
    const { isAuthenticated, isLoading, user } = useAppSelector(state => state.account);
    if (isLoading) return <Loading />;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (getPortalRole(user.role?.name) !== 'TEACHER') return <Navigate to={getDefaultRouteForRole(user.role?.name)} replace />;
    return <>{children}</>;
};

const StudentRoute = ({ children }: { children: ReactNode }) => {
    const { isAuthenticated, isLoading, user } = useAppSelector(state => state.account);
    if (isLoading) return <Loading />;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (getPortalRole(user.role?.name) !== 'STUDENT') return <Navigate to={getDefaultRouteForRole(user.role?.name)} replace />;
    return <>{children}</>;
};

const ClientRoute = ({ children }: { children: ReactNode }) => {
    const { isAuthenticated, isLoading, user } = useAppSelector(state => state.account);
    if (isLoading) return <Loading />;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return <Navigate to={getDefaultRouteForRole(user.role?.name)} replace />;
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
            children: [{ index: true, element: <CourseCard /> }],
        },
        { path: '/client/courses/:id', element: <LayoutApp><LayoutClient /></LayoutApp>, errorElement: <NotFound />, children: [{ index: true, element: <CourseDetail /> }] },
        { path: '/client/courses/:id/checkout', element: <LayoutApp><LayoutClient /></LayoutApp>, errorElement: <NotFound />, children: [{ index: true, element: <CourseCheckout /> }] },
        { path: '/client', element: <LayoutApp><ClientLayout /></LayoutApp>, errorElement: <NotFound />, children: [{ index: true, element: <ClientRoute><ClientDashboard /></ClientRoute> }] },
        {
            path: '/client/student',
            element: <LayoutApp><ClientLayout /></LayoutApp>,
            errorElement: <NotFound />,
            children: [
                { index: true, element: <StudentRoute><ClientDashboard /></StudentRoute> },
                { path: 'courses', element: <StudentRoute><StudentCourses /></StudentRoute> },
                { path: 'classes', element: <StudentRoute><StudentClasses /></StudentRoute> },
                { path: 'schedule', element: <StudentRoute><StudentSchedule /></StudentRoute> },
                { path: 'invoices', element: <StudentRoute><StudentInvoices /></StudentRoute> },
                { path: 'payments', element: <StudentRoute><StudentPayments /></StudentRoute> },
                { path: 'chat', element: <StudentRoute><ChatPage /></StudentRoute> },
                { path: 'profile', element: <StudentRoute><StudentProfile /></StudentRoute> },
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
                { path: 'chat', element: <AccountantRoute><ChatPage /></AccountantRoute> },
                { path: 'profile', element: <AccountantRoute><Profile /></AccountantRoute> },
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
                { path: 'chat', element: <ConsultantRoute><ChatPage /></ConsultantRoute> },
                { path: 'profile', element: <ConsultantRoute><Profile /></ConsultantRoute> },
            ],
        },
        {
            path: '/client/teacher',
            element: <LayoutApp><ClientLayout /></LayoutApp>,
            errorElement: <NotFound />,
            children: [
                { index: true, element: <TeacherRoute><TeacherDashboard /></TeacherRoute> },
                { path: 'courses', element: <TeacherRoute><TeacherCourses /></TeacherRoute> },
                { path: 'classes', element: <TeacherRoute><TeacherClasses /></TeacherRoute> },
                { path: 'students', element: <TeacherRoute><TeacherStudents /></TeacherRoute> },
                { path: 'schedule', element: <TeacherRoute><TeacherSchedule /></TeacherRoute> },
                { path: 'chat', element: <TeacherRoute><ChatPage /></TeacherRoute> },
                { path: 'profile', element: <TeacherRoute><Profile /></TeacherRoute> },
            ],
        },
        {
            path: '/client/manager',
            element: <LayoutApp><ClientLayout /></LayoutApp>,
            errorElement: <NotFound />,
            children: [
                { index: true, element: <ManagerRoute><ManagerDashboard /></ManagerRoute> },
                { path: 'classes/:id', element: <ManagerRoute><ManagerClassDetail /></ManagerRoute> },
                { path: 'classes', element: <ManagerRoute><ManagerClasses /></ManagerRoute> },
                { path: 'teachers', element: <ManagerRoute><ManagerTeachers /></ManagerRoute> },
                { path: 'students', element: <ManagerRoute><ManagerStudents /></ManagerRoute> },
                { path: 'courses', element: <ManagerRoute><ManagerCourses /></ManagerRoute> },
                { path: 'schedule', element: <ManagerRoute><ManagerSchedule /></ManagerRoute> },
                { path: 'chat', element: <ManagerRoute><ChatPage /></ManagerRoute> },
                { path: 'profile', element: <ManagerRoute><Profile /></ManagerRoute> },
            ],
        },
        { path: '/login', element: <LoginPage /> },
        { path: '/register', element: <RegisterPage /> },
    ]);

    return <RouterProvider router={router} />;
}
