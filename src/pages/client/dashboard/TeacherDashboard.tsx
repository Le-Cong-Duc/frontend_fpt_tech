import { useEffect, useMemo, useState } from 'react';
import { Alert, Avatar, Col, Row, Spin, Tag } from 'antd';
import { BookOutlined, CalendarOutlined, CheckCircleOutlined, MessageOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { useAppSelector } from '@/redux/hooks';
import { callFetchCourse, callFetchMyStudents, callFetchMyTeachingClassrooms } from '@/config/api';
import type { IClassroomWithDetails, ICourse, IPortalEnrollment } from '@/types/backend';
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

const dateText = (value?: string) => value ? new Date(value).toLocaleDateString('vi-VN') : 'Chưa cập nhật';

const TeacherDashboard = () => {
    const user = useAppSelector(state => state.account.user);
    const [classes, setClasses] = useState<IClassroomWithDetails[]>([]);
    const [students, setStudents] = useState<IPortalEnrollment[]>([]);
    const [courses, setCourses] = useState<ICourse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [retry, setRetry] = useState(0);

    useEffect(() => {
        let active = true;
        const load = async () => {
            setLoading(true);
            setError('');
            try {
                const [classroomResponse, studentResponse, courseResponse] = await Promise.all([
                    callFetchMyTeachingClassrooms(),
                    callFetchMyStudents(),
                    callFetchCourse('current=1&pageSize=1000'),
                ]);

                if (!active) return;

                const teacherClasses = toArray<IClassroomWithDetails>(classroomResponse);
                const teacherStudents = toArray<IPortalEnrollment>(studentResponse);
                const teacherCourses = toArray<ICourse>(courseResponse);

                setClasses(teacherClasses);
                setStudents(teacherStudents);
                setCourses(teacherCourses.filter(course => teacherClasses.some(item => item.course_id?._id === course._id)));
            } catch {
                if (active) setError('Không thể tải dữ liệu giảng viên.');
            } finally {
                if (active) setLoading(false);
            }
        };

        load();
        return () => { active = false; };
    }, [retry]);

    const courseList = useMemo(() => {
        const map = new Map<string, ICourse>();
        classes.forEach(item => {
            const course = item.course_id;
            if (course && course._id) map.set(course._id, course as ICourse);
        });
        return Array.from(map.values());
    }, [classes]);

    const upcoming = useMemo(() => [...classes]
        .filter(item => item.start_date)
        .sort((a, b) => new Date(a.start_date || 0).getTime() - new Date(b.start_date || 0).getTime())
        .slice(0, 4), [classes]);

    const activities = useMemo<ActivityItem[]>(() => [
        ...classes.slice(0, 3).map(item => ({
            key: item._id || item.class_name || 'classroom',
            title: item.class_name || 'Lớp học',
            detail: `${item.course_id?.name || 'Khóa học'} · ${item.room || 'Phòng học'} · ${dateText(item.start_date)}`,
            icon: <TeamOutlined />,
            status: item.status,
        })),
        ...students.slice(0, 3).map(item => ({
            key: item._id || item.student_id?._id || 'student',
            title: item.student_id?.name || 'Học viên mới',
            detail: `${item.class_id?.class_name || 'Lớp học'} · ${item.student_id?.email || 'Chưa có email'}`,
            icon: <UserOutlined />,
            status: item.status,
        })),
    ].slice(0, 5), [classes, students]);

    const quickActions = [
        { label: 'Khóa học', description: 'Khóa học phụ trách', icon: <BookOutlined />, to: '/client/teacher/courses' },
        { label: 'Lớp học', description: 'Lớp đang phụ trách', icon: <TeamOutlined />, to: '/client/teacher/classes' },
        { label: 'Học viên', description: 'Danh sách học viên', icon: <UserOutlined />, to: '/client/teacher/students' },
        { label: 'Lịch dạy', description: 'Lịch giảng dạy', icon: <CalendarOutlined />, to: '/client/teacher/schedule' },
        { label: 'Chat', description: 'Trao đổi với học viên', icon: <MessageOutlined />, to: '/client/teacher/chat' },
    ];

    const stats = [
        { title: 'Lớp phụ trách', value: classes.length, icon: <TeamOutlined />, accent: 'teal' as const },
        { title: 'Khóa học', value: courseList.length, icon: <BookOutlined />, accent: 'navy' as const },
        { title: 'Học viên', value: students.length, icon: <UserOutlined />, accent: 'green' as const },
        { title: 'Lịch dạy', value: upcoming.length, icon: <CalendarOutlined />, accent: 'coral' as const },
    ];

    if (loading) return <main className={`${styles.container} ${styles['client-dashboard-page']} ${styles['client-dashboard-loading']}`}><Spin size="large" /></main>;

    return (
        <main className={`${styles.container} ${styles['client-dashboard-page']}`}>
            <section className={styles['client-welcome']}>
                <div>
                    <span>TEACHER / CLIENT DASHBOARD</span>
                    <h1>Xin chào, {user.name || 'giáo viên'}!</h1>
                    <p>Hôm nay là {new Date().toLocaleDateString('vi-VN')}. Theo dõi lớp học, học viên và lịch giảng dạy của bạn.</p>
                </div>
                <Avatar size={64}>{user.name?.slice(0, 2).toUpperCase() || 'GV'}</Avatar>
            </section>

            {error && <Alert type="error" showIcon message={error} action={<a onClick={() => setRetry(value => value + 1)}>Thử lại</a>} className={styles['client-dashboard-alert']} />}

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
                            <h2>Lớp học sắp tới</h2>
                            <span>{upcoming.length} lớp</span>
                        </div>
                        {upcoming.length ? upcoming.map(item => (
                            <div className={styles['client-event-row']} key={item._id || item.class_name}>
                                <CalendarOutlined />
                                <div>
                                    <strong>{item.course_id?.name || 'Khóa học'}</strong>
                                    <span>{item.class_name || 'Lớp học'} · {item.room || 'Chưa có phòng'} · {dateText(item.start_date)}</span>
                                </div>
                                <Tag color="blue">{item.status || 'ACTIVE'}</Tag>
                            </div>
                        )) : <div className={styles['client-empty-inline']}>Chưa có lớp học sắp tới.</div>}
                    </section>

                    <section className={styles['client-dashboard-panel']}>
                        <div className={styles['client-panel-heading']}>
                            <h2>Thông tin tài khoản</h2>
                        </div>
                        <div className={styles['client-account-summary']}>
                            <Avatar size={46}>{user.name?.slice(0, 2).toUpperCase() || 'GV'}</Avatar>
                            <div>
                                <strong>{user.name || 'Giáo viên'}</strong>
                                <span>{user.email || 'Chưa cập nhật email'}</span>
                                <Tag color="blue">Giáo viên</Tag>
                            </div>
                        </div>
                        <a className={styles['client-profile-link']} href="/client/teacher/profile">Xem thông tin cá nhân</a>
                    </section>
                </Col>
            </Row>
        </main>
    );
};

export default TeacherDashboard;
