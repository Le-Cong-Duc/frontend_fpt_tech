import { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Button,
    Card,
    Col,
    DatePicker,
    Descriptions,
    Empty,
    Form,
    Input,
    InputNumber,
    Modal,
    Popconfirm,
    Row,
    Select,
    Space,
    Spin,
    Table,
    Tag,
    message,
} from 'antd';
import {
    ArrowLeftOutlined,
    EditOutlined,
    PlusOutlined,
    UserDeleteOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import {
    callCreateEnrollment,
    callDeleteEnrollment,
    callFetchClassroomById,
    callFetchCourse,
    callFetchEnrollment,
    callFetchUser,
    callUpdateClassroom,
} from '@/config/api';
import type { IClassroomWithDetails, ICourse, IEnrollment, IUser } from '@/types/backend';
import { dateText, statusTag, studentsOf, teachersOf, toArray } from './manager.shared';
import styles from '@/styles/client.module.scss';

const ManagerClassDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [classroom, setClassroom] = useState<IClassroomWithDetails>();
    const [enrollments, setEnrollments] = useState<IEnrollment[]>([]);
    const [allUsers, setAllUsers] = useState<IUser[]>([]);
    const [courses, setCourses] = useState<ICourse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal Add Student
    const [openAddStudent, setOpenAddStudent] = useState(false);
    const [addingStudent, setAddingStudent] = useState(false);
    const [addForm] = Form.useForm();

    // Modal Edit Class
    const [openEditClass, setOpenEditClass] = useState(false);
    const [savingClass, setSavingClass] = useState(false);
    const [editForm] = Form.useForm();

    const loadData = async () => {
        if (!id) {
            setError('Không xác định được lớp học.');
            setLoading(false);
            return;
        }
        setLoading(true);
        setError('');
        try {
            const [classRes, enrollRes, usersRes, coursesRes] = await Promise.all([
                callFetchClassroomById(id),
                callFetchEnrollment(`class_id=${id}&populate=student_id&pageSize=1000`),
                callFetchUser('current=1&pageSize=1000&populate=role'),
                callFetchCourse('current=1&pageSize=1000'),
            ]);

            setClassroom(classRes?.data as IClassroomWithDetails | undefined);
            setEnrollments(toArray<IEnrollment>(enrollRes));
            setAllUsers(toArray<IUser>(usersRes));
            setCourses(toArray<ICourse>(coursesRes));
        } catch {
            setError('Không thể tải thông tin lớp học và học viên.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [id]);

    const students = useMemo(() => studentsOf(allUsers), [allUsers]);
    const teachers = useMemo(() => teachersOf(allUsers), [allUsers]);

    // Lọc ra các học viên chưa có trong lớp này
    const enrolledStudentIds = useMemo(() => {
        return new Set(
            enrollments
                .map(item => (typeof item.student_id === 'object' ? (item.student_id as any)?._id : item.student_id))
                .filter(Boolean)
        );
    }, [enrollments]);

    const availableStudents = useMemo(() => {
        return students.filter(student => student._id && !enrolledStudentIds.has(student._id));
    }, [students, enrolledStudentIds]);

    // Handle Add Student to Class
    const handleAddStudent = async (values: any) => {
        if (!id) return;
        setAddingStudent(true);
        const payload: Omit<IEnrollment, '_id'> = {
            class_id: id as any,
            student_id: values.student_id,
            register_date: values.register_date ? dayjs(values.register_date).toISOString() : new Date().toISOString(),
            status: values.status || 'STUDYING',
        };

        const res = await callCreateEnrollment(payload);
        setAddingStudent(false);
        if (res?.data) {
            message.success('Đã thêm học viên vào lớp thành công');
            setOpenAddStudent(false);
            addForm.resetFields();
            const enrollRes = await callFetchEnrollment(`class_id=${id}&populate=student_id&pageSize=1000`);
            setEnrollments(toArray<IEnrollment>(enrollRes));
        } else {
            message.error(res?.message || 'Không thể thêm học viên vào lớp');
        }
    };

    // Handle Remove Student from Class
    const handleRemoveStudent = async (enrollmentId?: string) => {
        if (!enrollmentId || !id) return;
        const res = await callDeleteEnrollment(enrollmentId);
        if (res?.data) {
            message.success('Đã xóa học viên khỏi lớp');
            const enrollRes = await callFetchEnrollment(`class_id=${id}&populate=student_id&pageSize=1000`);
            setEnrollments(toArray<IEnrollment>(enrollRes));
        } else {
            message.error(res?.message || 'Không thể xóa học viên khỏi lớp');
        }
    };

    // Open Edit Class Modal
    const openEditModal = () => {
        if (!classroom) return;
        const courseId = typeof classroom.course_id === 'object' ? classroom.course_id?._id : classroom.course_id;
        const teacherId = typeof classroom.teacher_id === 'object' ? classroom.teacher_id?._id : classroom.teacher_id;
        editForm.setFieldsValue({
            class_name: classroom.class_name || '',
            course_id: courseId || '',
            teacher_id: teacherId || '',
            room: classroom.room || '',
            max_student: classroom.max_student || '',
            start_time: classroom.start_time || '',
            end_time: classroom.end_time || '',
            start_date: classroom.start_date ? dayjs(classroom.start_date) : undefined,
            end_date: classroom.end_date ? dayjs(classroom.end_date) : undefined,
            status: classroom.status || 'OPEN',
        });
        setOpenEditClass(true);
    };

    // Handle Save Class
    const handleSaveClass = async (values: any) => {
        if (!id) return;
        setSavingClass(true);
        const payload = {
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

        const res = await callUpdateClassroom(payload, id);
        setSavingClass(false);
        if (res?.data) {
            message.success('Đã cập nhật thông tin lớp học thành công');
            setOpenEditClass(false);
            const classRes = await callFetchClassroomById(id);
            setClassroom(classRes?.data as IClassroomWithDetails | undefined);
        } else {
            message.error(res?.message || 'Không thể cập nhật lớp học');
        }
    };

    return (
        <main className={`${styles.container} ${styles['manager-page']}`}>
            <section className={styles['manager-heading']}>
                <div>
                    <span>MANAGER / CLASSES / DETAIL</span>
                    <h1>Quản lý chi tiết lớp học</h1>
                    <p>Theo dõi tiến độ, sĩ số, lịch học và danh sách học viên trong lớp.</p>
                </div>
                <Space>
                    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/client/manager/classes')}>
                        Danh sách lớp
                    </Button>
                    <Button type="primary" icon={<EditOutlined />} onClick={openEditModal}>
                        Chỉnh sửa lớp
                    </Button>
                </Space>
            </section>

            {loading ? (
                <div className={styles['portal-loading']}>
                    <Spin size="large" />
                </div>
            ) : error ? (
                <Alert type="error" showIcon message={error} />
            ) : !classroom ? (
                <Card className={styles['portal-card']}>
                    <Empty description="Không tìm thấy thông tin lớp học" />
                </Card>
            ) : (
                <>
                    {/* Thông tin lớp học */}
                    <Card
                        className={styles['portal-card']}
                        title={
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span>{classroom.class_name || 'Thông tin lớp học'}</span>
                                {statusTag(classroom.status)}
                            </div>
                        }
                        style={{ marginBottom: 20 }}
                    >
                        <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }}>
                            <Descriptions.Item label="Khóa học">
                                <b>{classroom.course_id?.name || 'Chưa gán khóa học'}</b>
                            </Descriptions.Item>
                            <Descriptions.Item label="Giảng viên phụ trách">
                                <span style={{ color: '#1677ff' }}>
                                    <UserOutlined /> {classroom.teacher_id?.name || 'Chưa phân công'}
                                </span>
                            </Descriptions.Item>
                            <Descriptions.Item label="Phòng học">
                                <Tag color="blue">{classroom.room || 'Chưa có phòng'}</Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Sĩ số lớp">
                                <b>
                                    {enrollments.length} / {classroom.max_student || '—'} học viên
                                </b>
                            </Descriptions.Item>
                            <Descriptions.Item label="Khung giờ học">
                                {classroom.start_time && classroom.end_time
                                    ? `${classroom.start_time} - ${classroom.end_time}`
                                    : classroom.start_time || 'Chưa cập nhật'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Thời gian khóa học">
                                {classroom.start_date || '—'} ~ {classroom.end_date || '—'}
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>

                    {/* Danh sách học viên trong lớp */}
                    <Card
                        className={styles['portal-card']}
                        title={
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span>Danh sách học viên ({enrollments.length} học viên)</span>
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={() => {
                                        addForm.resetFields();
                                        setOpenAddStudent(true);
                                    }}
                                >
                                    Thêm học viên vào lớp
                                </Button>
                            </div>
                        }
                    >
                        {!enrollments.length ? (
                            <Empty description="Lớp học này hiện chưa có học viên nào. Hãy bấm 'Thêm học viên vào lớp' để xếp lớp." />
                        ) : (
                            <Table
                                rowKey="_id"
                                dataSource={enrollments}
                                pagination={{ pageSize: 8 }}
                                scroll={{ x: 800 }}
                                columns={[
                                    {
                                        title: 'STT',
                                        width: 60,
                                        render: (_: unknown, __: unknown, index: number) => index + 1,
                                    },
                                    {
                                        title: 'Học viên',
                                        render: (_: unknown, item) => {
                                            const student = item.student_id as any;
                                            return (
                                                <span style={{ fontWeight: 600 }}>
                                                    <UserOutlined style={{ marginRight: 6 }} />
                                                    {typeof student === 'object' ? student?.name || 'Chưa có tên' : student}
                                                </span>
                                            );
                                        },
                                    },
                                    {
                                        title: 'Email',
                                        render: (_: unknown, item) => {
                                            const student = item.student_id as any;
                                            return typeof student === 'object' ? student?.email || '—' : '—';
                                        },
                                    },
                                    {
                                        title: 'Số điện thoại',
                                        render: (_: unknown, item) => {
                                            const student = item.student_id as any;
                                            return typeof student === 'object' ? student?.phone || 'Chưa cập nhật' : '—';
                                        },
                                    },
                                    {
                                        title: 'Ngày ghi danh',
                                        render: (_: unknown, item) => dateText(item.register_date as any),
                                    },
                                    {
                                        title: 'Trạng thái',
                                        dataIndex: 'status',
                                        render: statusTag,
                                    },
                                    {
                                        title: 'Thao tác',
                                        render: (_: unknown, item) => (
                                            <Popconfirm
                                                title="Xóa học viên khỏi lớp?"
                                                description="Học viên này sẽ bị xóa khỏi danh sách lớp học."
                                                okText="Xác nhận xóa"
                                                cancelText="Hủy"
                                                okType="danger"
                                                onConfirm={() => handleRemoveStudent(item._id)}
                                            >
                                                <Button size="small" danger icon={<UserDeleteOutlined />}>
                                                    Hủy ghi danh
                                                </Button>
                                            </Popconfirm>
                                        ),
                                    },
                                ]}
                            />
                        )}
                    </Card>
                </>
            )}

            {/* Modal Thêm học viên vào lớp */}
            <Modal
                title={`Thêm học viên vào lớp: ${classroom?.class_name || ''}`}
                open={openAddStudent}
                confirmLoading={addingStudent}
                okText="Thêm học viên"
                cancelText="Hủy"
                onOk={() => addForm.submit()}
                onCancel={() => setOpenAddStudent(false)}
            >
                <Form form={addForm} layout="vertical" onFinish={handleAddStudent}>
                    <Form.Item
                        name="student_id"
                        label="Chọn học viên"
                        rules={[{ required: true, message: 'Vui lòng chọn học viên cần thêm!' }]}
                    >
                        <Select
                            showSearch
                            placeholder="Tìm học viên theo tên hoặc email"
                            filterOption={(input, option) =>
                                (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                            }
                            options={availableStudents.map(student => ({
                                label: `${student.name} (${student.email})`,
                                value: student._id || '',
                            }))}
                        />
                    </Form.Item>
                    <Form.Item name="register_date" label="Ngày ghi danh" initialValue={dayjs()}>
                        <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                    </Form.Item>
                    <Form.Item name="status" label="Trạng thái" initialValue="STUDYING">
                        <Select
                            options={[
                                { label: 'Đang học (STUDYING)', value: 'STUDYING' },
                                { label: 'Chờ thanh toán (WAITING_PAYMENT)', value: 'WAITING_PAYMENT' },
                                { label: 'Đã hoàn thành (COMPLETED)', value: 'COMPLETED' },
                            ]}
                        />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Modal Sửa lớp học */}
            <Modal
                title="Chỉnh sửa lớp học"
                open={openEditClass}
                width={700}
                confirmLoading={savingClass}
                okText="Lưu thay đổi"
                cancelText="Hủy"
                onOk={() => editForm.submit()}
                onCancel={() => setOpenEditClass(false)}
            >
                <Form form={editForm} layout="vertical" onFinish={handleSaveClass}>
                    <Row gutter={12}>
                        <Col span={14}>
                            <Form.Item
                                name="class_name"
                                label="Tên lớp học"
                                rules={[{ required: true, message: 'Vui lòng nhập tên lớp học!' }]}
                            >
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={10}>
                            <Form.Item name="room" label="Phòng học">
                                <Input />
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
                                    options={courses
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
                                <InputNumber min={1} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="start_time" label="Giờ bắt đầu">
                                <Input placeholder="18:00" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="end_time" label="Giờ kết thúc">
                                <Input placeholder="20:30" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={12}>
                        <Col span={12}>
                            <Form.Item name="start_date" label="Ngày bắt đầu">
                                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="end_date" label="Ngày kết thúc">
                                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="status" label="Trạng thái">
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
        </main>
    );
};

export default ManagerClassDetail;