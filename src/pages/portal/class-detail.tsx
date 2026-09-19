import { useEffect, useState } from 'react';
import { Alert, Button, Card, Descriptions, Empty, Modal, Popconfirm, Select, Spin, Table, Tag, message } from 'antd';
import { ArrowLeftOutlined, DeleteOutlined, EditOutlined, PlusOutlined, TeamOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import {
    callDeleteEnrollment,
    callFetchClassroomById,
    callFetchEnrollment,
    callFetchUser,
    callCreateEnrollment,
    callUpdateClassroom,
} from '@/config/api';
import { getPortalRole } from '@/config/portal';
import { useAppSelector } from '@/redux/hooks';
import type { IClassroomWithDetails, IEnrollment, IUser, IUserSummary } from '@/types/backend';
import styles from '@/styles/client.module.scss';

type ClassEnrollment = Omit<IEnrollment, 'student_id' | 'class_id'> & {
    student_id?: IUserSummary | string;
    class_id?: string;
};

const toValue = <T,>(response: unknown): T | undefined => (response as { data?: T })?.data;

const toArray = <T,>(response: unknown): T[] => {
    const data = (response as { data?: unknown })?.data;
    if (Array.isArray(data)) return data as T[];
    if (data && typeof data === 'object' && Array.isArray((data as { result?: T[] }).result)) {
        return (data as { result: T[] }).result;
    }
    return [];
};

const ClassDetailPage = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const user = useAppSelector(state => state.account.user);
    const [classroom, setClassroom] = useState<IClassroomWithDetails | null>(null);
    const [enrollments, setEnrollments] = useState<ClassEnrollment[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingStatus, setSavingStatus] = useState(false);
    const [teachers, setTeachers] = useState<IUser[]>([]);
    const [students, setStudents] = useState<IUser[]>([]);
    const [teacherModalOpen, setTeacherModalOpen] = useState(false);
    const [studentModalOpen, setStudentModalOpen] = useState(false);
    const [selectedTeacherId, setSelectedTeacherId] = useState('');
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [savingAssignment, setSavingAssignment] = useState(false);
    const [error, setError] = useState('');

    const loadData = async () => {
        if (!id) return;
        setLoading(true);
        setError('');
        try {
            const [classroomResponse, enrollmentResponse, userResponse] = await Promise.all([
                callFetchClassroomById(id),
                callFetchEnrollment(`current=1&pageSize=1000&class_id=${id}&populate=student_id`),
                callFetchUser('current=1&pageSize=1000'),
            ]);
            setClassroom(toValue<IClassroomWithDetails>(classroomResponse) || null);
            setEnrollments(toArray<ClassEnrollment>(enrollmentResponse));
            const users = toArray<IUser>(userResponse);
            setTeachers(users.filter(item => item.role?.name?.trim().toUpperCase() === 'TEACHER'));
            setStudents(users.filter(item => item.role?.name?.trim().toUpperCase() === 'STUDENT'));
        } catch {
            setError('Không thể tải chi tiết lớp học.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [id]);

    if (getPortalRole(user.role?.name) !== 'MANAGER') {
        return <main className={`${styles.container} ${styles['portal-section']}`}><Alert type="error" message="Bạn không có quyền xem trang này." /></main>;
    }

    const updateStatus = async (status: string) => {
        if (!id) return;
        setSavingStatus(true);
        const response = await callUpdateClassroom({ status }, id);
        setSavingStatus(false);
        if (response?.data) {
            setClassroom(current => current ? { ...current, status } : current);
            message.success('Đã cập nhật trạng thái lớp học');
        } else {
            message.error('Không thể cập nhật trạng thái lớp học');
        }
    };

    const removeStudent = async (enrollmentId?: string) => {
        if (!enrollmentId) return;
        const response = await callDeleteEnrollment(enrollmentId);
        if (response?.data) {
            setEnrollments(current => current.filter(enrollment => enrollment._id !== enrollmentId));
            message.success('Đã xóa học viên khỏi lớp');
        } else {
            message.error('Không thể xóa học viên khỏi lớp');
        }
    };

    const assignTeacher = async () => {
        if (!id || !selectedTeacherId) return message.warning('Vui lòng chọn giảng viên');
        setSavingAssignment(true);
        const response = await callUpdateClassroom({ teacher_id: selectedTeacherId }, id);
        setSavingAssignment(false);
        if (!response?.data) return message.error('Không thể gán giảng viên');
        const teacher = teachers.find(item => item._id === selectedTeacherId);
        setClassroom(current => current ? { ...current, teacher_id: teacher ? { _id: teacher._id, name: teacher.name, email: teacher.email } : current.teacher_id } : current);
        setTeacherModalOpen(false);
        message.success('Đã cập nhật giảng viên phụ trách');
    };

    const addStudents = async () => {
        if (!id || !selectedStudentIds.length) return message.warning('Vui lòng chọn học viên');
        setSavingAssignment(true);
        const responses = await Promise.all(selectedStudentIds.map(studentId => callCreateEnrollment({
            student_id: studentId,
            class_id: id,
            register_date: new Date().toISOString(),
            status: 'WAITING_PAYMENT',
        })));
        setSavingAssignment(false);
        if (responses.some(response => !response?.data)) return message.error('Không thể thêm học viên');
        setStudentModalOpen(false);
        setSelectedStudentIds([]);
        await loadData();
        message.success('Đã thêm học viên vào lớp');
    };

    if (loading) return <main className={`${styles.container} ${styles['portal-section']}`}><div className={styles['portal-loading']}><Spin /></div></main>;
    if (error || !classroom) return <main className={`${styles.container} ${styles['portal-section']}`}><Alert type="error" message={error || 'Không tìm thấy lớp học'} showIcon /></main>;

    return <main className={`${styles.container} ${styles['portal-section']}`}>
        <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate('/portal/classes')}>Quay lại danh sách lớp</Button>
        <section className={styles['portal-hero']}>
            <span>CHI TIẾT LỚP HỌC</span>
            <h1>{classroom.class_name || 'Lớp chưa đặt tên'}</h1>
            <p>{classroom.course_id?.name || 'Chưa gán khóa học'} · {classroom.room || 'Chưa cập nhật phòng học'}</p>
        </section>

        <div className={styles['class-detail-grid']}>
            <Card className={styles['portal-card']} title="Thông tin lớp học">
                <Descriptions column={{ xs: 1, sm: 2 }}>
                    <Descriptions.Item label="Tên khóa học">{classroom.course_id?.name || 'Chưa gán'}</Descriptions.Item>
                    <Descriptions.Item label="Giảng viên">
                        <span>{classroom.teacher_id?.name || 'Chưa có'}</span>{' '}
                        <Button size="small" icon={<EditOutlined />} onClick={() => { setSelectedTeacherId(classroom.teacher_id?._id || ''); setTeacherModalOpen(true); }}>{classroom.teacher_id ? 'Thay đổi GV' : 'Thêm GV'}</Button>
                    </Descriptions.Item>
                    <Descriptions.Item label="Phòng học">{classroom.room || 'Chưa cập nhật'}</Descriptions.Item>
                    <Descriptions.Item label="Thời gian">{classroom.start_time || '--:'} - {classroom.end_time || ':--'}</Descriptions.Item>
                    <Descriptions.Item label="Số lượng học viên">{enrollments.length}{classroom.max_student ? ` / ${classroom.max_student}` : ''}</Descriptions.Item>
                    <Descriptions.Item label="Trạng thái">
                        <Select value={classroom.status || undefined} loading={savingStatus} onChange={updateStatus} options={[
                            { label: 'Đang mở', value: 'OPEN' },
                            { label: 'Đã hoàn thành', value: 'COMPLETED' },
                            { label: 'Đã hủy', value: 'CANCELLED' },
                        ]} style={{ minWidth: 150 }} />
                    </Descriptions.Item>
                </Descriptions>
            </Card>
            <Card className={styles['portal-card']} title={<><TeamOutlined /> Tổng quan học viên</>}>
                <div className={styles['class-detail-summary']}><strong>{enrollments.length}</strong><span>học viên đang đăng ký</span></div>
                <Tag color={classroom.status === 'OPEN' ? 'green' : 'gold'}>{classroom.status || 'Chưa cập nhật'}</Tag>
            </Card>
        </div>

        <Card className={styles['portal-card']} title="Danh sách học viên" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { setSelectedStudentIds([]); setStudentModalOpen(true); }}>Thêm học viên</Button>}>
            {enrollments.length ? <Table<ClassEnrollment>
                rowKey="_id"
                scroll={{ x: 760 }}
                pagination={{ pageSize: 10 }}
                columns={[
                    { title: 'Họ tên', render: (_: unknown, enrollment: ClassEnrollment) => typeof enrollment.student_id === 'string' ? enrollment.student_id : enrollment.student_id?.name || 'Chưa cập nhật' },
                    { title: 'Email', render: (_: unknown, enrollment: ClassEnrollment) => typeof enrollment.student_id === 'string' ? 'Chưa cập nhật' : enrollment.student_id?.email || 'Chưa cập nhật' },
                    { title: 'Số điện thoại', render: (_: unknown, enrollment: ClassEnrollment) => typeof enrollment.student_id === 'string' ? 'Chưa cập nhật' : enrollment.student_id?.phone || 'Chưa cập nhật' },
                    { title: 'Trạng thái', dataIndex: 'status', render: (value?: string) => <Tag color={value === 'STUDYING' ? 'green' : 'gold'}>{value || 'Chưa cập nhật'}</Tag> },
                    { title: 'Thao tác', render: (_: unknown, enrollment: ClassEnrollment) => <Popconfirm title="Xóa học viên khỏi lớp?" okText="Xóa" cancelText="Hủy" onConfirm={() => removeStudent(enrollment._id)}><Button danger icon={<DeleteOutlined />}>Xóa khỏi lớp</Button></Popconfirm> },
                ]}
                dataSource={enrollments}
            /> : <Empty description="Lớp chưa có học viên" />}
        </Card>
        <Modal title={classroom.teacher_id ? 'Thay đổi giảng viên' : 'Gán giảng viên'} open={teacherModalOpen} confirmLoading={savingAssignment} okText="Lưu" cancelText="Hủy" onCancel={() => setTeacherModalOpen(false)} onOk={assignTeacher}>
            <Select showSearch optionFilterProp="label" value={selectedTeacherId || undefined} onChange={setSelectedTeacherId} placeholder="Chọn giảng viên" options={teachers.map(teacher => ({ label: `${teacher.name} - ${teacher.email}`, value: teacher._id || '' })).filter(option => option.value)} style={{ width: '100%' }} />
        </Modal>
        <Modal title="Thêm học viên vào lớp" open={studentModalOpen} confirmLoading={savingAssignment} okText="Thêm học viên" cancelText="Hủy" onCancel={() => setStudentModalOpen(false)} onOk={addStudents}>
            <Select mode="multiple" showSearch optionFilterProp="label" value={selectedStudentIds} onChange={setSelectedStudentIds} placeholder="Chọn một hoặc nhiều học viên" options={students.map(student => ({ label: `${student.name} - ${student.email}`, value: student._id || '' })).filter(option => option.value)} maxTagCount="responsive" style={{ width: '100%' }} />
        </Modal>
    </main>;
};

export default ClassDetailPage;
