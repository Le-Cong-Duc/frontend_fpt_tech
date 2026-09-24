import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Dropdown, Tag, type MenuProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { callLogout } from '@/config/api';
import { setLogoutAction } from '@/redux/slice/accountSlide';
import { getPortalRole } from '@/config/portal';

const roleLabels = { STUDENT: 'Học viên', TEACHER: 'Giảng viên', CONSULTANT: 'Tư vấn viên', ACCOUNTANT: 'Kế toán', MANAGER: 'Quản lý' } as const;

const ClientUserMenu = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const user = useAppSelector(state => state.account.user);
    const role = getPortalRole(user.role?.name);
    const profilePath = role === 'ACCOUNTANT' ? '/client/accountant/profile' : role === 'CONSULTANT' ? '/client/consultant/profile' : '/portal/profile';
    const items: MenuProps['items'] = [
        { key: 'identity', disabled: true, label: <div><strong>{user.name || 'Tài khoản'}</strong><br /><Tag color="blue">{roleLabels[role]}</Tag></div> },
        { type: 'divider' },
        { key: 'profile', icon: <UserOutlined />, label: 'Thông tin cá nhân' },
        { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất' },
    ];
    const handleClick: MenuProps['onClick'] = async ({ key }) => {
        if (key === 'profile') navigate(profilePath);
        if (key === 'logout') {
            await callLogout();
            dispatch(setLogoutAction({}));
            navigate('/login', { replace: true });
        }
    };
    return <Dropdown menu={{ items, onClick: handleClick }} trigger={['click']} placement="bottomRight"><button className="client-user-trigger" type="button" aria-label="Tài khoản người dùng"><span className="client-user-copy"><b>{user.name || 'Tài khoản'}</b><small>{roleLabels[role]}</small></span><Avatar>{user.name?.slice(0, 1).toUpperCase() || '?'}</Avatar></button></Dropdown>;
};
export default ClientUserMenu;
