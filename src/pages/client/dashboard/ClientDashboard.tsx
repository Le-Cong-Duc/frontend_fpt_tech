import { useEffect, useMemo, useState } from 'react';
import { Alert, Avatar, Card, Col, Empty, Row, Spin, Tag } from 'antd';
import { BookOutlined, CalendarOutlined, CheckCircleOutlined, CreditCardOutlined, FileTextOutlined, MessageOutlined, RiseOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { useAppSelector } from '@/redux/hooks';
import { getPortalRole, type PortalRole } from '@/config/portal';
import { callFetchClassroom, callFetchCourse, callFetchInvoice, callFetchMyEnrollments, callFetchMyInvoices, callFetchMyPayments, callFetchMyStudents, callFetchMyTeachingClassrooms, callFetchMyAssignedLeads, callFetchPayment, callFetchUser } from '@/config/api';
import type { IClassroomWithDetails, ICourse, IInvoice, ILead, IPortalEnrollment, IPortalInvoice, IPortalPayment, IPayment, IUser } from '@/types/backend';
import styles from '@/styles/client.module.scss';
import StatCard from './components/StatCard';
import QuickActionCard from './components/QuickActionCard';
import RecentActivity, { type ActivityItem } from './components/RecentActivity';

const toArray = <T,>(response: unknown): T[] => {
    const data = (response as { data?: unknown })?.data;
    if (Array.isArray(data)) return data as T[];
    if (data && typeof data === 'object' && Array.isArray((data as { result?: T[] }).result)) return (data as { result: T[] }).result;
    return [];
};
const money = (value?: number) => `${(value || 0).toLocaleString('vi-VN')} đ`;
const roleLabel: Record<PortalRole, string> = { STUDENT: 'Học viên', TEACHER: 'Giảng viên', CONSULTANT: 'Nhân viên tư vấn', ACCOUNTANT: 'Kế toán', MANAGER: 'Quản lý' };
const dateText = (value?: string) => value ? new Date(value).toLocaleDateString('vi-VN') : 'Chưa cập nhật';

interface DashboardData { enrollments: IPortalEnrollment[]; invoices: IPortalInvoice[]; payments: IPortalPayment[]; classes: IClassroomWithDetails[]; students: IPortalEnrollment[]; users: IUser[]; courses: ICourse[]; leads: ILead[]; accountantInvoices: IInvoice[]; accountantPayments: IPayment[]; }
const emptyData: DashboardData = { enrollments: [], invoices: [], payments: [], classes: [], students: [], users: [], courses: [], leads: [], accountantInvoices: [], accountantPayments: [] };

const ClientDashboard = () => {
    const user = useAppSelector(state => state.account.user);
    const role = getPortalRole(user.role?.name);
    const [data, setData] = useState<DashboardData>(emptyData);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [retry, setRetry] = useState(0);

    useEffect(() => {
        let active = true;
        const load = async () => {
            setLoading(true); setError('');
            try {
                let next = emptyData;
                if (role === 'STUDENT') {
                    const [enrollments, invoices, payments] = await Promise.all([callFetchMyEnrollments(), callFetchMyInvoices(), callFetchMyPayments()]);
                    next = { ...emptyData, enrollments: toArray<IPortalEnrollment>(enrollments), invoices: toArray<IPortalInvoice>(invoices), payments: toArray<IPortalPayment>(payments) };
                } else if (role === 'TEACHER') {
                    const [classes, students] = await Promise.all([callFetchMyTeachingClassrooms(), callFetchMyStudents()]);
                    next = { ...emptyData, classes: toArray<IClassroomWithDetails>(classes), students: toArray<IPortalEnrollment>(students) };
                } else if (role === 'CONSULTANT') {
                    const [leads, courses] = await Promise.all([callFetchMyAssignedLeads(), callFetchCourse('current=1&pageSize=1000')]);
                    next = { ...emptyData, leads: toArray<ILead>(leads), courses: toArray<ICourse>(courses) };
                } else if (role === 'ACCOUNTANT') {
                    const [invoices, payments] = await Promise.all([callFetchInvoice('current=1&pageSize=1000'), callFetchPayment('current=1&pageSize=1000')]);
                    next = { ...emptyData, accountantInvoices: toArray<IInvoice>(invoices), accountantPayments: toArray<IPayment>(payments) };
                } else {
                    const [classes, users, courses] = await Promise.all([callFetchClassroom('current=1&pageSize=1000&populate=course_id,teacher_id'), callFetchUser('current=1&pageSize=1000'), callFetchCourse('current=1&pageSize=1000')]);
                    next = { ...emptyData, classes: toArray<IClassroomWithDetails>(classes), users: toArray<IUser>(users), courses: toArray<ICourse>(courses) };
                }
                if (active) setData(next);
            } catch { if (active) setError('Không thể tải dữ liệu dashboard.'); }
            finally { if (active) setLoading(false); }
        };
        load();
        return () => { active = false; };
    }, [role, retry]);

    const activities = useMemo<ActivityItem[]>(() => {
        if (role === 'STUDENT') return data.payments.slice(0, 5).map(payment => ({ key: payment._id || String(payment.payment_date), title: 'Đã ghi nhận thanh toán', detail: `${dateText(payment.payment_date)} · ${payment.payment_method || 'Thanh toán'}`, icon: <CreditCardOutlined />, status: 'Hoàn tất' }));
        if (role === 'TEACHER') return data.students.slice(0, 5).map(student => ({ key: student._id || String(student.student_id), title: `Học viên trong lớp ${student.class_id?.class_name || ''}`, detail: student.student_id?.name || student.student_id?.email, icon: <UserOutlined />, status: student.status }));
        if (role === 'CONSULTANT') return data.leads.slice(0, 5).map(lead => ({ key: lead._id || lead.email || lead.full_name || '', title: lead.full_name || lead.name || 'Khách hàng mới', detail: lead.course_name || 'Chưa chọn khóa học', icon: <UserOutlined />, status: lead.status || 'NEW' }));
        if (role === 'ACCOUNTANT') return data.accountantPayments.slice(0, 5).map(payment => ({ key: payment._id || String(payment.payment_date), title: 'Thanh toán mới', detail: `${payment.payment_method || 'Giao dịch'} · ${dateText(payment.payment_date)}`, icon: <CreditCardOutlined />, status: 'Đã ghi nhận' }));
        return data.classes.slice(0, 5).map(classroom => ({ key: classroom._id || classroom.class_name || '', title: classroom.class_name || 'Lớp học mới', detail: `${classroom.course_id?.name || 'Chưa gán khóa học'} · ${classroom.room || 'Chưa có phòng'}`, icon: <TeamOutlined />, status: classroom.status }));
    }, [data, role]);

    const quickActions: Record<PortalRole, { label: string; description: string; icon: JSX.Element; to: string }[]> = {
        STUDENT: [{ label: 'Khóa học', description: 'Khóa học của tôi', icon: <BookOutlined />, to: '/portal/my-courses' }, { label: 'Lịch học', description: 'Lịch sắp tới', icon: <CalendarOutlined />, to: '/portal/schedule' }, { label: 'Hóa đơn', description: 'Khoản cần thanh toán', icon: <FileTextOutlined />, to: '/portal/invoices' }, { label: 'Thanh toán', description: 'Lịch sử giao dịch', icon: <CreditCardOutlined />, to: '/portal/payments' }],
        TEACHER: [{ label: 'Lớp học', description: 'Lớp đang phụ trách', icon: <TeamOutlined />, to: '/portal/classes' }, { label: 'Học viên', description: 'Danh sách học viên', icon: <UserOutlined />, to: '/portal/students' }, { label: 'Lịch dạy', description: 'Lịch giảng dạy', icon: <CalendarOutlined />, to: '/portal/schedule' }, { label: 'Tin nhắn', description: 'Trao đổi với học viên', icon: <MessageOutlined />, to: '/client/consultant/chat' }],
        CONSULTANT: [{ label: 'Khách hàng', description: 'Lead được giao', icon: <UserOutlined />, to: '/client/consultant/customers' }, { label: 'Khóa học', description: 'Tư vấn chương trình', icon: <BookOutlined />, to: '/client/consultant/courses' }, { label: 'Đăng ký học', description: 'Tạo đăng ký', icon: <TeamOutlined />, to: '/client/consultant/enrollments' }, { label: 'Follow-up', description: 'Pipeline khách hàng', icon: <CalendarOutlined />, to: '/client/consultant/follow-up' }],
        ACCOUNTANT: [{ label: 'Học phí', description: 'Theo dõi công nợ', icon: <RiseOutlined />, to: '/client/accountant/tuition' }, { label: 'Hóa đơn', description: 'Quản lý hóa đơn', icon: <FileTextOutlined />, to: '/client/accountant/invoices' }, { label: 'Thanh toán', description: 'Lịch sử giao dịch', icon: <CreditCardOutlined />, to: '/client/accountant/payments' }, { label: 'Doanh thu', description: 'Báo cáo doanh thu', icon: <RiseOutlined />, to: '/client/accountant/revenue' }],
        MANAGER: [{ label: 'Lớp học', description: 'Quản lý lớp', icon: <TeamOutlined />, to: '/portal/classes' }, { label: 'Giảng viên', description: 'Đội ngũ giảng viên', icon: <UserOutlined />, to: '/portal/teachers' }, { label: 'Học viên', description: 'Danh sách học viên', icon: <UserOutlined />, to: '/portal/students' }, { label: 'Lịch học', description: 'Lịch lớp học', icon: <CalendarOutlined />, to: '/portal/schedule' }],
    };

    const stats = role === 'STUDENT' ? [{ title: 'Khóa học đang học', value: data.enrollments.length, icon: <BookOutlined />, accent: 'teal' as const }, { title: 'Lớp đang tham gia', value: data.enrollments.filter(item => item.class_id).length, icon: <TeamOutlined />, accent: 'navy' as const }, { title: 'Thanh toán', value: data.payments.length, icon: <CreditCardOutlined />, accent: 'green' as const }, { title: 'Hóa đơn chưa trả', value: data.invoices.filter(item => item.status !== 'PAID').length, icon: <FileTextOutlined />, accent: 'coral' as const }] : role === 'TEACHER' ? [{ title: 'Lớp phụ trách', value: data.classes.length, icon: <TeamOutlined />, accent: 'teal' as const }, { title: 'Học viên', value: data.students.length, icon: <UserOutlined />, accent: 'navy' as const }, { title: 'Lịch dạy', value: data.classes.length, icon: <CalendarOutlined />, accent: 'green' as const }, { title: 'Tin nhắn', value: 0, icon: <MessageOutlined />, accent: 'coral' as const }] : role === 'CONSULTANT' ? [{ title: 'Tổng khách hàng', value: data.leads.length, icon: <UserOutlined />, accent: 'teal' as const }, { title: 'Khách mới', value: data.leads.filter(item => !item.status || ['NEW', 'INVITED'].includes(item.status.toUpperCase())).length, icon: <UserOutlined />, accent: 'coral' as const }, { title: 'Đã tư vấn', value: data.leads.filter(item => ['CONSULTED', 'CONTACTED'].includes(item.status?.toUpperCase() || '')).length, icon: <MessageOutlined />, accent: 'navy' as const }, { title: 'Đã đăng ký', value: data.leads.filter(item => item.status?.toUpperCase() === 'REGISTERED').length, icon: <CheckCircleOutlined />, accent: 'green' as const }] : role === 'ACCOUNTANT' ? [{ title: 'Tổng doanh thu', value: money(data.accountantInvoices.filter(item => item.status === 'PAID').reduce((sum, item) => sum + (item.final_amount || item.amount || 0), 0)), icon: <RiseOutlined />, accent: 'teal' as const }, { title: 'Tổng hóa đơn', value: data.accountantInvoices.length, icon: <FileTextOutlined />, accent: 'navy' as const }, { title: 'Đã thanh toán', value: data.accountantInvoices.filter(item => item.status === 'PAID').length, icon: <CheckCircleOutlined />, accent: 'green' as const }, { title: 'Chưa thanh toán', value: data.accountantInvoices.filter(item => item.status !== 'PAID').length, icon: <CreditCardOutlined />, accent: 'coral' as const }] : [{ title: 'Tổng lớp học', value: data.classes.length, icon: <TeamOutlined />, accent: 'teal' as const }, { title: 'Giáo viên', value: data.users.filter(item => item.role?.name?.toUpperCase().includes('TEACHER')).length, icon: <UserOutlined />, accent: 'navy' as const }, { title: 'Học viên', value: data.users.filter(item => item.role?.name?.toUpperCase().includes('STUDENT')).length, icon: <UserOutlined />, accent: 'green' as const }, { title: 'Lớp đang mở', value: data.classes.filter(item => item.status === 'OPEN').length, icon: <CalendarOutlined />, accent: 'coral' as const }];

    if (loading) return <main className={`${styles.container} ${styles['client-dashboard-page']} ${styles['client-dashboard-loading']}`}><Spin size="large" /></main>;
    return <main className={`${styles.container} ${styles['client-dashboard-page']}`}><section className={styles['client-welcome']}><div><span>{roleLabel[role].toUpperCase()} / CLIENT DASHBOARD</span><h1>Xin chào, {user.name || 'bạn'}!</h1><p>Hôm nay là {new Date().toLocaleDateString('vi-VN')}. Chúc bạn một ngày làm việc hiệu quả.</p></div><Avatar size={64}>{user.name?.slice(0, 2).toUpperCase()}</Avatar></section>{error && <Alert type="error" showIcon message={error} action={<a onClick={() => setRetry(value => value + 1)}>Thử lại</a>} className={styles['client-dashboard-alert']} />}<Row gutter={[16, 16]}>{stats.map(stat => <Col xs={24} sm={12} lg={6} key={stat.title}><StatCard {...stat} /></Col>)}</Row><section className={styles['client-quick-grid']}>{quickActions[role].map(action => <QuickActionCard key={action.to} {...action} />)}</section><Row gutter={[18, 18]} className={styles['client-dashboard-main']}><Col xs={24} lg={15}><RecentActivity items={activities} /></Col><Col xs={24} lg={9}><section className={styles['client-dashboard-panel']}><div className={styles['client-panel-heading']}><h2>Thông tin tài khoản</h2></div><div className={styles['client-account-summary']}><Avatar size={46}>{user.name?.slice(0, 2).toUpperCase()}</Avatar><div><strong>{user.name || 'Chưa cập nhật'}</strong><span>{user.email || 'Chưa cập nhật'}</span><Tag color="blue">{roleLabel[role]}</Tag></div></div><a className={styles['client-profile-link']} href={role === 'ACCOUNTANT' ? '/client/accountant/profile' : role === 'CONSULTANT' ? '/client/consultant/profile' : '/portal/profile'}>Xem thông tin cá nhân</a></section>{role === 'STUDENT' && <section className={styles['client-dashboard-panel']}><div className={styles['client-panel-heading']}><h2>Lịch học gần đây</h2></div>{data.enrollments.length ? data.enrollments.slice(0, 4).map(item => <div className={styles['client-event-row']} key={item._id}><CalendarOutlined /><div><strong>{item.class_id?.course_id?.name || 'Khóa học'}</strong><span>{item.class_id?.room || 'Chưa có phòng'} · {item.class_id?.start_time || 'Chưa cập nhật'}</span></div></div>) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có lịch học" />}</section>}</Col></Row></main>;
};
export default ClientDashboard;
