import { useMemo, useState } from 'react';
import {
    Button,
    Card,
    Col,
    Form,
    Input,
    InputNumber,
    Modal,
    Row,
    Select,
    Space,
    Table,
    Tabs,
    Tag,
    message,
} from 'antd';
import {
    CheckCircleOutlined,
    FileTextOutlined,
    IdcardOutlined,
    PlusOutlined,
    TeamOutlined,
    UserAddOutlined,
} from '@ant-design/icons';
import { useAppSelector } from '@/redux/hooks';
import {
    ConsultantEmpty,
    ConsultantState,
    StatCard,
    dateText,
    enrollLeadToClass,
    money,
    useConsultantData,
} from './consultant.shared';
import type { IClassroomWithDetails, ICourse, ILead } from '@/types/backend';
import styles from '@/styles/client.module.scss';

const ConsultantEnrollments = () => {
    const currentUser = useAppSelector(state => state.account.user);
    const data = useConsultantData();
    const [form] = Form.useForm();

    const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
    const [selectedLeadId, setSelectedLeadId] = useState<string>('');
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [discountAmount, setDiscountAmount] = useState<number>(0);
    const [enrolling, setEnrolling] = useState(false);

    // Lớp học theo khóa học được chọn
    const availableClasses = useMemo(() => {
        return data.classrooms.filter(c => {
            const courseId = typeof c.course_id === 'string' ? c.course_id : (c.course_id as any)?._id;
            return (!selectedCourseId || courseId === selectedCourseId) && (c.status === 'OPEN' || !c.status);
        });
    }, [data.classrooms, selectedCourseId]);

    // Danh sách các học viên đã ghi danh
    const enrolledStudents = useMemo(() => {
        return data.enrollments.map(e => {
            const student = typeof e.student_id === 'object' && e.student_id ? e.student_id : data.users.find(u => u._id === e.student_id);
            const classroom = data.classrooms.find(c => c._id === (typeof e.class_id === 'string' ? e.class_id : (e.class_id as any)?._id));
            const course = data.courses.find(c => c._id === (typeof classroom?.course_id === 'string' ? classroom.course_id : (classroom?.course_id as any)?._id));

            return {
                enrollment: e,
                studentName: student?.name || 'Học viên',
                studentEmail: student?.email || '',
                className: classroom?.class_name || 'Chưa xếp lớp',
                courseName: course?.name || 'Khóa học',
                status: e.status || 'ENROLLED',
                createdAt: (e as any).createdAt,
            };
        });
    }, [data.classrooms, data.courses, data.enrollments, data.users]);

    // Khi chọn Lead $\to$ tự động điền khóa học quan tâm
    const handleLeadChange = (leadId: string) => {
        setSelectedLeadId(leadId);
        const lead = data.leads.find(l => l._id === leadId);
        if (lead?.course_name) {
            const leadCourse = lead.course_name.toLowerCase();
            const course = data.courses.find(c => c.name.toLowerCase().includes(leadCourse));
            if (course?._id) {
                setSelectedCourseId(course._id);
                form.setFieldsValue({ course_id: course._id });
            }
        }
    };

    // Xác nhận ghi danh
    const handleEnroll = async () => {
        if (!selectedLeadId || !selectedClassId) {
            message.warning('Vui lòng chọn khách hàng và lớp học');
            return;
        }

        const lead = data.leads.find(l => l._id === selectedLeadId);
        const classroom = data.classrooms.find(c => c._id === selectedClassId);
        if (!lead || !classroom) {
            message.error('Thông tin khách hàng hoặc lớp học không tồn tại');
            return;
        }

        const courseId = typeof classroom.course_id === 'string' ? classroom.course_id : (classroom.course_id as any)?._id;
        const course = data.courses.find(c => c._id === courseId);

        setEnrolling(true);
        try {
            const result = await enrollLeadToClass({
                lead,
                classroom,
                course,
                discountAmount,
                users: data.users,
                roles: data.roles,
                consultantUser: currentUser as any,
            });

            if (result.success) {
                message.success(result.message);
                form.resetFields();
                setSelectedLeadId('');
                setSelectedCourseId('');
                setSelectedClassId('');
                setDiscountAmount(0);
                setActiveTab('list');
                await data.refresh();
            } else {
                message.error(result.message);
            }
        } catch {
            message.error('Lỗi khi thực hiện ghi danh');
        } finally {
            setEnrolling(false);
        }
    };

    return (
        <main className={`${styles.container} ${styles['consultant-page']}`}>
            <section className={styles['consultant-page-heading']}>
                <div>
                    <span>TUYỂN SINH / GHI DANH & XẾP LỚP</span>
                    <h1>Trung tâm ghi danh tuyển sinh</h1>
                    <p>Chuyển đổi khách hàng tiềm năng thành học viên chính thức, xếp lớp và tự động xuất hóa đơn học phí.</p>
                </div>
            </section>

            <ConsultantState loading={data.loading} error={data.error}>
                {/* 3 Thẻ chỉ số */}
                <Row gutter={[16, 16]} style={{ marginBottom: 18 }}>
                    <Col xs={24} sm={8}>
                        <StatCard
                            title="Tổng lượt ghi danh"
                            value={data.enrollments.length}
                            subValue="Hồ sơ học vụ trong hệ thống"
                            icon={<TeamOutlined />}
                            accent="teal"
                        />
                    </Col>
                    <Col xs={24} sm={8}>
                        <StatCard
                            title="Lớp học đang mở tiếp nhận"
                            value={data.classrooms.filter(c => c.status === 'OPEN' || !c.status).length}
                            subValue="Sẵn sàng xếp lịch học"
                            icon={<IdcardOutlined />}
                            accent="green"
                        />
                    </Col>
                    <Col xs={24} sm={8}>
                        <StatCard
                            title="Khách hàng đã chốt tuyển sinh"
                            value={data.leads.filter(l => l.status?.toUpperCase() === 'REGISTERED').length}
                            subValue="Đã chuyển đổi thành công"
                            icon={<CheckCircleOutlined />}
                            accent="navy"
                        />
                    </Col>
                </Row>

                <Card className={styles['portal-card']}>
                    <Tabs
                        activeKey={activeTab}
                        onChange={k => setActiveTab(k as any)}
                        items={[
                            {
                                key: 'create',
                                label: (
                                    <span>
                                        <UserAddOutlined /> Quy trình ghi danh tuyển sinh mới
                                    </span>
                                ),
                            },
                            {
                                key: 'list',
                                label: (
                                    <span>
                                        <TeamOutlined /> Danh sách học viên đã ghi danh ({enrolledStudents.length})
                                    </span>
                                ),
                            },
                        ]}
                    />

                    {activeTab === 'create' && (
                        <div style={{ maxWidth: 720, margin: '16px auto 32px' }}>
                            <div style={{ padding: '16px 20px', background: '#f0f9ff', borderRadius: 8, marginBottom: 24, border: '1px solid #bae6fd' }}>
                                <h3 style={{ margin: '0 0 6px', color: '#0369a1', fontSize: 16 }}>
                                    Quy trình tuyển sinh & kích hoạt học vụ tự động
                                </h3>
                                <p style={{ margin: 0, fontSize: 13, color: '#475569' }}>
                                    Khi xác nhận ghi danh: Hệ thống tự động kích hoạt tài khoản học viên, thêm vào danh sách lớp, phát hành hóa đơn học phí gửi phòng Kế toán và gửi email chúc mừng tới học viên.
                                </p>
                            </div>

                            <Form form={form} layout="vertical">
                                <Form.Item
                                    label="1. Chọn Khách hàng tiềm năng cần ghi danh *"
                                    required
                                >
                                    <Select
                                        showSearch
                                        placeholder="Tìm khách hàng theo tên, email hoặc số điện thoại..."
                                        optionFilterProp="label"
                                        value={selectedLeadId || undefined}
                                        onChange={handleLeadChange}
                                        options={data.leads
                                            .filter(l => l.status?.toUpperCase() !== 'REGISTERED')
                                            .map(lead => ({
                                                label: `${lead.full_name || lead.name} · SĐT: ${lead.phone} · Quan tâm: ${lead.course_name || 'Khóa học'}`,
                                                value: lead._id || '',
                                            }))}
                                    />
                                </Form.Item>

                                <Form.Item
                                    label="2. Chọn Khóa học đào tạo *"
                                    required
                                >
                                    <Select
                                        showSearch
                                        placeholder="Chọn khóa học..."
                                        optionFilterProp="label"
                                        value={selectedCourseId || undefined}
                                        onChange={val => {
                                            setSelectedCourseId(val);
                                            setSelectedClassId('');
                                        }}
                                        options={data.courses.map(course => ({
                                            label: `${course.name} · Cấp độ: ${course.level || 'Cơ bản'} · Học phí: ${money(course.price)}`,
                                            value: course._id || '',
                                        }))}
                                    />
                                </Form.Item>

                                <Form.Item
                                    label="3. Chọn Lớp học tiếp nhận học viên *"
                                    required
                                >
                                    <Select
                                        placeholder={selectedCourseId ? 'Chọn lớp học đang mở phù hợp ca học...' : 'Vui lòng chọn khóa học trước'}
                                        disabled={!selectedCourseId}
                                        value={selectedClassId || undefined}
                                        onChange={setSelectedClassId}
                                        options={availableClasses.map(cls => ({
                                            label: `${cls.class_name} · Phòng: ${cls.room || 'Phòng học FPT'} · Ca: ${cls.start_time || ''}-${cls.end_time || ''}`,
                                            value: cls._id || '',
                                        }))}
                                    />
                                </Form.Item>

                                <Form.Item
                                    label="4. Học bổng / Mức ưu đãi tuyển sinh (VNĐ)"
                                >
                                    <InputNumber
                                        min={0}
                                        value={discountAmount}
                                        onChange={val => setDiscountAmount(Number(val) || 0)}
                                        style={{ width: '100%' }}
                                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                        parser={value => value?.replace(/\$\s?|(,*)/g, '') as any}
                                        placeholder="Ví dụ: 1,000,000"
                                    />
                                </Form.Item>

                                <div style={{ marginTop: 28, textAlign: 'center' }}>
                                    <Button
                                        type="primary"
                                        size="large"
                                        icon={<CheckCircleOutlined />}
                                        loading={enrolling}
                                        disabled={!selectedLeadId || !selectedClassId}
                                        onClick={handleEnroll}
                                        style={{ minWidth: 240, height: 44, fontSize: 15 }}
                                    >
                                        Xác nhận ghi danh & Xuất hóa đơn
                                    </Button>
                                </div>
                            </Form>
                        </div>
                    )}

                    {activeTab === 'list' && (
                        <Table
                            rowKey={r => r.enrollment._id || Math.random().toString()}
                            dataSource={enrolledStudents}
                            pagination={{ pageSize: 8, showSizeChanger: true }}
                            scroll={{ x: 900 }}
                            columns={[
                                {
                                    title: 'Mã ghi danh',
                                    render: (_, r) => <b className={styles['invoice-code']}>ENR-{r.enrollment._id?.slice(-8).toUpperCase()}</b>,
                                },
                                {
                                    title: 'Học viên',
                                    render: (_, r) => (
                                        <div className={styles['consultant-person-cell']}>
                                            <strong>{r.studentName}</strong>
                                            <span>{r.studentEmail}</span>
                                        </div>
                                    ),
                                },
                                {
                                    title: 'Lớp học',
                                    dataIndex: 'className',
                                    render: name => <b>{name}</b>,
                                },
                                {
                                    title: 'Chương trình / Khóa học',
                                    dataIndex: 'courseName',
                                },
                                {
                                    title: 'Trạng thái học vụ',
                                    render: () => <Tag color="green">Đã ghi danh</Tag>,
                                },
                                {
                                    title: 'Ngày ghi danh',
                                    dataIndex: 'createdAt',
                                    render: dateText,
                                },
                            ]}
                        />
                    )}
                </Card>
            </ConsultantState>
        </main>
    );
};

export default ConsultantEnrollments;
