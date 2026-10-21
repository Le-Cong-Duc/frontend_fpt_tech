import { useMemo, useState } from 'react';
import { Button, Card, Col, Divider, Input, Row, Select, Space, Tag, Tooltip } from 'antd';
import {
    CalendarOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    EnvironmentOutlined,
    SearchOutlined,
    TeamOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/redux/hooks';
import {
    TeacherEmpty,
    TeacherState,
    dateText,
    statusColor,
    statusTag,
    statusText,
    useTeacherData,
} from './teacher.shared';
import type { IClassroomWithDetails } from '@/types/backend';
import styles from '@/styles/client.module.scss';

const TeacherSchedule = () => {
    const navigate = useNavigate();
    const user = useAppSelector(state => state.account.user);
    const data = useTeacherData(user._id);

    const [search, setSearch] = useState('');
    const [selectedRoom, setSelectedRoom] = useState<string>();
    const [statusFilter, setStatusFilter] = useState<string>();

    // Lọc danh sách lịch dạy
    const scheduleItems = useMemo(() => {
        return [...data.classes]
            .filter(item => {
                const className = item.class_name || '';
                const courseName = typeof item.course_id === 'object' ? item.course_id?.name || '' : '';
                const room = item.room || '';
                const matchSearch =
                    !search ||
                    `${className} ${courseName} ${room}`.toLowerCase().includes(search.toLowerCase());
                const matchRoom = !selectedRoom || item.room === selectedRoom;
                const matchStatus = !statusFilter || item.status?.toUpperCase() === statusFilter;
                return matchSearch && matchRoom && matchStatus;
            })
            .sort((a, b) => new Date(a.start_date || 0).getTime() - new Date(b.start_date || 0).getTime());
    }, [data.classes, search, selectedRoom, statusFilter]);

    // Danh sách phòng học duy nhất
    const roomOptions = useMemo(() => {
        const rooms = Array.from(new Set(data.classes.map(c => c.room).filter(Boolean) as string[]));
        return rooms.map(r => ({ label: `Phòng ${r}`, value: r }));
    }, [data.classes]);

    // Thống kê nhanh
    const totalTeachingClasses = data.classes.length;
    const activeClasses = data.classes.filter(
        c => c.status?.toUpperCase() === 'ACTIVE' || c.status?.toUpperCase() === 'OPEN'
    ).length;

    return (
        <main className={`${styles.container} ${styles['student-page']}`}>
            <section className={styles['student-heading']}>
                <div>
                    <span>TEACHER / TIMETABLE</span>
                    <h1>Lịch giảng dạy & Thời khóa biểu</h1>
                    <p>Theo dõi lịch trình các ca học, phòng đào tạo và ca dạy của các lớp phụ trách.</p>
                </div>
            </section>

            <TeacherState loading={data.loading} error={data.error}>
                {/* Thống kê lịch dạy */}
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                    <Col xs={24} sm={8}>
                        <Card className={styles['portal-card']} style={{ borderLeft: '4px solid #1677ff' }}>
                            <span style={{ color: '#888', fontSize: 13 }}>Tổng số ca dạy</span>
                            <h2 style={{ margin: '6px 0 0', color: '#1677ff' }}>{totalTeachingClasses} lớp học</h2>
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card className={styles['portal-card']} style={{ borderLeft: '4px solid #52c41a' }}>
                            <span style={{ color: '#888', fontSize: 13 }}>Lớp đang hoạt động</span>
                            <h2 style={{ margin: '6px 0 0', color: '#52c41a' }}>{activeClasses} lớp</h2>
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card className={styles['portal-card']} style={{ borderLeft: '4px solid #fa8c16' }}>
                            <span style={{ color: '#888', fontSize: 13 }}>Phòng đào tạo sử dụng</span>
                            <h2 style={{ margin: '6px 0 0', color: '#fa8c16' }}>{roomOptions.length} phòng</h2>
                        </Card>
                    </Col>
                </Row>

                {/* Bộ lọc */}
                <Card className={styles['portal-card']} style={{ marginBottom: 16 }}>
                    <div className={styles['student-filters']}>
                        <Input
                            prefix={<SearchOutlined />}
                            placeholder="Tìm kiếm môn học, tên lớp hoặc phòng..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ minWidth: 260 }}
                        />
                        <Select
                            allowClear
                            placeholder="Lọc theo phòng học"
                            value={selectedRoom}
                            onChange={setSelectedRoom}
                            style={{ minWidth: 160 }}
                            options={roomOptions}
                        />
                        <Select
                            allowClear
                            placeholder="Lọc theo trạng thái"
                            value={statusFilter}
                            onChange={setStatusFilter}
                            style={{ minWidth: 160 }}
                            options={[
                                { label: 'Đang mở (OPEN)', value: 'OPEN' },
                                { label: 'Đã đầy (FULL)', value: 'FULL' },
                                { label: 'Đang học (ACTIVE)', value: 'ACTIVE' },
                                { label: 'Hoàn thành (COMPLETED)', value: 'COMPLETED' },
                                { label: 'Đã hủy (CANCELLED)', value: 'CANCELLED' },
                            ]}
                        />
                    </div>
                </Card>

                {/* Danh sách các ca giảng dạy */}
                {!scheduleItems.length ? (
                    <TeacherEmpty description="Bạn chưa có lịch giảng dạy nào phù hợp với bộ lọc." />
                ) : (
                    <Row gutter={[16, 16]}>
                        {scheduleItems.map(item => {
                            const courseTitle =
                                typeof item.course_id === 'object' ? item.course_id?.name : 'Khóa học';
                            const studentsInClass = data.students.filter(s => {
                                const cid = typeof s.class_id === 'object' ? s.class_id?._id : s.class_id;
                                return cid === item._id;
                            });

                            return (
                                <Col xs={24} md={12} key={item._id}>
                                    <Card
                                        hoverable
                                        className={`${styles['portal-card']} ${styles['teacher-schedule-card']}`}
                                        style={{ height: '100%', borderTop: '3px solid #1677ff' }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                                <div
                                                    style={{
                                                        width: 48,
                                                        height: 48,
                                                        borderRadius: 8,
                                                        background: '#e6f4ff',
                                                        color: '#1677ff',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: 22,
                                                    }}
                                                >
                                                    <CalendarOutlined />
                                                </div>
                                                <div>
                                                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                                                        {item.class_name || 'Lớp học'}
                                                    </h3>
                                                    <span style={{ color: '#1677ff', fontSize: 13, fontWeight: 500 }}>
                                                        {courseTitle}
                                                    </span>
                                                </div>
                                            </div>
                                            {statusTag(item.status)}
                                        </div>

                                        <div className={styles['teacher-schedule-meta']}>
                                            <Space>
                                                <ClockCircleOutlined style={{ color: '#1677ff' }} />
                                                <b>Khung giờ:</b>
                                                <Tag color="blue" style={{ fontSize: 13, padding: '2px 8px' }}>
                                                    {item.start_time || '—'} ~ {item.end_time || '—'}
                                                </Tag>
                                            </Space>
                                            <Space>
                                                <EnvironmentOutlined style={{ color: '#52c41a' }} />
                                                <b>Phòng:</b>
                                                <Tag color="green">{item.room || 'Chưa có phòng'}</Tag>
                                            </Space>
                                        </div>

                                        <div className={styles['teacher-schedule-details']}>
                                            <div>
                                                <CalendarOutlined />
                                                <span><b>Thời gian khóa</b>{dateText(item.start_date)} – {dateText(item.end_date)}</span>
                                            </div>
                                            <div>
                                                <TeamOutlined />
                                                <span><b>Sĩ số hiện tại</b>{studentsInClass.length} / {item.max_student || 30} học viên</span>
                                            </div>
                                        </div>

                                        <Divider style={{ margin: '12px 0' }} />

                                        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                            <Button
                                                size="small"
                                                onClick={() => navigate('/client/teacher/classes')}
                                            >
                                                Quản lý lớp
                                            </Button>
                                            <Button
                                                size="small"
                                                type="primary"
                                                icon={<CheckCircleOutlined />}
                                                onClick={() => navigate('/client/teacher/classes')}
                                            >
                                                Vào điểm danh
                                            </Button>
                                        </Space>
                                    </Card>
                                </Col>
                            );
                        })}
                    </Row>
                )}
            </TeacherState>
        </main>
    );
};

export default TeacherSchedule;
