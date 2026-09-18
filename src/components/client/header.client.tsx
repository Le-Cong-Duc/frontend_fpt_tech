import { useEffect, useState } from 'react';
import { DashOutlined, LogoutOutlined, MenuFoldOutlined, TwitterOutlined } from '@ant-design/icons';
import { Avatar, ConfigProvider, Drawer, Dropdown, Menu, type MenuProps, Space, message } from 'antd';
import { FaReact } from 'react-icons/fa';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { callLogout } from '@/config/api';
import { setLogoutAction } from '@/redux/slice/accountSlide';
import { getPortalMenu, isBackofficeRole } from '@/config/portal';
import styles from '@/styles/client.module.scss';

const Header = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const location = useLocation();
    const isAuthenticated = useAppSelector(state => state.account.isAuthenticated);
    const user = useAppSelector(state => state.account.user);
    const [openMobileMenu, setOpenMobileMenu] = useState(false);
    const [current, setCurrent] = useState('/');
    const [isCompact, setIsCompact] = useState(false);
    const isBackoffice = isBackofficeRole(user.role?.name);

    useEffect(() => setCurrent(location.pathname), [location]);

    useEffect(() => {
        const handleResize = () => setIsCompact(window.innerWidth < 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const menuItems: MenuProps['items'] = [
        { label: <Link to="/">Trang Chủ</Link>, key: '/', icon: <TwitterOutlined /> },
        ...(isAuthenticated && !isBackoffice
            ? getPortalMenu(user.role?.name).map(item => ({
                key: item.key,
                label: <Link to={item.key}>{item.label}</Link>,
                icon: item.icon,
            }))
            : []),
    ];

    const handleLogout = async () => {
        const res = await callLogout();
        if (res?.data) {
            dispatch(setLogoutAction({}));
            message.success('Đăng xuất thành công');
            navigate('/');
        }
    };

    const dropdownItems: MenuProps['items'] = [
        ...(isBackoffice ? [{ label: <Link to="/admin">Trang Quản trị</Link>, key: 'admin', icon: <DashOutlined /> }] : []),
        { label: <span onClick={handleLogout}>Đăng xuất</span>, key: 'logout', icon: <LogoutOutlined /> },
    ];

    return <>
        <div className={styles['header-section']}>
            <div className={styles.container}>
                {!isCompact ? (
                    <div className={styles['header-inner']}>
                        <div className={styles.brand}>
                            <FaReact onClick={() => navigate('/')} title="Education Management" />
                        </div>

                        <div className={styles['top-menu']}>
                            <div className={styles['menu-scroll']}>
                                <ConfigProvider theme={{
                                    token: {
                                        colorPrimary: '#fff',
                                        colorBgContainer: '#1d2736',
                                        colorText: '#b5c0cf',
                                        colorTextDescription: '#fff',
                                        colorSplit: 'transparent',
                                        controlItemBgActive: 'rgba(255,255,255,0.08)',
                                    }
                                }}>
                                    <Menu
                                        inlineIndent={0}
                                        selectedKeys={[current]}
                                        mode="horizontal"
                                        items={menuItems}
                                        overflowedIndicator={null}
                                    />
                                </ConfigProvider>
                            </div>

                            <div className={styles.extra}>
                                {!isAuthenticated ? (
                                    <Link to="/login">Đăng nhập</Link>
                                ) : (
                                    <Dropdown menu={{ items: dropdownItems }} trigger={['click']}>
                                        <Space style={{ cursor: 'pointer' }}>
                                            <span>Chào {user.name}</span>
                                            <Avatar>{user.name?.substring(0, 2)?.toUpperCase()}</Avatar>
                                        </Space>
                                    </Dropdown>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className={styles['header-mobile']}>
                        <span>Education Management</span>
                        <MenuFoldOutlined onClick={() => setOpenMobileMenu(true)} />
                    </div>
                )}
            </div>
        </div>

        <Drawer title="Chức năng" placement="right" onClose={() => setOpenMobileMenu(false)} open={openMobileMenu}>
            <Menu
                onClick={({ key }) => {
                    setCurrent(key);
                    setOpenMobileMenu(false);
                    if (key !== 'logout' && key !== 'admin') {
                        navigate(key.toString());
                    }
                }}
                selectedKeys={[current]}
                mode="vertical"
                items={[...menuItems, ...(isAuthenticated ? dropdownItems : [])]}
            />
        </Drawer>
    </>;
};

export default Header;
