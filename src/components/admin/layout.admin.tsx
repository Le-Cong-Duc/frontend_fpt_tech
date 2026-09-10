import React, { useState, useEffect } from 'react';
import {
    AppstoreOutlined,
    ExceptionOutlined,
    ApiOutlined,
    UserOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    BugOutlined,
    BookOutlined,
    TeamOutlined,
    DollarOutlined,
    SolutionOutlined,
    MessageOutlined,
} from '@ant-design/icons';
import { Layout, Menu, Dropdown, Space, message, Avatar, Button } from 'antd';
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { isMobile } from 'react-device-detect';
import type { MenuProps } from 'antd';
import { setLogoutAction } from '@/redux/slice/accountSlide';
import { ALL_PERMISSIONS } from '@/config/permissions';

const { Content, Footer, Sider } = Layout;

const LayoutAdmin = () => {
    const location = useLocation();
    const isManager = location.pathname.startsWith('/manager');

    const [collapsed, setCollapsed] = useState(false);
    const [activeMenu, setActiveMenu] = useState('');
    const user = useAppSelector(state => state.account.user);

    const permissions = useAppSelector(state => state.account.user.permissions);
    const [menuItems, setMenuItems] = useState<MenuProps['items']>([]);

    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    useEffect(() => {
        {
            const canView = (resource: keyof typeof ALL_PERMISSIONS) => permissions.some(item =>
                (item.path ?? item.apiPath) === ALL_PERMISSIONS[resource].GET_PAGINATE.path
                && item.method === 'GET'
            );

            const full = [
                {
                    label: <Link to={isManager ? '/manager' : '/admin'}>Dashboard</Link>,
                    key: isManager ? '/manager' : '/admin',
                    icon: <AppstoreOutlined />
                },
                ...(canView('USERS') ? [{
                    label: <Link to='/admin/users'>Users</Link>,
                    key: '/admin/users',
                    icon: <UserOutlined />
                }] : []),
                ...(canView('ROLES') ? [{
                    label: <Link to='/admin/roles'>Roles</Link>,
                    key: '/admin/roles',
                    icon: <ExceptionOutlined />
                }] : []),
                ...(canView('PERMISSIONS') ? [{
                    label: <Link to='/admin/permissions'>Permissions</Link>,
                    key: '/admin/permissions',
                    icon: <ApiOutlined />
                }] : []),
                ...(['COURSES', 'CLASSROOMS', 'ENROLLMENTS', 'INVOICES', 'PAYMENTS', 'LEADS', 'CONVERSATIONS', 'MESSAGES', 'NOTIFICATIONS'] as const)
                    .filter(resource => canView(resource))
                    .map(resource => ({
                        label: <Link to={`/admin/${resource.toLowerCase()}`}>{resource.charAt(0) + resource.slice(1).toLowerCase()}</Link>,
                        key: `/admin/${resource.toLowerCase()}`,
                        icon: resource === 'COURSES' ? <BookOutlined />
                            : resource === 'LEADS' ? <SolutionOutlined />
                                : resource === 'PAYMENTS' || resource === 'INVOICES' ? <DollarOutlined />
                                    : resource === 'CONVERSATIONS' || resource === 'MESSAGES' || resource === 'NOTIFICATIONS' ? <MessageOutlined />
                                        : <TeamOutlined />,
                    })),

            ];

            setMenuItems(isManager ? full.slice(0, 1) : full);
        }
    }, [permissions, isManager])
    useEffect(() => {
        setActiveMenu(location.pathname)
    }, [location])

    const handleLogout = () => {
        dispatch(setLogoutAction({}));
        message.success('Đăng xuất thành công');
        navigate('/login');
    }

    const itemsDropdown = [
        {
            label: <Link to={'/'}>Trang chủ</Link>,
            key: 'home',
        },
        {
            label: <label
                style={{ cursor: 'pointer' }}
                onClick={() => handleLogout()}
            >Đăng xuất</label>,
            key: 'logout',
        },
    ];

    return (
        <>
            <Layout
                style={{ minHeight: '100vh' }}
                className="layout-admin"
            >
                {!isMobile ?
                    <Sider
                        theme='light'
                        collapsible
                        collapsed={collapsed}
                        onCollapse={(value) => setCollapsed(value)}>
                        <div style={{ height: 32, margin: 16, textAlign: 'center' }}>
                            <BugOutlined />  {isManager ? 'MANAGER' : 'ADMIN'}
                        </div>
                        <Menu
                            selectedKeys={[activeMenu]}
                            mode="inline"
                            items={menuItems}
                            onClick={(e) => setActiveMenu(e.key)}
                        />
                    </Sider>
                    :
                    <Menu
                        selectedKeys={[activeMenu]}
                        items={menuItems}
                        onClick={(e) => setActiveMenu(e.key)}
                        mode="horizontal"
                    />
                }

                <Layout>
                    {!isMobile &&
                        <div className='admin-header' style={{ display: "flex", justifyContent: "space-between", marginRight: 20 }}>
                            <Button
                                type="text"
                                icon={collapsed ? React.createElement(MenuUnfoldOutlined) : React.createElement(MenuFoldOutlined)}
                                onClick={() => setCollapsed(!collapsed)}
                                style={{
                                    fontSize: '16px',
                                    width: 64,
                                    height: 64,
                                }}
                            />

                            <Dropdown menu={{ items: itemsDropdown }} trigger={['click']}>
                                <Space style={{ cursor: "pointer" }}>
                                    Welcome {user?.name}
                                    <Avatar> {user?.name?.substring(0, 2)?.toUpperCase()} </Avatar>

                                </Space>
                            </Dropdown>
                        </div>
                    }
                    <Content style={{ padding: '15px' }}>
                        <Outlet />
                    </Content>
                </Layout>
            </Layout>

        </>
    );
};

export default LayoutAdmin;