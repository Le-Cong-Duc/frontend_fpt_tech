import { useEffect, useState } from 'react';
import { Alert, Button, Empty, message, Select, Spin } from 'antd';
import { ArrowLeftOutlined, CreditCardOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { callFetchCourseById, callFetchMyInvoices, callFetchOpenClassroomsForCourse, callRegisterForCourse } from '@/config/api';
import type { IClassroom, ICourse, IPortalInvoice } from '@/types/backend';
import { canRegisterForCourse } from '@/config/portal';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchAccount } from '@/redux/slice/accountSlide';
import styles from '@/styles/client.module.scss';
import PaymentRequestModal from '@/components/client/PaymentRequestModal';

const CourseCheckout = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { isAuthenticated, isLoading: accountLoading, user } = useAppSelector(state => state.account);
    const [course, setCourse] = useState<ICourse>();
    const [classrooms, setClassrooms] = useState<IClassroom[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>();
    const [loading, setLoading] = useState(true);
    const [classroomsLoading, setClassroomsLoading] = useState(false);
    const [registering, setRegistering] = useState(false);
    const [paymentInvoice, setPaymentInvoice] = useState<IPortalInvoice | null>(null);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [error, setError] = useState('');
    const canRegister = isAuthenticated && canRegisterForCourse(user.role?.name);

    useEffect(() => {
        let active = true;

        const loadCourse = async () => {
            if (!id) {
                setError('Không xác định được khóa học.');
                setLoading(false);
                return;
            }

            try {
                const response = await callFetchCourseById(id);
                if (active && response.data) setCourse(response.data);
                else if (active) setError('Không tìm thấy khóa học.');
            } catch {
                if (active) setError('Không thể tải thông tin khóa học. Vui lòng thử lại sau.');
            } finally {
                if (active) setLoading(false);
            }
        };

        loadCourse();
        return () => { active = false; };
    }, [id]);

    useEffect(() => {
        if (!id || accountLoading || !canRegister) return;
        let active = true;
        setClassroomsLoading(true);
        callFetchOpenClassroomsForCourse(id)
            .then(response => {
                const result: unknown = response.data;
                if (Array.isArray(result)) {
                    if (active) setClassrooms(result);
                    return;
                }
                throw new Error('Phản hồi danh sách lớp học không hợp lệ.');
            })
            .catch(() => {
                if (active) message.error('Không thể tải danh sách lớp đang tuyển sinh.');
            })
            .finally(() => {
                if (active) setClassroomsLoading(false);
            });
        return () => { active = false; };
    }, [id, accountLoading, canRegister]);

    const handleRegister = async () => {
        if (!user._id || !selectedClassId) {
            message.warning('Vui lòng chọn lớp học muốn đăng ký.');
            return;
        }
        setRegistering(true);
        try {
            const response = await callRegisterForCourse({
                student_id: user._id,
                class_id: selectedClassId,
                register_date: new Date().toISOString(),
                status: 'WAITING_PAYMENT',
            });
            if (!response?.data?._id) {
                throw new Error('Không nhận được thông tin đăng ký từ máy chủ.');
            }
            const enrollmentId = response.data._id;
            try {
                await dispatch(fetchAccount()).unwrap();
            } catch {
                message.warning('Đăng ký thành công nhưng chưa thể cập nhật thông tin tài khoản. Vui lòng tải lại trang.');
            }
            try {
                const invoicesResponse = await callFetchMyInvoices();
                const invoices = Array.isArray(invoicesResponse.data) ? invoicesResponse.data : [];
                const invoice = invoices.find(item => {
                    const invoiceEnrollmentId = typeof item.enrollment_id === 'string'
                        ? item.enrollment_id
                        : item.enrollment_id?._id;
                    return invoiceEnrollmentId === enrollmentId;
                });
                if (!invoice) {
                    message.warning('Đăng ký thành công nhưng chưa tìm thấy hóa đơn. Bạn có thể mở hóa đơn trong không gian học viên.');
                    navigate('/client/student/invoices');
                    return;
                }
                setPaymentInvoice(invoice);
                setPaymentModalOpen(true);
            } catch {
                message.warning('Đăng ký thành công nhưng chưa tải được hóa đơn. Vui lòng tiếp tục thanh toán trong không gian học viên.');
                navigate('/client/student/invoices');
            }
        } catch (registrationError) {
            const apiMessage = (registrationError as { message?: string })?.message;
            message.error(apiMessage || 'Không thể đăng ký lớp học. Vui lòng thử lại.');
        } finally {
            setRegistering(false);
        }
    };

    if (loading) return <main className={`${styles.container} ${styles['portal-loading']}`}><Spin size="large" /></main>;
    if (error || !course) return <main className={styles.container}>
        {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
        <Empty description="Không tìm thấy khóa học" />
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/')}>Trở về trang chủ</Button>
    </main>;

    const tuition = course.price ? `${Number(course.price).toLocaleString('vi-VN')} đ` : 'Liên hệ';

    return (
        <main className={`${styles.container} ${styles['course-checkout']}`}>
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/')}>Trở về trang chủ</Button>
            <section className={styles['checkout-layout']}>
                <article className={styles['checkout-course-summary']}>
                    <span className={styles['checkout-eyebrow']}>ĐĂNG KÝ KHÓA HỌC</span>
                    <h1>{course.name}</h1>
                    <p>{course.description || 'Chương trình học thực tế và hiện đại.'}</p>
                    <dl>
                        <div><dt>Trình độ</dt><dd>{course.level || 'Mọi trình độ'}</dd></div>
                        <div><dt>Thời lượng</dt><dd>{course.duration || 'Linh hoạt'}</dd></div>
                        <div><dt>Học phí</dt><dd className={styles['checkout-price']}>{tuition}</dd></div>
                    </dl>
                </article>
                <aside className={styles['checkout-payment']}>
                    <CreditCardOutlined className={styles['checkout-payment-icon']} />
                    <h2>Đăng ký khóa học</h2>
                    {accountLoading ? <Spin /> : !isAuthenticated ? (
                        <>
                            <Alert
                                type="warning"
                                showIcon
                                message="Bạn cần đăng nhập để tiếp tục đăng ký khóa học."
                                description="Tài khoản NORMAL USER có thể đăng ký khóa học đầu tiên và sẽ được chuyển thành học viên. Các vai trò khác không được phép đăng ký."
                            />
                            <Button type="primary" onClick={() => navigate(`/login?callback=${encodeURIComponent(`/client/courses/${id}/checkout`)}`)}>
                                Đăng nhập để tiếp tục
                            </Button>
                        </>
                    ) : !canRegister ? (
                        <Alert
                            type="error"
                            showIcon
                            message="Tài khoản hiện tại không được phép đăng ký khóa học."
                        />
                    ) : (
                        <>
                            {paymentInvoice ? (
                                <>
                                    <Alert
                                        type="info"
                                        showIcon
                                        message="Đăng ký khóa học thành công"
                                        description="Hóa đơn đã được tạo. Bạn có thể tiếp tục thanh toán hoặc xem hóa đơn trong không gian học viên."
                                    />
                                    <Button
                                        type="primary"
                                        icon={<CreditCardOutlined />}
                                        onClick={() => setPaymentModalOpen(true)}
                                    >
                                        Tiếp tục thanh toán
                                    </Button>
                                    <Button onClick={() => navigate('/client/student/invoices')}>
                                        Xem hóa đơn
                                    </Button>
                                </>
                            ) : (
                            <>
                            <p>Chọn lớp đang tuyển sinh để hoàn tất đăng ký.</p>
                            {classrooms.length > 0 ? (
                                <>
                                    <Select
                                        aria-label="Chọn lớp học"
                                        placeholder="Chọn lớp học"
                                        value={selectedClassId}
                                        onChange={setSelectedClassId}
                                        loading={classroomsLoading}
                                        options={classrooms.map(classroom => ({
                                            value: classroom._id,
                                            label: `${classroom.class_name || 'Lớp học'}${classroom.room ? ` · Phòng ${classroom.room}` : ''}${classroom.start_date ? ` · ${classroom.start_date}` : ''}`,
                                        }))}
                                        style={{ width: '100%', marginBottom: 16 }}
                                    />
                                    <Button
                                        type="primary"
                                        icon={<CreditCardOutlined />}
                                        loading={registering}
                                        disabled={!selectedClassId || classroomsLoading}
                                        onClick={handleRegister}
                                        block
                                    >
                                        Đăng ký khóa học
                                    </Button>
                                    <small>Hóa đơn học phí sẽ được tạo tự động sau khi đăng ký.</small>
                                </>
                            ) : (
                                <Empty description={classroomsLoading ? 'Đang tải lớp học...' : 'Hiện chưa có lớp đang tuyển sinh cho khóa học này.'} />
                            )}
                            </>
                            )}
                        </>
                    )}
                </aside>
            </section>
            <PaymentRequestModal
                invoice={paymentModalOpen ? paymentInvoice : null}
                userName={user.name}
                onClose={() => setPaymentModalOpen(false)}
                onRequested={() => {
                    setPaymentModalOpen(false);
                    navigate('/client/student/invoices');
                }}
            />
        </main>
    );
};

export default CourseCheckout;
