import { BellOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { Badge, Button } from 'antd';
import { useLocation } from 'react-router-dom';
import ClientUserMenu from './ClientUserMenu';
import styles from '@/styles/client.module.scss';

const titles: Record<string, string> = {
    '/client': 'Dashboard',
    '/portal/profile': 'Thông tin cá nhân',
    '/client/consultant': 'Tổng quan tư vấn',
    '/client/consultant/customers': 'Khách hàng',
    '/client/consultant/courses': 'Khóa học',
    '/client/consultant/enrollments': 'Đăng ký học',
    '/client/consultant/follow-up': 'Theo dõi khách hàng',
    '/client/consultant/chat': 'Tin nhắn',
    '/client/accountant': 'Tổng quan kế toán',
    '/client/accountant/tuition': 'Học phí',
    '/client/accountant/invoices': 'Hóa đơn',
    '/client/accountant/payments': 'Thanh toán',
    '/client/accountant/revenue': 'Doanh thu',
};

const ClientHeader = ({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) => {
    const location = useLocation();
    return <header className={styles['client-header']}><Button type="text" className={styles['client-menu-toggle']} icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={onToggle} aria-label={collapsed ? 'Mở menu' : 'Thu gọn menu'} /><div className={styles['client-header-title']}><span>FPT Learn</span><strong>{titles[location.pathname] || 'Không gian học tập'}</strong></div><div className={styles['client-header-actions']}><Button type="text" icon={<Badge dot><BellOutlined /></Badge>} aria-label="Thông báo" title="Thông báo" /><ClientUserMenu /></div></header>;
};
export default ClientHeader;
