import { Alert, Col, Row } from 'antd';
import { BookOutlined, CalendarOutlined, CheckCircleOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { useAppSelector } from '@/redux/hooks';
import { useManagerData, teachersOf, studentsOf, statusText } from '@/pages/client/manager/manager.shared';
import styles from '@/styles/client.module.scss';
import StatCard from './components/StatCard';
import QuickActionCard from './components/QuickActionCard';
import RecentActivity, { type ActivityItem } from './components/RecentActivity';

const ManagerDashboard = () => {
    const user = useAppSelector(state => state.account.user);
    const { classrooms, users, courses, loading, error } = useManagerData();

    const teacherList = teachersOf(users);
    const studentList = studentsOf(users);
    const activeClasses = classrooms.filter(classroom => !['CANCELLED', 'COMPLETED'].includes(classroom.status?.toUpperCase() || '')).length;
    const upcomingClasses = classrooms.filter(classroom => classroom.start_date && new Date(classroom.start_date) >= new Date()).length;

    const stats = [
        { title: 'Tổng số lớp học', value: classrooms.length, icon: <TeamOutlined />, accent: 'teal' as const },
        { title: 'Tổng số giáo viên', value: teacherList.length, icon: <UserOutlined />, accent: 'navy' as const },
        { title: 'Tổng số học viên', value: studentList.length, icon: <UserOutlined />, accent: 'green' as const },
        { title: 'Tổng số khóa học', value: courses.length, icon: <BookOutlined />, accent: 'coral' as const },
    ];

    const activities: ActivityItem[] = classrooms.slice(0, 6).map(classroom => ({
        key: classroom._id || classroom.class_name || 'classroom',
        title: classroom.class_name || 'Lớp học',
        detail: `${classroom.course_id?.name || 'Chưa gán khóa học'} · ${classroom.teacher_id?.name || 'Chưa gán giảng viên'}`,
        icon: <CalendarOutlined />,
        status: statusText(classroom.status),
    }));

    const quickActions = [
        { label: 'Lớp học', description: 'Quản lý lớp đang hoạt động', icon: <TeamOutlined />, to: '/client/manager/classes' },
        { label: 'Giáo viên', description: 'Danh sách giáo viên', icon: <UserOutlined />, to: '/client/manager/teachers' },
        { label: 'Học viên', description: 'Theo dõi học viên', icon: <UserOutlined />, to: '/client/manager/students' },
        { label: 'Khóa học', description: 'Chương trình đào tạo', icon: <BookOutlined />, to: '/client/manager/courses' },
        { label: 'Lịch học', description: 'Lịch trình lớp học', icon: <CalendarOutlined />, to: '/client/manager/schedule' },
    ];

    return (
        <main className={`${styles.container} ${styles['client-dashboard-page']}`}>
            <section className={styles['client-welcome']}>
                <div>
                    <span>MANAGER / DASHBOARD</span>
                    <h1>Xin chào, {user.name || 'Quản lý'}!</h1>
                    <p>Theo dõi hoạt động đào tạo của trung tâm và tiến độ lớp học.</p>
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
                        title="Lớp học gần đây"
                        items={activities}
                        loading={loading}
                        error={error}
                        emptyText="Chưa có lớp học nào"
                    />
                </Col>

                <Col xs={24} lg={9}>
                    <section className={styles['client-dashboard-panel']}>
                        <div className={styles['client-panel-heading']}>
                            <h2>Tổng quan đào tạo</h2>
                        </div>

                        <div style={{ display: 'grid', gap: 12 }}>
                            <div className={styles['client-event-row']}>
                                <CheckCircleOutlined />
                                <div>
                                    <strong>Lớp đang hoạt động</strong>
                                    <span>{activeClasses} lớp</span>
                                </div>
                            </div>

                            <div className={styles['client-event-row']}>
                                <CalendarOutlined />
                                <div>
                                    <strong>Lịch học sắp tới</strong>
                                    <span>{upcomingClasses} buổi</span>
                                </div>
                            </div>

                            <div className={styles['client-event-row']}>
                                <UserOutlined />
                                <div>
                                    <strong>Học viên</strong>
                                    <span>{studentList.length} người</span>
                                </div>
                            </div>
                        </div>
                    </section>
                </Col>
            </Row>
        </main>
    );
};

export default ManagerDashboard;
