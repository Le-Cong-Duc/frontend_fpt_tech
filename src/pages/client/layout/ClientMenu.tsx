import { NavLink } from 'react-router-dom';
import { getClientMenu } from '@/config/portal';
import { useAppSelector } from '@/redux/hooks';
import styles from '@/styles/client.module.scss';

const ClientMenu = ({ onNavigate, collapsed }: { onNavigate: () => void; collapsed: boolean }) => {
    const roleName = useAppSelector(state => state.account.user.role?.name);
    const items = getClientMenu(roleName);
    return <nav className={styles['client-sidebar-nav']} aria-label="Điều hướng khu vực client">{
        items.map(item => <NavLink key={item.key} to={item.key} end={item.label === 'Dashboard'}
            onClick={onNavigate} title={collapsed ? item.label : undefined}
            className={({ isActive }) => `${styles['client-nav-item']} ${isActive ? styles['client-nav-active'] : ''}`}>
            <span className={styles['client-nav-icon']}>{item.icon}</span>
            <span className={styles['client-nav-label']}>{item.label}</span>
        </NavLink>)}
    </nav>;
};
export default ClientMenu;
