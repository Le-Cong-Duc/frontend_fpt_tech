import { useMemo, useState } from 'react';
import { Button, Card, Descriptions, Form, Input, InputNumber, Modal, Popconfirm, Select, Table, Tag, message } from 'antd';
import { BookOutlined, EditOutlined, PlusOutlined, StopOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { callCreateCourse, callUpdateClassroom, callUpdateCourse } from '@/config/api';
import { ManagerEmpty, ManagerState, enrollmentsForClass, money, statusTag, useManagerData } from './manager.shared';
import type { ICourse } from '@/types/backend';
import styles from '@/styles/client.module.scss';

const ManagerCourses = () => {
    const navigate = useNavigate();
    const data = useManagerData();
    const [courseForm] = Form.useForm();
    const [search, setSearch] = useState('');
    const [level, setLevel] = useState<string>();
    const [selected, setSelected] = useState<ICourse | null>(null);
    const [editingCourse, setEditingCourse] = useState<ICourse | null>(null);
    const [courseFormOpen, setCourseFormOpen] = useState(false);
    const [savingCourse, setSavingCourse] = useState(false);

    const openCourseForm = (course?: ICourse) => {
        setEditingCourse(course || null);
        courseForm.resetFields();
        if (course) {
            courseForm.setFieldsValue(course);
        } else {
            courseForm.setFieldsValue({ status: 'ACTIVE' });
        }
        setCourseFormOpen(true);
    };

    const saveCourse = async (values: Omit<ICourse, '_id'>) => {
        setSavingCourse(true);
        try {
            const response = editingCourse?._id
                ? await callUpdateCourse(values, editingCourse._id)
                : await callCreateCourse(values);
            if (!response?.data) {
                message.error(response?.message || 'Không thể lưu khóa học.');
                return;
            }
            message.success(editingCourse ? 'Đã cập nhật khóa học.' : 'Đã tạo khóa học.');
            setCourseFormOpen(false);
            await data.refresh();
        } catch {
            message.error('Không thể lưu khóa học. Vui lòng thử lại.');
        } finally {
            setSavingCourse(false);
        }
    };

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

    const closeClass = async (classId?: string) => {
        if (!classId) return;
        try {
            const response = await callUpdateClassroom({ status: 'CANCELLED' }, classId);
            if (!response?.data) {
                message.error(response?.message || 'Không thể đóng lớp.');
                return;
            }
            message.success('Đã đóng lớp học.');
            await data.refresh();
        } catch {
            message.error('Không thể đóng lớp. Vui lòng thử lại.');
        }
    };

    const closeCourse = async (course?: ICourse) => {
        if (!course?._id) return;
        try {
            const response = await callUpdateCourse({ status: 'INACTIVE' }, course._id);
            if (!response?.data) {
                message.error(response?.message || 'Không thể đóng khóa học.');
                return;
            }
            message.success('Đã đóng khóa học. Học viên mới không thể đăng ký khóa học này.');
            setSelected(current => current?._id === course._id ? { ...current, status: 'INACTIVE' } : current);
            await data.refresh();
        } catch {
            message.error('Không thể đóng khóa học. Vui lòng thử lại.');
        }
    };

    return (
        <main className={`${styles.container} ${styles['manager-page']}`}>
            <section className={styles['manager-heading']}>
                <div>
                    <span>MANAGER / COURSES</span>
                    <h1>Chương trình Khóa học</h1>
                    <p>Tra cứu danh mục khóa học, học phí và các lớp đào tạo thuộc từng khóa.</p>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => openCourseForm()}>
                    Tạo khóa học
                </Button>
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
                                            return courseId === item._id && room.status === 'OPEN';
                                        }).length;
                                        return <Tag color={count > 0 ? 'cyan' : 'default'}>{count} lớp</Tag>;
                                    },
                                },
                                {
                                    title: 'Trạng thái',
                                    render: (_: unknown, item) => statusTag(item.status),
                                },
                                {
                                    title: 'Thao tác',
                                    render: (_: unknown, item) => (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <a onClick={() => openCourseForm(item)} style={{ fontWeight: 500 }}>
                                                <EditOutlined /> Sửa
                                            </a>
                                            <a onClick={() => setSelected(item)} style={{ fontWeight: 500 }}>
                                                Chi tiết
                                            </a>
                                            {item.status?.toUpperCase() !== 'INACTIVE' && (
                                                <Popconfirm
                                                    title={`Đóng khóa học "${item.name}"?`}
                                                    description="Học viên mới sẽ không thể đăng ký các lớp thuộc khóa học này."
                                                    okText="Đóng khóa học"
                                                    cancelText="Hủy"
                                                    onConfirm={() => void closeCourse(item)}
                                                >
                                                    <a style={{ color: '#ff4d4f', fontWeight: 500 }}>
                                                        <StopOutlined /> Đóng
                                                    </a>
                                                </Popconfirm>
                                            )}
                                        </div>
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
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                            {selected.status?.toUpperCase() !== 'INACTIVE' && (
                                <Popconfirm
                                    title={`Đóng khóa học "${selected.name}"?`}
                                    description="Học viên mới sẽ không thể đăng ký các lớp thuộc khóa học này."
                                    okText="Đóng khóa học"
                                    cancelText="Hủy"
                                    onConfirm={() => void closeCourse(selected)}
                                >
                                    <Button danger icon={<StopOutlined />}>
                                        Đóng khóa học
                                    </Button>
                                </Popconfirm>
                            )}
                            <Button
                                icon={<EditOutlined />}
                                style={{ marginLeft: 8 }}
                                onClick={() => {
                                    const course = selected;
                                    setSelected(null);
                                    openCourseForm(course);
                                }}
                            >
                                Chỉnh sửa khóa học
                            </Button>
                        </div>
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
                                {statusTag(selected.status)}
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
                                    {
                                        title: 'Thao tác',
                                        render: (_: unknown, room) => room.status === 'CANCELLED' ? (
                                            <Tag color="red">Đã đóng</Tag>
                                        ) : (
                                            <Popconfirm
                                                title={`Đóng lớp ${room.class_name || ''}?`}
                                                description="Học viên sẽ không thể đăng ký lớp này nữa."
                                                okText="Đóng lớp"
                                                cancelText="Hủy"
                                                onConfirm={() => void closeClass(room._id)}
                                            >
                                                <Button size="small" danger>Đóng lớp</Button>
                                            </Popconfirm>
                                        ),
                                    },
                                ]}
                            />
                        )}
                    </>
                )}
            </Modal>

            <Modal
                title={editingCourse ? 'Chỉnh sửa khóa học' : 'Tạo khóa học mới'}
                open={courseFormOpen}
                onCancel={() => setCourseFormOpen(false)}
                onOk={() => courseForm.submit()}
                confirmLoading={savingCourse}
                okText={editingCourse ? 'Lưu thay đổi' : 'Tạo khóa học'}
                cancelText="Hủy"
                destroyOnClose
                width={680}
            >
                <Form form={courseForm} layout="vertical" onFinish={saveCourse}>
                    <Form.Item
                        name="name"
                        label="Tên khóa học"
                        rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập tên khóa học.' }]}
                    >
                        <Input maxLength={150} placeholder="Nhập tên khóa học" />
                    </Form.Item>
                    <Form.Item name="description" label="Mô tả">
                        <Input.TextArea rows={4} maxLength={2000} placeholder="Mô tả nội dung khóa học" />
                    </Form.Item>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                        <Form.Item name="level" label="Cấp độ">
                            <Select
                                showSearch
                                allowClear
                                placeholder="Chọn cấp độ"
                                optionFilterProp="label"
                                options={[
                                    { label: 'Cơ bản (BEGINNER)', value: 'BEGINNER' },
                                    { label: 'Trung cấp (INTERMEDIATE)', value: 'INTERMEDIATE' },
                                    { label: 'Nâng cao (ADVANCED)', value: 'ADVANCED' },
                                    ...[...new Set(data.courses.map(course => course.level).filter(
                                        (value): value is string => Boolean(value)
                                    ))]
                                        .filter(value => !['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].includes(value))
                                        .map(value => ({ label: value, value })),
                                ]}
                            />
                        </Form.Item>
                        <Form.Item name="duration" label="Thời lượng">
                            <Input maxLength={100} placeholder="Ví dụ: 3 tháng" />
                        </Form.Item>
                        <Form.Item name="price" label="Học phí">
                            <InputNumber min={0} precision={0} style={{ width: '100%' }} placeholder="Nhập học phí" />
                        </Form.Item>
                        <Form.Item name="status" label="Trạng thái">
                            <Select
                                placeholder="Chọn trạng thái"
                                options={[
                                    { label: 'Đang hoạt động', value: 'ACTIVE' },
                                    { label: 'Ngừng hoạt động', value: 'INACTIVE' },
                                    ...(editingCourse?.status &&
                                    !['ACTIVE', 'INACTIVE'].includes(editingCourse.status.toUpperCase())
                                        ? [{ label: editingCourse.status, value: editingCourse.status }]
                                        : []),
                                ]}
                            />
                        </Form.Item>
                    </div>
                </Form>
            </Modal>
        </main>
    );
};

export default ManagerCourses;
