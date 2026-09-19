import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Descriptions, Empty, Form, Input, Modal, Popconfirm, Row, Select, Spin, Statistic, Table, Tag, message } from 'antd';
import { BookOutlined, CalendarOutlined, CreditCardOutlined, DeleteOutlined, EditOutlined, FileTextOutlined, PlusOutlined, TeamOutlined, UserAddOutlined } from '@ant-design/icons';
import {
    callCreateEnrollment,
    callCreateClassroom,
    callCreateCourse,
    callDeleteClassroom,
    callDeleteCourse,
    callFetchClassroom,
    callFetchCourse,
    callFetchEnrollment,
    callFetchInvoice,
    callFetchMyAssignedLeads,
    callFetchMyEnrollments,
    callFetchMyInvoices,
    callFetchMyPayments,
    callFetchMyStudents,
    callFetchMyTeachingClassrooms,
    callFetchUser,
    callUpdateCourse,
    callUpdateClassroom,
    callUpdateMyProfile,
} from '@/config/api';
import { getPortalRole, type PortalRole } from '@/config/portal';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useNavigate } from 'react-router-dom';
import { setProfileAction } from '@/redux/slice/accountSlide';
import type { IClassroom, IClassroomWithDetails, ICourse, IEnrollment, IInvoice, ILead, IPortalEnrollment, IPortalInvoice, IPortalPayment, IUser, IUserSummary } from '@/types/backend';
import styles from '@/styles/client.module.scss';

type PortalScreen = 'home' | 'my-courses' | 'classes' | 'schedule' | 'invoices' | 'payments' | 'students' | 'teachers' | 'courses' | 'leads' | 'profile';

interface PortalPageProps { screen: PortalScreen; }

const roleLabel: Record<PortalRole, string> = { STUDENT: 'Học viên', TEACHER: 'Giảng viên', CONSULTANT: 'Tư vấn viên', MANAGER: 'Quản lý' };

const screenTitle: Record<PortalScreen, { title: string; description: string }> = {
    home: { title: 'Không gian học tập', description: 'Theo dõi các hoạt động và công việc của bạn.' },
    'my-courses': { title: 'Khóa học của tôi', description: 'Các khóa học được lấy từ hồ sơ đăng ký của bạn.' },
    classes: { title: 'Lớp học', description: 'Thông tin lớp, phòng và thời gian học hoặc giảng dạy.' },
    schedule: { title: 'Lịch học', description: 'Lịch được tổng hợp từ các lớp của bạn.' },
    invoices: { title: 'Hóa đơn', description: 'Các hóa đơn thuộc những lớp bạn đã đăng ký.' },
    payments: { title: 'Thanh toán', description: 'Các giao dịch thuộc hóa đơn của bạn.' },
    students: { title: 'Học viên', description: 'Học viên trong những lớp bạn phụ trách.' },
    teachers: { title: 'Giảng viên', description: 'Danh sách giảng viên đang hoạt động trong hệ thống.' },
    courses: { title: 'Khóa học', description: 'Danh sách khóa học đang mở và quản lý bởi trung tâm.' },
    leads: { title: 'Khách hàng tư vấn', description: 'Khách hàng được phân công cho bạn.' },
    profile: { title: 'Thông tin cá nhân', description: 'Thông tin tài khoản đang đăng nhập.' },
};

const scheduleTitle = (role: PortalRole) => role === 'TEACHER' ? 'Lịch dạy' : 'Lịch học';
const scheduleDescription = (role: PortalRole) => role === 'TEACHER'
    ? 'Lịch được tổng hợp từ các lớp bạn đang giảng dạy.'
    : 'Lịch được tổng hợp từ các lớp của bạn.';

const toArray = <T,>(response: unknown): T[] => {
    const data = (response as { data?: unknown })?.data;
    if (Array.isArray(data)) return data as T[];
    if (data && typeof data === 'object' && Array.isArray((data as { result?: T[] }).result)) {
        return (data as { result: T[] }).result;
    }
    return [];
};

const dateText = (value?: string) => value ? new Date(value).toLocaleDateString('vi-VN') : 'Chưa cập nhật';
const moneyText = (value?: number) => typeof value === 'number' ? `${value.toLocaleString('vi-VN')} đ` : 'Chưa cập nhật';
const roleCodeOf = (user: IUser) => user.role?.name?.trim().toUpperCase() || '';
const invoiceStatusText = (value?: string) => {
    const status = value?.toUpperCase();
    if (status === 'PAID') return 'Hoàn tất';
    if (status === 'UNPAID' || status === 'WAITING_PAYMENT') return 'Chưa thanh toán';
    return value || 'Chưa cập nhật';
};
const invoiceStatusColor = (value?: string) => value?.toUpperCase() === 'PAID' ? 'green' : 'gold';
const paymentMethodText = (value?: string) => {
    const method = value?.toUpperCase();
    if (method === 'CASH') return 'Tiền mặt';
    if (method === 'BANK_TRANSFER') return 'Chuyển khoản';
    if (method === 'VNPAY') return 'VNPay';
    return value || 'Chưa cập nhật';
};
const classOf = (enrollment: IPortalEnrollment) => enrollment.class_id;
const courseNameOf = (enrollment?: IPortalEnrollment) => enrollment?.class_id?.course_id?.name || 'Chưa gán khóa học';
type ManagerEnrollment = Omit<IEnrollment, 'student_id' | 'class_id'> & {
    student_id: IUserSummary | string;
    class_id: IClassroomWithDetails | string;
};

const PortalPage = ({ screen }: PortalPageProps) => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const user = useAppSelector(state => state.account.user);
    const role = getPortalRole(user.role?.name);
    const info = screen === 'schedule'
        ? { title: scheduleTitle(role), description: scheduleDescription(role) }
        : screenTitle[screen];
    const [managerTeachers, setManagerTeachers] = useState<IUser[]>([]);
    const [managerStudents, setManagerStudents] = useState<IUser[]>([]);
    const [managerCourses, setManagerCourses] = useState<ICourse[]>([]);
    const [managerInvoices, setManagerInvoices] = useState<IInvoice[]>([]);
    const [managerEnrollments, setManagerEnrollments] = useState<ManagerEnrollment[]>([]);
    const [managerClassrooms, setManagerClassrooms] = useState<IClassroomWithDetails[]>([]);
    const [courseModalOpen, setCourseModalOpen] = useState(false);
    const [editingCourseId, setEditingCourseId] = useState<string>('');
    const [assignmentUser, setAssignmentUser] = useState<IUser | null>(null);
    const [assignmentClassId, setAssignmentClassId] = useState<string>('');
    const [savingCourse, setSavingCourse] = useState(false);
    const [savingAssignment, setSavingAssignment] = useState(false);
    const [classroomModalOpen, setClassroomModalOpen] = useState(false);
    const [editingClassroomId, setEditingClassroomId] = useState('');
    const [savingClassroom, setSavingClassroom] = useState(false);
    const [classActionType, setClassActionType] = useState<'teacher' | 'students' | null>(null);
    const [classActionClassId, setClassActionClassId] = useState('');
    const [classActionTeacherId, setClassActionTeacherId] = useState('');
    const [classActionStudentIds, setClassActionStudentIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(screen !== 'profile');
    const [error, setError] = useState('');
    const [enrollments, setEnrollments] = useState<IPortalEnrollment[]>([]);
    const [classes, setClasses] = useState<IClassroomWithDetails[]>([]);
    const [invoices, setInvoices] = useState<IPortalInvoice[]>([]);
    const [payments, setPayments] = useState<IPortalPayment[]>([]);
    const [paymentInvoice, setPaymentInvoice] = useState<IPortalInvoice | null>(null);
    const [leads, setLeads] = useState<ILead[]>([]);
    const [savingProfile, setSavingProfile] = useState(false);
    const [editingProfile, setEditingProfile] = useState(false);
    const [profileForm] = Form.useForm<{ name: string; currentPassword?: string; newPassword?: string; confirmPassword?: string }>();
    const [courseForm] = Form.useForm<Omit<ICourse, '_id'>>();
    const [classroomForm] = Form.useForm<Omit<IClassroom, '_id'>>();

    useEffect(() => {
        profileForm.setFieldsValue({ name: user.name });
    }, [profileForm, user.name]);

    useEffect(() => {
        let active = true;
        const load = async () => {
            setLoading(screen !== 'profile');
            setError('');
            try {
                if (screen === 'profile') return;

                if (role === 'STUDENT') {
                    if (screen === 'my-courses' || screen === 'classes' || screen === 'schedule') {
                        const response = await callFetchMyEnrollments();
                        if (active) setEnrollments(toArray<IPortalEnrollment>(response));
                    }
                    if (screen === 'invoices') {
                        const response = await callFetchMyInvoices();
                        if (active) setInvoices(toArray<IPortalInvoice>(response));
                    }
                    if (screen === 'payments') {
                        const [invoiceResponse, paymentResponse] = await Promise.all([
                            callFetchMyInvoices(), callFetchMyPayments(),
                        ]);
                        if (active) {
                            setInvoices(toArray<IPortalInvoice>(invoiceResponse));
                            setPayments(toArray<IPortalPayment>(paymentResponse));
                        }
                    }
                    if (screen === 'home') {
                        const [enrollmentResponse, invoiceResponse, paymentResponse] = await Promise.all([
                            callFetchMyEnrollments(), callFetchMyInvoices(), callFetchMyPayments(),
                        ]);
                        if (active) {
                            setEnrollments(toArray<IPortalEnrollment>(enrollmentResponse));
                            setInvoices(toArray<IPortalInvoice>(invoiceResponse));
                            setPayments(toArray<IPortalPayment>(paymentResponse));
                        }
                    }
                }

                if (role === 'TEACHER') {
                    if (screen === 'classes' || screen === 'schedule' || screen === 'home') {
                        const response = await callFetchMyTeachingClassrooms();
                        if (active) setClasses(toArray<IClassroomWithDetails>(response));
                    }
                    if (screen === 'students') {
                        const response = await callFetchMyStudents();
                        if (active) setEnrollments(toArray<IPortalEnrollment>(response));
                    }
                }

                if (role === 'MANAGER') {
                    if (screen === 'teachers' || screen === 'classes' || screen === 'home') {
                        const response = await callFetchUser();
                        if (active) setManagerTeachers(toArray<IUser>(response).filter(item => roleCodeOf(item) === 'TEACHER'));
                    }
                    if (screen === 'courses' || screen === 'classes' || screen === 'home') {
                        const response = await callFetchCourse();
                        if (active) setManagerCourses(toArray<ICourse>(response));
                    }
                    if (screen === 'classes' || screen === 'invoices' || screen === 'home') {
                        const response = await callFetchClassroom('current=1&pageSize=1000');
                        if (active) setManagerClassrooms(toArray<IClassroomWithDetails>(response));
                    }
                    if (screen === 'invoices' || screen === 'home') {
                        const response = await callFetchInvoice();
                        if (active) setManagerInvoices(toArray<IInvoice>(response));
                        const enrollmentResponse = await callFetchEnrollment('current=1&pageSize=1000&populate=student_id,class_id');
                        if (active) setManagerEnrollments(toArray<ManagerEnrollment>(enrollmentResponse));
                    }
                    if (screen === 'students' || screen === 'classes' || screen === 'home') {
                        const response = await callFetchUser();
                        if (active) setManagerStudents(toArray<IUser>(response).filter(item => roleCodeOf(item) === 'STUDENT'));
                    }
                }

                if (role === 'CONSULTANT' && (screen === 'leads' || screen === 'home')) {
                    const response = await callFetchMyAssignedLeads();
                    if (active) setLeads(toArray<ILead>(response));
                }
            } catch {
                if (active) setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
            } finally {
                if (active) setLoading(false);
            }
        };
        load();
        return () => { active = false; };
    }, [role, screen]);

    const classRows = useMemo(() => role === 'STUDENT'
        ? enrollments.map(enrollment => ({
            key: enrollment._id || enrollment.class_id?._id,
            name: enrollment.class_id?.class_name || 'Chưa có tên lớp',
            course: courseNameOf(enrollment),
            room: enrollment.class_id?.room || 'Chưa cập nhật',
            time: `${enrollment.class_id?.start_time || 'Chưa cập nhật'} – ${enrollment.class_id?.end_time || 'Chưa cập nhật'}`,
            status: enrollment.status || 'Chưa cập nhật',
        }))
        : classes.map(item => ({
            key: item._id,
            name: item.class_name || 'Chưa có tên lớp',
            course: item.course_id?.name || 'Chưa gán khóa học',
            room: item.room || 'Chưa cập nhật',
            time: `${item.start_time || 'Chưa cập nhật'} – ${item.end_time || 'Chưa cập nhật'}`,
            status: item.status || 'Chưa cập nhật',
        })), [classes, enrollments, role]);

    const submitProfile = async (values: { name: string; currentPassword?: string; newPassword?: string }) => {
        setSavingProfile(true);
        const response = await callUpdateMyProfile({
            name: values.name.trim(),
            ...(values.newPassword ? { currentPassword: values.currentPassword, newPassword: values.newPassword } : {}),
        });
        setSavingProfile(false);

        if (response?.data) {
            const updatedUser = response.data as unknown as { name?: string };
            const name = updatedUser.name || values.name.trim();
            dispatch(setProfileAction({ name }));
            profileForm.setFieldsValue({ name, currentPassword: undefined, newPassword: undefined, confirmPassword: undefined });
            setEditingProfile(false);
            message.success('Cập nhật thông tin thành công');
        } else {
            message.error(Array.isArray(response?.message) ? response.message[0] : response?.message || 'Không thể cập nhật thông tin');
        }
    };

    const openCourseModal = (course?: ICourse) => {
        setEditingCourseId(course?._id || '');
        courseForm.setFieldsValue(course ? {
            name: course.name,
            description: course.description,
            level: course.level,
            duration: course.duration,
            price: course.price,
            status: course.status,
        } : { name: '', description: '', level: '', duration: '', price: '', status: 'ACTIVE' });
        setCourseModalOpen(true);
    };

    const submitCourse = async (values: Omit<ICourse, '_id'>) => {
        setSavingCourse(true);
        const response = editingCourseId
            ? await callUpdateCourse(values, editingCourseId)
            : await callCreateCourse(values);
        setSavingCourse(false);
        if (!response?.data) {
            message.error('Không thể lưu khóa học');
            return;
        }
        const savedCourse = response.data;
        setManagerCourses(current => editingCourseId
            ? current.map(course => course._id === editingCourseId ? { ...course, ...savedCourse } : course)
            : [savedCourse, ...current]);
        setCourseModalOpen(false);
        courseForm.resetFields();
        message.success(editingCourseId ? 'Cập nhật khóa học thành công' : 'Thêm khóa học thành công');
    };

    const removeCourse = async (courseId?: string) => {
        if (!courseId) return;
        const response = await callDeleteCourse(courseId);
        if (response?.data) {
            setManagerCourses(current => current.filter(course => course._id !== courseId));
            message.success('Đã xóa khóa học');
        } else {
            message.error('Không thể xóa khóa học');
        }
    };

    const openClassroomModal = (classroom?: IClassroomWithDetails) => {
        setEditingClassroomId(classroom?._id || '');
        classroomForm.setFieldsValue(classroom ? {
            course_id: classroom.course_id?._id || '',
            teacher_id: classroom.teacher_id?._id || '',
            room: classroom.room || '',
            class_name: classroom.class_name || '',
            max_student: classroom.max_student || '',
            start_time: classroom.start_time || '',
            end_time: classroom.end_time || '',
            status: classroom.status || 'OPEN',
        } : { status: 'OPEN' });
        setClassroomModalOpen(true);
    };

    const submitClassroom = async (values: Omit<IClassroom, '_id'>) => {
        setSavingClassroom(true);
        const response = editingClassroomId
            ? await callUpdateClassroom(values, editingClassroomId)
            : await callCreateClassroom(values);
        setSavingClassroom(false);
        if (!response?.data) return message.error('Không thể lưu lớp học');
        const saved = response.data as unknown as IClassroom;
        if (editingClassroomId) {
            setManagerClassrooms(current => current.map(item => item._id === editingClassroomId ? { ...item, ...saved, course_id: item.course_id, teacher_id: item.teacher_id } : item));
        } else {
            const refreshed = await callFetchClassroom('current=1&pageSize=1000');
            setManagerClassrooms(toArray<IClassroomWithDetails>(refreshed));
        }
        setClassroomModalOpen(false);
        classroomForm.resetFields();
        message.success(editingClassroomId ? 'Cập nhật lớp học thành công' : 'Thêm lớp học thành công');
    };

    const removeClassroom = async (classroomId?: string) => {
        if (!classroomId) return;
        const response = await callDeleteClassroom(classroomId);
        if (!response?.data) return message.error('Không thể xóa lớp học');
        setManagerClassrooms(current => current.filter(item => item._id !== classroomId));
        message.success('Đã xóa lớp học');
    };

    const assignUserToClass = async () => {
        if (!assignmentUser?._id || !assignmentClassId) {
            message.warning('Vui lòng chọn lớp học');
            return;
        }
        setSavingAssignment(true);
        const response = roleCodeOf(assignmentUser) === 'TEACHER'
            ? await callUpdateClassroom({ teacher_id: assignmentUser._id }, assignmentClassId)
            : await callCreateEnrollment({
                student_id: assignmentUser._id,
                class_id: assignmentClassId,
                register_date: new Date().toISOString(),
                status: 'WAITING_PAYMENT',
            });
        setSavingAssignment(false);
        if (!response?.data) {
            message.error('Không thể thêm vào lớp học');
            return;
        }
        if (roleCodeOf(assignmentUser) === 'TEACHER') {
            setManagerClassrooms(current => current.map(item => item._id === assignmentClassId
                ? { ...item, teacher_id: { _id: assignmentUser._id, name: assignmentUser.name, email: assignmentUser.email } }
                : item));
        }
        setAssignmentUser(null);
        setAssignmentClassId('');
        message.success('Đã thêm vào lớp học');
    };

    const closeClassAction = () => {
        setClassActionType(null);
        setClassActionClassId('');
        setClassActionTeacherId('');
        setClassActionStudentIds([]);
    };

    const submitClassAction = async () => {
        if (!classActionClassId) return message.warning('Không xác định được lớp học');
        setSavingAssignment(true);
        if (classActionType === 'teacher') {
            if (!classActionTeacherId) {
                setSavingAssignment(false);
                return message.warning('Vui lòng chọn giảng viên');
            }
            const response = await callUpdateClassroom({ teacher_id: classActionTeacherId }, classActionClassId);
            setSavingAssignment(false);
            if (!response?.data) return message.error('Không thể gán giảng viên');
            const teacher = managerTeachers.find(item => item._id === classActionTeacherId);
            setManagerClassrooms(current => current.map(item => item._id === classActionClassId
                ? { ...item, teacher_id: teacher ? { _id: teacher._id, name: teacher.name, email: teacher.email } : item.teacher_id }
                : item));
            message.success('Đã gán giảng viên phụ trách');
            closeClassAction();
            return;
        }

        if (!classActionStudentIds.length) {
            setSavingAssignment(false);
            return message.warning('Vui lòng chọn ít nhất một học viên');
        }
        const responses = await Promise.all(classActionStudentIds.map(studentId => callCreateEnrollment({
            student_id: studentId,
            class_id: classActionClassId,
            register_date: new Date().toISOString(),
            status: 'WAITING_PAYMENT',
        })));
        setSavingAssignment(false);
        if (responses.some(response => !response?.data)) return message.error('Không thể thêm một hoặc nhiều học viên');
        message.success('Đã thêm học viên vào lớp');
        closeClassAction();
    };

    const renderContent = () => {
        if (loading) return <div className={styles['portal-loading']}><Spin /></div>;
        if (error) return <Alert type="error" showIcon message={error} />;

        if (screen === 'profile') return <Card className={styles['portal-card']}>
            <Descriptions column={{ xs: 1, sm: 2 }} labelStyle={{ color: '#728095' }}>
                <Descriptions.Item label="Họ tên">{user.name || 'Chưa cập nhật'}</Descriptions.Item>
                <Descriptions.Item label="Vai trò">{roleLabel[role]}</Descriptions.Item>
                <Descriptions.Item label="Email">{user.email || 'Chưa cập nhật'}</Descriptions.Item>
                <Descriptions.Item label="Mã tài khoản">{user._id || 'Chưa cập nhật'}</Descriptions.Item>
            </Descriptions>
            {!editingProfile ? <Button type="primary" onClick={() => setEditingProfile(true)}>
                Chỉnh sửa thông tin
            </Button> : <div className={styles['profile-form']}>
                <h3>Chỉnh sửa thông tin</h3>
                <Form form={profileForm} layout="vertical" onFinish={submitProfile}>
                    <Form.Item name="name" label="Họ và tên" rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập họ và tên' }]}>
                        <Input maxLength={100} />
                    </Form.Item>
                    <Form.Item name="currentPassword" label="Mật khẩu hiện tại" dependencies={['newPassword']} rules={[({ getFieldValue }) => ({
                        validator: (_, value) => getFieldValue('newPassword') && !value ? Promise.reject(new Error('Vui lòng nhập mật khẩu hiện tại')) : Promise.resolve()
                    })]}>
                        <Input.Password autoComplete="current-password" />
                    </Form.Item>
                    <Form.Item name="newPassword" label="Mật khẩu mới" rules={[{ min: 8, message: 'Mật khẩu mới phải có ít nhất 8 ký tự' }]}>
                        <Input.Password autoComplete="new-password" />
                    </Form.Item>
                    <Form.Item name="confirmPassword" label="Nhập lại mật khẩu mới" dependencies={['newPassword']} rules={[({ getFieldValue }) => ({
                        validator: (_, value) => !getFieldValue('newPassword') || value === getFieldValue('newPassword') ? Promise.resolve() : Promise.reject(new Error('Mật khẩu xác nhận chưa khớp'))
                    })]}>
                        <Input.Password autoComplete="new-password" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" loading={savingProfile}>Lưu thay đổi</Button>
                    <Button type="default" onClick={() => {
                        profileForm.resetFields();
                        profileForm.setFieldsValue({ name: user.name });
                        setEditingProfile(false);
                    }}>Hủy</Button>
                </Form>
            </div>}
        </Card>;

        if (screen === 'my-courses') return enrollments.length ? <Row gutter={[18, 18]}>{enrollments.map(enrollment => <Col xs={24} md={12} key={enrollment._id}><Card className={styles['portal-card']} title={<><BookOutlined /> {courseNameOf(enrollment)}</>} extra={<Tag color="green">{enrollment.status || 'Chưa cập nhật'}</Tag>}>
            <p><b>Lớp:</b> {classOf(enrollment)?.class_name || 'Chưa cập nhật'}</p>
            <p><b>Lịch:</b> {classOf(enrollment)?.start_time || 'Chưa cập nhật'} – {classOf(enrollment)?.end_time || 'Chưa cập nhật'}</p>
            <p><b>Ngày đăng ký:</b> {dateText(enrollment.register_date)}</p>
        </Card></Col>)}</Row> : <Empty description="Bạn chưa có khóa học nào" />;

        if (screen === 'schedule') {
            if (role === 'CONSULTANT') return <Alert type="info" showIcon message="Chưa có dữ liệu lịch hẹn" description="Backend hiện chưa lưu lịch hẹn cho tư vấn viên." />;
            return classRows.length ? <div className={styles['schedule-list']}>{classRows.map(item => <Card key={String(item.key)} className={styles['portal-card']}><div className={styles['schedule-row']}><div className={styles['schedule-date']}><CalendarOutlined /></div><div><h3>{item.course}</h3><p>{item.name} · {item.room} · {item.time}</p></div><Tag color="blue">{role === 'TEACHER' ? 'Lịch dạy' : 'Lịch học'}</Tag></div></Card>)}</div> : <Empty description={role === 'TEACHER' ? 'Chưa có lịch dạy' : 'Chưa có lịch học'} />;
        }

        if (screen === 'invoices') {
            if (role === 'MANAGER') {
                const getId = (value?: string | { _id?: string }) => typeof value === 'string' ? value : value?._id || '';
                const managerInvoiceClassRows = managerClassrooms.map(classroom => {
                    const classId = classroom._id || '';
                    const classEnrollments = managerEnrollments.filter(enrollment => getId(enrollment.class_id) === classId);
                    const classEnrollmentIds = new Set(classEnrollments.map(enrollment => enrollment._id));
                    const classInvoices = managerInvoices.filter(invoice => classEnrollmentIds.has(invoice.enrollment_id));
                    return {
                        ...classroom,
                        key: classId,
                        invoiceCount: classInvoices.length,
                        paidCount: classInvoices.filter(invoice => invoice.status?.toUpperCase() === 'PAID').length,
                        students: classEnrollments,
                    };
                });
                return managerInvoiceClassRows.length ? <Card className={styles['portal-card']}>
                    <Table
                        pagination={false}
                        scroll={{ x: 820 }}
                        rowKey="key"
                        expandable={{
                            expandedRowRender: (classroom) => <div className={styles['invoice-class-detail']}>
                                <Descriptions size="small" column={{ xs: 1, sm: 3 }}>
                                    <Descriptions.Item label="Khóa học">{classroom.course_id?.name || 'Chưa gán khóa học'}</Descriptions.Item>
                                    <Descriptions.Item label="Giảng viên phụ trách">{classroom.teacher_id?.name || 'Chưa có'}</Descriptions.Item>
                                    <Descriptions.Item label="Tổng học viên">{classroom.students.length}</Descriptions.Item>
                                </Descriptions>
                                {classroom.students.length ? <Table
                                    size="small"
                                    pagination={false}
                                    rowKey={(student) => student._id || `${classroom.key}-${getId(student.student_id)}`}
                                    columns={[
                                        { title: 'Học viên', render: (_: unknown, enrollment: ManagerEnrollment) => typeof enrollment.student_id === 'string' ? enrollment.student_id : enrollment.student_id?.name || 'Chưa cập nhật' },
                                        { title: 'Email', render: (_: unknown, enrollment: ManagerEnrollment) => typeof enrollment.student_id === 'string' ? 'Chưa cập nhật' : enrollment.student_id?.email || 'Chưa cập nhật' },
                                        { title: 'Trạng thái', dataIndex: 'status', render: (value?: string) => <Tag color={value === 'STUDYING' ? 'green' : 'gold'}>{value || 'Chưa cập nhật'}</Tag> },
                                    ]}
                                    dataSource={classroom.students}
                                /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có học viên trong lớp" />}
                            </div>,
                        }}
                        columns={[
                            { title: 'Lớp học', dataIndex: 'class_name', render: (value?: string) => value || 'Lớp chưa đặt tên' },
                            { title: 'Khóa học', render: (_: unknown, classroom: IClassroomWithDetails) => classroom.course_id?.name || 'Chưa gán khóa học' },
                            { title: 'Giảng viên phụ trách', render: (_: unknown, classroom: IClassroomWithDetails) => classroom.teacher_id?.name || 'Chưa có' },
                            { title: 'Học viên', render: (_: unknown, classroom: typeof managerInvoiceClassRows[number]) => classroom.students.length },
                            { title: 'Hóa đơn', render: (_: unknown, classroom: typeof managerInvoiceClassRows[number]) => `${classroom.paidCount}/${classroom.invoiceCount} đã trả` },
                        ]}
                        dataSource={managerInvoiceClassRows}
                    />
                </Card> : <Empty description="Chưa có lớp học để hiển thị hóa đơn" />;
            }
            const invoiceRows = invoices;
            return invoiceRows.length ? <Card className={styles['portal-card']} title="Các khoản cần thanh toán"><Table pagination={false} scroll={{ x: 700 }} columns={[
                { title: 'Mã hóa đơn', dataIndex: '_id' },
                { title: 'Khóa học', render: (_: unknown, row: IPortalInvoice | IInvoice) => 'enrollment_id' in row && typeof row.enrollment_id === 'object' ? courseNameOf(row.enrollment_id as IPortalEnrollment) : 'Chung' },
                { title: 'Lớp học', render: (_: unknown, row: IPortalInvoice | IInvoice) => 'enrollment_id' in row && typeof row.enrollment_id === 'object' ? row.enrollment_id?.class_id?.class_name || 'Chưa cập nhật' : 'Chưa cập nhật' },
                { title: 'Số tiền cần trả', render: (_: unknown, row: IPortalInvoice | IInvoice) => <b>{moneyText('final_amount' in row ? (row.final_amount ?? row.amount) : row.amount)}</b> },
                { title: 'Trạng thái', dataIndex: 'status', render: (value?: string) => <Tag color={invoiceStatusColor(value)}>{invoiceStatusText(value)}</Tag> },
            ]} dataSource={invoiceRows} rowKey="_id" /></Card> : <Empty description="Chưa có hóa đơn" />;
        }

        if (screen === 'payments' && role === 'STUDENT') return <>
            <Card className={styles['portal-card']} title="Hóa đơn của tôi">
                {invoices.length ? <Table pagination={false} scroll={{ x: 780 }} rowKey="_id" columns={[
                    { title: 'Khóa học', render: (_: unknown, row: IPortalInvoice) => courseNameOf(row) },
                    { title: 'Lớp học', render: (_: unknown, row: IPortalInvoice) => row.enrollment_id?.class_id?.class_name || 'Chưa cập nhật' },
                    { title: 'Số tiền', render: (_: unknown, row: IPortalInvoice) => <b>{moneyText(row.final_amount ?? row.amount)}</b> },
                    { title: 'Trạng thái', dataIndex: 'status', render: (value?: string) => <Tag color={invoiceStatusColor(value)}>{invoiceStatusText(value)}</Tag> },
                    { title: 'Thao tác', render: (_: unknown, row: IPortalInvoice) => row.status?.toUpperCase() === 'PAID'
                        ? <Tag color="green">Hoàn tất</Tag>
                        : <Button type="primary" onClick={() => setPaymentInvoice(row)}>Thanh toán</Button> },
                ]} dataSource={invoices} /> : <Empty description="Bạn chưa có hóa đơn" />}
            </Card>
            <Card className={styles['portal-card']} title="Lịch sử thanh toán" style={{ marginTop: 18 }}>
                {payments.length ? <Table pagination={false} scroll={{ x: 760 }} rowKey="_id" columns={[
                    { title: 'Mã giao dịch', dataIndex: '_id' },
                    { title: 'Khóa học', render: (_: unknown, row: IPortalPayment) => courseNameOf(row.invoice_id?.enrollment_id) },
                    { title: 'Lớp học', render: (_: unknown, row: IPortalPayment) => row.invoice_id?.enrollment_id?.class_id?.class_name || 'Chưa cập nhật' },
                    { title: 'Số tiền', render: (_: unknown, row: IPortalPayment) => moneyText(row.invoice_id?.final_amount ?? row.invoice_id?.amount) },
                    { title: 'Phương thức', dataIndex: 'payment_method', render: (value?: string) => paymentMethodText(value) },
                    { title: 'Ngày thanh toán', dataIndex: 'payment_date', render: (value?: string) => dateText(value) },
                    { title: 'Trạng thái', render: () => <Tag color="green">Hoàn tất</Tag> },
                ]} dataSource={payments} /> : <Empty description="Chưa có giao dịch thanh toán" />}
            </Card>
            <Modal title="Thông tin thanh toán" open={Boolean(paymentInvoice)} footer={null} onCancel={() => setPaymentInvoice(null)}>
                <Descriptions column={1}>
                    <Descriptions.Item label="Khóa học">{paymentInvoice ? courseNameOf(paymentInvoice) : ''}</Descriptions.Item>
                    <Descriptions.Item label="Lớp học">{paymentInvoice?.enrollment_id?.class_id?.class_name || 'Chưa cập nhật'}</Descriptions.Item>
                    <Descriptions.Item label="Phòng học">{paymentInvoice?.enrollment_id?.class_id?.room || 'Chưa cập nhật'}</Descriptions.Item>
                    <Descriptions.Item label="Số tiền cần thanh toán"><b>{paymentInvoice ? moneyText(paymentInvoice.final_amount ?? paymentInvoice.amount) : ''}</b></Descriptions.Item>
                </Descriptions>
                <div className={styles['payment-qr-placeholder']}>
                    <span>QR</span>
                    <p>Khu vực hiển thị mã QR thanh toán</p>
                </div>
                <Alert type="info" showIcon message="Mã QR sẽ được tích hợp tại đây." />
            </Modal>
        </>;

        if (screen === 'payments') return payments.length ? <Card className={styles['portal-card']} title="Lịch sử thanh toán"><Table pagination={false} scroll={{ x: 760 }} columns={[
            { title: 'Mã giao dịch', dataIndex: '_id' },
            { title: 'Khóa học', render: (_: unknown, row: IPortalPayment) => courseNameOf(row.invoice_id?.enrollment_id) },
            { title: 'Lớp học', render: (_: unknown, row: IPortalPayment) => row.invoice_id?.enrollment_id?.class_id?.class_name || 'Chưa cập nhật' },
            { title: 'Số tiền', render: (_: unknown, row: IPortalPayment) => moneyText(row.invoice_id?.final_amount ?? row.invoice_id?.amount) },
            { title: 'Phương thức', dataIndex: 'payment_method', render: (value?: string) => paymentMethodText(value) },
            { title: 'Ngày thanh toán', dataIndex: 'payment_date', render: (value?: string) => dateText(value) },
            { title: 'Trạng thái', render: () => <Tag color="green">Hoàn tất</Tag> },
        ]} dataSource={payments} rowKey="_id" /></Card> : <Empty description="Chưa có giao dịch thanh toán" />;

        if (screen === 'students') {
            const studentRows = role === 'MANAGER' ? managerStudents : enrollments;
            if (role === 'MANAGER') {
                return studentRows.length ? <Card className={styles['portal-card']}><Table pagination={false} scroll={{ x: 560 }} columns={[
                    { title: 'Học viên', dataIndex: 'name' }, { title: 'Email', dataIndex: 'email' }, { title: 'Giới tính', dataIndex: 'gender' }, { title: 'Địa chỉ', dataIndex: 'address' },
                    { title: 'Thao tác', key: 'actions', render: (_: unknown, student: IUser) => <Button type="primary" icon={<UserAddOutlined />} onClick={() => { setAssignmentUser(student); setAssignmentClassId(''); }}>Thêm vào lớp</Button> },
                ]} dataSource={studentRows as IUser[]} rowKey="_id" /></Card> : <Empty description="Chưa có học viên" />;
            }
            return enrollments.length ? <Card className={styles['portal-card']}><Table pagination={false} scroll={{ x: 560 }} columns={[
                { title: 'Học viên', render: (_, row: IPortalEnrollment) => row.student_id?.name || 'Chưa cập nhật' }, { title: 'Email', render: (_, row: IPortalEnrollment) => row.student_id?.email || 'Chưa cập nhật' }, { title: 'Lớp', render: (_, row: IPortalEnrollment) => row.class_id?.class_name || 'Chưa cập nhật' }, { title: 'Trạng thái', dataIndex: 'status', render: (value?: string) => <Tag color="green">{value || 'Chưa cập nhật'}</Tag> },
            ]} dataSource={enrollments} rowKey="_id" /></Card> : <Empty description="Chưa có học viên trong các lớp bạn phụ trách" />;
        }

        if (screen === 'teachers') {
            return managerTeachers.length ? <Card className={styles['portal-card']}><Table pagination={false} scroll={{ x: 560 }} columns={[
                { title: 'Giảng viên', dataIndex: 'name' }, { title: 'Email', dataIndex: 'email' }, { title: 'Giới tính', dataIndex: 'gender' }, { title: 'Địa chỉ', dataIndex: 'address' },
                { title: 'Thao tác', key: 'actions', render: (_: unknown, teacher: IUser) => <Button type="primary" icon={<UserAddOutlined />} onClick={() => { setAssignmentUser(teacher); setAssignmentClassId(''); }}>Thêm vào lớp</Button> },
            ]} dataSource={managerTeachers} rowKey="_id" /></Card> : <Empty description="Chưa có giảng viên" />;
        }

        if (screen === 'courses') {
            return <Card className={styles['portal-card']} extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openCourseModal()}>Thêm khóa học</Button>}>
                {managerCourses.length ? <Table pagination={false} scroll={{ x: 760 }} columns={[
                    { title: 'Khóa học', dataIndex: 'name' }, { title: 'Mô tả', dataIndex: 'description' }, { title: 'Cấp độ', dataIndex: 'level' }, { title: 'Thời lượng', dataIndex: 'duration' }, { title: 'Giá', render: (_: unknown, row: ICourse) => row.price ? `${String(row.price).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} đ` : 'Chưa cập nhật' },
                    { title: 'Thao tác', key: 'actions', render: (_: unknown, course: ICourse) => <div className={styles['table-actions']}><Button aria-label="Sửa khóa học" icon={<EditOutlined />} onClick={() => openCourseModal(course)} /><Popconfirm title="Xóa khóa học này?" okText="Xóa" cancelText="Hủy" onConfirm={() => removeCourse(course._id)}><Button danger aria-label="Xóa khóa học" icon={<DeleteOutlined />} /></Popconfirm></div> },
                ]} dataSource={managerCourses} rowKey="_id" /> : <Empty description="Chưa có khóa học" />}
            </Card>;
        }

        if (screen === 'classes') {
            if (role === 'MANAGER') {
                return <>
                    <div className={styles['portal-toolbar']}>
                        <div><h2>Danh sách lớp học</h2><p>Quản lý lớp, khóa học và giảng viên phụ trách.</p></div>
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => openClassroomModal()}>Thêm lớp học</Button>
                    </div>
                    {managerClassrooms.length ? <div className={styles['schedule-list']}>
                        {managerClassrooms.map(item => {
                        return <Card key={item._id} className={styles['portal-card']}>
                            <div className={styles['schedule-row']}>
                                <div className={styles['schedule-date']}><TeamOutlined /></div>
                                <div style={{ flex: 1 }}>
                                    <h3>{item.class_name || 'Lớp chưa đặt tên'}</h3>
                                    <p>{item.course_id?.name || 'Chưa gán khóa học'} · {item.room || 'Chưa cập nhật'} · {item.start_time || 'Chưa cập nhật'} – {item.end_time || 'Chưa cập nhật'}</p>
                                    <p>Giảng viên phụ trách: {item.teacher_id?.name || 'Chưa có'}</p>
                                </div>
                                <div className={styles['manager-class-actions']}>
                                    <Button icon={<TeamOutlined />} onClick={() => navigate(`/portal/classes/${item._id}`)}>Xem chi tiết lớp</Button>
                                    <Button icon={<EditOutlined />} onClick={() => openClassroomModal(item)}>Sửa lớp</Button>
                                    <Popconfirm title="Xóa lớp học này?" description="Thao tác này không xóa các học viên đã đăng ký." okText="Xóa" cancelText="Hủy" onConfirm={() => removeClassroom(item._id)}>
                                        <Button danger icon={<DeleteOutlined />}>Xóa lớp</Button>
                                    </Popconfirm>
                                </div>
                            </div>
                        </Card>;
                        })}
                    </div> : <Empty description="Chưa có lớp học" />}
                </>;
            }
            return classRows.length ? <Card className={styles['portal-card']}><Table pagination={false} scroll={{ x: 640 }} columns={[
                { title: 'Lớp học', dataIndex: 'name' }, { title: 'Khóa học', dataIndex: 'course' }, { title: 'Phòng', dataIndex: 'room' }, { title: 'Thời gian', dataIndex: 'time' }, { title: 'Trạng thái', dataIndex: 'status', render: (value: string) => <Tag color="green">{value}</Tag> },
            ]} dataSource={classRows} /></Card> : <Empty description="Chưa có lớp học phù hợp" />;
        }

        if (screen === 'leads') return leads.length ? <Card className={styles['portal-card']}><Table pagination={false} scroll={{ x: 560 }} columns={[
            { title: 'Khách hàng', dataIndex: 'full_name' }, { title: 'Khóa học quan tâm', dataIndex: 'course_name' }, { title: 'Liên hệ', dataIndex: 'phone' }, { title: 'Trạng thái', dataIndex: 'status', render: (value?: string) => <Tag color="blue">{value || 'Chưa cập nhật'}</Tag> },
        ]} dataSource={leads} rowKey="_id" /></Card> : <Empty description="Chưa có khách hàng được phân công" />;

        return <Card className={styles['portal-card']}><p>Chọn chức năng trên thanh điều hướng để xem thông tin chi tiết.</p></Card>;
    };

    const primaryCount = role === 'STUDENT'
        ? enrollments.length
        : role === 'TEACHER'
            ? classes.length
            : role === 'MANAGER'
                ? managerStudents.length
                : leads.length;
    const secondaryCount = role === 'MANAGER' ? managerClassrooms.length : role === 'STUDENT' ? enrollments.length : classes.length;
    const invoiceCount = role === 'MANAGER' ? managerInvoices.length : invoices.length;
    return <main className={`${styles.container} ${styles['portal-section']}`}>
        <section className={styles['portal-hero']}><span>{roleLabel[role].toUpperCase()}</span><h1>{screen === 'home' ? `Chào ${user.name || 'bạn'}!` : info.title}</h1><p>{info.description}</p></section>
        {screen === 'home' && <Row gutter={[18, 18]} className={styles['portal-stats']}>
            <Col xs={24} sm={12} lg={6}><Card><Statistic title={role === 'MANAGER' ? 'Học viên' : role === 'CONSULTANT' ? 'Khách hàng phụ trách' : role === 'TEACHER' ? 'Lớp phụ trách' : 'Khóa học đang học'} value={primaryCount} prefix={<BookOutlined />} /></Card></Col>
            <Col xs={24} sm={12} lg={6}><Card><Statistic title={role === 'MANAGER' ? 'Lớp học' : role === 'TEACHER' ? 'Lịch dạy' : 'Lịch học/giảng'} value={secondaryCount} prefix={<CalendarOutlined />} /></Card></Col>
            <Col xs={24} sm={12} lg={6}><Card><Statistic title="Hóa đơn" value={invoiceCount} prefix={<FileTextOutlined />} /></Card></Col>
            <Col xs={24} sm={12} lg={6}><Card><Statistic title="Thanh toán" value={payments.length} prefix={<CreditCardOutlined />} /></Card></Col>
        </Row>}
        <section className={styles['portal-content']}>{renderContent()}</section>
        <Modal
            title={editingClassroomId ? 'Sửa lớp học' : 'Thêm lớp học'}
            open={classroomModalOpen}
            destroyOnClose
            width={720}
            confirmLoading={savingClassroom}
            okText={editingClassroomId ? 'Lưu thay đổi' : 'Thêm lớp học'}
            cancelText="Hủy"
            onCancel={() => setClassroomModalOpen(false)}
            onOk={() => classroomForm.submit()}
        >
            <Form form={classroomForm} layout="vertical" onFinish={submitClassroom}>
                <Row gutter={12}>
                    <Col xs={24} sm={12}><Form.Item name="class_name" label="Tên lớp" rules={[{ required: true, message: 'Vui lòng nhập tên lớp' }]}><Input placeholder="Ví dụ: React cơ bản K01" /></Form.Item></Col>
                    <Col xs={24} sm={12}><Form.Item name="room" label="Phòng học" rules={[{ required: true, message: 'Vui lòng nhập phòng học' }]}><Input placeholder="Phòng A101" /></Form.Item></Col>
                </Row>
                <Row gutter={12}>
                    <Col xs={24} sm={12}><Form.Item name="course_id" label="Khóa học" rules={[{ required: true, message: 'Vui lòng chọn khóa học' }]}><Select showSearch optionFilterProp="label" placeholder="Chọn khóa học" options={managerCourses.map(course => ({ label: course.name, value: course._id || '' })).filter(option => option.value)} /></Form.Item></Col>
                    <Col xs={24} sm={12}><Form.Item name="teacher_id" label="Giảng viên" rules={[{ required: true, message: 'Vui lòng chọn giảng viên' }]}><Select showSearch optionFilterProp="label" placeholder="Chọn giảng viên" options={managerTeachers.map(teacher => ({ label: `${teacher.name} - ${teacher.email}`, value: teacher._id || '' })).filter(option => option.value)} /></Form.Item></Col>
                </Row>
                <Row gutter={12}>
                    <Col xs={24} sm={8}><Form.Item name="max_student" label="Số học viên tối đa" rules={[{ required: true, message: 'Vui lòng nhập sĩ số' }]}><Input inputMode="numeric" placeholder="30" /></Form.Item></Col>
                    <Col xs={24} sm={8}><Form.Item name="start_time" label="Bắt đầu" rules={[{ required: true, message: 'Vui lòng nhập giờ bắt đầu' }]}><Input placeholder="18:00" /></Form.Item></Col>
                    <Col xs={24} sm={8}><Form.Item name="end_time" label="Kết thúc" rules={[{ required: true, message: 'Vui lòng nhập giờ kết thúc' }]}><Input placeholder="20:00" /></Form.Item></Col>
                </Row>
                <Form.Item name="status" label="Trạng thái"><Select options={[{ label: 'Đang mở', value: 'OPEN' }, { label: 'Đã hoàn thành', value: 'COMPLETED' }, { label: 'Đã hủy', value: 'CANCELLED' }]} /></Form.Item>
            </Form>
        </Modal>
        <Modal
            title={classActionType === 'teacher' ? 'Gán giảng viên phụ trách' : 'Thêm học viên vào lớp'}
            open={Boolean(classActionType)}
            confirmLoading={savingAssignment}
            okText="Xác nhận"
            cancelText="Hủy"
            onCancel={closeClassAction}
            onOk={submitClassAction}
        >
            {classActionType === 'teacher' ? <Select
                value={classActionTeacherId || undefined}
                onChange={setClassActionTeacherId}
                placeholder="Chọn giảng viên"
                options={managerTeachers.map(teacher => ({ label: `${teacher.name} - ${teacher.email}`, value: teacher._id || '' })).filter(option => option.value)}
                style={{ width: '100%' }}
            /> : <Select
                mode="multiple"
                value={classActionStudentIds}
                onChange={setClassActionStudentIds}
                placeholder="Chọn một hoặc nhiều học viên"
                options={managerStudents.map(student => ({ label: `${student.name} - ${student.email}`, value: student._id || '' })).filter(option => option.value)}
                maxTagCount="responsive"
                style={{ width: '100%' }}
            />}
        </Modal>
        <Modal
            title={editingCourseId ? 'Sửa khóa học' : 'Thêm khóa học'}
            open={courseModalOpen}
            destroyOnClose
            confirmLoading={savingCourse}
            okText={editingCourseId ? 'Lưu thay đổi' : 'Thêm khóa học'}
            cancelText="Hủy"
            onCancel={() => setCourseModalOpen(false)}
            onOk={() => courseForm.submit()}
        >
            <Form form={courseForm} layout="vertical" onFinish={submitCourse}>
                <Form.Item name="name" label="Tên khóa học" rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập tên khóa học' }]}>
                    <Input placeholder="Ví dụ: Lập trình Web với React" />
                </Form.Item>
                <Form.Item name="description" label="Mô tả">
                    <Input.TextArea rows={3} placeholder="Mô tả ngắn về khóa học" />
                </Form.Item>
                <Row gutter={12}>
                    <Col span={12}><Form.Item name="level" label="Cấp độ"><Input placeholder="Cơ bản" /></Form.Item></Col>
                    <Col span={12}><Form.Item name="duration" label="Thời lượng"><Input placeholder="3 tháng" /></Form.Item></Col>
                </Row>
                <Row gutter={12}>
                    <Col span={12}><Form.Item name="price" label="Học phí"><Input inputMode="numeric" placeholder="5000000" /></Form.Item></Col>
                    <Col span={12}><Form.Item name="status" label="Trạng thái"><Select options={[{ label: 'Đang hoạt động', value: 'ACTIVE' }, { label: 'Tạm dừng', value: 'INACTIVE' }]} /></Form.Item></Col>
                </Row>
            </Form>
        </Modal>
        <Modal
            title={`Thêm ${roleCodeOf(assignmentUser || {} as IUser) === 'TEACHER' ? 'giảng viên' : 'học viên'} vào lớp`}
            open={Boolean(assignmentUser)}
            confirmLoading={savingAssignment}
            okText="Xác nhận"
            cancelText="Hủy"
            onCancel={() => setAssignmentUser(null)}
            onOk={assignUserToClass}
        >
            <p><b>{assignmentUser?.name}</b> · {assignmentUser?.email}</p>
            <Select
                value={assignmentClassId || undefined}
                onChange={setAssignmentClassId}
                placeholder="Chọn lớp học"
                options={managerClassrooms.map(item => ({
                    label: `${item.class_name || 'Lớp chưa đặt tên'}${item.course_id?.name ? ` - ${item.course_id.name}` : ''}`,
                    value: item._id || '',
                })).filter(option => option.value)}
                style={{ width: '100%' }}
            />
        </Modal>
    </main>;
};

export default PortalPage;
