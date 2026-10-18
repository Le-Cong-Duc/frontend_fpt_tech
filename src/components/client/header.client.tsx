import { useEffect, useState } from 'react';
import {
    DashOutlined,
    EnvironmentOutlined,
    GiftOutlined,
    HomeOutlined,
    LogoutOutlined,
    MailOutlined,
    MenuFoldOutlined,
    PhoneOutlined,
    ReadOutlined,
    RocketOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { Avatar, ConfigProvider, Drawer, Dropdown, Menu, type MenuProps, Space, message } from 'antd';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { callLogout } from '@/config/api';
import { setLogoutAction } from '@/redux/slice/accountSlide';
import { getClientMenu, getDefaultRouteForRole, getPortalRole, isBackofficeRole } from '@/config/portal';
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

    useEffect(() => {
        setCurrent(location.pathname);
    }, [location]);

    useEffect(() => {
        const handleResize = () => setIsCompact(window.innerWidth < 992);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const scrollToSection = (sectionId: string) => {
        if (location.pathname !== '/') {
            navigate(`/#${sectionId}`);
            setTimeout(() => {
                const el = document.getElementById(sectionId);
                if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 300);
        } else {
            const el = document.getElementById(sectionId);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const menuItems: MenuProps['items'] = [
        {
            label: <span onClick={() => { navigate('/'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Trang Chủ</span>,
            key: '/',
            icon: <HomeOutlined />,
        },
        {
            label: <span onClick={() => scrollToSection('courses')}>Khóa Học</span>,
            key: 'courses',
            icon: <ReadOutlined />,
        },
        {
            label: <span onClick={() => scrollToSection('roadmap')}>Lộ Trình</span>,
            key: 'roadmap',
        },
        {
            label: <span onClick={() => scrollToSection('advantages')}>Lợi Thế</span>,
            key: 'advantages',
        },
        {
            label: <span onClick={() => scrollToSection('faculty')}>Giảng Viên</span>,
            key: 'faculty',
        },
        {
            label: <span onClick={() => scrollToSection('reviews')}>Bảng Vàng</span>,
            key: 'reviews',
        },
        {
            label: <span onClick={() => scrollToSection('faq')}>Hỏi Đáp</span>,
            key: 'faq',
        },
        ...(isAuthenticated && !isBackoffice
            ? getClientMenu(user.role?.name).map(item => ({
                key: item.key,
                label: <Link to={item.key}>{item.label}</Link>,
                icon: item.icon,
            }))
            : []),
    ];

    const handleLogout = async () => {
        try {
            await callLogout();
        } catch {
            // ignore
        }
        dispatch(setLogoutAction({}));
        message.success('Đăng xuất thành công');
        window.location.href = '/login';
    };

    const defaultRoute = getDefaultRouteForRole(user.role?.name);
    const roleDefaultRoute = getPortalRole(user.role?.name) === 'STUDENT' ? '/client/student' : defaultRoute;
    const dropdownItems: MenuProps['items'] = [
        ...(isBackoffice
            ? [{ label: <Link to="/admin">Trang Quản trị Hệ Thống</Link>, key: 'admin', icon: <DashOutlined /> }]
            : [{ label: <Link to={roleDefaultRoute}>Không gian học tập</Link>, key: 'portal', icon: <DashOutlined /> }]),
        { label: <span onClick={handleLogout}>Đăng xuất</span>, key: 'logout', icon: <LogoutOutlined /> },
    ];

    return (
        <>
            {/* Topbar Announcement & Hotline */}
            <div className={styles['topbar-section']}>
                <div className={styles.container}>
                    <div className={styles['topbar-inner']}>
                        <div className={styles['topbar-left']}>
                            <a href="tel:19006600">
                                <PhoneOutlined /> Hotline 24/7: <strong>1900 6600</strong>
                            </a>
                            <a href="mailto:tuyensinh@fpt.edu.vn">
                                <MailOutlined /> tuyensinh@fpt.edu.vn
                            </a>
                            <span>
                                <EnvironmentOutlined /> Cơ sở: Hà Nội • Đà Nẵng • TP.HCM • Cần Thơ
                            </span>
                        </div>
                        <div className={styles['topbar-right']}>
                            <span className={styles['promo-tag']}>
                                <GiftOutlined /> Ưu đãi tháng này: Tặng học bổng tới 30% & Thi thử chuẩn quốc tế
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Header */}
            <header className={styles['header-section']}>
                <div className={styles.container}>
                    {!isCompact ? (
                        <div className={styles['header-inner']}>
                            <div className={styles.brand} onClick={() => { navigate('/'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                                <div className={styles['brand-badge']}>
                                    <RocketOutlined />
                                </div>
                                <div className={styles['brand-text']}>
                                    <span className={styles['brand-name']}>FPT LANGUAGE CENTER</span>
                                    <span className={styles['brand-sub']}>Hệ Thống Đào Tạo Ngoại Ngữ Chuẩn Quốc Tế</span>
                                </div>
                            </div>

                            <div className={styles['top-menu']}>
                                <div className={styles['menu-scroll']}>
                                    <ConfigProvider
                                        theme={{
                                            token: {
                                                colorPrimary: '#f97316',
                                                colorBgContainer: 'transparent',
                                                colorText: '#cbd5e1',
                                                colorTextDescription: '#ffffff',
                                                colorSplit: 'transparent',
                                                controlItemBgActive: 'rgba(249, 115, 22, 0.1)',
                                            },
                                        }}
                                    >
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
                                    <button
                                        type="button"
                                        className={styles['cta-consult-btn']}
                                        onClick={() => scrollToSection('lead-form')}
                                    >
                                        <GiftOutlined /> Nhận Tư Vấn & Học Bổng
                                    </button>

                                    {!isAuthenticated ? (
                                        <Link to="/login" className={styles['login-btn']}>
                                            <UserOutlined /> Đăng nhập
                                        </Link>
                                    ) : (
                                        <Dropdown menu={{ items: dropdownItems }} trigger={['click']}>
                                            <div className={styles['user-profile']}>
                                                <Avatar style={{ backgroundColor: '#f97316' }}>
                                                    {user.name?.substring(0, 2)?.toUpperCase()}
                                                </Avatar>
                                                <span>{user.name}</span>
                                            </div>
                                        </Dropdown>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className={styles['header-mobile']}>
                            <div
                                style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                                onClick={() => { navigate('/'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            >
                                <RocketOutlined style={{ fontSize: 24, color: '#f97316' }} />
                                <span style={{ fontWeight: 800, fontSize: 16 }}>FPT LANGUAGE CENTER</span>
                            </div>
                            <MenuFoldOutlined
                                style={{ fontSize: 22, cursor: 'pointer' }}
                                onClick={() => setOpenMobileMenu(true)}
                            />
                        </div>
                    )}
                </div>
            </header>

            <Drawer
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <RocketOutlined style={{ color: '#f97316' }} />
                        <span style={{ fontWeight: 700 }}>Menu Hệ Thống FPT</span>
                    </div>
                }
                placement="right"
                onClose={() => setOpenMobileMenu(false)}
                open={openMobileMenu}
            >
                <div style={{ marginBottom: 16 }}>
                    <button
                        type="button"
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#ffffff',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                        }}
                        onClick={() => {
                            setOpenMobileMenu(false);
                            scrollToSection('lead-form');
                        }}
                    >
                        <GiftOutlined /> Đăng ký nhận học bổng 30%
                    </button>
                </div>
                <Menu
                    onClick={({ key }) => {
                        setCurrent(key);
                        setOpenMobileMenu(false);
                        if (['courses', 'roadmap', 'advantages', 'faculty', 'reviews', 'faq'].includes(key)) {
                            scrollToSection(key);
                        } else if (key !== 'logout' && key !== 'admin') {
                            navigate(key.toString());
                        }
                    }}
                    selectedKeys={[current]}
                    mode="vertical"
                    items={[
                        ...menuItems,
                        ...(isAuthenticated
                            ? dropdownItems
                            : [
                                {
                                    key: '/login',
                                    label: <Link to="/login">Đăng nhập tài khoản</Link>,
                                    icon: <UserOutlined />,
                                },
                            ]),
                    ]}
                />
            </Drawer>
        </>
    );
};

export default Header;
