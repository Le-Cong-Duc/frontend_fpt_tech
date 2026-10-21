import { useState } from 'react';
import { Avatar, Button, Card, Descriptions, Divider, Form, Input, Space, Tag, message } from 'antd';
import { EditOutlined, LockOutlined, SafetyCertificateOutlined, UserOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { callUpdateMyProfile } from '@/config/api';
import { getPortalRole } from '@/config/portal';
import { setProfileAction } from '@/redux/slice/accountSlide';
import styles from '@/styles/client.module.scss';

interface ProfileFormValues {
    name: string;
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
}

const roleLabels = {
    STUDENT: 'Học viên',
    TEACHER: 'Giảng viên',
    CONSULTANT: 'Tư vấn viên',
    MANAGER: 'Quản lý',
    ACCOUNTANT: 'Kế toán',
} as const;

const Profile = () => {
    const dispatch = useAppDispatch();
    const user = useAppSelector(state => state.account.user);
    const role = getPortalRole(user.role?.name);
    const [form] = Form.useForm<ProfileFormValues>();
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    const saveProfile = async ({ name, currentPassword, newPassword }: ProfileFormValues) => {
        setSaving(true);
        try {
            const response = await callUpdateMyProfile({
                name: name.trim(),
                ...(newPassword ? { currentPassword, newPassword } : {}),
            });
            const updatedUser = response.data;
            if (!updatedUser) {
                message.error(response.message || 'Không thể cập nhật thông tin');
                return;
            }

            const updatedName = updatedUser.name || name.trim();
            dispatch(setProfileAction({ name: updatedName }));
            form.setFieldsValue({ name: updatedName, currentPassword: undefined, newPassword: undefined, confirmPassword: undefined });
            setEditing(false);
            message.success('Cập nhật thông tin thành công');
        } catch {
            message.error('Không thể cập nhật thông tin. Vui lòng thử lại.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <main className={`${styles.container} ${styles['manager-page']} ${styles['profile-page']}`}>
            <section className={styles['manager-welcome']}>
                <div>
                    <span>CLIENT / PROFILE</span>
                    <h1>Thông tin cá nhân</h1>
                    <p>Quản lý thông tin tài khoản và bảo mật đăng nhập của bạn.</p>
                </div>
            </section>

            <Card className={`${styles['portal-card']} ${styles['profile-overview']}`}>
                <div className={styles['profile-identity']}>
                    <Avatar size={72} icon={<UserOutlined />} style={{ backgroundColor: '#e8f1ff', color: '#2563eb' }}>
                        {user.name?.slice(0, 1)?.toUpperCase()}
                    </Avatar>
                    <div>
                        <h2>{user.name || 'Chưa cập nhật họ tên'}</h2>
                        <Space size={8} wrap>
                            <Tag color="blue">{roleLabels[role]}</Tag>
                            <span>{user.email || 'Chưa cập nhật email'}</span>
                        </Space>
                    </div>
                    {!editing && (
                        <Button type="primary" icon={<EditOutlined />} onClick={() => {
                            form.setFieldsValue({ name: user.name });
                            setEditing(true);
                        }}>
                            Chỉnh sửa
                        </Button>
                    )}
                </div>
                <Divider />
                <Descriptions title="Thông tin tài khoản" bordered size="middle" column={{ xs: 1, sm: 2 }}>
                    <Descriptions.Item label="Họ và tên">{user.name || 'Chưa cập nhật'}</Descriptions.Item>
                    <Descriptions.Item label="Vai trò">{roleLabels[role]}</Descriptions.Item>
                    <Descriptions.Item label="Email">{user.email || 'Chưa cập nhật'}</Descriptions.Item>
                    <Descriptions.Item label="Mã tài khoản">{user._id || 'Chưa cập nhật'}</Descriptions.Item>
                </Descriptions>
            </Card>

            {editing && (
                <Card
                    className={`${styles['portal-card']} ${styles['profile-edit-card']}`}
                    title={<Space><LockOutlined />Cập nhật thông tin & bảo mật</Space>}
                    extra={<Tag color="green"><SafetyCertificateOutlined />Thông tin được bảo vệ</Tag>}
                >
                    <p className={styles['profile-edit-hint']}>Để trống phần mật khẩu nếu bạn không muốn đổi mật khẩu.</p>
                    <Form form={form} layout="vertical" onFinish={saveProfile}>
                        <Form.Item name="name" label="Họ và tên" rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập họ và tên' }]}>
                            <Input maxLength={100} prefix={<UserOutlined />} placeholder="Nhập họ và tên" />
                        </Form.Item>
                        <Divider orientation="left">Đổi mật khẩu</Divider>
                        <Form.Item name="currentPassword" label="Mật khẩu hiện tại" dependencies={['newPassword']} rules={[({ getFieldValue }) => ({
                            validator: (_, value) => getFieldValue('newPassword') && !value
                                ? Promise.reject(new Error('Vui lòng nhập mật khẩu hiện tại'))
                                : Promise.resolve(),
                        })]}>
                            <Input.Password autoComplete="current-password" placeholder="Nhập mật khẩu hiện tại" />
                        </Form.Item>
                        <div className={styles['profile-form-grid']}>
                            <Form.Item name="newPassword" label="Mật khẩu mới" rules={[{ min: 8, message: 'Mật khẩu mới phải có ít nhất 8 ký tự' }]}>
                                <Input.Password autoComplete="new-password" placeholder="Tối thiểu 8 ký tự" />
                            </Form.Item>
                            <Form.Item name="confirmPassword" label="Xác nhận mật khẩu mới" dependencies={['newPassword']} rules={[({ getFieldValue }) => ({
                                validator: (_, value) => !getFieldValue('newPassword') || value === getFieldValue('newPassword')
                                    ? Promise.resolve()
                                    : Promise.reject(new Error('Mật khẩu xác nhận chưa khớp')),
                            })]}>
                                <Input.Password autoComplete="new-password" placeholder="Nhập lại mật khẩu mới" />
                            </Form.Item>
                        </div>
                        <Space>
                            <Button type="primary" htmlType="submit" loading={saving}>Lưu thay đổi</Button>
                            <Button onClick={() => { form.resetFields(); setEditing(false); }}>Hủy</Button>
                        </Space>
                    </Form>
                </Card>
            )}

        </main>
    );
};

export default Profile;
