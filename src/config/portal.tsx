import type { ReactNode } from 'react';
import {
    BookOutlined,
    CalendarOutlined,
    CreditCardOutlined,
    FileTextOutlined,
    RiseOutlined,
    TeamOutlined,
    UserOutlined,
} from '@ant-design/icons';

export type PortalRole = 'STUDENT' | 'TEACHER' | 'CONSULTANT' | 'MANAGER' | 'ACCOUNTANT';

export interface PortalMenuItem {
    key: string;
    label: string;
    roles: PortalRole[];
    icon: ReactNode;
}

const normalizeRole = (value = '') => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();

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

export const portalMenu: PortalMenuItem[] = [
    { key: '/client', label: 'Dashboard', roles: ['STUDENT', 'TEACHER', 'CONSULTANT', 'MANAGER', 'ACCOUNTANT'], icon: <RiseOutlined /> },
    { key: '/portal/my-courses', label: 'Khóa học của tôi', roles: ['STUDENT'], icon: <BookOutlined /> },
    { key: '/portal/classes', label: 'Lớp học', roles: ['STUDENT', 'TEACHER', 'MANAGER'], icon: <TeamOutlined /> },
    { key: '/portal/schedule', label: 'Lịch học', roles: ['STUDENT', 'TEACHER'], icon: <CalendarOutlined /> },
    { key: '/portal/invoices', label: 'Hóa đơn', roles: ['MANAGER'], icon: <FileTextOutlined /> },
    { key: '/portal/payments', label: 'Thanh toán', roles: ['STUDENT'], icon: <CreditCardOutlined /> },
    { key: '/portal/students', label: 'Học viên', roles: ['TEACHER', 'MANAGER'], icon: <TeamOutlined /> },
    { key: '/portal/teachers', label: 'Giảng viên', roles: ['MANAGER'], icon: <UserOutlined /> },
    { key: '/portal/courses', label: 'Khóa học', roles: ['MANAGER'], icon: <BookOutlined /> },
    { key: '/portal/leads', label: 'Khách hàng tư vấn', roles: [], icon: <UserOutlined /> },
    { key: '/client/consultant', label: 'Tổng quan tư vấn', roles: ['CONSULTANT'], icon: <TeamOutlined /> },
    { key: '/client/consultant/customers', label: 'Khách hàng', roles: ['CONSULTANT'], icon: <UserOutlined /> },
    { key: '/client/consultant/courses', label: 'Khóa học', roles: ['CONSULTANT'], icon: <BookOutlined /> },
    { key: '/client/consultant/enrollments', label: 'Đăng ký học', roles: ['CONSULTANT'], icon: <TeamOutlined /> },
    { key: '/client/consultant/follow-up', label: 'Theo dõi khách hàng', roles: ['CONSULTANT'], icon: <CalendarOutlined /> },
    { key: '/client/consultant/chat', label: 'Tin nhắn', roles: ['CONSULTANT'], icon: <FileTextOutlined /> },
    { key: '/portal/profile', label: 'Thông tin cá nhân', roles: ['STUDENT', 'TEACHER', 'CONSULTANT', 'MANAGER', 'ACCOUNTANT'], icon: <UserOutlined /> },
    { key: '/client/accountant', label: 'Tổng quan kế toán', roles: ['ACCOUNTANT'], icon: <CreditCardOutlined /> },
    { key: '/client/accountant/tuition', label: 'Học phí', roles: ['ACCOUNTANT'], icon: <FileTextOutlined /> },
    { key: '/client/accountant/invoices', label: 'Hóa đơn', roles: ['ACCOUNTANT'], icon: <FileTextOutlined /> },
    { key: '/client/accountant/payments', label: 'Thanh toán', roles: ['ACCOUNTANT'], icon: <CreditCardOutlined /> },
    { key: '/client/accountant/revenue', label: 'Doanh thu', roles: ['ACCOUNTANT'], icon: <CalendarOutlined /> },
    { key: '/client/accountant/profile', label: 'Thông tin cá nhân', roles: ['ACCOUNTANT'], icon: <UserOutlined /> },
];

export const getPortalMenu = (roleName?: string): PortalMenuItem[] => {
    const portalRole = getPortalRole(roleName);
    return portalMenu
        .filter(item => item.roles.includes(portalRole))
        .map(item => ({
            ...item,
            label: item.key === '/portal/schedule' && portalRole === 'TEACHER' ? 'Lịch dạy' : item.label,
        }));
};

export const canAccessPortalPath = (roleName: string | undefined, path: string) => {
    const portalRole = getPortalRole(roleName);
    return portalMenu.some(item => item.key === path && item.roles.includes(portalRole));
};
