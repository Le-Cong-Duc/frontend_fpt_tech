import { Alert, Avatar, Col, Row, Tag } from 'antd';
import { BookOutlined, CalendarOutlined, CreditCardOutlined, FileTextOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { useAppSelector } from '@/redux/hooks';
import type { IPortalEnrollment, IPortalInvoice, IPortalPayment } from '@/types/backend';
import { useStudentData, statusTag, dateText, money } from '../student/student.shared';
import styles from '@/styles/client.module.scss';
import StatCard from './components/StatCard';
import QuickActionCard from './components/QuickActionCard';
import RecentActivity, { type ActivityItem } from './components/RecentActivity';

const StudentDashboard = () => {
    const user = useAppSelector(state => state.account.user);
    const { enrollments, invoices, payments, loading, error } = useStudentData(user._id);

    const upcoming = [...enrollments]
        .filter(item => item.class_id?.start_date)
        .sort((a, b) => new Date(a.class_id?.start_date || 0).getTime() - new Date(b.class_id?.start_date || 0).getTime())
        .slice(0, 4);

    const unpaidInvoices = invoices.filter(item => item.status?.toUpperCase() !== 'PAID');

    const activities = buildActivityList(enrollments, payments, invoices);

    const quickActions = [
        { label: 'Khóa học', description: 'Khóa học của tôi', icon: <BookOutlined />, to: '/client/student/courses' },
        { label: 'Lịch học', description: 'Lịch sắp tới', icon: <CalendarOutlined />, to: '/client/student/schedule' },
        { label: 'Hóa đơn', description: 'Khoản cần thanh toán', icon: <FileTextOutlined />, to: '/client/student/invoices' },
        { label: 'Thanh toán', description: 'Lịch sử giao dịch', icon: <CreditCardOutlined />, to: '/client/student/payments' },
    ];

    const stats = [
        { title: 'Khóa học đang học', value: enrollments.length, icon: <BookOutlined />, accent: 'teal' as const },
        { title: 'Lớp đang tham gia', value: enrollments.filter(item => item.class_id).length, icon: <TeamOutlined />, accent: 'navy' as const },
        { title: 'Đã thanh toán', value: payments.length, icon: <CreditCardOutlined />, accent: 'green' as const },
        { title: 'Hóa đơn chưa trả', value: unpaidInvoices.length, icon: <FileTextOutlined />, accent: 'coral' as const },
    ];

    if (loading) {
        return <main className={`${styles.container} ${styles['client-dashboard-page']} ${styles['client-dashboard-loading']}`}><div className={styles['portal-loading']}><span>Đang tải dashboard học viên...</span></div></main>;
    }

    return (
        <main className={`${styles.container} ${styles['client-dashboard-page']}`}>
            <section className={styles['client-welcome']}>
                <div>
                    <span>STUDENT / CLIENT DASHBOARD</span>
                    <h1>Xin chào, {user.name || 'học viên'}!</h1>
                    <p>Hôm nay là {new Date().toLocaleDateString('vi-VN')}. Theo dõi tiến độ học tập và tài chính của bạn.</p>
                </div>
                <Avatar size={64}>{user.name?.slice(0, 2).toUpperCase() || 'HV'}</Avatar>
            </section>

            {error && <Alert type="error" showIcon message={error} className={styles['client-dashboard-alert']} />}

            <Row gutter={[16, 16]}>
                {stats.map(stat => (
                    <Col xs={24} sm={12} lg={6} key={stat.title}>
                        <StatCard {...stat} />
                    </Col>
                ))}
            </Row>

            <section className={styles['client-quick-grid']}>
                {quickActions.map(action => (
                    <QuickActionCard key={action.to} {...action} />
                ))}
            </section>

            <Row gutter={[18, 18]} className={styles['client-dashboard-main']}>
                <Col xs={24} lg={15}>
                    <RecentActivity items={activities} title="Hoạt động gần đây" />
                </Col>
                <Col xs={24} lg={9}>
                    <section className={styles['client-dashboard-panel']}>
                        <div className={styles['client-panel-heading']}>
                            <h2>Lịch học sắp tới</h2>
                            <span>{upcoming.length} buổi</span>
                        </div>
                        {upcoming.length ? upcoming.map(item => (
                            <div className={styles['client-event-row']} key={item._id || item.class_id?._id}>
                                <CalendarOutlined />
                                <div>
                                    <strong>{item.class_id?.course_id?.name || 'Khóa học'}</strong>
                                    <span>{item.class_id?.class_name || 'Lớp học'} · {item.class_id?.start_time || '—'} - {item.class_id?.end_time || '—'} · {item.class_id?.room || 'Phòng học'}</span>
                                </div>
                                {statusTag(item.status)}
                            </div>
                        )) : <div className={styles['client-empty-inline']}>Bạn chưa có lịch học sắp tới.</div>}
                    </section>

                    <section className={styles['client-dashboard-panel']}>
                        <div className={styles['client-panel-heading']}>
                            <h2>Hóa đơn cần chú ý</h2>
                            <span>{unpaidInvoices.length} khoản</span>
                        </div>
                        {unpaidInvoices.length ? unpaidInvoices.slice(0, 4).map(item => (
                            <div className={styles['client-event-row']} key={item._id}>
                                <FileTextOutlined />
                                <div>
                                    <strong>{item.enrollment_id?.class_id?.course_id?.name || 'Hóa đơn'}</strong>
                                    <span>{money(item.final_amount || item.amount)}</span>
                                </div>
                                {statusTag(item.status)}
                            </div>
                        )) : <div className={styles['client-empty-inline']}>Tất cả hóa đơn đã được thanh toán.</div>}
                    </section>

                    <section className={styles['client-dashboard-panel']}>
                        <div className={styles['client-panel-heading']}>
                            <h2>Thông tin tài khoản</h2>
                        </div>
                        <div className={styles['client-account-summary']}>
                            <Avatar size={46}>{user.name?.slice(0, 2).toUpperCase() || 'HV'}</Avatar>
                            <div>
                                <strong>{user.name || 'Học viên'}</strong>
                                <span>{user.email || 'Chưa cập nhật email'}</span>
                                <Tag color="blue">Học viên</Tag>
                            </div>
                        </div>
                        <a className={styles['client-profile-link']} href="/client/student/profile">Xem thông tin cá nhân</a>
                    </section>
                </Col>
            </Row>
        </main>
    );
};

const buildActivityList = (
    enrollments: IPortalEnrollment[],
    payments: IPortalPayment[],
    invoices: IPortalInvoice[],
): ActivityItem[] => {
    const paymentItems = payments.slice(0, 3).map(payment => ({
        key: payment._id || String(payment.payment_date),
        title: 'Đã ghi nhận thanh toán',
        detail: `${dateText(payment.payment_date)} · ${payment.payment_method || 'Thanh toán'} · ${money(payment.invoice_id?.final_amount ?? payment.invoice_id?.amount ?? 0)}`,
        icon: <CreditCardOutlined />,
        status: 'Hoàn tất',
    }));

    const studyItems = enrollments.slice(0, 2).map(item => ({
        key: item._id || item.class_id?._id || 'study',
        title: item.class_id?.course_id?.name || 'Khóa học mới',
        detail: `${item.class_id?.class_name || 'Lớp học'} · ${item.status || 'Đang học'}`,
        icon: <UserOutlined />,
        status: item.status,
    }));

    const invoiceItems = invoices.slice(0, 2).map(item => ({
        key: item._id || 'invoice',
        title: 'Hóa đơn học phí',
        detail: `${item.enrollment_id?.class_id?.course_id?.name || 'Khóa học'} · ${money(item.final_amount || item.amount)}`,
        icon: <FileTextOutlined />,
        status: item.status,
    }));

    return [...paymentItems, ...studyItems, ...invoiceItems].slice(0, 5) as ActivityItem[];
};

export default StudentDashboard;
