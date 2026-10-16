import { Card, Col, Row, Table } from 'antd';
import { BookOutlined, CalendarOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/redux/hooks';
import {
    ManagerEmpty,
    ManagerState,
    enrollmentsForClass,
    statusTag,
    teachersOf,
    studentsOf,
    useManagerData,
} from './manager.shared';
import styles from '@/styles/client.module.scss';
import StatCard from '../dashboard/components/StatCard';
import QuickActionCard from '../dashboard/components/QuickActionCard';
import RecentActivity from '../dashboard/components/RecentActivity';

const ManagerDashboard = () => {
    const navigate = useNavigate();
    const user = useAppSelector(state => state.account.user);
    const data = useManagerData();

    const teachers = teachersOf(data.users);
    const students = studentsOf(data.users);
    const activeClasses = data.classrooms.filter(item =>
        ['OPEN', 'ACTIVE'].includes(item.status?.toUpperCase() || '')
    );

    return (
        <main className={`${styles.container} ${styles['manager-page']}`}>
            <section className={styles['manager-welcome']}>
                <div>
                    <span>MANAGER WORKSPACE</span>
                    <h1>Xin chào, {user.name || 'Quản lý'}!</h1>
                    <p>Điều phối lớp học, giảng viên, học viên và lịch đào tạo của trung tâm.</p>
                </div>
                <TeamOutlined />
            </section>

            <ManagerState loading={data.loading} error={data.error}>
                {!data.classrooms.length && !data.users.length ? (
                    <ManagerEmpty description="Chưa có dữ liệu quản lý trong hệ thống" />
                ) : (
                    <>
                        <Row gutter={[16, 16]}>
                            <Col xs={24} sm={12} lg={6}>
                                <StatCard
                                    title="Tổng lớp học"
                                    value={data.classrooms.length}
                                    icon={<TeamOutlined />}
                                    accent="teal"
                                />
                            </Col>
                            <Col xs={24} sm={12} lg={6}>
                                <StatCard
                                    title="Lớp đang mở / học"
                                    value={activeClasses.length}
                                    icon={<CalendarOutlined />}
                                    accent="green"
                                />
                            </Col>
                            <Col xs={24} sm={12} lg={6}>
                                <StatCard
                                    title="Đội ngũ Giáo viên"
                                    value={teachers.length}
                                    icon={<UserOutlined />}
                                    accent="navy"
                                />
                            </Col>
                            <Col xs={24} sm={12} lg={6}>
                                <StatCard
                                    title="Tổng số Học viên"
                                    value={students.length}
                                    icon={<TeamOutlined />}
                                    accent="coral"
                                />
                            </Col>
                        </Row>

                        <div className={styles['manager-quick-grid']}>
                            <QuickActionCard
                                label="Quản lý Lớp học"
                                description="Xem danh sách & tạo lớp"
                                icon={<TeamOutlined />}
                                to="/client/manager/classes"
                            />
                            <QuickActionCard
                                label="Đội ngũ Giáo viên"
                                description="Phân công giảng dạy"
                                icon={<UserOutlined />}
                                to="/client/manager/teachers"
                            />
                            <QuickActionCard
                                label="Hồ sơ Học viên"
                                description="Theo dõi học vụ"
                                icon={<TeamOutlined />}
                                to="/client/manager/students"
                            />
                            <QuickActionCard
                                label="Khóa học"
                                description="Tra cứu chương trình"
                                icon={<BookOutlined />}
                                to="/client/manager/courses"
                            />
                            <QuickActionCard
                                label="Thời khóa biểu"
                                description="Lịch toàn trung tâm"
                                icon={<CalendarOutlined />}
                                to="/client/manager/schedule"
                            />
                        </div>

                        <Row gutter={[18, 18]}>
                            <Col xs={24} lg={15}>
                                <Card
                                    className={styles['portal-card']}
                                    title="Lớp học đang mở & hoạt động"
                                    extra={
                                        <a onClick={() => navigate('/client/manager/classes')}>Xem tất cả</a>
                                    }
                                >
                                    <Table
                                        size="small"
                                        pagination={false}
                                        rowKey="_id"
                                        dataSource={activeClasses.slice(0, 6)}
                                        columns={[
                                            {
                                                title: 'Lớp học',
                                                render: (_: unknown, item) => (
                                                    <a
                                                        onClick={() => navigate(`/client/manager/classes/${item._id}`)}
                                                        style={{ fontWeight: 600 }}
                                                    >
                                                        {item.class_name || item._id}
                                                    </a>
                                                ),
                                            },
                                            {
                                                title: 'Khóa học',
                                                render: (_: unknown, item) =>
                                                    item.course_id?.name || 'Chưa cập nhật',
                                            },
                                            {
                                                title: 'Giáo viên',
                                                render: (_: unknown, item) =>
                                                    item.teacher_id?.name || 'Chưa phân công',
                                            },
                                            {
                                                title: 'Sĩ số',
                                                render: (_: unknown, item) => {
                                                    const count = enrollmentsForClass(
                                                        item._id || '',
                                                        data.enrollments
                                                    ).length;
                                                    return `${count}/${item.max_student || '—'}`;
                                                },
                                            },
                                            {
                                                title: 'Trạng thái',
                                                dataIndex: 'status',
                                                render: statusTag,
                                            },
                                        ]}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} lg={9}>
                                <RecentActivity
                                    title="Hoạt động lớp học gần đây"
                                    items={data.classrooms.slice(0, 5).map(item => ({
                                        key: item._id || item.class_name || '',
                                        title: item.class_name || 'Lớp học',
                                        detail: `${item.course_id?.name || 'Khóa học'} · Phòng: ${item.room || 'Chưa có phòng'}`,
                                        icon: <CalendarOutlined />,
                                        status: item.status,
                                    }))}
                                />
                            </Col>
                        </Row>
                    </>
                )}
            </ManagerState>
        </main>
    );
};

export default ManagerDashboard;
