import { useMemo, useState } from 'react';
import { Button, Card, Descriptions, Input, Modal, Select, Space, Table, Tag, message } from 'antd';
import { PlusOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { callCreateEnrollment } from '@/config/api';
import { ManagerEmpty, ManagerState, idOf, statusTag, studentsOf, useManagerData } from './manager.shared';
import styles from '@/styles/client.module.scss';

const ManagerStudents = () => {
    const navigate = useNavigate();
    const data = useManagerData();
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<(typeof data.users)[number] | null>(null);
    const [showClassAssignment, setShowClassAssignment] = useState(false);
    const [selectedClassId, setSelectedClassId] = useState<string>();
    const [savingAssignment, setSavingAssignment] = useState(false);

    const students = useMemo(
        () =>
            studentsOf(data.users).filter(item =>
                `${item.name || ''} ${item.email || ''} ${item.phone || ''}`
                    .toLowerCase()
                    .includes(search.toLowerCase())
            ),
        [data.users, search]
    );

    const studentEnrollments = useMemo(() => {
        if (!selected?._id) return [];
        return data.enrollments.filter(enrollment => idOf(enrollment.student_id) === selected._id);
    }, [selected, data.enrollments]);

    const availableClasses = useMemo(() => {
        const registeredCourseIds = new Set(
            studentEnrollments
                .filter(enrollment => enrollment.status?.toUpperCase() !== 'CANCELLED')
                .map(enrollment => {
                    const classroom = typeof enrollment.class_id === 'object'
                        ? enrollment.class_id
                        : data.classrooms.find(item => item._id === idOf(enrollment.class_id));
                    return idOf(classroom?.course_id);
                })
                .filter(Boolean)
        );
        return data.classrooms.filter(classroom =>
            classroom.status === 'OPEN' &&
            !registeredCourseIds.has(idOf(classroom.course_id))
        );
    }, [data.classrooms, studentEnrollments]);

    const assignStudentToClass = async () => {
        if (!selected?._id || !selectedClassId) return;
        setSavingAssignment(true);
        try {
            const response = await callCreateEnrollment({
                student_id: selected._id,
                class_id: selectedClassId,
                register_date: new Date().toISOString(),
                status: 'WAITING_PAYMENT',
            });
            if (!response?.data) {
                message.error(response?.message || 'Không thể xếp lớp cho học viên.');
                return;
            }
            message.success('Đã xếp lớp và tạo hóa đơn học phí cho học viên.');
            setShowClassAssignment(false);
            setSelectedClassId(undefined);
            await data.refresh();
        } catch {
            message.error('Không thể xếp lớp cho học viên. Vui lòng thử lại.');
        } finally {
            setSavingAssignment(false);
        }
    };

    return (
        <main className={`${styles.container} ${styles['manager-page']}`}>
            <section className={styles['manager-heading']}>
                <div>
                    <span>MANAGER / STUDENTS</span>
                    <h1>Quản lý Học viên</h1>
                    <p>Theo dõi học viên, tiến độ tham gia khóa học và tình trạng lớp.</p>
                </div>
            </section>

            <ManagerState loading={data.loading} error={data.error}>
                {!students.length ? (
                    <ManagerEmpty description="Chưa có dữ liệu học viên trong hệ thống" />
                ) : (
                    <Card className={styles['portal-card']}>
                        <div className={styles['manager-filters']}>
                            <Input.Search
                                placeholder="Tìm kiếm theo tên học viên, email hoặc số điện thoại..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{ maxWidth: 400 }}
                            />
                        </div>
                        <Table
                            rowKey="_id"
                            dataSource={students}
                            pagination={{ pageSize: 10, showTotal: total => `Tổng số ${total} học viên` }}
                            scroll={{ x: 800 }}
                            columns={[
                                {
                                    title: 'STT',
                                    width: 60,
                                    render: (_: unknown, __: unknown, index: number) => index + 1,
                                },
                                {
                                    title: 'Học viên',
                                    render: (_: unknown, item) => (
                                        <span className={styles['manager-person']} style={{ fontWeight: 600 }}>
                                            <UserOutlined style={{ marginRight: 6, color: '#1677ff' }} />
                                            {item.name}
                                        </span>
                                    ),
                                },
                                { title: 'Email', dataIndex: 'email' },
                                {
                                    title: 'Điện thoại',
                                    dataIndex: 'phone',
                                    render: (value?: string) => value || 'Chưa cập nhật',
                                },
                                {
                                    title: 'Lớp tham gia',
                                    render: (_: unknown, item) => {
                                        const myEnrollments = data.enrollments.filter(
                                            enrollment => idOf(enrollment.student_id) === item._id
                                        );
                                        if (!myEnrollments.length) return <Tag>Chưa xếp lớp</Tag>;
                                        return (
                                            <Space wrap size={[0, 4]}>
                                                {myEnrollments.map(e => {
                                                    const className =
                                                        typeof e.class_id === 'object'
                                                            ? e.class_id?.class_name
                                                            : e.class_id;
                                                    return (
                                                        <Tag color="cyan" key={e._id}>
                                                            {className || 'Lớp học'}
                                                        </Tag>
                                                    );
                                                })}
                                            </Space>
                                        );
                                    },
                                },
                                {
                                    title: 'Trạng thái',
                                    render: (_: unknown, item) => {
                                        const myEnrollments = data.enrollments.filter(
                                            enrollment => idOf(enrollment.student_id) === item._id
                                        );
                                        return myEnrollments.length ? (
                                            statusTag(myEnrollments[0].status)
                                        ) : (
                                            <Tag color="default">Chưa tham gia lớp</Tag>
                                        );
                                    },
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
                title={`Thông tin học viên: ${selected?.name || ''}`}
                open={Boolean(selected)}
                footer={null}
                onCancel={() => setSelected(null)}
                width={700}
            >
                {selected && (
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                        <div>
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => setShowClassAssignment(value => !value)}
                            >
                                Xếp lớp
                            </Button>
                            {showClassAssignment && (
                                <Space.Compact style={{ display: 'flex', width: '100%', marginTop: 10 }}>
                                    <Select
                                        showSearch
                                        optionFilterProp="label"
                                        placeholder="Chọn lớp đang mở"
                                        value={selectedClassId}
                                        onChange={setSelectedClassId}
                                        options={availableClasses.map(classroom => ({
                                            value: classroom._id || '',
                                            label: `${classroom.class_name || 'Lớp học'} · ${classroom.course_id?.name || 'Khóa học'}${classroom.room ? ` · Phòng ${classroom.room}` : ''}`,
                                        }))}
                                        notFoundContent="Không có lớp đang mở phù hợp"
                                        style={{ flex: 1 }}
                                    />
                                    <Button
                                        type="primary"
                                        disabled={!selectedClassId}
                                        loading={savingAssignment}
                                        onClick={() => void assignStudentToClass()}
                                    >
                                        Xác nhận xếp lớp
                                    </Button>
                                </Space.Compact>
                            )}
                        </div>
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
                            <h4 style={{ marginBottom: 10 }}>
                                Các lớp đã ghi danh ({studentEnrollments.length} lớp):
                            </h4>
                            {!studentEnrollments.length ? (
                                <p style={{ color: '#888' }}>Học viên này chưa tham gia lớp học nào.</p>
                            ) : (
                                <Table
                                    size="small"
                                    pagination={false}
                                    rowKey="_id"
                                    dataSource={studentEnrollments}
                                    columns={[
                                        {
                                            title: 'Lớp học',
                                            render: (_: unknown, row) => {
                                                const classroom =
                                                    typeof row.class_id === 'object' ? row.class_id : null;
                                                const className =
                                                    classroom?.class_name ||
                                                    (typeof row.class_id === 'string' ? row.class_id : 'Lớp học');
                                                return classroom?._id ? (
                                                    <a
                                                        onClick={() => {
                                                            setSelected(null);
                                                            navigate(`/client/manager/classes/${classroom._id}`);
                                                        }}
                                                        style={{ fontWeight: 600 }}
                                                    >
                                                        {className}
                                                    </a>
                                                ) : (
                                                    <b>{className}</b>
                                                );
                                            },
                                        },
                                        {
                                            title: 'Trạng thái học',
                                            dataIndex: 'status',
                                            render: statusTag,
                                        },
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

export default ManagerStudents;
