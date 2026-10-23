import { useMemo, useState } from 'react';
import { Card, Col, Input, Row, Select, Space, Tag } from 'antd';
import {
    CalendarOutlined,
    ClockCircleOutlined,
    SearchOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/redux/hooks';
import { StudentEmpty, StudentState, dateText, enrollmentCourse, statusTag, useStudentData } from './student.shared';
import styles from '@/styles/client.module.scss';

const StudentSchedule = () => {
    const navigate = useNavigate();
    const user = useAppSelector(state => state.account.user);
    const data = useStudentData(user._id);
    const [search, setSearch] = useState('');
    const [room, setRoom] = useState<string>();
    const activeEnrollments = useMemo(
        () => data.enrollments.filter(item => item.status?.toUpperCase() !== 'CANCELLED'),
        [data.enrollments]
    );

    const items = useMemo(
        () =>
            activeEnrollments.filter(item => {
                const courseName = enrollmentCourse(item);
                const className = item.class_id?.class_name || '';
                const teacherName = item.class_id?.teacher_id?.name || '';
                const matchSearch =
                    !search ||
                    `${courseName} ${className} ${teacherName}`.toLowerCase().includes(search.toLowerCase());
                const matchRoom = !room || item.class_id?.room === room;
                return matchSearch && matchRoom;
            }),
        [activeEnrollments, room, search]
    );

    const availableRooms = useMemo(() => {
        return [...new Set(activeEnrollments.map(item => item.class_id?.room).filter(Boolean))];
    }, [activeEnrollments]);

    return (
        <main className={`${styles.container} ${styles['student-page']}`}>
            <section className={styles['student-heading']}>
                <div>
                    <span>STUDENT / CALENDAR</span>
                    <h1>Thời khóa biểu của tôi</h1>
                    <p>Lịch học cá nhân được tổng hợp tự động từ tất cả các lớp bạn đang tham gia.</p>
                </div>
            </section>

            <StudentState loading={data.loading} error={data.error}>
                {!activeEnrollments.length ? (
                    <StudentEmpty description="Bạn chưa đăng ký lớp học nào để hiển thị thời khóa biểu." />
                ) : (
                    <>
                        <div className={styles['student-filters']}>
                            <Input
                                prefix={<SearchOutlined />}
                                placeholder="Tìm theo tên môn học, lớp học hoặc giảng viên..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{ minWidth: 300 }}
                            />
                            <Select
                                allowClear
                                placeholder="Lọc theo phòng học"
                                value={room}
                                onChange={setRoom}
                                style={{ minWidth: 160 }}
                                options={availableRooms.map(value => ({
                                    label: `Phòng ${value}`,
                                    value: value || '',
                                }))}
                            />
                        </div>

                        {!items.length ? (
                            <StudentEmpty description="Không có lịch học nào phù hợp với bộ lọc tìm kiếm." />
                        ) : (
                            <div className={styles['student-schedule-list']}>
                                {items.map(item => (
                                    <Card
                                        className={`${styles['portal-card']} ${styles['manager-schedule-card']}`}
                                        key={item._id}
                                        hoverable
                                        onClick={() => navigate('/client/student/classes')}
                                    >
                                        <div className={styles['manager-schedule-time']}>
                                            <ClockCircleOutlined />
                                            <b>{item.class_id?.start_time || '—'}</b>
                                            <span>{item.class_id?.end_time || '—'}</span>
                                        </div>
                                        <div className={styles['manager-schedule-date']}>
                                            <CalendarOutlined />
                                            <span>{dateText(item.class_id?.start_date)}</span>
                                            {item.class_id?.end_date && <small>đến {dateText(item.class_id.end_date)}</small>}
                                        </div>
                                        <div className={styles['manager-schedule-info']}>
                                            <h3>{enrollmentCourse(item)}</h3>
                                            <p>
                                                Lớp: {item.class_id?.class_name || 'Chưa cập nhật'} ·{' '}
                                                <span>
                                                    <UserOutlined /> {item.class_id?.teacher_id?.name || 'Chưa phân công'}
                                                </span>
                                            </p>
                                            <Space size="middle" style={{ marginTop: 4 }}>
                                                <Tag color="blue">Phòng: {item.class_id?.room || 'Chưa xếp phòng'}</Tag>
                                            </Space>
                                        </div>
                                        <div className={styles['manager-schedule-status']}>
                                            {statusTag(item.status)}
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </StudentState>
        </main>
    );
};

export default StudentSchedule;
