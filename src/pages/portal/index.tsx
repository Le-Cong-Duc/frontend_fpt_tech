import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Descriptions, Empty, Form, Input, Row, Spin, Statistic, Table, Tag, message } from 'antd';
import { BookOutlined, CalendarOutlined, CreditCardOutlined, FileTextOutlined, TeamOutlined } from '@ant-design/icons';
import {
    callFetchMyAssignedLeads,
    callFetchMyEnrollments,
    callFetchMyInvoices,
    callFetchMyPayments,
    callFetchMyStudents,
    callFetchMyTeachingClassrooms,
    callUpdateMyProfile,
} from '@/config/api';
import { getPortalRole, type PortalRole } from '@/config/portal';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setProfileAction } from '@/redux/slice/accountSlide';
import type { IClassroomWithDetails, ILead, IPortalEnrollment, IPortalInvoice, IPortalPayment } from '@/types/backend';
import styles from '@/styles/client.module.scss';

type PortalScreen = 'home' | 'my-courses' | 'classes' | 'schedule' | 'invoices' | 'payments' | 'students' | 'leads' | 'profile';

interface PortalPageProps { screen: PortalScreen; }

const roleLabel: Record<PortalRole, string> = { STUDENT: 'Học viên', TEACHER: 'Giảng viên', CONSULTANT: 'Tư vấn viên' };

const screenTitle: Record<PortalScreen, { title: string; description: string }> = {
    home: { title: 'Không gian học tập', description: 'Theo dõi các hoạt động và công việc của bạn.' },
    'my-courses': { title: 'Khóa học của tôi', description: 'Các khóa học được lấy từ hồ sơ đăng ký của bạn.' },
    classes: { title: 'Lớp học', description: 'Thông tin lớp, phòng và thời gian học hoặc giảng dạy.' },
    schedule: { title: 'Lịch học', description: 'Lịch được tổng hợp từ các lớp của bạn.' },
    invoices: { title: 'Hóa đơn', description: 'Các hóa đơn thuộc những lớp bạn đã đăng ký.' },
    payments: { title: 'Thanh toán', description: 'Các giao dịch thuộc hóa đơn của bạn.' },
    students: { title: 'Học viên', description: 'Học viên trong những lớp bạn phụ trách.' },
    leads: { title: 'Khách hàng tư vấn', description: 'Khách hàng được phân công cho bạn.' },
    profile: { title: 'Thông tin cá nhân', description: 'Thông tin tài khoản đang đăng nhập.' },
};

const toArray = <T,>(response: unknown): T[] => {
    const data = (response as { data?: unknown })?.data;
    return Array.isArray(data) ? data as T[] : [];
};

const dateText = (value?: string) => value ? new Date(value).toLocaleDateString('vi-VN') : 'Chưa cập nhật';
const moneyText = (value?: number) => typeof value === 'number' ? `${value.toLocaleString('vi-VN')} đ` : 'Chưa cập nhật';
const classOf = (enrollment: IPortalEnrollment) => enrollment.class_id;
const courseNameOf = (enrollment?: IPortalEnrollment) => enrollment?.class_id?.course_id?.name || 'Chưa gán khóa học';

const PortalPage = ({ screen }: PortalPageProps) => {
    const dispatch = useAppDispatch();
    const user = useAppSelector(state => state.account.user);
    const role = getPortalRole(user.role?.name);
    const info = screenTitle[screen];
    const [loading, setLoading] = useState(screen !== 'profile');
    const [error, setError] = useState('');
    const [enrollments, setEnrollments] = useState<IPortalEnrollment[]>([]);
    const [classes, setClasses] = useState<IClassroomWithDetails[]>([]);
    const [invoices, setInvoices] = useState<IPortalInvoice[]>([]);
    const [payments, setPayments] = useState<IPortalPayment[]>([]);
    const [leads, setLeads] = useState<ILead[]>([]);
    const [savingProfile, setSavingProfile] = useState(false);
    const [editingProfile, setEditingProfile] = useState(false);
    const [profileForm] = Form.useForm<{ name: string; currentPassword?: string; newPassword?: string; confirmPassword?: string }>();

    useEffect(() => {
        profileForm.setFieldsValue({ name: user.name });
    }, [profileForm, user.name]);

    useEffect(() => {
        let active = true;
        const load = async () => {
            setLoading(screen !== 'profile');
            setError('');
            try {
                if (screen === 'profile') return;

                if (role === 'STUDENT') {
                    if (screen === 'my-courses' || screen === 'classes' || screen === 'schedule') {
                        const response = await callFetchMyEnrollments();
                        if (active) setEnrollments(toArray<IPortalEnrollment>(response));
                    }
                    if (screen === 'invoices') {
                        const response = await callFetchMyInvoices();
                        if (active) setInvoices(toArray<IPortalInvoice>(response));
                    }
                    if (screen === 'payments') {
                        const response = await callFetchMyPayments();
                        if (active) setPayments(toArray<IPortalPayment>(response));
                    }
                    if (screen === 'home') {
                        const [enrollmentResponse, invoiceResponse, paymentResponse] = await Promise.all([
                            callFetchMyEnrollments(), callFetchMyInvoices(), callFetchMyPayments(),
                        ]);
                        if (active) {
                            setEnrollments(toArray<IPortalEnrollment>(enrollmentResponse));
                            setInvoices(toArray<IPortalInvoice>(invoiceResponse));
                            setPayments(toArray<IPortalPayment>(paymentResponse));
                        }
                    }
                }

                if (role === 'TEACHER') {
                    if (screen === 'classes' || screen === 'schedule' || screen === 'home') {
                        const response = await callFetchMyTeachingClassrooms();
                        if (active) setClasses(toArray<IClassroomWithDetails>(response));
                    }
                    if (screen === 'students') {
                        const response = await callFetchMyStudents();
                        if (active) setEnrollments(toArray<IPortalEnrollment>(response));
                    }
                }

                if (role === 'CONSULTANT' && (screen === 'leads' || screen === 'home')) {
                    const response = await callFetchMyAssignedLeads();
                    if (active) setLeads(toArray<ILead>(response));
                }
            } catch {
                if (active) setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
            } finally {
                if (active) setLoading(false);
            }
        };
        load();
        return () => { active = false; };
    }, [role, screen]);

    const classRows = useMemo(() => role === 'STUDENT'
        ? enrollments.map(enrollment => ({
            key: enrollment._id || enrollment.class_id?._id,
            name: enrollment.class_id?.class_name || 'Chưa có tên lớp',
            course: courseNameOf(enrollment),
            room: enrollment.class_id?.room || 'Chưa cập nhật',
            time: `${enrollment.class_id?.start_time || 'Chưa cập nhật'} – ${enrollment.class_id?.end_time || 'Chưa cập nhật'}`,
            status: enrollment.status || 'Chưa cập nhật',
        }))
        : classes.map(item => ({
            key: item._id,
            name: item.class_name || 'Chưa có tên lớp',
            course: item.course_id?.name || 'Chưa gán khóa học',
            room: item.room || 'Chưa cập nhật',
            time: `${item.start_time || 'Chưa cập nhật'} – ${item.end_time || 'Chưa cập nhật'}`,
            status: item.status || 'Chưa cập nhật',
        })), [classes, enrollments, role]);

    const submitProfile = async (values: { name: string; currentPassword?: string; newPassword?: string }) => {
        setSavingProfile(true);
        const response = await callUpdateMyProfile({
            name: values.name.trim(),
            ...(values.newPassword ? { currentPassword: values.currentPassword, newPassword: values.newPassword } : {}),
        });
        setSavingProfile(false);

        if (response?.data) {
            const updatedUser = response.data as unknown as { name?: string };
            const name = updatedUser.name || values.name.trim();
            dispatch(setProfileAction({ name }));
            profileForm.setFieldsValue({ name, currentPassword: undefined, newPassword: undefined, confirmPassword: undefined });
            setEditingProfile(false);
            message.success('Cập nhật thông tin thành công');
        } else {
            message.error(Array.isArray(response?.message) ? response.message[0] : response?.message || 'Không thể cập nhật thông tin');
        }
    };

    const renderContent = () => {
        if (loading) return <div className={styles['portal-loading']}><Spin /></div>;
        if (error) return <Alert type="error" showIcon message={error} />;

        if (screen === 'profile') return <Card className={styles['portal-card']}>
            <Descriptions column={{ xs: 1, sm: 2 }} labelStyle={{ color: '#728095' }}>
                <Descriptions.Item label="Họ tên">{user.name || 'Chưa cập nhật'}</Descriptions.Item>
                <Descriptions.Item label="Vai trò">{roleLabel[role]}</Descriptions.Item>
                <Descriptions.Item label="Email">{user.email || 'Chưa cập nhật'}</Descriptions.Item>
                <Descriptions.Item label="Mã tài khoản">{user._id || 'Chưa cập nhật'}</Descriptions.Item>
            </Descriptions>
            {!editingProfile ? <Button type="primary" onClick={() => setEditingProfile(true)}>
                Chỉnh sửa thông tin
            </Button> : <div className={styles['profile-form']}>
                <h3>Chỉnh sửa thông tin</h3>
                <Form form={profileForm} layout="vertical" onFinish={submitProfile}>
                    <Form.Item name="name" label="Họ và tên" rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập họ và tên' }]}>
                        <Input maxLength={100} />
                    </Form.Item>
                    <Form.Item name="currentPassword" label="Mật khẩu hiện tại" dependencies={['newPassword']} rules={[({ getFieldValue }) => ({
                        validator: (_, value) => getFieldValue('newPassword') && !value ? Promise.reject(new Error('Vui lòng nhập mật khẩu hiện tại')) : Promise.resolve()
                    })]}>
                        <Input.Password autoComplete="current-password" />
                    </Form.Item>
                    <Form.Item name="newPassword" label="Mật khẩu mới" rules={[{ min: 8, message: 'Mật khẩu mới phải có ít nhất 8 ký tự' }]}>
                        <Input.Password autoComplete="new-password" />
                    </Form.Item>
                    <Form.Item name="confirmPassword" label="Nhập lại mật khẩu mới" dependencies={['newPassword']} rules={[({ getFieldValue }) => ({
                        validator: (_, value) => !getFieldValue('newPassword') || value === getFieldValue('newPassword') ? Promise.resolve() : Promise.reject(new Error('Mật khẩu xác nhận chưa khớp'))
                    })]}>
                        <Input.Password autoComplete="new-password" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" loading={savingProfile}>Lưu thay đổi</Button>
                    <Button type="default" onClick={() => {
                        profileForm.resetFields();
                        profileForm.setFieldsValue({ name: user.name });
                        setEditingProfile(false);
                    }}>Hủy</Button>
                </Form>
            </div>}
        </Card>;

        if (screen === 'my-courses') return enrollments.length ? <Row gutter={[18, 18]}>{enrollments.map(enrollment => <Col xs={24} md={12} key={enrollment._id}><Card className={styles['portal-card']} title={<><BookOutlined /> {courseNameOf(enrollment)}</>} extra={<Tag color="green">{enrollment.status || 'Chưa cập nhật'}</Tag>}>
            <p><b>Lớp:</b> {classOf(enrollment)?.class_name || 'Chưa cập nhật'}</p>
            <p><b>Lịch:</b> {classOf(enrollment)?.start_time || 'Chưa cập nhật'} – {classOf(enrollment)?.end_time || 'Chưa cập nhật'}</p>
            <p><b>Ngày đăng ký:</b> {dateText(enrollment.register_date)}</p>
        </Card></Col>)}</Row> : <Empty description="Bạn chưa có khóa học nào" />;

        if (screen === 'classes') return classRows.length ? <Card className={styles['portal-card']}><Table pagination={false} scroll={{ x: 640 }} columns={[
            { title: 'Lớp học', dataIndex: 'name' }, { title: 'Khóa học', dataIndex: 'course' }, { title: 'Phòng', dataIndex: 'room' }, { title: 'Thời gian', dataIndex: 'time' }, { title: 'Trạng thái', dataIndex: 'status', render: (value: string) => <Tag color="green">{value}</Tag> },
        ]} dataSource={classRows} /></Card> : <Empty description="Chưa có lớp học phù hợp" />;

        if (screen === 'schedule') {
            if (role === 'CONSULTANT') return <Alert type="info" showIcon message="Chưa có dữ liệu lịch hẹn" description="Backend hiện chưa lưu lịch hẹn cho tư vấn viên." />;
            return classRows.length ? <div className={styles['schedule-list']}>{classRows.map(item => <Card key={String(item.key)} className={styles['portal-card']}><div className={styles['schedule-row']}><div className={styles['schedule-date']}><CalendarOutlined /></div><div><h3>{item.course}</h3><p>{item.name} · {item.room} · {item.time}</p></div><Tag color="blue">{role === 'TEACHER' ? 'Lịch giảng' : 'Lịch học'}</Tag></div></Card>)}</div> : <Empty description="Chưa có lịch học" />;
        }

        if (screen === 'invoices') return invoices.length ? <Card className={styles['portal-card']}><Table pagination={false} scroll={{ x: 560 }} columns={[
            { title: 'Mã hóa đơn', dataIndex: '_id' }, { title: 'Khóa học', render: (_, row: IPortalInvoice) => courseNameOf(row.enrollment_id) }, { title: 'Số tiền', render: (_, row: IPortalInvoice) => <b>{moneyText(row.final_amount ?? row.amount)}</b> }, { title: 'Trạng thái', dataIndex: 'status', render: (value?: string) => <Tag color="gold">{value || 'Chưa cập nhật'}</Tag> },
        ]} dataSource={invoices} rowKey="_id" /></Card> : <Empty description="Chưa có hóa đơn" />;

        if (screen === 'payments') return payments.length ? <Card className={styles['portal-card']}><Table pagination={false} scroll={{ x: 560 }} columns={[
            { title: 'Mã giao dịch', dataIndex: '_id' }, { title: 'Khóa học', render: (_, row: IPortalPayment) => courseNameOf(row.invoice_id?.enrollment_id) }, { title: 'Phương thức', dataIndex: 'payment_method', render: (value?: string) => value || 'Chưa cập nhật' }, { title: 'Ngày thanh toán', dataIndex: 'payment_date', render: (value?: string) => dateText(value) },
        ]} dataSource={payments} rowKey="_id" /></Card> : <Empty description="Chưa có giao dịch thanh toán" />;

        if (screen === 'students') return enrollments.length ? <Card className={styles['portal-card']}><Table pagination={false} scroll={{ x: 560 }} columns={[
            { title: 'Học viên', render: (_, row: IPortalEnrollment) => row.student_id?.name || 'Chưa cập nhật' }, { title: 'Email', render: (_, row: IPortalEnrollment) => row.student_id?.email || 'Chưa cập nhật' }, { title: 'Lớp', render: (_, row: IPortalEnrollment) => row.class_id?.class_name || 'Chưa cập nhật' }, { title: 'Trạng thái', dataIndex: 'status', render: (value?: string) => <Tag color="green">{value || 'Chưa cập nhật'}</Tag> },
        ]} dataSource={enrollments} rowKey="_id" /></Card> : <Empty description="Chưa có học viên trong các lớp bạn phụ trách" />;

        if (screen === 'leads') return leads.length ? <Card className={styles['portal-card']}><Table pagination={false} scroll={{ x: 560 }} columns={[
            { title: 'Khách hàng', dataIndex: 'full_name' }, { title: 'Khóa học quan tâm', dataIndex: 'course_name' }, { title: 'Liên hệ', dataIndex: 'phone' }, { title: 'Trạng thái', dataIndex: 'status', render: (value?: string) => <Tag color="blue">{value || 'Chưa cập nhật'}</Tag> },
        ]} dataSource={leads} rowKey="_id" /></Card> : <Empty description="Chưa có khách hàng được phân công" />;

        return <Card className={styles['portal-card']}><p>Chọn chức năng trên thanh điều hướng để xem thông tin chi tiết.</p></Card>;
    };

    const primaryCount = role === 'STUDENT' ? enrollments.length : role === 'TEACHER' ? classes.length : leads.length;
    return <main className={`${styles.container} ${styles['portal-section']}`}>
        <section className={styles['portal-hero']}><span>{roleLabel[role].toUpperCase()}</span><h1>{screen === 'home' ? `Chào ${user.name || 'bạn'}!` : info.title}</h1><p>{info.description}</p></section>
        {screen === 'home' && <Row gutter={[18, 18]} className={styles['portal-stats']}>
            <Col xs={24} sm={12} lg={6}><Card><Statistic title={role === 'CONSULTANT' ? 'Khách hàng phụ trách' : role === 'TEACHER' ? 'Lớp phụ trách' : 'Khóa học đang học'} value={primaryCount} prefix={<BookOutlined />} /></Card></Col>
            <Col xs={24} sm={12} lg={6}><Card><Statistic title="Lịch học/giảng" value={role === 'STUDENT' ? enrollments.length : classes.length} prefix={<CalendarOutlined />} /></Card></Col>
            <Col xs={24} sm={12} lg={6}><Card><Statistic title="Hóa đơn" value={invoices.length} prefix={<FileTextOutlined />} /></Card></Col>
            <Col xs={24} sm={12} lg={6}><Card><Statistic title="Thanh toán" value={payments.length} prefix={<CreditCardOutlined />} /></Card></Col>
        </Row>}
        <section className={styles['portal-content']}>{renderContent()}</section>
    </main>;
};

export default PortalPage;
