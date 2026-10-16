import { useMemo, useState } from 'react';
import {
    Avatar,
    Button,
    Card,
    Col,
    Descriptions,
    Divider,
    Input,
    Modal,
    Popconfirm,
    Row,
    Select,
    Space,
    Table,
    Tag,
    Tooltip,
    message,
} from 'antd';
import {
    CheckCircleOutlined,
    EditOutlined,
    EyeOutlined,
    MessageOutlined,
    PhoneOutlined,
    SearchOutlined,
    TeamOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/redux/hooks';
import { callUpdateEnrollment } from '@/config/api';
import {
    TeacherEmpty,
    TeacherState,
    dateText,
    getSavedGrades,
    statusColor,
    statusTag,
    statusText,
    useTeacherData,
} from './teacher.shared';
import type { IPortalEnrollment } from '@/types/backend';
import styles from '@/styles/client.module.scss';

const TeacherStudents = () => {
    const navigate = useNavigate();
    const user = useAppSelector(state => state.account.user);
    const data = useTeacherData(user._id);

    const [search, setSearch] = useState('');
    const [classFilter, setClassFilter] = useState<string>();
    const [statusFilter, setStatusFilter] = useState<string>();
    const [selectedStudent, setSelectedStudent] = useState<IPortalEnrollment | null>(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    // Danh sách lớp giảng viên đang phụ trách để đưa vào select option
    const classOptions = useMemo(() => {
        return data.classes.map(c => ({
            label: `${c.class_name} (${typeof c.course_id === 'object' ? c.course_id?.name : 'Khóa học'})`,
            value: c._id || '',
        }));
    }, [data.classes]);

    // Lọc danh sách học viên
    const filteredStudents = useMemo(() => {
        return data.students.filter(item => {
            const studentName = typeof item.student_id === 'object' ? item.student_id?.name || '' : '';
            const email = typeof item.student_id === 'object' ? item.student_id?.email || '' : '';
            const phone = typeof item.student_id === 'object' ? item.student_id?.phone || '' : '';
            const className = typeof item.class_id === 'object' ? item.class_id?.class_name || '' : '';
            const classId = typeof item.class_id === 'object' ? item.class_id?._id : item.class_id;

            const matchSearch =
                !search ||
                `${studentName} ${email} ${phone} ${className}`.toLowerCase().includes(search.toLowerCase());
            const matchClass = !classFilter || classId === classFilter;
            const matchStatus = !statusFilter || item.status?.toUpperCase() === statusFilter;

            return matchSearch && matchClass && matchStatus;
        });
    }, [data.students, search, classFilter, statusFilter]);

    // Thống kê nhanh
    const totalStudents = data.students.length;
    const studyingCount = data.students.filter(s => s.status?.toUpperCase() === 'STUDYING').length;
    const completedCount = data.students.filter(s => s.status?.toUpperCase() === 'COMPLETED').length;

    // Xem chi tiết học viên & điểm số
    const handleViewDetail = (student: IPortalEnrollment) => {
        setSelectedStudent(student);
        setDetailModalOpen(true);
    };

    // Cập nhật trạng thái học tập của học viên
    const handleUpdateStatus = async (enrollmentId: string, newStatus: string) => {
        setUpdatingStatus(true);
        try {
            await callUpdateEnrollment({ status: newStatus as any }, enrollmentId);
            message.success(`Đã cập nhật trạng thái học vụ thành: ${statusText(newStatus)}`);
            await data.refresh();
            if (selectedStudent && selectedStudent._id === enrollmentId) {
                setSelectedStudent({ ...selectedStudent, status: newStatus });
            }
        } catch {
            message.error('Không thể cập nhật trạng thái học viên. Vui lòng thử lại.');
        } finally {
            setUpdatingStatus(false);
        }
    };

    // Lấy thông tin điểm đã lưu của học viên trong lớp
    const getStudentGradeInfo = (student: IPortalEnrollment | null) => {
        if (!student) return null;
        const classId = typeof student.class_id === 'object' ? student.class_id?._id : student.class_id;
        const sid = student._id || (typeof student.student_id === 'object' ? student.student_id?._id : '') || '';
        if (!classId || !sid) return null;
        const saved = getSavedGrades(classId);
        return saved[sid] || null;
    };

    // Định nghĩa bảng học viên
    const columns = [
        {
            title: 'Học viên',
            key: 'student',
            render: (_: unknown, record: IPortalEnrollment) => {
                const sname = typeof record.student_id === 'object' ? record.student_id?.name || 'Học viên' : 'Học viên';
                const semail = typeof record.student_id === 'object' ? record.student_id?.email || '—' : '—';
                return (
                    <Space>
                        <Avatar style={{ backgroundColor: '#1677ff' }}>
                            {sname.slice(0, 2).toUpperCase()}
                        </Avatar>
                        <div>
                            <div style={{ fontWeight: 600 }}>{sname}</div>
                            <div style={{ fontSize: 12, color: '#888' }}>{semail}</div>
                        </div>
                    </Space>
                );
            },
        },
        {
            title: 'Số điện thoại',
            key: 'phone',
            render: (_: unknown, record: IPortalEnrollment) =>
                typeof record.student_id === 'object' ? record.student_id?.phone || '—' : '—',
        },
        {
            title: 'Lớp học phụ trách',
            key: 'class',
            render: (_: unknown, record: IPortalEnrollment) => {
                const cname = typeof record.class_id === 'object' ? record.class_id?.class_name : 'Lớp học';
                const crname =
                    typeof record.class_id === 'object' && typeof record.class_id?.course_id === 'object'
                        ? record.class_id?.course_id?.name
                        : '';
                return (
                    <div>
                        <div style={{ fontWeight: 500 }}>{cname}</div>
                        {crname && <div style={{ fontSize: 12, color: '#888' }}>{crname}</div>}
                    </div>
                );
            },
        },
        {
            title: 'Ngày tham gia',
            dataIndex: 'register_date',
            key: 'register_date',
            render: (value?: string) => dateText(value),
        },
        {
            title: 'Trạng thái học vụ',
            dataIndex: 'status',
            key: 'status',
            render: (value?: string) => statusTag(value),
        },
        {
            title: 'Hành động',
            key: 'actions',
            align: 'right' as const,
            render: (_: unknown, record: IPortalEnrollment) => (
                <Space>
                    <Tooltip title="Xem thông tin & Đánh giá">
                        <Button
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => handleViewDetail(record)}
                        >
                            Chi tiết
                        </Button>
                    </Tooltip>
                    <Tooltip title="Trao đổi tin nhắn">
                        <Button
                            size="small"
                            type="primary"
                            ghost
                            icon={<MessageOutlined />}
                            onClick={() => navigate('/client/teacher/chat')}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    const currentGrade = getStudentGradeInfo(selectedStudent);

    return (
        <main className={`${styles.container} ${styles['student-page']}`}>
            <section className={styles['student-heading']}>
                <div>
                    <span>TEACHER / STUDENTS</span>
                    <h1>Học viên thuộc các lớp giảng dạy</h1>
                    <p>Theo dõi danh sách học viên, tiến độ tham gia khóa học, đánh giá kết quả và hỗ trợ học tập.</p>
                </div>
            </section>

            <TeacherState loading={data.loading} error={data.error}>
                {/* Thống kê học viên */}
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                    <Col xs={24} sm={8}>
                        <Card className={styles['portal-card']} style={{ borderLeft: '4px solid #1677ff' }}>
                            <span style={{ color: '#888', fontSize: 13 }}>Tổng học viên phụ trách</span>
                            <h2 style={{ margin: '6px 0 0', color: '#1677ff' }}>{totalStudents} học viên</h2>
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card className={styles['portal-card']} style={{ borderLeft: '4px solid #52c41a' }}>
                            <span style={{ color: '#888', fontSize: 13 }}>Đang theo học</span>
                            <h2 style={{ margin: '6px 0 0', color: '#52c41a' }}>{studyingCount} học viên</h2>
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card className={styles['portal-card']} style={{ borderLeft: '4px solid #722ed1' }}>
                            <span style={{ color: '#888', fontSize: 13 }}>Đã hoàn thành khóa học</span>
                            <h2 style={{ margin: '6px 0 0', color: '#722ed1' }}>{completedCount} học viên</h2>
                        </Card>
                    </Col>
                </Row>

                {/* Bộ lọc học viên */}
                <Card className={styles['portal-card']} style={{ marginBottom: 16 }}>
                    <div className={styles['student-filters']}>
                        <Input
                            prefix={<SearchOutlined />}
                            placeholder="Tìm kiếm theo tên, email, số điện thoại..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ minWidth: 260 }}
                        />
                        <Select
                            allowClear
                            placeholder="Chọn lớp học"
                            value={classFilter}
                            onChange={setClassFilter}
                            style={{ minWidth: 220 }}
                            options={classOptions}
                        />
                        <Select
                            allowClear
                            placeholder="Trạng thái học vụ"
                            value={statusFilter}
                            onChange={setStatusFilter}
                            style={{ minWidth: 160 }}
                            options={[
                                { label: 'Đang học (STUDYING)', value: 'STUDYING' },
                                { label: 'Hoàn thành (COMPLETED)', value: 'COMPLETED' },
                                { label: 'Chờ thanh toán (WAITING_PAYMENT)', value: 'WAITING_PAYMENT' },
                                { label: 'Đã hủy (CANCELLED)', value: 'CANCELLED' },
                            ]}
                        />
                    </div>
                </Card>

                {/* Bảng danh sách học viên */}
                {!filteredStudents.length ? (
                    <TeacherEmpty description="Không tìm thấy học viên nào phù hợp với bộ lọc." />
                ) : (
                    <Card className={styles['portal-card']}>
                        <Table
                            rowKey="_id"
                            dataSource={filteredStudents}
                            columns={columns}
                            pagination={{ pageSize: 10, showSizeChanger: true }}
                        />
                    </Card>
                )}
            </TeacherState>

            {/* Modal Chi tiết Học viên & Đánh giá kết quả */}
            <Modal
                title={
                    <Space>
                        <UserOutlined style={{ color: '#1677ff' }} />
                        <span>Hồ sơ & Đánh giá học tập</span>
                    </Space>
                }
                open={detailModalOpen}
                onCancel={() => setDetailModalOpen(false)}
                footer={[
                    <Button key="close" onClick={() => setDetailModalOpen(false)}>
                        Đóng
                    </Button>,
                    <Button
                        key="chat"
                        type="primary"
                        icon={<MessageOutlined />}
                        onClick={() => {
                            setDetailModalOpen(false);
                            navigate('/client/teacher/chat');
                        }}
                    >
                        Gửi tin nhắn trao đổi
                    </Button>,
                ]}
                width={650}
            >
                {selectedStudent && (
                    <>
                        <Descriptions title="Thông tin học viên" bordered size="small" column={{ xs: 1, sm: 2 }}>
                            <Descriptions.Item label="Họ và tên">
                                <b>{typeof selectedStudent.student_id === 'object' ? selectedStudent.student_id?.name : '—'}</b>
                            </Descriptions.Item>
                            <Descriptions.Item label="Email">
                                {typeof selectedStudent.student_id === 'object' ? selectedStudent.student_id?.email : '—'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Số điện thoại">
                                {typeof selectedStudent.student_id === 'object' ? selectedStudent.student_id?.phone || 'Chưa cập nhật' : '—'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Trạng thái">
                                {statusTag(selectedStudent.status)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Lớp đang học">
                                {typeof selectedStudent.class_id === 'object' ? selectedStudent.class_id?.class_name : '—'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Khóa học">
                                {typeof selectedStudent.class_id === 'object' && typeof selectedStudent.class_id?.course_id === 'object'
                                    ? selectedStudent.class_id?.course_id?.name
                                    : '—'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Ngày bắt đầu học">
                                {dateText(selectedStudent.register_date)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Phòng học">
                                {typeof selectedStudent.class_id === 'object' ? selectedStudent.class_id?.room || '—' : '—'}
                            </Descriptions.Item>
                        </Descriptions>

                        <Divider style={{ margin: '16px 0' }} />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <h4 style={{ margin: 0 }}>Kết quả học tập & Đánh giá của giảng viên</h4>
                        </div>

                        {currentGrade ? (
                            <Card size="small" style={{ background: '#fafafa', borderRadius: 8 }}>
                                <Row gutter={[16, 12]}>
                                    <Col span={8}>
                                        <div style={{ fontSize: 12, color: '#888' }}>Chuyên cần (10%):</div>
                                        <div style={{ fontSize: 18, fontWeight: 700, color: '#52c41a' }}>
                                            {currentGrade.attendanceScore ?? '—'} / 10
                                        </div>
                                    </Col>
                                    <Col span={8}>
                                        <div style={{ fontSize: 12, color: '#888' }}>Giữa kỳ (40%):</div>
                                        <div style={{ fontSize: 18, fontWeight: 700, color: '#1677ff' }}>
                                            {currentGrade.midtermScore ?? 'Chưa chấm'}
                                        </div>
                                    </Col>
                                    <Col span={8}>
                                        <div style={{ fontSize: 12, color: '#888' }}>Cuối khóa (50%):</div>
                                        <div style={{ fontSize: 18, fontWeight: 700, color: '#722ed1' }}>
                                            {currentGrade.finalScore ?? 'Chưa chấm'}
                                        </div>
                                    </Col>
                                    <Col span={24}>
                                        <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Nhận xét quá trình học:</div>
                                        <div style={{ fontStyle: 'italic', color: '#444', marginTop: 2 }}>
                                            "{currentGrade.note || 'Chưa có nhận xét nào.'}"
                                        </div>
                                    </Col>
                                </Row>
                            </Card>
                        ) : (
                            <div style={{ padding: '16px', background: '#fafafa', borderRadius: 8, textAlign: 'center', color: '#888' }}>
                                Giảng viên chưa nhập bảng điểm cho học viên này. Bạn có thể vào mục <b>Lớp học của tôi &gt; Đánh giá</b> để nhập điểm.
                            </div>
                        )}

                        <Divider style={{ margin: '16px 0' }} />

                        <div>
                            <span style={{ fontSize: 13, color: '#666', marginRight: 12 }}>Cập nhật trạng thái học vụ:</span>
                            <Space wrap>
                                <Button
                                    size="small"
                                    type={selectedStudent.status === 'STUDYING' ? 'primary' : 'default'}
                                    loading={updatingStatus}
                                    onClick={() => handleUpdateStatus(selectedStudent._id || '', 'STUDYING')}
                                >
                                    Đang học
                                </Button>
                                <Button
                                    size="small"
                                    type={selectedStudent.status === 'COMPLETED' ? 'primary' : 'default'}
                                    style={{ color: '#52c41a', borderColor: '#52c41a' }}
                                    loading={updatingStatus}
                                    onClick={() => handleUpdateStatus(selectedStudent._id || '', 'COMPLETED')}
                                >
                                    Đã tốt nghiệp / Hoàn thành
                                </Button>
                                <Popconfirm
                                    title="Xác nhận thôi học"
                                    description="Bạn có chắc chắn muốn cập nhật học viên này sang trạng thái Đã hủy / Thôi học?"
                                    onConfirm={() => handleUpdateStatus(selectedStudent._id || '', 'CANCELLED')}
                                >
                                    <Button size="small" danger loading={updatingStatus}>
                                        Đã thôi học (Hủy)
                                    </Button>
                                </Popconfirm>
                            </Space>
                        </div>
                    </>
                )}
            </Modal>
        </main>
    );
};

export default TeacherStudents;
