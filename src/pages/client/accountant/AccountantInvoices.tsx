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
    BellOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    DeleteOutlined,
    DollarCircleOutlined,
    DownloadOutlined,
    EditOutlined,
    EyeOutlined,
    FileAddOutlined,
    FileTextOutlined,
    PrinterOutlined,
    SearchOutlined,
} from '@ant-design/icons';
import {
    callCreateInvoice,
    callCreateNotification,
    callDeleteInvoice,
    callUpdateInvoice,
} from '@/config/api';
import { useAppSelector } from '@/redux/hooks';
import {
    AccountantEmpty,
    AccountantState,
    StatCard,
    dateText,
    dateTimeText,
    exportToCsv,
    invoiceStatusText,
    money,
    numberToWordsVietnamese,
    statusTag,
    useAccountantData,
    useInvoiceRows,
    type AccountantInvoice,
    type InvoiceRow,
} from './accountant.shared';
import styles from '@/styles/client.module.scss';

const AccountantInvoices = () => {
    const currentUser = useAppSelector(state => state.account.user);
    const data = useAccountantData();
    const rows = useInvoiceRows(data);

    const [form] = Form.useForm();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>();
    const [classFilter, setClassFilter] = useState<string>();

    const [formOpen, setFormOpen] = useState(false);
    const [editingInvoice, setEditingInvoice] = useState<AccountantInvoice | null>(null);
    const [saving, setSaving] = useState(false);

    // Modal xem & in hóa đơn
    const [printModalOpen, setPrintModalOpen] = useState(false);
    const [selectedPrintRow, setSelectedPrintRow] = useState<InvoiceRow | null>(null);

    // Modal nhắc nợ
    const [remindModalOpen, setRemindModalOpen] = useState(false);
    const [remindRow, setRemindRow] = useState<InvoiceRow | null>(null);
    const [remindContent, setRemindContent] = useState('');
    const [sendingReminder, setSendingReminder] = useState(false);

    // Thống kê nhanh
    const stats = useMemo(() => {
        const total = rows.length;
        const paid = rows.filter(r => r.invoice.status?.toUpperCase() === 'PAID').length;
        const unpaid = rows.filter(r => r.invoice.status?.toUpperCase() !== 'PAID' && r.invoice.status?.toUpperCase() !== 'CANCELLED').length;
        const totalValue = rows.reduce((s, r) => s + (Number(r.invoice.final_amount ?? r.invoice.amount) || 0), 0);
        return { total, paid, unpaid, totalValue };
    }, [rows]);

    // Lọc danh sách hóa đơn
    const filteredRows = useMemo(() => {
        return rows.filter(r => {
            const invoiceCode = r.invoice._id || '';
            const matchSearch = `${invoiceCode} ${r.student.name} ${r.student.email} ${r.classroomName}`
                .toLowerCase()
                .includes(search.toLowerCase());

            const matchStatus = !statusFilter || r.invoice.status?.toUpperCase() === statusFilter;
            const matchClass = !classFilter || r.classroomName === classFilter;

            return matchSearch && matchStatus && matchClass;
        });
    }, [classFilter, rows, search, statusFilter]);

    // Mở form tạo / sửa hóa đơn
    const handleOpenForm = (invoice?: AccountantInvoice) => {
        if (invoice) {
            setEditingInvoice(invoice);
            const enrollmentId = typeof invoice.enrollment_id === 'string'
                ? invoice.enrollment_id
                : invoice.enrollment_id?._id || '';

            form.setFieldsValue({
                enrollment_id: enrollmentId,
                amount: invoice.amount || 0,
                discount_amount: invoice.discount_amount || 0,
                final_amount: invoice.final_amount || invoice.amount || 0,
                status: invoice.status || 'UNPAID',
            });
        } else {
            setEditingInvoice(null);
            form.resetFields();
            form.setFieldsValue({
                amount: 0,
                discount_amount: 0,
                final_amount: 0,
                status: 'UNPAID',
            });
        }
        setFormOpen(true);
    };

    // Khi chọn enrollment trong form tạo hóa đơn $\to$ tự động điền học phí gốc
    const handleEnrollmentSelect = (enrollmentId: string) => {
        const enrollment = data.enrollments.find(e => e._id === enrollmentId);
        if (!enrollment) return;

        const classId = typeof enrollment.class_id === 'string' ? enrollment.class_id : (enrollment.class_id as any)?._id;
        const classroom = data.classrooms.find(c => c._id === classId);
        const courseId = typeof classroom?.course_id === 'string' ? classroom.course_id : (classroom?.course_id as any)?._id;
        const course = data.courses.find(c => c._id === courseId);

        const fee = Number(course?.price) || (course as any)?.tuition_fee || 5000000;
        const currDiscount = form.getFieldValue('discount_amount') || 0;
        form.setFieldsValue({
            amount: fee,
            final_amount: Math.max(0, fee - currDiscount),
        });
    };

    // Cập nhật final_amount khi thay đổi amount hoặc discount_amount
    const handleAmountChange = () => {
        const amount = Number(form.getFieldValue('amount') || 0);
        const discount = Number(form.getFieldValue('discount_amount') || 0);
        form.setFieldsValue({
            final_amount: Math.max(0, amount - discount),
        });
    };

    // Lưu hóa đơn
    const handleSaveInvoice = async (values: any) => {
        setSaving(true);
        try {
            const final = Math.max(0, Number(values.amount || 0) - Number(values.discount_amount || 0));
            const payload = {
                enrollment_id: values.enrollment_id,
                amount: Number(values.amount || 0),
                discount_amount: Number(values.discount_amount || 0),
                final_amount: final,
                status: values.status || 'UNPAID',
            };

            const res = editingInvoice?._id
                ? await callUpdateInvoice(payload, editingInvoice._id)
                : await callCreateInvoice(payload as any);

            if (res?.data) {
                message.success(editingInvoice ? 'Đã cập nhật hóa đơn học phí' : 'Đã phát hành hóa đơn học phí mới');
                setFormOpen(false);
                await data.refresh();
            } else {
                message.error(res?.message || 'Không thể lưu hóa đơn');
            }
        } catch {
            message.error('Lỗi khi lưu hóa đơn');
        } finally {
            setSaving(false);
        }
    };

    // Hủy hóa đơn
    const handleDeleteInvoice = async (id: string) => {
        try {
            const res = await callDeleteInvoice(id);
            if (res?.data) {
                message.success('Đã hủy hóa đơn học phí');
                await data.refresh();
            } else {
                message.error(res?.message || 'Không thể hủy hóa đơn');
            }
        } catch {
            message.error('Lỗi khi hủy hóa đơn');
        }
    };

    // Mở modal in hóa đơn
    const handleOpenPrint = (row: InvoiceRow) => {
        setSelectedPrintRow(row);
        setPrintModalOpen(true);
    };

    // Mở modal nhắc nợ
    const handleOpenReminder = (row: InvoiceRow) => {
        setRemindRow(row);
        setRemindContent(
            `Kính gửi học viên ${row.student.name},\n\nHệ thống đào tạo FPT Education xin thông báo đến bạn về hóa đơn học phí:\n- Mã hóa đơn: INV-${row.invoice._id?.slice(-8).toUpperCase()}\n- Khóa học: ${row.courseName} (${row.classroomName})\n- Số tiền cần nộp: ${money(row.remaining)}\n- Trạng thái: Chưa thanh toán\n\nXin vui lòng liên hệ phòng Kế toán hoặc hoàn tất học phí theo đúng quy định đào tạo.\nTrân trọng cảm ơn!`
        );
        setRemindModalOpen(true);
    };

    // Gửi thông báo nhắc nợ
    const handleSendReminder = async () => {
        if (!remindRow?.student.id) {
            message.error('Không tìm thấy mã học viên');
            return;
        }

        setSendingReminder(true);
        try {
            const res = await callCreateNotification({
                title: `[FPT Education] Nhắc nộp học phí hóa đơn INV-${remindRow.invoice._id?.slice(-8).toUpperCase()}`,
                content: remindContent,
                receiver_id: remindRow.student.id as any,
                sender_id: currentUser._id as any,
                type: 'EMAIL',
                status: 'SENT',
                isRead: false,
            } as any);

            if (res?.data) {
                message.success(`Đã gửi thông báo nhắc nợ thành công tới ${remindRow.student.name}`);
                setRemindModalOpen(false);
            } else {
                message.error(res?.message || 'Không thể gửi thông báo');
            }
        } catch {
            message.error('Lỗi khi gửi thông báo');
        } finally {
            setSendingReminder(false);
        }
    };

    // Xuất CSV
    const handleExportCsv = () => {
        const headers = ['Mã hóa đơn', 'Học viên', 'Email', 'Lớp học', 'Khóa học', 'Học phí gốc', 'Giảm giá', 'Thành tiền', 'Trạng thái', 'Ngày phát hành'];
        const exportRows = filteredRows.map(r => [
            r.invoice._id || '',
            r.student.name,
            r.student.email,
            r.classroomName,
            r.courseName,
            r.invoice.amount || 0,
            r.invoice.discount_amount || 0,
            r.invoice.final_amount ?? r.invoice.amount ?? 0,
            r.invoice.status || 'UNPAID',
            dateText(r.invoice.createdAt),
        ]);
        exportToCsv(`Danh_sach_hoa_don_${new Date().toISOString().slice(0, 10)}`, headers, exportRows);
        message.success('Đã xuất danh sách hóa đơn thành công!');
    };

    const classNamesList = useMemo(() => {
        return Array.from(new Set(rows.map(r => r.classroomName).filter(Boolean)));
    }, [rows]);

    return (
        <main className={`${styles.container} ${styles['accountant-page']}`}>
            <section className={styles['accountant-page-heading']}>
                <div>
                    <span>TÀI CHÍNH / HÓA ĐƠN HỌC PHÍ</span>
                    <h1>Quản lý hóa đơn tài chính</h1>
                    <p>Phát hành, tra cứu, in hóa đơn học phí và gửi thông báo công nợ cho học viên.</p>
                </div>
                <Space>
                    <Button icon={<DownloadOutlined />} onClick={handleExportCsv}>
                        Xuất danh sách (CSV)
                    </Button>
                    <Button
                        type="primary"
                        icon={<FileAddOutlined />}
                        onClick={() => handleOpenForm()}
                    >
                        Phát hành hóa đơn mới
                    </Button>
                </Space>
            </section>

            <AccountantState loading={data.loading} error={data.error}>
                {/* 4 Thẻ thống kê */}
                <Row gutter={[16, 16]} style={{ marginBottom: 18 }}>
                    <Col xs={24} sm={12} lg={6}>
                        <StatCard
                            title="Tổng giá trị hóa đơn"
                            value={money(stats.totalValue)}
                            subValue="Toàn bộ giá trị đã phát hành"
                            icon={<DollarCircleOutlined />}
                            accent="teal"
                        />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <StatCard
                            title="Hóa đơn đã thanh toán"
                            value={stats.paid}
                            subValue="Đã thu tiền đầy đủ"
                            icon={<CheckCircleOutlined />}
                            accent="green"
                        />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <StatCard
                            title="Hóa đơn chờ thanh toán"
                            value={stats.unpaid}
                            subValue="Cần theo dõi và thu hồi"
                            icon={<ClockCircleOutlined />}
                            accent="coral"
                        />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <StatCard
                            title="Tổng số hóa đơn"
                            value={stats.total}
                            subValue="Hồ sơ tài chính trong hệ thống"
                            icon={<FileTextOutlined />}
                            accent="navy"
                        />
                    </Col>
                </Row>

                <Card className={styles['portal-card']}>
                    {/* Thanh tìm kiếm và bộ lọc */}
                    <div className={styles['accountant-filters']} style={{ marginBottom: 16 }}>
                        <Input
                            allowClear
                            prefix={<SearchOutlined />}
                            placeholder="Tìm kiếm mã HĐ, tên học viên, email hoặc lớp học..."
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
                                { label: 'Đã thanh toán (PAID)', value: 'PAID' },
                                { label: 'Chưa thanh toán (UNPAID)', value: 'UNPAID' },
                                { label: 'Thanh toán một phần', value: 'PARTIAL' },
                                { label: 'Đã hủy (CANCELLED)', value: 'CANCELLED' },
                            ]}
                        />
                        <Select
                            allowClear
                            placeholder="Lọc theo lớp học"
                            value={classFilter}
                            onChange={setClassFilter}
                            style={{ width: 200 }}
                            options={classNamesList.map(c => ({ label: c, value: c }))}
                        />
                    </div>

                    {!filteredRows.length ? (
                        <AccountantEmpty description="Chưa có hóa đơn nào phù hợp với điều kiện tìm kiếm" />
                    ) : (
                        <Table
                            rowKey={r => r.invoice._id || Math.random().toString()}
                            dataSource={filteredRows}
                            pagination={{ pageSize: 8, showSizeChanger: true }}
                            scroll={{ x: 1100 }}
                            columns={[
                                {
                                    title: 'Mã hóa đơn',
                                    width: 140,
                                    render: (_, r) => (
                                        <b className={styles['invoice-code']}>
                                            INV-{r.invoice._id?.slice(-8).toUpperCase()}
                                        </b>
                                    ),
                                },
                                {
                                    title: 'Học viên',
                                    render: (_, r) => (
                                        <div className={styles['accountant-person-cell']}>
                                            <strong>{r.student.name}</strong>
                                            <span>{r.student.email}</span>
                                        </div>
                                    ),
                                },
                                {
                                    title: 'Lớp học & Khóa học',
                                    render: (_, r) => (
                                        <div>
                                            <b>{r.classroomName}</b>
                                            <div style={{ fontSize: 11, color: '#627d98' }}>{r.courseName}</div>
                                        </div>
                                    ),
                                },
                                {
                                    title: 'Học phí gốc',
                                    render: (_, r) => money(r.invoice.amount),
                                },
                                {
                                    title: 'Giảm giá',
                                    render: (_, r) => (
                                        <span style={{ color: r.invoice.discount_amount ? '#0f62fe' : '#829ab1' }}>
                                            {money(r.invoice.discount_amount)}
                                        </span>
                                    ),
                                },
                                {
                                    title: 'Thành tiền',
                                    render: (_, r) => (
                                        <b style={{ color: '#0b3d91' }}>
                                            {money(r.invoice.final_amount ?? r.invoice.amount)}
                                        </b>
                                    ),
                                },
                                {
                                    title: 'Trạng thái',
                                    render: (_, r) => statusTag(r.invoice.status),
                                },
                                {
                                    title: 'Ngày tạo',
                                    render: (_, r) => dateText(r.invoice.createdAt),
                                },
                                {
                                    title: 'Thao tác nghiệp vụ',
                                    fixed: 'right',
                                    width: 180,
                                    render: (_, r) => (
                                        <Space size="small">
                                            <Tooltip title="Xem & In hóa đơn tài chính">
                                                <Button
                                                    size="small"
                                                    icon={<PrinterOutlined />}
                                                    onClick={() => handleOpenPrint(r)}
                                                />
                                            </Tooltip>
                                            {r.invoice.status?.toUpperCase() !== 'PAID' && (
                                                <Tooltip title="Gửi nhắc nợ qua email">
                                                    <Button
                                                        size="small"
                                                        icon={<BellOutlined />}
                                                        onClick={() => handleOpenReminder(r)}
                                                    />
                                                </Tooltip>
                                            )}
                                            <Tooltip title="Chỉnh sửa hóa đơn">
                                                <Button
                                                    size="small"
                                                    icon={<EditOutlined />}
                                                    disabled={r.invoice.status?.toUpperCase() === 'PAID'}
                                                    onClick={() => handleOpenForm(r.invoice)}
                                                />
                                            </Tooltip>
                                            <Tooltip title="Hủy hóa đơn">
                                                <Popconfirm
                                                    title="Bạn có chắc chắn muốn hủy hóa đơn này?"
                                                    okText="Hủy hóa đơn"
                                                    cancelText="Không"
                                                    onConfirm={() => handleDeleteInvoice(r.invoice._id || '')}
                                                    disabled={r.invoice.status?.toUpperCase() === 'PAID'}
                                                >
                                                    <Button
                                                        danger
                                                        size="small"
                                                        icon={<DeleteOutlined />}
                                                        disabled={r.invoice.status?.toUpperCase() === 'PAID'}
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
            </AccountantState>

            {/* Modal Phát hành / Chỉnh sửa Hóa đơn */}
            <Modal
                title={editingInvoice ? 'Chỉnh sửa hóa đơn học phí' : 'Phát hành hóa đơn học phí mới'}
                open={formOpen}
                confirmLoading={saving}
                okText={editingInvoice ? 'Lưu thay đổi' : 'Phát hành hóa đơn'}
                cancelText="Hủy bỏ"
                onOk={() => form.submit()}
                onCancel={() => setFormOpen(false)}
                width={640}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSaveInvoice}
                    style={{ marginTop: 12 }}
                >
                    <Form.Item
                        name="enrollment_id"
                        label="Hồ sơ ghi danh học viên / Lớp học *"
                        rules={[{ required: true, message: 'Vui lòng chọn học viên và lớp ghi danh' }]}
                    >
                        <Select
                            showSearch
                            placeholder="Tìm học viên hoặc lớp học..."
                            optionFilterProp="label"
                            onChange={handleEnrollmentSelect}
                            options={data.enrollments.map(e => {
                                const stName = typeof e.student_id === 'object' && e.student_id ? e.student_id.name : e.student_id;
                                const cls = data.classrooms.find(c => c._id === (typeof e.class_id === 'string' ? e.class_id : (e.class_id as any)?._id));
                                return {
                                    value: e._id || '',
                                    label: `${stName || 'Học viên'} · Lớp: ${cls?.class_name || 'Chưa rõ'} (${e._id?.slice(-6)})`,
                                };
                            }).filter(item => Boolean(item.value))}
                        />
                    </Form.Item>

                    <Row gutter={12}>
                        <Col span={12}>
                            <Form.Item
                                name="amount"
                                label="Học phí gốc niêm yết (VNĐ) *"
                                rules={[{ required: true, message: 'Vui lòng nhập học phí' }]}
                            >
                                <InputNumber
                                    min={0}
                                    style={{ width: '100%' }}
                                    onChange={handleAmountChange}
                                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={value => value?.replace(/\$\s?|(,*)/g, '') as any}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="discount_amount"
                                label="Học bổng / Miễn giảm (VNĐ)"
                            >
                                <InputNumber
                                    min={0}
                                    style={{ width: '100%' }}
                                    onChange={handleAmountChange}
                                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={value => value?.replace(/\$\s?|(,*)/g, '') as any}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name="final_amount"
                        label="Số tiền thực thu (Sau miễn giảm)"
                    >
                        <InputNumber
                            disabled
                            style={{ width: '100%', fontWeight: 700, color: '#0b3d91' }}
                            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={value => value?.replace(/\$\s?|(,*)/g, '') as any}
                        />
                    </Form.Item>

                    <Form.Item
                        name="status"
                        label="Trạng thái hóa đơn"
                        rules={[{ required: true }]}
                    >
                        <Select
                            options={[
                                { label: 'Chưa thanh toán (UNPAID)', value: 'UNPAID' },
                                { label: 'Thanh toán một phần (PARTIAL)', value: 'PARTIAL' },
                                { label: 'Đã thanh toán đủ (PAID)', value: 'PAID' },
                                { label: 'Đã hủy bỏ (CANCELLED)', value: 'CANCELLED' },
                            ]}
                        />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Modal Xem & In Hóa đơn tài chính chuẩn */}
            <Modal
                title="Hóa đơn học phí điện tử"
                open={printModalOpen}
                footer={[
                    <Button key="close" onClick={() => setPrintModalOpen(false)}>
                        Đóng
                    </Button>,
                    <Button
                        key="print"
                        type="primary"
                        icon={<PrinterOutlined />}
                        onClick={() => window.print()}
                    >
                        In hóa đơn tài chính
                    </Button>,
                ]}
                onCancel={() => setPrintModalOpen(false)}
                width={780}
            >
                {selectedPrintRow && (
                    <div className={styles['accountant-financial-doc']}>
                        {/* Header hóa đơn */}
                        <div className={styles['financial-doc-header']}>
                            <div className={styles['financial-doc-logo']}>
                                <div>
                                    <div className={styles['financial-doc-brand']}>HỆ THỐNG GIÁO DỤC FPT</div>
                                    <div className={styles['financial-doc-sub']}>FPT EDUCATION SYSTEM · TRUNG TÂM ĐÀO TẠO CÔNG NGHỆ</div>
                                    <div className={styles['financial-doc-sub']}>Địa chỉ: Khu Công nghệ cao Hòa Lạc, Hà Nội | Hotline: 1900 6600</div>
                                </div>
                            </div>
                            <div className={styles['financial-doc-meta']}>
                                <div><b>Mã HĐ:</b> INV-{selectedPrintRow.invoice._id?.slice(-8).toUpperCase()}</div>
                                <div><b>Ngày phát hành:</b> {dateText(selectedPrintRow.invoice.createdAt || new Date())}</div>
                                <div><b>Trạng thái:</b> {invoiceStatusText(selectedPrintRow.invoice.status)}</div>
                            </div>
                        </div>

                        {/* Tiêu đề chứng từ */}
                        <div className={styles['financial-doc-title']}>
                            <h2>HÓA ĐƠN THU HỌC PHÍ ĐIỆN TỬ</h2>
                            <p>(Bản thể hiện điện tử phục vụ lưu chuyển chứng từ tài chính nội bộ)</p>
                        </div>

                        {/* Thông tin học viên */}
                        <div className={styles['financial-doc-body']}>
                            <div className={styles['financial-doc-row']}>
                                <span><b>Họ và tên học viên:</b></span>
                                <span>{selectedPrintRow.student.name}</span>
                            </div>
                            <div className={styles['financial-doc-row']}>
                                <span><b>Email liên hệ:</b></span>
                                <span>{selectedPrintRow.student.email}</span>
                            </div>
                            <div className={styles['financial-doc-row']}>
                                <span><b>Số điện thoại:</b></span>
                                <span>{selectedPrintRow.student.phone || 'Chưa cập nhật'}</span>
                            </div>
                            <div className={styles['financial-doc-row']}>
                                <span><b>Lớp đăng ký học:</b></span>
                                <span>{selectedPrintRow.classroomName}</span>
                            </div>
                            <div className={styles['financial-doc-row']}>
                                <span><b>Chương trình đào tạo / Khóa học:</b></span>
                                <span>{selectedPrintRow.courseName}</span>
                            </div>

                            {/* Bảng kê chi phí */}
                            <table style={{ width: '100%', marginTop: 18, borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: '#f0f4f8', borderBottom: '2px solid #cbd2d9' }}>
                                        <th style={{ padding: 8 }}>STT</th>
                                        <th style={{ padding: 8 }}>Khoản thu / Nội dung</th>
                                        <th style={{ padding: 8, textAlign: 'right' }}>Học phí gốc</th>
                                        <th style={{ padding: 8, textAlign: 'right' }}>Học bổng / Miễn giảm</th>
                                        <th style={{ padding: 8, textAlign: 'right' }}>Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                        <td style={{ padding: 8 }}>1</td>
                                        <td style={{ padding: 8 }}>Học phí toàn khóa đào tạo: {selectedPrintRow.courseName}</td>
                                        <td style={{ padding: 8, textAlign: 'right' }}>{money(selectedPrintRow.invoice.amount)}</td>
                                        <td style={{ padding: 8, textAlign: 'right' }}>{money(selectedPrintRow.invoice.discount_amount)}</td>
                                        <td style={{ padding: 8, textAlign: 'right', fontWeight: 600 }}>
                                            {money(selectedPrintRow.invoice.final_amount ?? selectedPrintRow.invoice.amount)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            <div style={{ marginTop: 16, padding: '12px 16px', background: '#f8fafc', borderRadius: 6 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                                    <span><b>Tổng số tiền thanh toán:</b></span>
                                    <b style={{ color: '#0b3d91', fontSize: 16 }}>
                                        {money(selectedPrintRow.invoice.final_amount ?? selectedPrintRow.invoice.amount)}
                                    </b>
                                </div>
                                <div style={{ marginTop: 6, fontSize: 12, color: '#486581' }}>
                                    Số tiền viết bằng chữ:{' '}
                                    <em>
                                        {numberToWordsVietnamese(
                                            Number(selectedPrintRow.invoice.final_amount ?? selectedPrintRow.invoice.amount ?? 0)
                                        )}
                                    </em>
                                </div>
                            </div>
                        </div>

                        {/* Chữ ký 3 bên */}
                        <div className={styles['financial-doc-signatures']}>
                            <div>
                                <div className={styles['signature-role']}>HỌC VIÊN / NGƯỜI NỘP</div>
                                <div className={styles['signature-note']}>(Ký, ghi rõ họ tên)</div>
                                <div className={styles['signature-space']} />
                                <div>{selectedPrintRow.student.name}</div>
                            </div>
                            <div>
                                <div className={styles['signature-role']}>KẾ TOÁN VIÊN LẬP BIỂU</div>
                                <div className={styles['signature-note']}>(Ký, ghi rõ họ tên)</div>
                                <div className={styles['signature-space']} />
                                <div>{currentUser.name || 'Ban Tài vụ'}</div>
                            </div>
                            <div>
                                <div className={styles['signature-role']}>KẾ TOÁN TRƯỞNG / THỦ QUỸ</div>
                                <div className={styles['signature-note']}>(Ký, đóng dấu nếu có)</div>
                                <div className={styles['signature-space']} />
                                <div>FPT Education System</div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal Nhắc nợ học phí */}
            <Modal
                title="Gửi email thông báo nhắc nợ học phí"
                open={remindModalOpen}
                confirmLoading={sendingReminder}
                okText="Gửi email nhắc nợ"
                cancelText="Hủy"
                onOk={handleSendReminder}
                onCancel={() => setRemindModalOpen(false)}
                width={580}
            >
                {remindRow && (
                    <div style={{ marginTop: 12 }}>
                        <p style={{ margin: '0 0 12px', color: '#486581' }}>
                            Học viên nhận: <b>{remindRow.student.name}</b> ({remindRow.student.email})
                        </p>
                        <Input.TextArea
                            rows={8}
                            value={remindContent}
                            onChange={e => setRemindContent(e.target.value)}
                        />
                    </div>
                )}
            </Modal>
        </main>
    );
};

export default AccountantInvoices;
