import { useMemo, useState } from 'react';
import { Card, Descriptions, Input, Modal, Space, Table, Tag } from 'antd';
import { BookOutlined, CalendarOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { ManagerEmpty, ManagerState, enrollmentsForClass, statusTag, teachersOf, useManagerData } from './manager.shared';
import styles from '@/styles/client.module.scss';

const ManagerTeachers = () => {
    const navigate = useNavigate();
    const data = useManagerData();
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<(typeof data.users)[number] | null>(null);

    const teachers = useMemo(
        () =>
            teachersOf(data.users).filter(item =>
                `${item.name || ''} ${item.email || ''} ${item.phone || ''}`
                    .toLowerCase()
                    .includes(search.toLowerCase())
            ),
        [data.users, search]
    );

    const teacherClasses = useMemo(() => {
        if (!selected?._id) return [];
        return data.classrooms.filter(room => {
            const teacherId = typeof room.teacher_id === 'object' ? room.teacher_id?._id : room.teacher_id;
            return teacherId === selected._id;
        });
    }, [selected, data.classrooms]);

    return (
        <main className={`${styles.container} ${styles['manager-page']}`}>
            <section className={styles['manager-heading']}>
                <div>
                    <span>MANAGER / TEACHERS</span>
                    <h1>Đội ngũ Giáo viên</h1>
                    <p>Theo dõi giảng viên, lịch dạy và các lớp học đang phụ trách.</p>
                </div>
            </section>

            <ManagerState loading={data.loading} error={data.error}>
                {!teachers.length ? (
                    <ManagerEmpty description="Chưa có dữ liệu giáo viên trong hệ thống" />
                ) : (
                    <Card className={styles['portal-card']}>
                        <div className={styles['manager-filters']}>
                            <Input.Search
                                placeholder="Tìm kiếm theo tên giáo viên, email hoặc số điện thoại..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{ maxWidth: 400 }}
                            />
                        </div>
                        <Table
                            rowKey="_id"
                            dataSource={teachers}
                            pagination={{ pageSize: 10, showTotal: total => `Tổng số ${total} giáo viên` }}
                            scroll={{ x: 750 }}
                            columns={[
                                {
                                    title: 'STT',
                                    width: 60,
                                    render: (_: unknown, __: unknown, index: number) => index + 1,
                                },
                                {
                                    title: 'Giáo viên',
                                    render: (_: unknown, item) => (
                                        <span className={styles['manager-person']} style={{ fontWeight: 600 }}>
                                            <UserOutlined style={{ marginRight: 6, color: '#1677ff' }} />
                                            {item.name}
                                        </span>
                                    ),
                                },
                                { title: 'Email', dataIndex: 'email' },
                                {
                                    title: 'Số điện thoại',
                                    dataIndex: 'phone',
                                    render: (value?: string) => value || 'Chưa cập nhật',
                                },
                                {
                                    title: 'Lớp đang dạy',
                                    render: (_: unknown, item) => {
                                        const count = data.classrooms.filter(room => {
                                            const teacherId =
                                                typeof room.teacher_id === 'object'
                                                    ? room.teacher_id?._id
                                                    : room.teacher_id;
                                            return teacherId === item._id;
                                        }).length;
                                        return <Tag color={count > 0 ? 'blue' : 'default'}>{count} lớp</Tag>;
                                    },
                                },
                                {
                                    title: 'Trạng thái',
                                    render: () => <Tag color="green">Đang công tác</Tag>,
                                },
                                {
                                    title: 'Thao tác',
                                    render: (_: unknown, item) => (
                                        <a onClick={() => setSelected(item)} style={{ fontWeight: 500 }}>
                                            Xem chi tiết
                                        </a>
                                    ),
                                },
                            ]}
                        />
                    </Card>
                )}
            </ManagerState>

            <Modal
                title={`Hồ sơ giáo viên: ${selected?.name || ''}`}
                open={Boolean(selected)}
                footer={null}
                onCancel={() => setSelected(null)}
                width={700}
            >
                {selected && (
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                        <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
                            <Descriptions.Item label="Họ tên">
                                <b>{selected.name}</b>
                            </Descriptions.Item>
                            <Descriptions.Item label="Email">{selected.email}</Descriptions.Item>
                            <Descriptions.Item label="Điện thoại">{selected.phone || 'Chưa cập nhật'}</Descriptions.Item>
                            <Descriptions.Item label="Địa chỉ">{selected.address || 'Chưa cập nhật'}</Descriptions.Item>
                            <Descriptions.Item label="Tuổi">{selected.age || '—'}</Descriptions.Item>
                            <Descriptions.Item label="Giới tính">
                                {selected.gender === 'MALE' ? 'Nam' : selected.gender === 'FEMALE' ? 'Nữ' : 'Khác'}
                            </Descriptions.Item>
                        </Descriptions>

                        <div>
                            <h4 style={{ marginBottom: 10 }}>Các lớp đang phụ trách ({teacherClasses.length} lớp):</h4>
                            {!teacherClasses.length ? (
                                <p style={{ color: '#888' }}>Giáo viên này hiện chưa được phân công lớp học nào.</p>
                            ) : (
                                <Table
                                    size="small"
                                    pagination={false}
                                    rowKey="_id"
                                    dataSource={teacherClasses}
                                    columns={[
                                        {
                                            title: 'Tên lớp',
                                            render: (_: unknown, room) => (
                                                <a
                                                    onClick={() => {
                                                        const id = room._id;
                                                        setSelected(null);
                                                        navigate(`/client/manager/classes/${id}`);
                                                    }}
                                                    style={{ fontWeight: 600 }}
                                                >
                                                    {room.class_name || room._id}
                                                </a>
                                            ),
                                        },
                                        {
                                            title: 'Khóa học',
                                            render: (_: unknown, room) => room.course_id?.name || '—',
                                        },
                                        { title: 'Phòng', dataIndex: 'room', render: (val?: string) => val || '—' },
                                        {
                                            title: 'Sĩ số',
                                            render: (_: unknown, room) =>
                                                `${enrollmentsForClass(room._id || '', data.enrollments).length}/${room.max_student || '—'}`,
                                        },
                                        { title: 'Trạng thái', dataIndex: 'status', render: statusTag },
                                    ]}
                                />
                            )}
                        </div>
                    </Space>
                )}
            </Modal>
        </main>
    );
};

export default ManagerTeachers;
