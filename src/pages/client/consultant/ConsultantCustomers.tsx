import { useMemo, useState } from 'react';
import {
    Button,
    Card,
    Col,
    Form,
    Input,
    InputNumber,
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
    DeleteOutlined,
    DownloadOutlined,
    EditOutlined,
    EyeOutlined,
    MailOutlined,
    MessageOutlined,
    PhoneOutlined,
    PlusOutlined,
    SearchOutlined,
    TeamOutlined,
    UserAddOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
    callCreateLead,
    callCreateNotification,
    callDeleteLead,
    callUpdateLead,
} from '@/config/api';
import { useAppSelector } from '@/redux/hooks';
import {
    ConsultantEmpty,
    ConsultantState,
    LeadIcon,
    StatCard,
    dateText,
    enrollLeadToClass,
    exportToCsv,
    money,
    statusTag,
    statusText,
    useConsultantData,
} from './consultant.shared';
import type { IClassroomWithDetails, ICourse, ILead } from '@/types/backend';
import styles from '@/styles/client.module.scss';

const ConsultantCustomers = () => {
    const navigate = useNavigate();
    const currentUser = useAppSelector(state => state.account.user);
    const data = useConsultantData();

    const [form] = Form.useForm<ILead>();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>();
    const [courseFilter, setCourseFilter] = useState<string>();

    // Modal thêm/sửa lead
    const [formOpen, setFormOpen] = useState(false);
    const [editingLead, setEditingLead] = useState<ILead | null>(null);
    const [saving, setSaving] = useState(false);

    // Modal chi tiết lead
    const [detailLead, setDetailLead] = useState<ILead | null>(null);

    // Modal ghi danh nhanh (Enroll)
    const [enrollModalOpen, setEnrollModalOpen] = useState(false);
    const [enrollLead, setEnrollLead] = useState<ILead | null>(null);
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [discountAmount, setDiscountAmount] = useState<number>(0);
    const [enrolling, setEnrolling] = useState(false);

    // Modal gửi email tư vấn
    const [mailModalOpen, setMailModalOpen] = useState(false);
    const [mailLead, setMailLead] = useState<ILead | null>(null);
    const [mailSubject, setMailSubject] = useState('');
    const [mailContent, setMailContent] = useState('');
    const [sendingMail, setSendingMail] = useState(false);

    // Danh sách khóa học có trong hệ thống
    const courseNamesList = useMemo(() => {
        return Array.from(new Set(data.courses.map(c => c.name).filter(Boolean)));
    }, [data.courses]);

    // Lọc danh sách khách hàng
    const filteredLeads = useMemo(() => {
        return data.leads.filter(lead => {
            const name = lead.full_name || lead.name || '';
            const email = lead.email || '';
            const phone = lead.phone || '';
            const cName = lead.course_name || '';

            const matchSearch = `${name} ${email} ${phone} ${cName}`.toLowerCase().includes(search.toLowerCase());
            const matchStatus = !statusFilter || lead.status?.toUpperCase() === statusFilter;
            const matchCourse = !courseFilter || lead.course_name === courseFilter;

            return matchSearch && matchStatus && matchCourse;
        });
    }, [courseFilter, data.leads, search, statusFilter]);

    // Mở form thêm / sửa
    const handleOpenForm = (lead?: ILead) => {
        if (lead) {
            setEditingLead(lead);
            form.setFieldsValue({
                ...lead,
                full_name: lead.full_name || lead.name,
                status: lead.status || 'NEW',
            });
        } else {
            setEditingLead(null);
            form.resetFields();
            form.setFieldsValue({
                status: 'NEW',
            });
        }
        setFormOpen(true);
    };

    // Lưu khách hàng
    const handleSaveLead = async (values: any) => {
        setSaving(true);
        try {
            const payload = {
                full_name: values.full_name || values.name,
                phone: values.phone,
                email: values.email,
                course_name: values.course_name,
                note: values.note,
                status: values.status || 'NEW',
                consultant_id: currentUser._id as any,
            };

            const res = editingLead?._id
                ? await callUpdateLead(payload, editingLead._id)
                : await callCreateLead(payload);

            if (res?.data) {
                message.success(editingLead ? 'Đã cập nhật thông tin khách hàng' : 'Đã thêm khách hàng tiềm năng mới');
                setFormOpen(false);
                await data.refresh();
            } else {
                message.error(res?.message || 'Không thể lưu thông tin khách hàng');
            }
        } catch {
            message.error('Lỗi khi lưu khách hàng');
        } finally {
            setSaving(false);
        }
    };

    // Xóa khách hàng
    const handleDeleteLead = async (id: string) => {
        try {
            const res = await callDeleteLead(id);
            if (res?.data) {
                message.success('Đã xóa khách hàng');
                await data.refresh();
            } else {
                message.error(res?.message || 'Không thể xóa khách hàng');
            }
        } catch {
            message.error('Lỗi khi xóa khách hàng');
        }
    };

    // Mở modal ghi danh
    const handleOpenEnroll = (lead: ILead) => {
        setEnrollLead(lead);
        setSelectedClassId('');
        setDiscountAmount(0);
        setEnrollModalOpen(true);
    };

    // Xác nhận ghi danh
    const handleConfirmEnroll = async () => {
        if (!enrollLead || !selectedClassId) {
            message.warning('Vui lòng chọn lớp học để ghi danh');
            return;
        }

        const selectedClass = data.classrooms.find(c => c._id === selectedClassId);
        if (!selectedClass) {
            message.error('Không tìm thấy thông tin lớp học đã chọn');
            return;
        }

        const courseId = typeof selectedClass.course_id === 'string' ? selectedClass.course_id : (selectedClass.course_id as any)?._id;
        const course = data.courses.find(c => c._id === courseId);

        setEnrolling(true);
        try {
            const result = await enrollLeadToClass({
                lead: enrollLead,
                classroom: selectedClass,
                course,
                discountAmount,
                users: data.users,
                roles: data.roles,
                consultantUser: currentUser as any,
            });

            if (result.success) {
                message.success(result.message);
                setEnrollModalOpen(false);
                await data.refresh();
            } else {
                message.error(result.message);
            }
        } catch {
            message.error('Có lỗi xảy ra trong quá trình ghi danh');
        } finally {
            setEnrolling(false);
        }
    };

    // Mở modal gửi email tư vấn
    const handleOpenMail = (lead: ILead) => {
        setMailLead(lead);
        setMailSubject(`[FPT Education] Tư vấn lộ trình khóa học ${lead.course_name || 'chuyên nghiệp'}`);
        setMailContent(
            `Kính gửi anh/chị ${lead.full_name || 'khách hàng'},\n\nEm là ${currentUser.name || 'chuyên viên tư vấn'} đại diện Hệ thống Đào tạo FPT Education.\n\nCảm ơn anh/chị đã quan tâm đến chương trình đào tạo "${lead.course_name || 'chất lượng cao'}". Em xin gửi tới anh/chị thông tin tóm tắt lộ trình học và chính sách ưu đãi tuyển sinh mới nhất trong tháng này.\n\nNếu anh/chị có bất kỳ câu hỏi nào về lịch học hoặc nội dung đào tạo, xin vui lòng phản hồi email này hoặc liên hệ hotline 1900 6600 để được hỗ trợ chu đáo nhất.\n\nTrân trọng cảm ơn!`
        );
        setMailModalOpen(true);
    };

    // Gửi email tư vấn
    const handleSendMail = async () => {
        if (!mailLead) return;

        setSendingMail(true);
        try {
            // Tìm user nếu có hoặc gửi thông báo
            const targetUser = data.users.find(u => (u.email || '').toLowerCase() === (mailLead.email || '').toLowerCase());
            const receiverId = targetUser?._id || currentUser._id; // fallback

            const res = await callCreateNotification({
                title: mailSubject,
                content: mailContent,
                receiver_id: receiverId as any,
                sender_id: currentUser._id as any,
                type: 'EMAIL',
                status: 'SENT',
                isRead: false,
            } as any);

            if (res?.data) {
                // Cập nhật trạng thái lead thành CONTACTED nếu đang là NEW
                if (mailLead._id && (!mailLead.status || mailLead.status.toUpperCase() === 'NEW')) {
                    await callUpdateLead({ status: 'CONTACTED' }, mailLead._id);
                }
                message.success(`Đã gửi email tư vấn tới khách hàng ${mailLead.full_name}`);
                setMailModalOpen(false);
                await data.refresh();
            } else {
                message.error(res?.message || 'Không thể gửi email tư vấn');
            }
        } catch {
            message.error('Lỗi khi gửi email tư vấn');
        } finally {
            setSendingMail(false);
        }
    };

    // Xuất CSV
    const handleExportCsv = () => {
        const headers = ['Mã KH', 'Họ tên', 'Điện thoại', 'Email', 'Khóa học quan tâm', 'Trạng thái', 'Ghi chú', 'Ngày tạo'];
        const exportRows = filteredLeads.map(l => [
            l._id || '',
            l.full_name || l.name || '',
            l.phone || '',
            l.email || '',
            l.course_name || '',
            statusText(l.status),
            l.note || '',
            dateText((l as any).createdAt),
        ]);
        exportToCsv(`Danh_sach_khach_hang_CRM_${new Date().toISOString().slice(0, 10)}`, headers, exportRows);
        message.success('Đã xuất danh sách khách hàng thành công!');
    };

    return (
        <main className={`${styles.container} ${styles['consultant-page']}`}>
            <section className={styles['consultant-page-heading']}>
                <div>
                    <span>TUYỂN SINH / CRM LEADS</span>
                    <h1>Quản lý khách hàng tiềm năng</h1>
                    <p>Theo dõi danh sách khách hàng được phân công, lịch sử tư vấn và chuyển đổi thành học viên chính thức.</p>
                </div>
                <Space>
                    <Button icon={<DownloadOutlined />} onClick={handleExportCsv}>
                        Xuất danh sách (CSV)
                    </Button>
                    <Button
                        type="primary"
                        icon={<UserAddOutlined />}
                        onClick={() => handleOpenForm()}
                    >
                        Thêm khách hàng mới
                    </Button>
                </Space>
            </section>

            <ConsultantState loading={data.loading} error={data.error}>
                <Card className={styles['portal-card']}>
                    {/* Bộ lọc tìm kiếm */}
                    <div className={styles['consultant-filters']} style={{ marginBottom: 16 }}>
                        <Input
                            allowClear
                            prefix={<SearchOutlined />}
                            placeholder="Tìm kiếm theo họ tên, số điện thoại, email hoặc khóa học..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ flex: 2 }}
                        />
                        <Select
                            allowClear
                            placeholder="Lọc trạng thái"
                            value={statusFilter}
                            onChange={setStatusFilter}
                            style={{ width: 180 }}
                            options={[
                                { label: 'Tất cả trạng thái', value: '' },
                                { label: 'Khách hàng mới (NEW)', value: 'NEW' },
                                { label: 'Đã liên hệ (CONTACTED)', value: 'CONTACTED' },
                                { label: 'Đang tư vấn (CONSULTED)', value: 'CONSULTED' },
                                { label: 'Đã đăng ký học (REGISTERED)', value: 'REGISTERED' },
                                { label: 'Không có nhu cầu (CANCELLED)', value: 'CANCELLED' },
                            ]}
                        />
                        <Select
                            allowClear
                            placeholder="Lọc khóa học quan tâm"
                            value={courseFilter}
                            onChange={setCourseFilter}
                            style={{ width: 220 }}
                            options={courseNamesList.map(name => ({ label: name, value: name }))}
                        />
                    </div>

                    {!filteredLeads.length ? (
                        <ConsultantEmpty description="Chưa có khách hàng nào phù hợp với bộ lọc" />
                    ) : (
                        <Table
                            rowKey="_id"
                            dataSource={filteredLeads}
                            pagination={{ pageSize: 8, showSizeChanger: true }}
                            scroll={{ x: 1100 }}
                            columns={[
                                {
                                    title: 'STT',
                                    width: 50,
                                    render: (_, __, idx) => idx + 1,
                                },
                                {
                                    title: 'Khách hàng',
                                    render: (_, lead: ILead) => (
                                        <div className={styles['consultant-person-cell']}>
                                            <strong>
                                                <LeadIcon status={lead.status} /> {lead.full_name || lead.name}
                                            </strong>
                                            <span>{lead.email}</span>
                                        </div>
                                    ),
                                },
                                {
                                    title: 'Điện thoại',
                                    dataIndex: 'phone',
                                    render: phone => (
                                        <span style={{ color: '#0f62fe', fontWeight: 600 }}>
                                            <PhoneOutlined /> {phone || 'Chưa cập nhật'}
                                        </span>
                                    ),
                                },
                                {
                                    title: 'Khóa học quan tâm',
                                    dataIndex: 'course_name',
                                    render: c => <b>{c || 'Chưa xác định'}</b>,
                                },
                                {
                                    title: 'Trạng thái',
                                    dataIndex: 'status',
                                    render: statusTag,
                                },
                                {
                                    title: 'Ghi chú tư vấn',
                                    dataIndex: 'note',
                                    ellipsis: true,
                                    render: n => <span>{n || 'Chưa có ghi chú'}</span>,
                                },
                                {
                                    title: 'Thao tác nghiệp vụ',
                                    fixed: 'right',
                                    width: 220,
                                    render: (_, lead: ILead) => (
                                        <Space size="small">
                                            <Tooltip title="Xem chi tiết hồ sơ">
                                                <Button
                                                    size="small"
                                                    icon={<EyeOutlined />}
                                                    onClick={() => setDetailLead(lead)}
                                                />
                                            </Tooltip>
                                            <Tooltip title="Ghi danh học viên vào lớp (Enroll)">
                                                <Button
                                                    type="primary"
                                                    size="small"
                                                    icon={<TeamOutlined />}
                                                    disabled={lead.status?.toUpperCase() === 'REGISTERED'}
                                                    onClick={() => handleOpenEnroll(lead)}
                                                >
                                                    Ghi danh
                                                </Button>
                                            </Tooltip>
                                            <Tooltip title="Gửi email tư vấn / Brochure">
                                                <Button
                                                    size="small"
                                                    icon={<MailOutlined />}
                                                    onClick={() => handleOpenMail(lead)}
                                                />
                                            </Tooltip>
                                            <Tooltip title="Chỉnh sửa thông tin">
                                                <Button
                                                    size="small"
                                                    icon={<EditOutlined />}
                                                    onClick={() => handleOpenForm(lead)}
                                                />
                                            </Tooltip>
                                            <Tooltip title="Xóa khách hàng">
                                                <Popconfirm
                                                    title="Bạn có chắc chắn muốn xóa khách hàng này?"
                                                    okText="Xóa"
                                                    cancelText="Hủy"
                                                    onConfirm={() => handleDeleteLead(lead._id || '')}
                                                >
                                                    <Button
                                                        danger
                                                        size="small"
                                                        icon={<DeleteOutlined />}
                                                    />
                                                </Popconfirm>
                                            </Tooltip>
                                        </Space>
                                    ),
                                },
                            ]}
                        />
                    )}
                </Card>
            </ConsultantState>

            {/* Modal Thêm / Chỉnh sửa khách hàng */}
            <Modal
                title={editingLead ? 'Chỉnh sửa khách hàng tiềm năng' : 'Thêm khách hàng tiềm năng mới'}
                open={formOpen}
                confirmLoading={saving}
                okText="Lưu thông tin"
                cancelText="Hủy bỏ"
                onOk={() => form.submit()}
                onCancel={() => setFormOpen(false)}
                width={580}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSaveLead}
                    style={{ marginTop: 12 }}
                >
                    <Form.Item
                        name="full_name"
                        label="Họ và tên khách hàng *"
                        rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
                    >
                        <Input placeholder="Ví dụ: Nguyễn Văn An" />
                    </Form.Item>

                    <Row gutter={12}>
                        <Col span={12}>
                            <Form.Item
                                name="phone"
                                label="Số điện thoại *"
                                rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
                            >
                                <Input placeholder="Ví dụ: 0912345678" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="email"
                                label="Địa chỉ email *"
                                rules={[{ required: true, type: 'email', message: 'Vui lòng nhập email hợp lệ' }]}
                            >
                                <Input placeholder="Ví dụ: an.nguyen@gmail.com" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={12}>
                        <Col span={12}>
                            <Form.Item
                                name="course_name"
                                label="Khóa học quan tâm *"
                                rules={[{ required: true, message: 'Vui lòng chọn hoặc nhập khóa học' }]}
                            >
                                <Select
                                    showSearch
                                    placeholder="Chọn khóa học..."
                                    options={courseNamesList.map(name => ({ label: name, value: name }))}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="status"
                                label="Trạng thái khách hàng *"
                                rules={[{ required: true }]}
                            >
                                <Select
                                    options={[
                                        { label: 'Khách hàng mới (NEW)', value: 'NEW' },
                                        { label: 'Đã liên hệ (CONTACTED)', value: 'CONTACTED' },
                                        { label: 'Đang tư vấn (CONSULTED)', value: 'CONSULTED' },
                                        { label: 'Đã đăng ký học (REGISTERED)', value: 'REGISTERED' },
                                        { label: 'Không nhu cầu (CANCELLED)', value: 'CANCELLED' },
                                    ]}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name="note"
                        label="Nhật ký tư vấn / Ghi chú chăm sóc"
                    >
                        <Input.TextArea
                            rows={3}
                            placeholder="Ghi nhận nhu cầu, thời gian rảnh, mong muốn của khách hàng..."
                        />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Modal Ghi danh nhanh vào lớp học */}
            <Modal
                title="Ghi danh khách hàng vào lớp học chính thức"
                open={enrollModalOpen}
                confirmLoading={enrolling}
                okText="Xác nhận ghi danh & Xuất hóa đơn"
                cancelText="Hủy bỏ"
                onOk={handleConfirmEnroll}
                onCancel={() => setEnrollModalOpen(false)}
                width={620}
            >
                {enrollLead && (
                    <div style={{ marginTop: 12 }}>
                        <div style={{ padding: 14, background: '#f8fafc', borderRadius: 8, marginBottom: 16 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                                <div>Khách hàng: <b>{enrollLead.full_name || enrollLead.name}</b></div>
                                <div>Số điện thoại: <b>{enrollLead.phone}</b></div>
                                <div>Email: <b>{enrollLead.email}</b></div>
                                <div>Khóa học quan tâm: <b style={{ color: '#0f62fe' }}>{enrollLead.course_name}</b></div>
                            </div>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label className={styles['accountant-field-label']}>Chọn Lớp học đang mở tiếp nhận học viên *</label>
                            <Select
                                showSearch
                                placeholder="Chọn lớp học phù hợp..."
                                value={selectedClassId || undefined}
                                onChange={setSelectedClassId}
                                style={{ width: '100%' }}
                                options={data.classrooms
                                    .filter(c => c.status === 'OPEN' || !c.status)
                                    .map(c => {
                                        const cCourse = typeof c.course_id === 'object' ? c.course_id : data.courses.find(item => item._id === c.course_id);
                                        return {
                                            value: c._id || '',
                                            label: `${c.class_name} · ${cCourse?.name || 'Khóa học'} · Phòng: ${c.room || 'Online'} · Ca: ${c.start_time || ''}-${c.end_time || ''}`,
                                        };
                                    })}
                            />
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label className={styles['accountant-field-label']}>Mức học bổng / Ưu đãi tuyển sinh (VNĐ)</label>
                            <InputNumber
                                min={0}
                                value={discountAmount}
                                onChange={val => setDiscountAmount(Number(val) || 0)}
                                style={{ width: '100%' }}
                                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={value => value?.replace(/\$\s?|(,*)/g, '') as any}
                            />
                        </div>

                        <div style={{ padding: 12, background: '#f0fdf4', borderRadius: 6, border: '1px solid #bbf7d0', fontSize: 12, color: '#166534' }}>
                            <CheckCircleOutlined style={{ marginRight: 6 }} />
                            Hệ thống sẽ tự động tạo tài khoản học viên (nếu chưa có), tạo hồ sơ ghi danh lớp học và phát hành hóa đơn học phí gửi phòng Kế toán.
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal Gửi email tư vấn */}
            <Modal
                title="Gửi email tư vấn & lộ trình học tập"
                open={mailModalOpen}
                confirmLoading={sendingMail}
                okText="Gửi email"
                cancelText="Đóng"
                onOk={handleSendMail}
                onCancel={() => setMailModalOpen(false)}
                width={600}
            >
                {mailLead && (
                    <div style={{ marginTop: 12 }}>
                        <div style={{ marginBottom: 12 }}>
                            <label className={styles['accountant-field-label']}>Khách hàng nhận</label>
                            <Input disabled value={`${mailLead.full_name || mailLead.name} (${mailLead.email})`} />
                        </div>
                        <div style={{ marginBottom: 12 }}>
                            <label className={styles['accountant-field-label']}>Tiêu đề email</label>
                            <Input value={mailSubject} onChange={e => setMailSubject(e.target.value)} />
                        </div>
                        <div style={{ marginBottom: 12 }}>
                            <label className={styles['accountant-field-label']}>Nội dung email tư vấn</label>
                            <Input.TextArea rows={7} value={mailContent} onChange={e => setMailContent(e.target.value)} />
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal Chi tiết khách hàng */}
            <Modal
                title="Hồ sơ khách hàng tiềm năng"
                open={Boolean(detailLead)}
                footer={null}
                onCancel={() => setDetailLead(null)}
                width={500}
            >
                {detailLead && (
                    <div className={styles['consultant-detail']}>
                        <h3 style={{ margin: '0 0 4px', fontSize: 18, color: '#102a43' }}>
                            {detailLead.full_name || detailLead.name}
                        </h3>
                        <p style={{ margin: '0 0 12px', color: '#627d98' }}>
                            {detailLead.email} · {detailLead.phone}
                        </p>
                        <div style={{ display: 'grid', gap: 10, padding: 14, background: '#f8fafc', borderRadius: 8, fontSize: 13 }}>
                            <div><b>Khóa học quan tâm:</b> {detailLead.course_name}</div>
                            <div><b>Trạng thái tuyển sinh:</b> {statusTag(detailLead.status)}</div>
                            <div><b>Ngày tiếp nhận:</b> {dateText((detailLead as any).createdAt)}</div>
                            <div><b>Ghi chú tư vấn:</b> {detailLead.note || 'Chưa có ghi chú'}</div>
                        </div>
                        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                            <Button onClick={() => { setDetailLead(null); handleOpenForm(detailLead); }}>
                                Chỉnh sửa
                            </Button>
                            <Button type="primary" onClick={() => { setDetailLead(null); handleOpenEnroll(detailLead); }}>
                                Ghi danh ngay
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </main>
    );
};

export default ConsultantCustomers;
