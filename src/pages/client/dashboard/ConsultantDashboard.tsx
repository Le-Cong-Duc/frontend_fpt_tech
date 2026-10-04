import { Alert, Col, Row } from 'antd';
import { BookOutlined, CalendarOutlined, CheckCircleOutlined, MessageOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { useAppSelector } from '@/redux/hooks';
import { useConsultantData } from '@/pages/client/consultant/consultant.shared';
import styles from '@/styles/client.module.scss';
import StatCard from './components/StatCard';
import QuickActionCard from './components/QuickActionCard';
import RecentActivity, { type ActivityItem } from './components/RecentActivity';

const ConsultantDashboard = () => {
    const user = useAppSelector(state => state.account.user);
    const { leads, courses, loading, error } = useConsultantData();

    const stats = [
        { title: 'Tổng khách hàng', value: leads.length, icon: <UserOutlined />, accent: 'teal' as const },
        { title: 'Khách mới', value: leads.filter(lead => !lead.status || ['NEW', 'INVITED'].includes(lead.status.toUpperCase())).length, icon: <UserOutlined />, accent: 'navy' as const },
        { title: 'Đã tư vấn', value: leads.filter(lead => ['CONSULTED', 'CONTACTED'].includes(lead.status?.toUpperCase() || '')).length, icon: <MessageOutlined />, accent: 'green' as const },
        { title: 'Đã đăng ký', value: leads.filter(lead => lead.status?.toUpperCase() === 'REGISTERED').length, icon: <CheckCircleOutlined />, accent: 'coral' as const },
    ];

    const activities: ActivityItem[] = leads.slice(0, 6).map(lead => ({
        key: lead._id || lead.email || lead.phone || lead.full_name || 'lead',
        title: lead.full_name || lead.name || 'Khách hàng mới',
        detail: `${lead.course_name || 'Chưa chọn khóa học'} · ${lead.phone || lead.email || 'Chưa có liên hệ'}`,
        icon: <UserOutlined />,
        status: lead.status || 'NEW',
    }));

    const quickActions = [
        { label: 'Khách hàng', description: 'Danh sách khách hàng đang tư vấn', icon: <UserOutlined />, to: '/client/consultant/customers' },
        { label: 'Khóa học', description: 'Xem chương trình phù hợp', icon: <BookOutlined />, to: '/client/consultant/courses' },
        { label: 'Follow-up', description: 'Pipeline và lịch tư vấn', icon: <CalendarOutlined />, to: '/client/consultant/follow-up' },
        { label: 'Đăng ký', description: 'Theo dõi học viên mới', icon: <TeamOutlined />, to: '/client/consultant/enrollments' },
    ];

    return (
        <main className={`${styles.container} ${styles['client-dashboard-page']}`}>
            <section className={styles['client-welcome']}>
                <div>
                    <span>CONSULTANT / DASHBOARD</span>
                    <h1>Xin chào, {user.name || 'Tư vấn viên'}!</h1>
                    <p>Quản lý khách hàng và theo dõi tiến độ tư vấn trong cùng một nơi.</p>
                </div>
            </section>

            {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}

            <Row gutter={[16, 16]}>
                {stats.map(stat => (
                    <Col xs={24} sm={12} lg={6} key={stat.title}>
                        <StatCard
                            title={stat.title}
                            value={stat.value}
                            icon={stat.icon}
                            accent={stat.accent}
                            loading={loading}
                            emptyText="0"
                        />
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
                    <RecentActivity
                        title="Khách hàng gần đây"
                        items={activities}
                        loading={loading}
                        error={error}
                        emptyText="Chưa có khách hàng nào trong pipeline"
                    />
                </Col>

                <Col xs={24} lg={9}>
                    <section className={styles['client-dashboard-panel']}>
                        <div className={styles['client-panel-heading']}>
                            <h2>Tổng quan tư vấn</h2>
                        </div>

                        <div className={styles['client-account-summary']}>
                            <div className={styles['client-activity-icon']}><UserOutlined /></div>
                            <div>
                                <strong>{user.name || 'Chưa cập nhật'}</strong>
                                <span>{user.email || 'Chưa có email'}</span>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gap: 12 }}>
                            <div className={styles['client-event-row']}>
                                <CheckCircleOutlined />
                                <div>
                                    <strong>Đã đăng ký</strong>
                                    <span>{leads.filter(lead => lead.status?.toUpperCase() === 'REGISTERED').length} khách hàng</span>
                                </div>
                            </div>

                            <div className={styles['client-event-row']}>
                                <MessageOutlined />
                                <div>
                                    <strong>Đang tư vấn</strong>
                                    <span>{leads.filter(lead => ['CONSULTED', 'CONTACTED', 'NEW', 'INVITED'].includes(lead.status?.toUpperCase() || 'NEW')).length} khách hàng</span>
                                </div>
                            </div>

                            <div className={styles['client-event-row']}>
                                <CalendarOutlined />
                                <div>
                                    <strong>Khóa học</strong>
                                    <span>{courses.length} chương trình đang mở</span>
                                </div>
                            </div>
                        </div>
                    </section>
                </Col>
            </Row>
        </main>
    );
};

export default ConsultantDashboard;
