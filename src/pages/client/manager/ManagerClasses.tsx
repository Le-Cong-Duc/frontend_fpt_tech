import { useMemo, useState } from 'react';
import { Button, Card, Col, DatePicker, Form, Input, InputNumber, Modal, Row, Select, Space, Table, message } from 'antd';
import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined, LinkOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { callCreateClassroom, callDeleteClassroom, callUpdateClassroom } from '@/config/api';
import {
    ManagerEmpty,
    ManagerState,
    enrollmentsForClass,
    statusTag,
    teachersOf,
    useManagerData,
} from './manager.shared';
import type { IClassroom, IClassroomWithDetails } from '@/types/backend';
import styles from '@/styles/client.module.scss';

const ManagerClasses = () => {
    const navigate = useNavigate();
    const data = useManagerData();
    const [form] = Form.useForm();
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<IClassroomWithDetails | null>(null);
    const [editing, setEditing] = useState('');
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<string>();
    const [course, setCourse] = useState<string>();
    const [teacher, setTeacher] = useState<string>();
    const [saving, setSaving] = useState(false);

    const teachers = useMemo(() => teachersOf(data.users), [data.users]);

    const visible = useMemo(
        () =>
            data.classrooms.filter(item => {
                const matchSearch =
                    !search ||
                    `${item.class_name || ''} ${item._id || ''} ${item.room || ''}`
                        .toLowerCase()
                        .includes(search.toLowerCase());
                const matchStatus = !status || item.status === status;
                const courseId = typeof item.course_id === 'object' ? item.course_id?._id : item.course_id;
                const matchCourse = !course || courseId === course;
                const teacherId = typeof item.teacher_id === 'object' ? item.teacher_id?._id : item.teacher_id;
                const matchTeacher = !teacher || teacherId === teacher;
                return matchSearch && matchStatus && matchCourse && matchTeacher;
            }),
        [data.classrooms, search, status, course, teacher]
    );

    const openForm = (item?: IClassroomWithDetails) => {
        setEditing(item?._id || '');
        if (item) {
            const courseId = typeof item.course_id === 'object' ? item.course_id?._id : item.course_id;
            const teacherId = typeof item.teacher_id === 'object' ? item.teacher_id?._id : item.teacher_id;
            form.setFieldsValue({
                class_name: item.class_name || '',
                course_id: courseId || '',
                teacher_id: teacherId || '',
                room: item.room || '',
                max_student: item.max_student || '',
                start_time: item.start_time || '',
                end_time: item.end_time || '',
                start_date: item.start_date ? dayjs(item.start_date) : undefined,
                end_date: item.end_date ? dayjs(item.end_date) : undefined,
                status: item.status || 'OPEN',
            });
        } else {
            form.resetFields();
            form.setFieldsValue({ status: 'OPEN' });
        }
        setOpen(true);
    };

    const save = async (values: any) => {
        setSaving(true);
        const payload: Omit<IClassroom, '_id'> = {
            class_name: values.class_name,
            course_id: values.course_id,
            teacher_id: values.teacher_id,
            room: values.room,
            max_student: values.max_student,
            start_time: values.start_time,
            end_time: values.end_time,
            start_date: values.start_date ? dayjs(values.start_date).format('YYYY-MM-DD') : undefined,
            end_date: values.end_date ? dayjs(values.end_date).format('YYYY-MM-DD') : undefined,
            status: values.status || 'OPEN',
        };

        const response = editing ? await callUpdateClassroom(payload, editing) : await callCreateClassroom(payload);
        setSaving(false);
        if (!response?.data) {
            return message.error(response?.message || 'Không thể lưu lớp học');
        }
        message.success(editing ? 'Đã cập nhật lớp học thành công' : 'Đã tạo lớp học thành công');
        setOpen(false);
        await data.refresh();
    };

    const remove = async (item: IClassroomWithDetails) => {
        if (!item._id) return;
        const response = await callDeleteClassroom(item._id);
        if (response?.data) {
            message.success('Đã xóa lớp học thành công');
            await data.refresh();
        } else {
            message.error(response?.message || 'Không thể xóa lớp học');
        }
    };

    return (
        <main className={`${styles.container} ${styles['manager-page']}`}>
            <section className={styles['manager-heading']}>
                <div>
                    <span>MANAGER / CLASSES</span>
                    <h1>Quản lý lớp học</h1>
                    <p>Điều phối lớp, khóa học, giáo viên, phòng học và sĩ số toàn trung tâm.</p>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => openForm()}>
                    Tạo lớp học mới
                </Button>
            </section>

            <ManagerState loading={data.loading} error={data.error}>
                {!data.classrooms.length ? (
                    <ManagerEmpty description="Chưa có lớp học nào trong hệ thống" />
                ) : (
                    <Card className={styles['portal-card']}>
                        <div className={styles['manager-filters']}>
                            <Input.Search
                                placeholder="Tìm tên lớp, mã lớp hoặc phòng..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{ minWidth: 220 }}
                            />
                            <Select
                                allowClear
                                placeholder="Lọc theo khóa học"
                                value={course}
                                onChange={setCourse}
                                style={{ minWidth: 180 }}
                                options={data.courses
                                    .map(item => ({ label: item.name, value: item._id || '' }))
                                    .filter(item => item.value)}
                            />
                            <Select
                                allowClear
                                placeholder="Lọc theo giáo viên"
                                value={teacher}
                                onChange={setTeacher}
                                style={{ minWidth: 180 }}
                                options={teachers.map(item => ({ label: item.name, value: item._id || '' }))}
                            />
                            <Select
                                allowClear
                                placeholder="Trạng thái"
                                value={status}
                                onChange={setStatus}
                                style={{ minWidth: 140 }}
                                options={[
                                    { label: 'Đang mở (OPEN)', value: 'OPEN' },
                                    { label: 'Đang hoạt động (ACTIVE)', value: 'ACTIVE' },
                                    { label: 'Hoàn thành (COMPLETED)', value: 'COMPLETED' },
                                    { label: 'Đã hủy (CANCELLED)', value: 'CANCELLED' },
                                ]}
                            />
                        </div>

                        <Table
                            rowKey="_id"
                            dataSource={visible}
                            pagination={{ pageSize: 8, showTotal: total => `Tổng cộng ${total} lớp học` }}
                            scroll={{ x: 1100 }}
                            columns={[
                                { title: 'STT', width: 60, render: (_: unknown, __: unknown, index: number) => index + 1 },
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
                                    render: (_: unknown, item) => item.course_id?.name || 'Chưa cập nhật',
                                },
                                {
                                    title: 'Giáo viên',
                                    render: (_: unknown, item) => item.teacher_id?.name || 'Chưa phân công',
                                },
                                {
                                    title: 'Phòng học',
                                    dataIndex: 'room',
                                    render: (val?: string) => val || 'Chưa xếp phòng',
                                },
                                {
                                    title: 'Sĩ số',
                                    render: (_: unknown, item) => {
                                        const count = enrollmentsForClass(item._id || '', data.enrollments).length;
                                        return `${count}/${item.max_student || '—'}`;
                                    },
                                },
                                {
                                    title: 'Thời gian học',
                                    render: (_: unknown, item) =>
                                        item.start_time && item.end_time
                                            ? `${item.start_time} - ${item.end_time}`
                                            : item.start_time || '—',
                                },
                                {
                                    title: 'Ngày học',
                                    render: (_: unknown, item) =>
                                        item.start_date && item.end_date
                                            ? `${item.start_date} ~ ${item.end_date}`
                                            : item.start_date || '—',
                                },
                                {
                                    title: 'Trạng thái',
                                    dataIndex: 'status',
                                    render: statusTag,
                                },
                                {
                                    title: 'Thao tác',
                                    fixed: 'right',
                                    width: 140,
                                    render: (_: unknown, item) => (
                                        <Space>
                                            <Button
                                                size="small"
                                                icon={<EyeOutlined />}
                                                title="Xem nhanh"
                                                onClick={() => setSelected(item)}
                                            />
                                            <Button
                                                size="small"
                                                icon={<EditOutlined />}
                                                title="Chỉnh sửa"
                                                onClick={() => openForm(item)}
                                            />
                                            <Button
                                                size="small"
                                                danger
                                                icon={<DeleteOutlined />}
                                                title="Xóa lớp"
                                                onClick={() =>
                                                    Modal.confirm({
                                                        title: 'Xóa lớp học?',
                                                        content: `Bạn có chắc chắn muốn xóa lớp "${item.class_name}" không?`,
                                                        okText: 'Xóa',
                                                        okType: 'danger',
                                                        cancelText: 'Hủy',
                                                        onOk: () => remove(item),
                                                    })
                                                }
                                            />
                                        </Space>
                                    ),
                                },
                            ]}
                        />
                    </Card>
                )}
            </ManagerState>

            {/* Modal Tạo/Sửa lớp học */}
            <Modal
                title={editing ? 'Chỉnh sửa lớp học' : 'Tạo lớp học mới'}
                open={open}
                width={700}
                confirmLoading={saving}
                okText="Lưu thông tin"
                cancelText="Hủy"
                onOk={() => form.submit()}
                onCancel={() => setOpen(false)}
            >
                <Form form={form} layout="vertical" onFinish={save}>
                    <Row gutter={12}>
                        <Col span={14}>
                            <Form.Item
                                name="class_name"
                                label="Tên lớp học"
                                rules={[{ required: true, message: 'Vui lòng nhập tên lớp học!' }]}
                            >
                                <Input placeholder="Ví dụ: React Native K12 - T2/T4" />
                            </Form.Item>
                        </Col>
                        <Col span={10}>
                            <Form.Item name="room" label="Phòng học">
                                <Input placeholder="Ví dụ: P.302, Lab 4" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={12}>
                        <Col span={12}>
                            <Form.Item
                                name="course_id"
                                label="Khóa học"
                                rules={[{ required: true, message: 'Vui lòng chọn khóa học!' }]}
                            >
                                <Select
                                    placeholder="Chọn khóa học"
                                    options={data.courses
                                        .map(item => ({ label: item.name, value: item._id || '' }))
                                        .filter(item => item.value)}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="teacher_id"
                                label="Giáo viên phụ trách"
                                rules={[{ required: true, message: 'Vui lòng chọn giáo viên!' }]}
                            >
                                <Select
                                    placeholder="Chọn giáo viên"
                                    options={teachers.map(item => ({
                                        label: `${item.name} (${item.email})`,
                                        value: item._id || '',
                                    }))}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={12}>
                        <Col span={8}>
                            <Form.Item name="max_student" label="Sĩ số tối đa">
                                <InputNumber min={1} max={100} style={{ width: '100%' }} placeholder="30" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="start_time" label="Giờ bắt đầu">
                                <Input placeholder="Ví dụ: 18:00" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="end_time" label="Giờ kết thúc">
                                <Input placeholder="Ví dụ: 20:30" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={12}>
                        <Col span={12}>
                            <Form.Item name="start_date" label="Ngày bắt đầu">
                                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" placeholder="Chọn ngày bắt đầu" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="end_date" label="Ngày kết thúc">
                                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" placeholder="Chọn ngày kết thúc" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="status" label="Trạng thái lớp học">
                        <Select
                            options={[
                                { label: 'Đang mở tuyển sinh (OPEN)', value: 'OPEN' },
                                { label: 'Đang học (ACTIVE)', value: 'ACTIVE' },
                                { label: 'Đã hoàn thành (COMPLETED)', value: 'COMPLETED' },
                                { label: 'Đã hủy (CANCELLED)', value: 'CANCELLED' },
                            ]}
                        />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Modal Xem nhanh chi tiết lớp */}
            <Modal
                title={`Chi tiết lớp học: ${selected?.class_name || ''}`}
                open={Boolean(selected)}
                footer={
                    selected ? (
                        <Space>
                            <Button onClick={() => setSelected(null)}>Đóng</Button>
                            <Button
                                type="primary"
                                icon={<LinkOutlined />}
                                onClick={() => {
                                    const id = selected._id;
                                    setSelected(null);
                                    navigate(`/client/manager/classes/${id}`);
                                }}
                            >
                                Quản lý chi tiết & Học viên
                            </Button>
                        </Space>
                    ) : null
                }
                onCancel={() => setSelected(null)}
                width={650}
            >
                {selected && (
                    <>
                        <p>
                            <b>Khóa học:</b> {selected.course_id?.name || 'Chưa cập nhật'}
                        </p>
                        <p>
                            <b>Giáo viên:</b> {selected.teacher_id?.name || 'Chưa phân công'}
                        </p>
                        <p>
                            <b>Phòng học:</b> {selected.room || 'Chưa có phòng'}
                        </p>
                        <p>
                            <b>Sĩ số:</b> {enrollmentsForClass(selected._id || '', data.enrollments).length} /{' '}
                            {selected.max_student || '—'}
                        </p>
                        <p>
                            <b>Thời gian:</b> {selected.start_time || '—'} - {selected.end_time || '—'}
                        </p>
                        <p>
                            <b>Ngày:</b> {selected.start_date || '—'} ~ {selected.end_date || '—'}
                        </p>
                        <p>
                            <b>Trạng thái:</b> {statusTag(selected.status)}
                        </p>
                        <h4 style={{ marginTop: 16 }}>Danh sách học viên trong lớp:</h4>
                        {enrollmentsForClass(selected._id || '', data.enrollments).length ? (
                            <Table
                                size="small"
                                pagination={{ pageSize: 5 }}
                                dataSource={enrollmentsForClass(selected._id || '', data.enrollments)}
                                rowKey="_id"
                                columns={[
                                    {
                                        title: 'Học viên',
                                        render: (_: unknown, row) =>
                                            typeof row.student_id === 'string'
                                                ? row.student_id
                                                : row.student_id?.name || 'Chưa có tên',
                                    },
                                    {
                                        title: 'Email',
                                        render: (_: unknown, row) =>
                                            typeof row.student_id === 'object'
                                                ? (row.student_id as any)?.email || '—'
                                                : '—',
                                    },
                                    { title: 'Trạng thái', dataIndex: 'status', render: statusTag },
                                ]}
                            />
                        ) : (
                            <p style={{ color: '#888' }}>Chưa có học viên nào được xếp vào lớp này.</p>
                        )}
                    </>
                )}
            </Modal>
        </main>
    );
};

export default ManagerClasses;
