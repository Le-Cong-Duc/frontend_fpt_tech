import type { ReactNode } from 'react';
import {
    BookOutlined,
    CalendarOutlined,
    BarChartOutlined,
    CheckCircleOutlined,
    CreditCardOutlined,
    DollarOutlined,
    FileTextOutlined,
    TeamOutlined,
    UserOutlined,
} from '@ant-design/icons';

export type PortalRole = 'STUDENT' | 'TEACHER' | 'CONSULTANT' | 'MANAGER';

export interface PortalMenuItem {
    key: string;
    label: string;
    roles: PortalRole[];
    icon: ReactNode;
}

export interface AccountantMenuItem {
    key: string;
    label: string;
    icon: ReactNode;
}

const normalizeRole = (value = '') => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();

export const isBackofficeRole = (roleName?: string) => {
    const role = normalizeRole(roleName);
    return role.includes('ADMIN') || role.includes('QUAN TRI') || isAccountantRole(role);
};

export const isAccountantRole = (roleName?: string) => {
    const role = normalizeRole(roleName);
    return role.includes('ACCOUNTANT') || role.includes('KE TOAN') || role.includes('KETOAN');
};

export const getPortalRole = (roleName?: string): PortalRole => {
    const role = normalizeRole(roleName);
    if (role.includes('MANAGER') || role.includes('QUAN LY')) return 'MANAGER';
    if (role.includes('TEACHER') || role.includes('GIANG VIEN')) return 'TEACHER';
    if (role.includes('CONSULTANT') || role.includes('TU VAN')) return 'CONSULTANT';
    return 'STUDENT';
};

export const portalMenu: PortalMenuItem[] = [
    { key: '/portal/my-courses', label: 'Khóa học của tôi', roles: ['STUDENT'], icon: <BookOutlined /> },
    { key: '/portal/classes', label: 'Lớp học', roles: ['STUDENT', 'TEACHER', 'MANAGER'], icon: <TeamOutlined /> },
    { key: '/portal/schedule', label: 'Lịch học', roles: ['STUDENT', 'TEACHER', 'CONSULTANT'], icon: <CalendarOutlined /> },
    { key: '/portal/invoices', label: 'Hóa đơn', roles: ['MANAGER'], icon: <FileTextOutlined /> },
    { key: '/portal/payments', label: 'Thanh toán', roles: ['STUDENT'], icon: <CreditCardOutlined /> },
    { key: '/portal/students', label: 'Học viên', roles: ['TEACHER', 'MANAGER'], icon: <TeamOutlined /> },
    { key: '/portal/teachers', label: 'Giảng viên', roles: ['MANAGER'], icon: <UserOutlined /> },
    { key: '/portal/courses', label: 'Khóa học', roles: ['MANAGER'], icon: <BookOutlined /> },
    { key: '/portal/leads', label: 'Khách hàng tư vấn', roles: ['CONSULTANT'], icon: <UserOutlined /> },
    { key: '/portal/profile', label: 'Thông tin cá nhân', roles: ['STUDENT', 'TEACHER', 'CONSULTANT', 'MANAGER'], icon: <UserOutlined /> },
];

export const accountantMenu: AccountantMenuItem[] = [
    { key: '/accountant?view=home', label: 'Trang chủ', icon: <BarChartOutlined /> },
    { key: '/accountant?view=fees', label: 'Học phí học viên', icon: <TeamOutlined /> },
    { key: '/accountant?view=create-invoice', label: 'Tạo hóa đơn', icon: <FileTextOutlined /> },
    { key: '/accountant?view=confirm-payment', label: 'Xác nhận thanh toán', icon: <CheckCircleOutlined /> },
    { key: '/accountant?view=payment-history', label: 'Lịch sử thanh toán', icon: <CreditCardOutlined /> },
    { key: '/accountant?view=invoices', label: 'Xem hóa đơn', icon: <FileTextOutlined /> },
    { key: '/accountant?view=export', label: 'Xuất hóa đơn', icon: <DollarOutlined /> },
    { key: '/accountant?view=revenue', label: 'Doanh thu theo tháng', icon: <BarChartOutlined /> },
    { key: '/accountant?view=debtors', label: 'Học viên chưa đóng phí', icon: <TeamOutlined /> },
];

export const getAccountantMenu = () => accountantMenu;

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
