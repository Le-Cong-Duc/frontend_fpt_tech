import { useMemo, useState } from 'react';
import { Card, Input, Select, Space, Tag } from 'antd';
import { CalendarOutlined, ClockCircleOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { ManagerEmpty, ManagerState, enrollmentsForClass, statusTag, teachersOf, useManagerData } from './manager.shared';
import styles from '@/styles/client.module.scss';

const ManagerSchedule = () => {
    const navigate = useNavigate();
    const data = useManagerData();
    const [search, setSearch] = useState('');
    const [room, setRoom] = useState<string>();
    const [teacher, setTeacher] = useState<string>();
    const [status, setStatus] = useState<string>();

    const teachers = useMemo(() => teachersOf(data.users), [data.users]);

    const rows = useMemo(
        () =>
            data.classrooms.filter(item => {
                const matchSearch =
                    !search ||
                    `${item.class_name || ''} ${item.course_id?.name || ''} ${item.teacher_id?.name || ''}`
                        .toLowerCase()
                        .includes(search.toLowerCase());
                const matchRoom = !room || item.room === room;
                const teacherId = typeof item.teacher_id === 'object' ? item.teacher_id?._id : item.teacher_id;
                const matchTeacher = !teacher || teacherId === teacher;
                const matchStatus = !status || item.status === status;
                return matchSearch && matchRoom && matchTeacher && matchStatus;
            }),
        [data.classrooms, room, teacher, status, search]
    );

    return (
        <main className={`${styles.container} ${styles['manager-page']}`}>
            <section className={styles['manager-heading']}>
                <div>
                    <span>MANAGER / SCHEDULE</span>
                    <h1>Lịch học & Giảng dạy toàn trung tâm</h1>
                    <p>Tổng hợp thời khóa biểu các lớp học, ca dạy của giảng viên và phân bổ phòng học.</p>
                </div>
            </section>

            <ManagerState loading={data.loading} error={data.error}>
                {!rows.length && !search && !room && !teacher ? (
                    <ManagerEmpty description="Chưa có thời khóa biểu nào được thiết lập" />
                ) : (
                    <>
                        <div className={styles['manager-filters']}>
                            <Input.Search
                                placeholder="Tìm theo tên lớp, khóa học hoặc giáo viên..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{ minWidth: 260 }}
                            />
                            <Select
                                allowClear
                                placeholder="Lọc theo phòng học"
                                value={room}
                                onChange={setRoom}
                                style={{ minWidth: 160 }}
                                options={[...new Set(data.classrooms.map(item => item.room).filter(Boolean))].map(value => ({
                                    label: `Phòng ${value}`,
                                    value: value || '',
                                }))}
                            />
                            <Select
                                allowClear
                                placeholder="Lọc theo giáo viên"
                                value={teacher}
                                onChange={setTeacher}
                                style={{ minWidth: 180 }}
                                options={teachers.map(t => ({ label: t.name, value: t._id || '' }))}
                            />
                            <Select
                                allowClear
                                placeholder="Trạng thái lớp"
                                value={status}
                                onChange={setStatus}
                                style={{ minWidth: 140 }}
                                options={[
                                    { label: 'Đang mở (OPEN)', value: 'OPEN' },
                                    { label: 'Đang học (ACTIVE)', value: 'ACTIVE' },
                                    { label: 'Hoàn thành (COMPLETED)', value: 'COMPLETED' },
                                ]}
                            />
                        </div>

                        {!rows.length ? (
                            <ManagerEmpty description="Không tìm thấy lịch học phù hợp với bộ lọc" />
                        ) : (
                            <div className={styles['manager-schedule-list']}>
                                {rows.map(item => {
                                    const studentCount = enrollmentsForClass(item._id || '', data.enrollments).length;
                                    return (
                                        <Card
                                            className={`${styles['portal-card']} ${styles['manager-schedule-card']}`}
                                            key={item._id}
                                            hoverable
                                            onClick={() => navigate(`/client/manager/classes/${item._id}`)}
                                        >
                                            <div className={styles['manager-schedule-time']}>
                                                <ClockCircleOutlined />
                                                <b>{item.start_time || '—'}</b>
                                                <span>{item.end_time || '—'}</span>
                                            </div>
                                            <div className={styles['manager-schedule-info']}>
                                                <h3>{item.class_name || 'Lớp học'}</h3>
                                                <p>
                                                    {item.course_id?.name || 'Chưa gán khóa học'} ·{' '}
                                                    <span style={{ color: '#1677ff' }}>
                                                        <UserOutlined /> {item.teacher_id?.name || 'Chưa phân công GV'}
                                                    </span>
                                                </p>
                                                <Space size="middle" style={{ marginTop: 4 }}>
                                                    <Tag color="blue">Phòng: {item.room || 'Chưa xếp phòng'}</Tag>
                                                    <span>
                                                        <TeamOutlined /> Sĩ số: {studentCount}/{item.max_student || '—'}
                                                    </span>
                                                    {item.start_date && (
                                                        <span>
                                                            <CalendarOutlined /> {item.start_date} ~ {item.end_date || ''}
                                                        </span>
                                                    )}
                                                </Space>
                                            </div>
                                            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                                                {statusTag(item.status)}
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </ManagerState>
        </main>
    );
};

export default ManagerSchedule;
