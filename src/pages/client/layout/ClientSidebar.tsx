import { CloseOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import ClientMenu from './ClientMenu';
import styles from '@/styles/client.module.scss';

const ClientSidebar = ({ collapsed, mobileOpen, onClose }: { collapsed: boolean; mobileOpen: boolean; onClose: () => void }) => <><aside className={`${styles['client-sidebar']} ${collapsed ? styles['client-sidebar-collapsed'] : ''} ${mobileOpen ? styles['client-sidebar-mobile-open'] : ''}`}><div className={styles['client-sidebar-brand']}><span>FL</span><div><strong>FPT Learn</strong><small>Learning hub</small></div><Button type="text" className={styles['client-mobile-close']} icon={<CloseOutlined />} onClick={onClose} aria-label="Đóng menu" /></div><ClientMenu collapsed={collapsed} onNavigate={onClose} /></aside>{mobileOpen && <button className={styles['client-sidebar-overlay']} onClick={onClose} aria-label="Đóng menu" type="button" />}</>;
export default ClientSidebar;
