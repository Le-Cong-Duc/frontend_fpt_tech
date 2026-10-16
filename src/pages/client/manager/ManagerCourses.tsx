import { useMemo, useState } from 'react';
import { Card, Descriptions, Input, Modal, Select, Table, Tag } from 'antd';
import { BookOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { ManagerEmpty, ManagerState, enrollmentsForClass, money, statusTag, useManagerData } from './manager.shared';
import type { ICourse } from '@/types/backend';
import styles from '@/styles/client.module.scss';

const ManagerCourses = () => {
    const navigate = useNavigate();
    const data = useManagerData();
    const [search, setSearch] = useState('');
    const [level, setLevel] = useState<string>();
    const [selected, setSelected] = useState<ICourse | null>(null);

    const courses = useMemo(
        () =>
            data.courses.filter(
                item =>
                    item.name.toLowerCase().includes(search.toLowerCase()) &&
                    (!level || item.level === level)
            ),
        [data.courses, level, search]
    );

    const courseClasses = useMemo(() => {
        if (!selected?._id) return [];
        return data.classrooms.filter(item => {
            const courseId = typeof item.course_id === 'object' ? item.course_id?._id : item.course_id;
            return courseId === selected._id;
        });
    }, [selected, data.classrooms]);

    return (
        <main className={`${styles.container} ${styles['manager-page']}`}>
            <section className={styles['manager-heading']}>
                <div>
                    <span>MANAGER / COURSES</span>
                    <h1>Chương trình Khóa học</h1>
                    <p>Tra cứu danh mục khóa học, học phí và các lớp đào tạo thuộc từng khóa.</p>
                </div>
            </section>

            <ManagerState loading={data.loading} error={data.error}>
                {!courses.length ? (
                    <ManagerEmpty description="Chưa có dữ liệu khóa học trong hệ thống" />
                ) : (
                    <Card className={styles['portal-card']}>
                        <div className={styles['manager-filters']}>
                            <Input.Search
                                placeholder="Tìm kiếm tên khóa học..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{ minWidth: 260 }}
                            />
                            <Select
                                allowClear
                                placeholder="Lọc cấp độ"
                                value={level}
                                onChange={setLevel}
                                style={{ minWidth: 160 }}
                                options={[...new Set(data.courses.map(item => item.level).filter(Boolean))].map(value => ({
                                    label: value,
                                    value: value || '',
                                }))}
                            />
                        </div>

                        <Table
                            rowKey="_id"
                            dataSource={courses}
                            pagination={{ pageSize: 8, showTotal: total => `Tổng số ${total} khóa học` }}
                            scroll={{ x: 850 }}
                            columns={[
                                {
                                    title: 'STT',
                                    width: 60,
                                    render: (_: unknown, __: unknown, index: number) => index + 1,
                                },
                                {
                                    title: 'Khóa học',
                                    render: (_: unknown, item) => (
                                        <span className={styles['manager-person']} style={{ fontWeight: 600 }}>
                                            <BookOutlined style={{ marginRight: 6, color: '#1677ff' }} />
                                            {item.name}
                                        </span>
                                    ),
                                },
                                {
                                    title: 'Mô tả',
                                    dataIndex: 'description',
                                    ellipsis: true,
                                    render: (val?: string) => val || 'Chưa cập nhật mô tả',
                                },
                                {
                                    title: 'Cấp độ',
                                    dataIndex: 'level',
                                    render: (val?: string) => <Tag color="blue">{val || 'Mọi cấp độ'}</Tag>,
                                },
                                {
                                    title: 'Thời lượng',
                                    dataIndex: 'duration',
                                    render: (val?: string) => val || 'Linh hoạt',
                                },
                                {
                                    title: 'Học phí',
                                    render: (_: unknown, item) => <b>{money(item.price)}</b>,
                                },
                                {
                                    title: 'Số lớp mở',
                                    render: (_: unknown, item) => {
                                        const count = data.classrooms.filter(room => {
                                            const courseId =
                                                typeof room.course_id === 'object'
                                                    ? room.course_id?._id
                                                    : room.course_id;
                                            return courseId === item._id;
                                        }).length;
                                        return <Tag color={count > 0 ? 'cyan' : 'default'}>{count} lớp</Tag>;
                                    },
                                },
                                {
                                    title: 'Trạng thái',
                                    render: (_: unknown, item) => (
                                        <Tag color={item.status === 'ACTIVE' ? 'green' : 'gold'}>
                                            {item.status || 'Đang mở'}
                                        </Tag>
                                    ),
                                },
                                {
                                    title: 'Thao tác',
                                    render: (_: unknown, item) => (
                                        <a onClick={() => setSelected(item)} style={{ fontWeight: 500 }}>
                                            Chi tiết
                                        </a>
                                    ),
                                },
                            ]}
                        />
                    </Card>
                )}
            </ManagerState>

            <Modal
                title={`Khóa học: ${selected?.name || ''}`}
                open={Boolean(selected)}
                footer={null}
                onCancel={() => setSelected(null)}
                width={720}
            >
                {selected && (
                    <>
                        <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small" style={{ marginBottom: 16 }}>
                            <Descriptions.Item label="Tên khóa học" span={2}>
                                <b>{selected.name}</b>
                            </Descriptions.Item>
                            <Descriptions.Item label="Học phí">
                                <b style={{ color: '#d4380d' }}>{money(selected.price)}</b>
                            </Descriptions.Item>
                            <Descriptions.Item label="Cấp độ">{selected.level || 'Mọi trình độ'}</Descriptions.Item>
                            <Descriptions.Item label="Thời lượng">{selected.duration || 'Linh hoạt'}</Descriptions.Item>
                            <Descriptions.Item label="Trạng thái">
                                <Tag color={selected.status === 'ACTIVE' ? 'green' : 'gold'}>
                                    {selected.status || 'Đang mở'}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Mô tả" span={2}>
                                {selected.description || 'Chưa có mô tả chi tiết.'}
                            </Descriptions.Item>
                        </Descriptions>

                        <h4 style={{ marginBottom: 10 }}>Các lớp học thuộc khóa này ({courseClasses.length} lớp):</h4>
                        {!courseClasses.length ? (
                            <p style={{ color: '#888' }}>Chưa có lớp học nào được mở cho khóa học này.</p>
                        ) : (
                            <Table
                                size="small"
                                pagination={false}
                                rowKey="_id"
                                dataSource={courseClasses}
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
                                        title: 'Giáo viên',
                                        render: (_: unknown, room) => room.teacher_id?.name || 'Chưa phân công',
                                    },
                                    { title: 'Phòng học', dataIndex: 'room', render: (val?: string) => val || '—' },
                                    {
                                        title: 'Sĩ số',
                                        render: (_: unknown, room) =>
                                            `${enrollmentsForClass(room._id || '', data.enrollments).length}/${room.max_student || '—'}`,
                                    },
                                    { title: 'Trạng thái', dataIndex: 'status', render: statusTag },
                                ]}
                            />
                        )}
                    </>
                )}
            </Modal>
        </main>
    );
};

export default ManagerCourses;
