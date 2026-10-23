import { useMemo, useState } from 'react';
import { Button, Card, Col, Descriptions, Input, Modal, Row, Select, Space, Table, Tabs, Tag, message } from 'antd';
import {
    BookOutlined,
    CalendarOutlined,
    CompassOutlined,
    PlusCircleOutlined,
    SearchOutlined,
    TeamOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/redux/hooks';
import { callFetchMyInvoices, callRegisterForCourse } from '@/config/api';
import {
    StudentEmpty,
    StudentState,
    enrollmentCourse,
    money,
    statusTag,
    useStudentData,
} from './student.shared';
import type { IClassroomWithDetails, ICourse, IPortalInvoice } from '@/types/backend';
import styles from '@/styles/client.module.scss';
import PaymentRequestModal from '@/components/client/PaymentRequestModal';

const StudentCourses = () => {
    const navigate = useNavigate();
    const user = useAppSelector(state => state.account.user);
    const data = useStudentData(user._id);

    const [activeTab, setActiveTab] = useState('my-courses');
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<string>();
    const [selectedCourse, setSelectedCourse] = useState<ICourse | null>(null);
    const [enrolling, setEnrolling] = useState(false);
    const [paymentInvoice, setPaymentInvoice] = useState<IPortalInvoice | null>(null);

    // Lọc các khóa học học viên đã đăng ký
    const myCourses = useMemo(
        () =>
            data.enrollments.filter(item => {
                const matchSearch =
                    !search ||
                    enrollmentCourse(item).toLowerCase().includes(search.toLowerCase()) ||
                    (item.class_id?.class_name || '').toLowerCase().includes(search.toLowerCase());
                const matchStatus = !status || item.status?.toUpperCase() === status;
                return matchSearch && matchStatus;
            }),
        [data.enrollments, search, status]
    );

    // Lọc các khóa học mở tại trung tâm
    const allCourses = useMemo(
        () =>
            data.courses.filter(c =>
                !search ||
                c.name.toLowerCase().includes(search.toLowerCase()) ||
                (c.description || '').toLowerCase().includes(search.toLowerCase())
            ),
        [data.courses, search]
    );

    // Lấy các lớp đang mở của một khóa học
    const availableClasses = useMemo(() => {
        if (!selectedCourse?._id) return [];
        return data.classrooms.filter(room => {
            const courseId = typeof room.course_id === 'object' ? room.course_id?._id : room.course_id;
            return courseId === selectedCourse._id && room.status?.toUpperCase() === 'OPEN';
        });
    }, [selectedCourse, data.classrooms]);

    // Các lớp học viên đã tham gia
    const enrolledClassIds = useMemo(() => {
        return new Set(
            data.enrollments.map(e => (typeof e.class_id === 'object' ? e.class_id?._id : e.class_id)).filter(Boolean)
        );
    }, [data.enrollments]);

    // Đăng ký qua endpoint tự phục vụ để backend tạo enrollment và hóa đơn.
    const handleEnrollClass = async (classroom: IClassroomWithDetails) => {
        if (!user._id) {
            return message.error('Không tìm thấy thông tin tài khoản học viên.');
        }
        if (!classroom._id) return;

        setEnrolling(true);
        try {
            const response = await callRegisterForCourse({
                student_id: user._id,
                class_id: classroom._id,
                register_date: new Date().toISOString(),
                status: 'WAITING_PAYMENT',
            });
            const enrollmentId = response?.data?._id;
            if (!enrollmentId) throw new Error(response?.message || 'Không nhận được thông tin đăng ký từ máy chủ.');
            setSelectedCourse(null);
            await data.refresh();
            setActiveTab('my-courses');
            let invoice: IPortalInvoice | undefined;
            try {
                const invoiceResponse = await callFetchMyInvoices();
                const invoices = Array.isArray(invoiceResponse.data) ? invoiceResponse.data : [];
                invoice = invoices.find(item => {
                    const invoiceEnrollmentId = typeof item.enrollment_id === 'string'
                        ? item.enrollment_id
                        : item.enrollment_id?._id;
                    return invoiceEnrollmentId === enrollmentId;
                });
            } catch {
                message.warning('Đăng ký thành công nhưng chưa tải được hóa đơn. Bạn có thể xem lại tại mục Hóa đơn.');
                navigate('/client/student/invoices');
                return;
            }
            if (!invoice) {
                message.warning('Đăng ký thành công nhưng chưa tìm thấy hóa đơn. Bạn có thể thanh toán sau tại mục Hóa đơn.');
                navigate('/client/student/invoices');
                return;
            }
            setPaymentInvoice(invoice);
            message.success(`Đã đăng ký lớp ${classroom.class_name}. Vui lòng thanh toán hoặc chọn thanh toán sau.`);
        } catch (error) {
            const apiMessage = (error as { message?: string })?.message;
            message.error(apiMessage || 'Không thể hoàn tất đăng ký. Vui lòng thử lại.');
        } finally {
            setEnrolling(false);
        }
    };

    return (
        <main className={`${styles.container} ${styles['student-page']}`}>
            <section className={styles['student-heading']}>
                <div>
                    <span>STUDENT / LEARNING</span>
                    <h1>Chương trình & Khóa học</h1>
                    <p>Theo dõi các khóa học bạn đang theo học và khám phá các chương trình đào tạo mới.</p>
                </div>
            </section>

            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={[
                    {
                        key: 'my-courses',
                        label: (
                            <span>
                                <BookOutlined /> Khóa học của tôi ({data.enrollments.length})
                            </span>
                        ),
                    },
                    {
                        key: 'explore-courses',
                        label: (
                            <span>
                                <CompassOutlined /> Khám phá khóa học ({data.courses.length})
                            </span>
                        ),
                    },
                ]}
            />

            <StudentState loading={data.loading} error={data.error}>
                {activeTab === 'my-courses' ? (
                    <>
                        <div className={styles['student-filters']}>
                            <Input
                                prefix={<SearchOutlined />}
                                placeholder="Tìm khóa học hoặc tên lớp..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{ maxWidth: 350 }}
                            />
                            <Select
                                allowClear
                                placeholder="Lọc theo trạng thái"
                                value={status}
                                onChange={setStatus}
                                style={{ minWidth: 160 }}
                                options={[
                                    { label: 'Đang học (STUDYING)', value: 'STUDYING' },
                                    { label: 'Hoàn thành (COMPLETED)', value: 'COMPLETED' },
                                    { label: 'Chờ thanh toán (WAITING_PAYMENT)', value: 'WAITING_PAYMENT' },
                                    { label: 'Đã hủy (CANCELLED)', value: 'CANCELLED' },
                                ]}
                            />
                        </div>

                        {!myCourses.length ? (
                            <Card className={styles['portal-card']} style={{ textAlign: 'center', padding: '30px 20px' }}>
                                <BookOutlined style={{ fontSize: 48, color: '#1677ff', marginBottom: 12 }} />
                                <h3>Bạn chưa có khóa học nào</h3>
                                <p style={{ color: '#888', marginBottom: 20 }}>
                                    Hãy khám phá danh mục khóa học của FPT để đăng ký lớp học phù hợp với bạn.
                                </p>
                                <Button type="primary" icon={<CompassOutlined />} onClick={() => setActiveTab('explore-courses')}>
                                    Khám phá khóa học ngay
                                </Button>
                            </Card>
                        ) : (
                            <Row gutter={[16, 16]}>
                                {myCourses.map(item => (
                                    <Col xs={24} md={12} lg={8} key={item._id}>
                                        <Card
                                            hoverable
                                            className={styles['portal-card']}
                                            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 12 }}>
                                                <div className={styles['student-course-icon']}>
                                                    <BookOutlined />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                                                        {enrollmentCourse(item)}
                                                    </h3>
                                                    <span style={{ color: '#888', fontSize: 13 }}>
                                                        Lớp: {item.class_id?.class_name || 'Chưa cập nhật'}
                                                    </span>
                                                </div>
                                                {statusTag(item.status)}
                                            </div>

                                            <div style={{ fontSize: 13, color: '#555', marginBottom: 16, flex: 1 }}>
                                                <p style={{ margin: '4px 0' }}>
                                                    <UserOutlined style={{ marginRight: 6 }} />
                                                    <b>Giảng viên:</b> {item.class_id?.teacher_id?.name || 'Chưa phân công'}
                                                </p>
                                                <p style={{ margin: '4px 0' }}>
                                                    <CalendarOutlined style={{ marginRight: 6 }} />
                                                    <b>Lịch học:</b> {item.class_id?.start_time || '—'} - {item.class_id?.end_time || '—'}
                                                </p>
                                                <p style={{ margin: '4px 0' }}>
                                                    <TeamOutlined style={{ marginRight: 6 }} />
                                                    <b>Phòng:</b> {item.class_id?.room || 'Chưa có phòng'}
                                                </p>
                                                {item.class_id?.start_date && (
                                                    <p style={{ margin: '4px 0' }}>
                                                        <b>Thời gian:</b> {item.class_id.start_date} ~ {item.class_id.end_date || ''}
                                                    </p>
                                                )}
                                            </div>

                                            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                                <Button size="small" onClick={() => navigate('/client/student/classes')}>
                                                    Xem lớp học
                                                </Button>
                                                <Button
                                                    size="small"
                                                    type="primary"
                                                    ghost
                                                    icon={<CalendarOutlined />}
                                                    onClick={() => navigate('/client/student/schedule')}
                                                >
                                                    Thời khóa biểu
                                                </Button>
                                            </Space>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        )}
                    </>
                ) : (
                    <>
                        <div className={styles['student-filters']}>
                            <Input
                                prefix={<SearchOutlined />}
                                placeholder="Tìm khóa học theo tên hoặc nội dung..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{ maxWidth: 400 }}
                            />
                        </div>

                        <Row gutter={[16, 16]}>
                            {allCourses.map(course => (
                                <Col xs={24} md={12} lg={8} key={course._id}>
                                    <Card
                                        hoverable
                                        className={styles['portal-card']}
                                        style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                                            <div className={styles['student-course-icon']}>
                                                <BookOutlined />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{course.name}</h3>
                                                <Tag color="blue">{course.level || 'Mọi trình độ'}</Tag>
                                            </div>
                                        </div>

                                        <p
                                            style={{
                                                fontSize: 13,
                                                color: '#666',
                                                flex: 1,
                                                display: '-webkit-box',
                                                WebkitLineClamp: 3,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                                marginBottom: 12,
                                            }}
                                        >
                                            {course.description || 'Chương trình đào tạo tiêu chuẩn FPT.'}
                                        </p>

                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginTop: 'auto',
                                                paddingTop: 10,
                                                borderTop: '1px solid #f0f0f0',
                                            }}
                                        >
                                            <div>
                                                <span style={{ fontSize: 12, color: '#888' }}>Học phí:</span>
                                                <br />
                                                <b style={{ color: '#d4380d', fontSize: 16 }}>{money(course.price)}</b>
                                            </div>
                                            <Button
                                                type="primary"
                                                icon={<PlusCircleOutlined />}
                                                onClick={() => setSelectedCourse(course)}
                                            >
                                                Xem lớp mở
                                            </Button>
                                        </div>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </>
                )}
            </StudentState>

            {/* Modal Xem các lớp đang mở của khóa học và Đăng ký */}
            <Modal
                title={`Khóa học: ${selectedCourse?.name || ''}`}
                open={Boolean(selectedCourse)}
                footer={null}
                onCancel={() => setSelectedCourse(null)}
                width={700}
            >
                {selectedCourse && (
                    <>
                        <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small" style={{ marginBottom: 16 }}>
                            <Descriptions.Item label="Thời lượng">{selectedCourse.duration || 'Linh hoạt'}</Descriptions.Item>
                            <Descriptions.Item label="Học phí">
                                <b style={{ color: '#d4380d' }}>{money(selectedCourse.price)}</b>
                            </Descriptions.Item>
                            <Descriptions.Item label="Mô tả" span={2}>
                                {selectedCourse.description || 'Chưa có mô tả chi tiết.'}
                            </Descriptions.Item>
                        </Descriptions>

                        <h4>Các lớp đang tuyển sinh:</h4>
                        {!availableClasses.length ? (
                            <p style={{ color: '#888', padding: '10px 0' }}>
                                Hiện tại chưa có lớp học nào đang mở đăng ký cho khóa học này. Vui lòng liên hệ ban tư vấn để biết thêm lịch khai giảng.
                            </p>
                        ) : (
                            <Table
                                size="small"
                                pagination={false}
                                rowKey="_id"
                                dataSource={availableClasses}
                                columns={[
                                    {
                                        title: 'Lớp học',
                                        render: (_: unknown, room) => <b>{room.class_name}</b>,
                                    },
                                    {
                                        title: 'Giảng viên',
                                        render: (_: unknown, room) => room.teacher_id?.name || 'Đang cập nhật',
                                    },
                                    {
                                        title: 'Khung giờ',
                                        render: (_: unknown, room) =>
                                            `${room.start_time || '—'} - ${room.end_time || '—'}`,
                                    },
                                    {
                                        title: 'Phòng',
                                        dataIndex: 'room',
                                        render: (val?: string) => val || '—',
                                    },
                                    {
                                        title: 'Đăng ký',
                                        render: (_: unknown, room) => {
                                            const isEnrolled = enrolledClassIds.has(room._id || '');
                                            if (isEnrolled) {
                                                return <Tag color="green">Đã tham gia</Tag>;
                                            }
                                            return (
                                                <Button
                                                    size="small"
                                                    type="primary"
                                                    loading={enrolling}
                                                    onClick={() => handleEnrollClass(room)}
                                                >
                                                    Đăng ký lớp
                                                </Button>
                                            );
                                        },
                                    },
                                ]}
                            />
                        )}
                    </>
                )}
            </Modal>
            <PaymentRequestModal
                invoice={paymentInvoice}
                userName={user.name}
                onClose={() => setPaymentInvoice(null)}
                onPayLater={() => {
                    setPaymentInvoice(null);
                    navigate('/client/student/invoices');
                }}
                onRequested={() => {
                    setPaymentInvoice(null);
                    navigate('/client/student/invoices');
                }}
            />
        </main>
    );
};

export default StudentCourses;
