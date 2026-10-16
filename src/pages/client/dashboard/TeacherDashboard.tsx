import { useMemo } from 'react';
import { Alert, Avatar, Col, Row, Spin, Tag } from 'antd';
import {
    BookOutlined,
    CalendarOutlined,
    CheckCircleOutlined,
    EditOutlined,
    MessageOutlined,
    TeamOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { useAppSelector } from '@/redux/hooks';
import { dateText, statusTag, useTeacherData } from '../teacher/teacher.shared';
import type { ActivityItem } from './components/RecentActivity';
import StatCard from './components/StatCard';
import QuickActionCard from './components/QuickActionCard';
import RecentActivity from './components/RecentActivity';
import styles from '@/styles/client.module.scss';

const TeacherDashboard = () => {
    const user = useAppSelector(state => state.account.user);
    const { classes, courses, students, loading, error, refresh } = useTeacherData(user._id);

    const upcoming = useMemo(
        () =>
            [...classes]
                .filter(item => item.start_date)
                .sort(
                    (a, b) =>
                        new Date(a.start_date || 0).getTime() - new Date(b.start_date || 0).getTime()
                )
                .slice(0, 4),
        [classes]
    );

    const activities = useMemo<ActivityItem[]>(
        () =>
            [
                ...classes.slice(0, 3).map(item => ({
                    key: item._id || item.class_name || 'classroom',
                    title: item.class_name || 'Lớp học',
                    detail: `${typeof item.course_id === 'object' ? item.course_id?.name || 'Khóa học' : 'Khóa học'} · ${item.room || 'Phòng học'} · ${dateText(item.start_date)}`,
                    icon: <TeamOutlined />,
                    status: item.status,
                })),
                ...students.slice(0, 3).map(item => ({
                    key: item._id || (typeof item.student_id === 'object' ? item.student_id?._id : '') || 'student',
                    title: typeof item.student_id === 'object' ? item.student_id?.name || 'Học viên' : 'Học viên',
                    detail: `${typeof item.class_id === 'object' ? item.class_id?.class_name || 'Lớp học' : 'Lớp học'} · ${typeof item.student_id === 'object' ? item.student_id?.email || 'Chưa có email' : ''}`,
                    icon: <UserOutlined />,
                    status: item.status,
                })),
            ].slice(0, 5),
        [classes, students]
    );

    const quickActions = [
        { label: 'Khóa học', description: 'Giáo trình đào tạo', icon: <BookOutlined />, to: '/client/teacher/courses' },
        { label: 'Lớp học', description: 'Lớp đang phụ trách', icon: <TeamOutlined />, to: '/client/teacher/classes' },
        { label: 'Học viên', description: 'Danh sách học viên', icon: <UserOutlined />, to: '/client/teacher/students' },
        { label: 'Lịch dạy', description: 'Thời khóa biểu', icon: <CalendarOutlined />, to: '/client/teacher/schedule' },
        { label: 'Chat', description: 'Kênh trao đổi học vụ', icon: <MessageOutlined />, to: '/client/teacher/chat' },
    ];

    const stats = [
        { title: 'Lớp phụ trách', value: classes.length, icon: <TeamOutlined />, accent: 'teal' as const },
        { title: 'Khóa học', value: courses.length, icon: <BookOutlined />, accent: 'navy' as const },
        { title: 'Học viên', value: students.length, icon: <UserOutlined />, accent: 'green' as const },
        { title: 'Ca dạy sắp tới', value: upcoming.length, icon: <CalendarOutlined />, accent: 'coral' as const },
    ];

    if (loading) {
        return (
            <main className={`${styles.container} ${styles['client-dashboard-page']} ${styles['client-dashboard-loading']}`}>
                <Spin size="large" />
            </main>
        );
    }

    return (
        <main className={`${styles.container} ${styles['client-dashboard-page']}`}>
            <section className={styles['client-welcome']}>
                <div>
                    <span>TEACHER / CLIENT DASHBOARD</span>
                    <h1>Xin chào, Thầy/Cô {user.name || 'giáo viên'}!</h1>
                    <p>Hôm nay là {new Date().toLocaleDateString('vi-VN')}. Theo dõi tiến độ lớp học, điểm danh và đánh giá học viên.</p>
                </div>
                <Avatar size={64} style={{ backgroundColor: '#1677ff' }}>
                    {user.name?.slice(0, 2).toUpperCase() || 'GV'}
                </Avatar>
            </section>

            {error && (
                <Alert
                    type="error"
                    showIcon
                    message={error}
                    action={<a onClick={() => refresh()}>Thử lại</a>}
                    className={styles['client-dashboard-alert']}
                />
            )}

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
                    <RecentActivity items={activities} title="Hoạt động giảng dạy gần đây" />
                </Col>
                <Col xs={24} lg={9}>
                    <section className={styles['client-dashboard-panel']}>
                        <div className={styles['client-panel-heading']}>
                            <h2>Lớp học sắp tới</h2>
                            <span>{upcoming.length} lớp</span>
                        </div>
                        {upcoming.length ? (
                            upcoming.map(item => (
                                <div className={styles['client-event-row']} key={item._id || item.class_name}>
                                    <CalendarOutlined />
                                    <div>
                                        <strong>{typeof item.course_id === 'object' ? item.course_id?.name || 'Khóa học' : 'Khóa học'}</strong>
                                        <span>
                                            {item.class_name || 'Lớp học'} · Phòng {item.room || 'Chưa có phòng'} · {dateText(item.start_date)}
                                        </span>
                                    </div>
                                    {statusTag(item.status)}
                                </div>
                            ))
                        ) : (
                            <div className={styles['client-empty-inline']}>Chưa có lịch dạy sắp tới.</div>
                        )}
                    </section>

                    <section className={styles['client-dashboard-panel']}>
                        <div className={styles['client-panel-heading']}>
                            <h2>Thông tin giảng viên</h2>
                        </div>
                        <div className={styles['client-account-summary']}>
                            <Avatar size={46} style={{ backgroundColor: '#1677ff' }}>
                                {user.name?.slice(0, 2).toUpperCase() || 'GV'}
                            </Avatar>
                            <div>
                                <strong>{user.name || 'Giáo viên'}</strong>
                                <span>{user.email || 'Chưa cập nhật email'}</span>
                                <Tag color="blue">Giảng viên FPT</Tag>
                            </div>
                        </div>
                        <a className={styles['client-profile-link']} href="/client/teacher/profile">
                            Xem thông tin cá nhân
                        </a>
                    </section>
                </Col>
            </Row>
        </main>
    );
};

export default TeacherDashboard;
