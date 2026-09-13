import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Form, Input, Modal, Select, Spin, message } from 'antd';
import { ArrowLeftOutlined, BookOutlined, ClockCircleOutlined, DollarOutlined, FormOutlined, TeamOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { callCreateEnrollment, callCreateLead, callFetchClassroom, callFetchCourseById } from '@/config/api';
import { useAppSelector } from '@/redux/hooks';
import type { IClassroom, ICourse } from '@/types/backend';
import styles from '@/styles/client.module.scss';

const CourseDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const user = useAppSelector(state => state.account.user);
    const isAuthenticated = useAppSelector(state => state.account.isAuthenticated);
    const [course, setCourse] = useState<ICourse | null>(null);
    const [classrooms, setClassrooms] = useState<IClassroom[]>([]);
    const [loading, setLoading] = useState(true);
    const [openEnrollment, setOpenEnrollment] = useState(false);
    const [openConsultation, setOpenConsultation] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [enrollmentForm] = Form.useForm();
    const [consultationForm] = Form.useForm();

    useEffect(() => {
        if (!id) return;
        const load = async () => {
            try {
                const [courseResponse, classroomResponse] = await Promise.all([
                    callFetchCourseById(id),
                    callFetchClassroom(`current=1&pageSize=50&course_id=${id}`),
                ]);
                const courseData = courseResponse.data as unknown as ICourse | { data?: ICourse };
                setCourse('data' in courseData && courseData.data ? courseData.data : courseData as ICourse);
                const classroomData = classroomResponse.data as unknown as { result?: IClassroom[]; data?: { result?: IClassroom[] } };
                setClassrooms(classroomData?.result ?? classroomData?.data?.result ?? []);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    const price = useMemo(() => {
        if (!course?.price) return 'Liên hệ';
        const value = Number(course.price);
        return Number.isNaN(value) ? course.price : `${value.toLocaleString('vi-VN')} đ`;
    }, [course?.price]);

    const openRegister = () => {
        if (!isAuthenticated) {
            message.info('Vui lòng đăng nhập để đăng ký khóa học.');
            navigate('/login');
            return;
        }
        setOpenEnrollment(true);
    };

    const submitEnrollment = async ({ class_id }: { class_id: string }) => {
        if (!user._id || !id) return;
        setSubmitting(true);
        const response = await callCreateEnrollment({ student_id: user._id, class_id, register_date: new Date().toISOString(), status: 'WAITING_PAYMENT' });
        setSubmitting(false);
        if (response.data) {
            message.success('Đăng ký khóa học thành công.');
            setOpenEnrollment(false);
            enrollmentForm.resetFields();
        } else message.error(response.message || 'Không thể đăng ký khóa học.');
    };

    const submitConsultation = async (values: { full_name: string; phone: string; email: string; note?: string }) => {
        if (!course) return;
        setSubmitting(true);
        const response = await callCreateLead({ ...values, course_name: course.name });
        setSubmitting(false);
        if (response.data) {
            message.success('Đã gửi yêu cầu tư vấn. Trung tâm sẽ liên hệ với bạn.');
            setOpenConsultation(false);
            consultationForm.resetFields();
        } else message.error(response.message || 'Không thể gửi yêu cầu tư vấn.');
    };

    if (loading) return <div className={styles['course-state']}><Spin /></div>;
    if (!course) return <div className={styles['course-state']}><Alert message="Không tìm thấy khóa học" type="warning" /></div>;

    return <main className={styles['course-detail']}>
        <button className={styles['back-link']} type="button" onClick={() => navigate('/')}><ArrowLeftOutlined /> Quay lại danh sách</button>
        <section className={styles['detail-hero']}>
            <div className={styles['course-icon']}><BookOutlined /></div>
            <span className={styles['course-status']}>{course.status || 'Đang tuyển sinh'}</span>
            <h1>{course.name}</h1>
            <p>{course.description || 'Chương trình học thực tế, phù hợp cho hành trình phát triển kỹ năng của bạn.'}</p>
        </section>
        <section className={styles['detail-content']}>
            <div className={styles['detail-main']}>
                <h2>Thông tin khóa học</h2>
                <p>{course.description || 'Khóa học được xây dựng với nội dung thực hành và lộ trình rõ ràng.'}</p>
                <div className={styles['detail-facts']}>
                    <span><TeamOutlined /><b>Cấp độ</b>{course.level || 'Mọi trình độ'}</span>
                    <span><ClockCircleOutlined /><b>Thời lượng</b>{course.duration || 'Linh hoạt'}</span>
                    <span><DollarOutlined /><b>Học phí</b>{price}</span>
                </div>
                <h2>Lớp đang mở</h2>
                {classrooms.length ? classrooms.map(item => <div className={styles['classroom-row']} key={item._id}>
                    <b>{item.class_name || 'Lớp học mới'}</b><span>{item.room || 'Đang cập nhật'} · {item.max_student || 'Không giới hạn'} học viên</span>
                </div>) : <p className={styles['muted']}>Hiện chưa có lớp mở cho khóa học này. Bạn có thể gửi yêu cầu tư vấn.</p>}
            </div>
            <aside className={styles['detail-aside']}>
                <strong>{price}</strong>
                <Button type="primary" size="large" block disabled={!classrooms.length} onClick={openRegister}>Đăng ký khóa học</Button>
                <Button size="large" block icon={<FormOutlined />} onClick={() => setOpenConsultation(true)}>Tư vấn khóa học</Button>
                {!classrooms.length && <small>Chưa có lớp mở, hãy để lại thông tin để được tư vấn lịch học.</small>}
            </aside>
        </section>
        <Modal title={`Đăng ký ${course.name}`} open={openEnrollment} onCancel={() => setOpenEnrollment(false)} onOk={() => enrollmentForm.submit()} confirmLoading={submitting} okText="Xác nhận đăng ký" cancelText="Hủy">
            <Form form={enrollmentForm} layout="vertical" onFinish={submitEnrollment}>
                <Form.Item name="class_id" label="Chọn lớp học" rules={[{ required: true, message: 'Vui lòng chọn lớp học' }]}>
                    <Select options={classrooms.map(item => ({ value: item._id, label: `${item.class_name || 'Lớp học'} - ${item.room || 'Chưa có phòng'}` }))} placeholder="Chọn lớp phù hợp" />
                </Form.Item>
            </Form>
        </Modal>
        <Modal title="Đăng ký tư vấn" open={openConsultation} onCancel={() => setOpenConsultation(false)} onOk={() => consultationForm.submit()} confirmLoading={submitting} okText="Gửi yêu cầu" cancelText="Hủy">
            <Form form={consultationForm} layout="vertical" onFinish={submitConsultation}>
                <Form.Item name="full_name" label="Họ và tên" rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}><Input /></Form.Item>
                <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}><Input /></Form.Item>
                <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Vui lòng nhập email hợp lệ' }]}><Input /></Form.Item>
                <Form.Item name="note" label="Nội dung cần tư vấn"><Input.TextArea rows={3} placeholder="Bạn muốn được tư vấn thêm điều gì?" /></Form.Item>
            </Form>
        </Modal>
    </main>;
};

export default CourseDetailPage;