import type { ReactNode } from 'react';
import {
    BookOutlined,
    CalendarOutlined,
    CreditCardOutlined,
    FileTextOutlined,
    TeamOutlined,
    UserOutlined,
} from '@ant-design/icons';

export type PortalRole = 'STUDENT' | 'TEACHER' | 'CONSULTANT';

export interface PortalMenuItem {
    key: string;
    label: string;
    roles: PortalRole[];
    icon: ReactNode;
}

const normalizeRole = (value = '') => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();

export const isBackofficeRole = (roleName?: string) => {
    const role = normalizeRole(roleName);
    return role.includes('ADMIN') || role.includes('MANAGER') || role.includes('QUAN TRI') || role.includes('QUAN LY');
};

export const getPortalRole = (roleName?: string): PortalRole => {
    const role = normalizeRole(roleName);
    if (role.includes('TEACHER') || role.includes('GIANG VIEN')) return 'TEACHER';
    if (role.includes('CONSULTANT') || role.includes('TU VAN')) return 'CONSULTANT';
    return 'STUDENT';
};

export const portalMenu: PortalMenuItem[] = [
    { key: '/portal/my-courses', label: 'Khóa học của tôi', roles: ['STUDENT'], icon: <BookOutlined /> },
    { key: '/portal/classes', label: 'Lớp học', roles: ['STUDENT', 'TEACHER'], icon: <TeamOutlined /> },
    { key: '/portal/schedule', label: 'Lịch học', roles: ['STUDENT', 'TEACHER', 'CONSULTANT'], icon: <CalendarOutlined /> },
    { key: '/portal/invoices', label: 'Hóa đơn', roles: ['STUDENT'], icon: <FileTextOutlined /> },
    { key: '/portal/payments', label: 'Thanh toán', roles: ['STUDENT'], icon: <CreditCardOutlined /> },
    { key: '/portal/students', label: 'Học viên', roles: ['TEACHER'], icon: <TeamOutlined /> },
    { key: '/portal/leads', label: 'Khách hàng tư vấn', roles: ['CONSULTANT'], icon: <UserOutlined /> },
    { key: '/portal/profile', label: 'Thông tin cá nhân', roles: ['STUDENT', 'TEACHER', 'CONSULTANT'], icon: <UserOutlined /> },
];

export const getPortalMenu = (roleName?: string): PortalMenuItem[] => {
    const portalRole = getPortalRole(roleName);
    return portalMenu.filter(item => item.roles.includes(portalRole));
};

export const canAccessPortalPath = (roleName: string | undefined, path: string) => {
    const portalRole = getPortalRole(roleName);
    return portalMenu.some(item => item.key === path && item.roles.includes(portalRole));
};
