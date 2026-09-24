import { useEffect, useState, type ReactNode } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import ClientHeader from './ClientHeader';
import ClientSidebar from './ClientSidebar';
import styles from '@/styles/client.module.scss';

const ClientLayout = ({ children }: { children?: ReactNode }) => {
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    useEffect(() => { setMobileOpen(false); }, [location.pathname]);
    return <div className={`${styles['client-layout']} ${collapsed ? styles['client-layout-collapsed'] : ''}`}><ClientSidebar collapsed={collapsed} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} /><div className={styles['client-layout-body']}><ClientHeader collapsed={collapsed} onToggle={() => { if (window.innerWidth < 900) setMobileOpen(true); else setCollapsed(value => !value); }} /><main className={styles['client-main']}>{children || <Outlet />}</main></div></div>;
};
export default ClientLayout;
