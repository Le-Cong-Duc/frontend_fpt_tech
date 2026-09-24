import { HomeOutlined } from '@ant-design/icons';
import { NavLink } from 'react-router-dom';
import { getPortalMenu, getPortalRole } from '@/config/portal';
import { useAppSelector } from '@/redux/hooks';
import styles from '@/styles/client.module.scss';

const ClientMenu = ({ onNavigate, collapsed }: { onNavigate: () => void; collapsed: boolean }) => {
    const roleName = useAppSelector(state => state.account.user.role?.name);
    const role = getPortalRole(roleName);
    const legacyProfile = role === 'CONSULTANT' || role === 'ACCOUNTANT';
    const managerLegacy = ['/portal/classes', '/portal/students', '/portal/teachers', '/portal/courses', '/portal/schedule'];
    const studentLegacy = ['/portal/my-courses', '/portal/schedule', '/portal/invoices', '/portal/payments', '/portal/profile'];
    const dashboard = role === 'MANAGER' ? { key: '/client/manager', label: 'Dashboard', icon: <HomeOutlined /> } : role === 'STUDENT' ? { key: '/client/student', label: 'Dashboard', icon: <HomeOutlined /> } : { key: '/client', label: 'Dashboard', icon: <HomeOutlined /> };
    const items = [dashboard, ...getPortalMenu(roleName).filter(item => item.key !== '/client' && item.key !== '/client/manager' && item.key !== '/client/student' && !(legacyProfile && item.key === '/portal/profile') && !(role === 'MANAGER' && managerLegacy.includes(item.key)) && !(role === 'STUDENT' && studentLegacy.includes(item.key)))];
    return <nav className={styles['client-sidebar-nav']} aria-label="Điều hướng khu vực client">{items.map(item => <NavLink key={item.key} to={item.key} end={item.key === '/client'} onClick={onNavigate} title={collapsed ? item.label : undefined} className={({ isActive }) => `${styles['client-nav-item']} ${isActive ? styles['client-nav-active'] : ''}`}><span className={styles['client-nav-icon']}>{item.icon}</span><span className={styles['client-nav-label']}>{item.label}</span></NavLink>)}</nav>;
};
export default ClientMenu;
