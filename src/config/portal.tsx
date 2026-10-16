import type { ReactNode } from 'react';
import {
    BookOutlined,
    CalendarOutlined,
    CreditCardOutlined,
    FileTextOutlined,
    HomeOutlined,
    RiseOutlined,
    TeamOutlined,
    UserOutlined,
} from '@ant-design/icons';

export type PortalRole = 'STUDENT' | 'TEACHER' | 'CONSULTANT' | 'MANAGER' | 'ACCOUNTANT';

export interface ClientMenuItem {
    key: string;
    label: string;
    roles: PortalRole[];
    icon: ReactNode;
}

const normalizeRole = (value: any = '') => {
    if (typeof value === 'object' && value !== null && 'name' in value) {
        value = value.name;
    }
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
};

export const isBackofficeRole = (roleName?: string) => {
    const role = normalizeRole(roleName);
    return role.includes('ADMIN') || role.includes('QUAN TRI');
};

export const isAccountantRole = (roleName?: string) => getPortalRole(roleName) === 'ACCOUNTANT';

export const getPortalRole = (roleName?: string): PortalRole => {
    const role = normalizeRole(roleName);
    if (role.includes('MANAGER') || role.includes('QUAN LY')) return 'MANAGER';
    if (role.includes('TEACHER') || role.includes('GIANG VIEN')) return 'TEACHER';
    if (role.includes('CONSULTANT') || role.includes('TU VAN')) return 'CONSULTANT';
    if (role.includes('ACCOUNTANT') || role.includes('KE TOAN')) return 'ACCOUNTANT';
    return 'STUDENT';
};

export const getDefaultRouteForRole = (roleName?: string): string => {
    if (isBackofficeRole(roleName)) return '/admin';
    const role = getPortalRole(roleName);
    switch (role) {
        case 'TEACHER':
            return '/client/teacher';
        case 'MANAGER':
            return '/client/manager';
        case 'ACCOUNTANT':
            return '/client/accountant';
        case 'CONSULTANT':
            return '/client/consultant';
        case 'STUDENT':
        default:
            return '/client/student';
    }
};

export const resolveTargetRoute = (roleName?: string, callback?: string | null): string => {
    const defaultRoute = getDefaultRouteForRole(roleName);
    if (!callback) return defaultRoute;
    try {
        const decoded = decodeURIComponent(callback);
        if (decoded.startsWith(defaultRoute)) {
            return decoded;
        }
    } catch {
        // ignore malformed callback
    }
    return defaultRoute;
};

export const clientMenu: ClientMenuItem[] = [
    { key: '/client/student', label: 'Dashboard', roles: ['STUDENT'], icon: <HomeOutlined /> },
    { key: '/client/student/courses', label: 'Khóa học của tôi', roles: ['STUDENT'], icon: <BookOutlined /> },
    { key: '/client/student/classes', label: 'Lớp học', roles: ['STUDENT'], icon: <TeamOutlined /> },
    { key: '/client/student/schedule', label: 'Lịch học', roles: ['STUDENT'], icon: <CalendarOutlined /> },
    { key: '/client/student/invoices', label: 'Hóa đơn', roles: ['STUDENT'], icon: <FileTextOutlined /> },
    { key: '/client/student/payments', label: 'Thanh toán', roles: ['STUDENT'], icon: <CreditCardOutlined /> },
    { key: '/client/student/profile', label: 'Thông tin cá nhân', roles: ['STUDENT'], icon: <UserOutlined /> },
    { key: '/client/teacher', label: 'Dashboard', roles: ['TEACHER'], icon: <HomeOutlined /> },
    { key: '/client/teacher/courses', label: 'Khóa học của tôi', roles: ['TEACHER'], icon: <BookOutlined /> },
    { key: '/client/teacher/classes', label: 'Lớp học', roles: ['TEACHER'], icon: <TeamOutlined /> },
    { key: '/client/teacher/students', label: 'Học viên', roles: ['TEACHER'], icon: <TeamOutlined /> },
    { key: '/client/teacher/schedule', label: 'Lịch dạy', roles: ['TEACHER'], icon: <CalendarOutlined /> },
    { key: '/client/teacher/chat', label: 'Chat', roles: ['TEACHER'], icon: <FileTextOutlined /> },
    { key: '/client/teacher/profile', label: 'Thông tin cá nhân', roles: ['TEACHER'], icon: <UserOutlined /> },
    { key: '/client/consultant', label: 'Dashboard', roles: ['CONSULTANT'], icon: <HomeOutlined /> },
    { key: '/client/consultant/customers', label: 'Khách hàng', roles: ['CONSULTANT'], icon: <UserOutlined /> },
    { key: '/client/consultant/courses', label: 'Khóa học', roles: ['CONSULTANT'], icon: <BookOutlined /> },
    { key: '/client/consultant/enrollments', label: 'Đăng ký học', roles: ['CONSULTANT'], icon: <TeamOutlined /> },
    { key: '/client/consultant/follow-up', label: 'Theo dõi khách hàng', roles: ['CONSULTANT'], icon: <CalendarOutlined /> },
    { key: '/client/consultant/chat', label: 'Tin nhắn', roles: ['CONSULTANT'], icon: <FileTextOutlined /> },
    { key: '/client/consultant/profile', label: 'Thông tin cá nhân', roles: ['CONSULTANT'], icon: <UserOutlined /> },
    { key: '/client/manager', label: 'Dashboard', roles: ['MANAGER'], icon: <HomeOutlined /> },
    { key: '/client/manager/classes', label: 'Lớp học', roles: ['MANAGER'], icon: <TeamOutlined /> },
    { key: '/client/manager/teachers', label: 'Giáo viên', roles: ['MANAGER'], icon: <UserOutlined /> },
    { key: '/client/manager/students', label: 'Học viên', roles: ['MANAGER'], icon: <TeamOutlined /> },
    { key: '/client/manager/courses', label: 'Khóa học', roles: ['MANAGER'], icon: <BookOutlined /> },
    { key: '/client/manager/schedule', label: 'Lịch học', roles: ['MANAGER'], icon: <CalendarOutlined /> },
    { key: '/client/manager/profile', label: 'Thông tin cá nhân', roles: ['MANAGER'], icon: <UserOutlined /> },
    { key: '/client/accountant', label: 'Dashboard', roles: ['ACCOUNTANT'], icon: <HomeOutlined /> },
    { key: '/client/accountant/tuition', label: 'Học phí', roles: ['ACCOUNTANT'], icon: <FileTextOutlined /> },
    { key: '/client/accountant/invoices', label: 'Hóa đơn', roles: ['ACCOUNTANT'], icon: <FileTextOutlined /> },
    { key: '/client/accountant/payments', label: 'Thanh toán', roles: ['ACCOUNTANT'], icon: <CreditCardOutlined /> },
    { key: '/client/accountant/revenue', label: 'Doanh thu', roles: ['ACCOUNTANT'], icon: <RiseOutlined /> },
    { key: '/client/accountant/profile', label: 'Thông tin cá nhân', roles: ['ACCOUNTANT'], icon: <UserOutlined /> },
];

export const getClientMenu = (roleName?: string): ClientMenuItem[] => {
    const role = getPortalRole(roleName);
    return clientMenu.filter(item => item.roles.includes(role));
};

export const getClientProfilePath = (roleName?: string) =>
    getClientMenu(roleName).find(item => item.label === 'Thông tin cá nhân')?.key || '/client/student/profile';

export const canAccessClientPath = (roleName: string | undefined, path: string) =>
    getClientMenu(roleName).some(item => item.key === path);
