import { useMemo, useState } from 'react';
import {
    Badge,
    Button,
    Card,
    Col,
    Form,
    Input,
    InputNumber,
    Modal,
    Progress,
    Row,
    Select,
    Space,
    Table,
    Tabs,
    Tag,
    Tooltip,
    message,
} from 'antd';
import {
    BellOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    DollarCircleOutlined,
    DownloadOutlined,
    EditOutlined,
    ExclamationCircleOutlined,
    FilterOutlined,
    MailOutlined,
    SearchOutlined,
    TeamOutlined,
    WalletOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
    callCreateNotification,
    callCreatePayment,
    callUpdateInvoice,
} from '@/config/api';
import { useAppSelector } from '@/redux/hooks';
import {
    AccountantEmpty,
    AccountantState,
    StatCard,
    dateText,
    exportToCsv,
    money,
    numberToWordsVietnamese,
    statusTag,
    useAccountantData,
    useInvoiceRows,
    type AccountantInvoice,
    type InvoiceRow,
} from './accountant.shared';
import styles from '@/styles/client.module.scss';

const AccountantTuition = () => {
    const navigate = useNavigate();
    const currentUser = useAppSelector(state => state.account.user);
    const data = useAccountantData();
    const rows = useInvoiceRows(data);

    const [activeTab, setActiveTab] = useState<'students' | 'classes'>('students');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>();
    const [classFilter, setClassFilter] = useState<string>();

    // State cho Modal thu tiền
    const [payModalOpen, setPayModalOpen] = useState(false);
    const [selectedInvoiceRow, setSelectedInvoiceRow] = useState<InvoiceRow | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'BANK_TRANSFER' | 'CASH' | 'VNPAY'>('BANK_TRANSFER');
    const [payAmount, setPayAmount] = useState<number>(0);
    const [payNote, setPayNote] = useState('');
    const [savingPayment, setSavingPayment] = useState(false);

    // State cho Modal nhắc nợ
    const [remindModalOpen, setRemindModalOpen] = useState(false);
    const [remindRow, setRemindRow] = useState<InvoiceRow | null>(null);
    const [remindTitle, setRemindTitle] = useState('');
    const [remindContent, setRemindContent] = useState('');
    const [sendingReminder, setSendingReminder] = useState(false);

    // State cho Modal miễn giảm / học bổng
    const [discountModalOpen, setDiscountModalOpen] = useState(false);
    const [discountRow, setDiscountRow] = useState<InvoiceRow | null>(null);
    const [discountAmount, setDiscountAmount] = useState<number>(0);
    const [savingDiscount, setSavingDiscount] = useState(false);

    // Thống kê tổng quan
    const summary = useMemo(() => {
        const totalTuition = rows.reduce((s, r) => s + (Number(r.invoice.amount) || 0), 0);
        const totalDiscount = rows.reduce((s, r) => s + (Number(r.invoice.discount_amount) || 0), 0);
        const totalFinal = rows.reduce((s, r) => s + (Number(r.invoice.final_amount ?? r.invoice.amount) || 0), 0);
        const totalPaid = rows.reduce((s, r) => s + r.paid, 0);
        const totalDebt = rows.reduce((s, r) => s + r.remaining, 0);
        const debtStudentsCount = rows.filter(r => r.remaining > 0).length;
        const fullyPaidCount = rows.filter(r => r.remaining === 0).length;

        return {
            totalTuition,
            totalDiscount,
            totalFinal,
            totalPaid,
            totalDebt,
            debtStudentsCount,
            fullyPaidCount,
            totalStudents: rows.length,
        };
    }, [rows]);

    // Lọc danh sách học viên
    const filteredRows = useMemo(() => {
        return rows.filter(r => {
            const matchSearch = `${r.student.name} ${r.student.email} ${r.student.phone} ${r.classroomName} ${r.invoice._id || ''}`
                .toLowerCase()
                .includes(search.toLowerCase());

            let matchStatus = true;
            if (statusFilter === 'PAID') matchStatus = r.remaining === 0;
            else if (statusFilter === 'DEBT') matchStatus = r.remaining > 0;
            else if (statusFilter) matchStatus = r.invoice.status?.toUpperCase() === statusFilter;

            let matchClass = true;
            if (classFilter) matchClass = r.classroomName === classFilter;

            return matchSearch && matchStatus && matchClass;
        });
    }, [classFilter, rows, search, statusFilter]);

    // Tổng hợp theo lớp học
    const classSummaryList = useMemo(() => {
        const map = new Map<string, {
            className: string;
            courseName: string;
            totalStudents: number;
            paidStudents: number;
            debtStudents: number;
            totalAmount: number;
            paidAmount: number;
            remainingAmount: number;
        }>();

        rows.forEach(r => {
            const key = r.classroomName || 'Chưa xếp lớp';
            const curr = map.get(key) || {
                className: key,
                courseName: r.courseName,
                totalStudents: 0,
                paidStudents: 0,
                debtStudents: 0,
                totalAmount: 0,
                paidAmount: 0,
                remainingAmount: 0,
            };

            curr.totalStudents += 1;
            curr.totalAmount += (Number(r.invoice.final_amount ?? r.invoice.amount) || 0);
            curr.paidAmount += r.paid;
            curr.remainingAmount += r.remaining;
            if (r.remaining === 0) curr.paidStudents += 1;
            else curr.debtStudents += 1;

            map.set(key, curr);
        });

        return Array.from(map.values());
    }, [rows]);

    // Mở modal thu tiền
    const handleOpenPayment = (row: InvoiceRow) => {
        setSelectedInvoiceRow(row);
        setPayAmount(row.remaining);
        setPaymentMethod('BANK_TRANSFER');
        setPayNote('');
        setPayModalOpen(true);
    };

    // Xác nhận thu tiền
    const handleConfirmPayment = async () => {
        if (!selectedInvoiceRow?.invoice._id) return;
        if (payAmount <= 0) {
            message.warning('Vui lòng nhập số tiền hợp lệ lớn hơn 0');
            return;
        }

        setSavingPayment(true);
        try {
            const resPayment = await callCreatePayment({
                invoice_id: selectedInvoiceRow.invoice._id,
                payment_method: paymentMethod,
                payment_date: new Date() as any,
            });

            if (resPayment?.data) {
                // Nếu thu đủ số tiền còn lại thì cập nhật trạng thái hóa đơn sang PAID
                const isFullyPaid = payAmount >= selectedInvoiceRow.remaining;
                await callUpdateInvoice(
                    { status: isFullyPaid ? 'PAID' : 'PARTIAL' },
                    selectedInvoiceRow.invoice._id
                );

                message.success(`Đã thu thành công ${money(payAmount)} cho học viên ${selectedInvoiceRow.student.name}`);
                setPayModalOpen(false);
                await data.refresh();
            } else {
                message.error(resPayment?.message || 'Không thể tạo phiếu thu tiền');
            }
        } catch {
            message.error('Có lỗi xảy ra trong quá trình ghi nhận thanh toán');
        } finally {
            setSavingPayment(false);
        }
    };

    // Mở modal nhắc nợ
    const handleOpenReminder = (row: InvoiceRow) => {
        setRemindRow(row);
        setRemindTitle(`[FPT Education] Nhắc nộp học phí lớp ${row.classroomName}`);
        setRemindContent(
            `Kính gửi học viên ${row.student.name},\n\nBộ phận Tài chính - Kế toán FPT Education xin thông báo về việc hoàn tất nghĩa vụ học phí cho khóa học "${row.courseName}" (Lớp: ${row.classroomName}).\n\n- Số tiền cần nộp: ${money(row.remaining)}\n- Bằng chữ: ${numberToWordsVietnamese(row.remaining)}\n- Trạng thái hiện tại: Chưa thanh toán\n\nQuý học viên vui lòng thanh toán tại Văn phòng Kế toán hoặc chuyển khoản ngân hàng theo thông tin:\n- Số tài khoản: 000123456789 - TPBank\n- Chủ tài khoản: FPT EDUCATION SYSTEM\n- Cú pháp: HP_${row.invoice._id?.slice(-8).toUpperCase()}_${row.student.name}\n\nTrân trọng cảm ơn!`
        );
        setRemindModalOpen(true);
    };

    // Gửi thông báo nhắc nợ
    const handleSendReminder = async () => {
        if (!remindRow || !remindRow.student.id) {
            message.error('Không tìm thấy thông tin định danh của học viên để gửi thông báo');
            return;
        }

        setSendingReminder(true);
        try {
            const res = await callCreateNotification({
                title: remindTitle,
                content: remindContent,
                receiver_id: remindRow.student.id as any,
                sender_id: currentUser._id as any,
                type: 'EMAIL',
                status: 'SENT',
                isRead: false,
            } as any);

            if (res?.data) {
                message.success(`Đã gửi thông báo nhắc học phí thành công tới học viên ${remindRow.student.name}`);
                setRemindModalOpen(false);
            } else {
                message.error(res?.message || 'Không thể gửi thông báo');
            }
        } catch {
            message.error('Lỗi khi gửi thông báo nhắc nợ');
        } finally {
            setSendingReminder(false);
        }
    };

    // Mở modal miễn giảm
    const handleOpenDiscount = (row: InvoiceRow) => {
        setDiscountRow(row);
        setDiscountAmount(Number(row.invoice.discount_amount) || 0);
        setDiscountModalOpen(true);
    };

    // Lưu miễn giảm
    const handleSaveDiscount = async () => {
        if (!discountRow?.invoice._id) return;
        const originalAmount = Number(discountRow.invoice.amount) || 0;
        if (discountAmount > originalAmount) {
            message.warning('Mức miễn giảm không được vượt quá học phí gốc');
            return;
        }

        setSavingDiscount(true);
        try {
            const finalAmount = Math.max(0, originalAmount - discountAmount);
            const res = await callUpdateInvoice(
                {
                    discount_amount: discountAmount,
                    final_amount: finalAmount,
                },
                discountRow.invoice._id
            );

            if (res?.data) {
                message.success('Đã cập nhật mức miễn giảm / học bổng thành công');
                setDiscountModalOpen(false);
                await data.refresh();
            } else {
                message.error(res?.message || 'Không thể cập nhật miễn giảm');
            }
        } catch {
            message.error('Lỗi khi cập nhật miễn giảm');
        } finally {
            setSavingDiscount(false);
        }
    };

    // Xuất báo cáo CSV
    const handleExportCsv = () => {
        const headers = ['Mã HĐ', 'Học viên', 'Email', 'SĐT', 'Lớp học', 'Khóa học', 'Học phí gốc', 'Miễn giảm', 'Phải nộp', 'Đã nộp', 'Còn nợ', 'Trạng thái'];
        const exportRows = filteredRows.map(r => [
            r.invoice._id || '',
            r.student.name,
            r.student.email,
            r.student.phone,
            r.classroomName,
            r.courseName,
            r.invoice.amount || 0,
            r.invoice.discount_amount || 0,
            r.invoice.final_amount ?? r.invoice.amount ?? 0,
            r.paid,
            r.remaining,
            r.remaining === 0 ? 'Đã hoàn tất' : 'Còn nợ',
        ]);
        exportToCsv(`Cong_no_hoc_phi_${new Date().toISOString().slice(0, 10)}`, headers, exportRows);
        message.success('Đã xuất danh sách công nợ học phí thành công!');
    };

    const classNamesList = useMemo(() => {
        return Array.from(new Set(rows.map(r => r.classroomName).filter(Boolean)));
    }, [rows]);

    return (
        <main className={`${styles.container} ${styles['accountant-page']}`}>
            <section className={styles['accountant-page-heading']}>
                <div>
                    <span>TÀI CHÍNH / HỌC PHÍ & CÔNG NỢ</span>
                    <h1>Quản lý học phí & Công nợ học viên</h1>
                    <p>Theo dõi biểu phí, công nợ chi tiết theo học viên và tỷ lệ hoàn thành theo từng lớp học.</p>
                </div>
                <Space>
                    <Button icon={<DownloadOutlined />} onClick={handleExportCsv}>
                        Xuất file công nợ (CSV)
                    </Button>
                    <Button type="primary" icon={<DollarCircleOutlined />} onClick={() => navigate('/client/accountant/payments')}>
                        Lập phiếu thu tại quầy
                    </Button>
                </Space>
            </section>

            <AccountantState loading={data.loading} error={data.error}>
                {/* Các thẻ chỉ số */}
                <Row gutter={[16, 16]} style={{ marginBottom: 18 }}>
                    <Col xs={24} sm={12} lg={6}>
                        <StatCard
                            title="Tổng công nợ còn nợ"
                            value={money(summary.totalDebt)}
                            subValue={`${summary.debtStudentsCount} học viên chưa hoàn tất`}
                            icon={<WalletOutlined />}
                            accent="coral"
                        />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <StatCard
                            title="Học phí đã thu"
                            value={money(summary.totalPaid)}
                            subValue={`${summary.fullyPaidCount} học viên đã hoàn thành`}
                            icon={<CheckCircleOutlined />}
                            accent="green"
                        />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <StatCard
                            title="Tổng học bổng / Miễn giảm"
                            value={money(summary.totalDiscount)}
                            subValue="Chính sách hỗ trợ học viên"
                            icon={<DollarCircleOutlined />}
                            accent="teal"
                        />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <StatCard
                            title="Tổng số hồ sơ học phí"
                            value={summary.totalStudents}
                            subValue="Toàn bộ học viên đã ghi danh"
                            icon={<TeamOutlined />}
                            accent="navy"
                        />
                    </Col>
                </Row>

                <Card className={styles['portal-card']}>
                    <Tabs
                        activeKey={activeTab}
                        onChange={key => setActiveTab(key as any)}
                        items={[
                            {
                                key: 'students',
                                label: (
                                    <span>
                                        <WalletOutlined /> Danh sách công nợ học viên ({filteredRows.length})
                                    </span>
                                ),
                            },
                            {
                                key: 'classes',
                                label: (
                                    <span>
                                        <TeamOutlined /> Theo dõi học phí theo lớp ({classSummaryList.length})
                                    </span>
                                ),
                            },
                        ]}
                    />

                    {activeTab === 'students' && (
                        <>
                            {/* Bộ lọc học viên */}
                            <div className={styles['accountant-filters']} style={{ marginBottom: 16 }}>
                                <Input
                                    allowClear
                                    prefix={<SearchOutlined />}
                                    placeholder="Tìm theo tên học viên, email, số điện thoại hoặc mã HĐ..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    style={{ flex: 2 }}
                                />
                                <Select
                                    allowClear
                                    placeholder="Lọc trạng thái nợ"
                                    value={statusFilter}
                                    onChange={setStatusFilter}
                                    style={{ width: 180 }}
                                    options={[
                                        { label: 'Tất cả trạng thái', value: '' },
                                        { label: 'Còn nợ học phí', value: 'DEBT' },
                                        { label: 'Đã hoàn tất 100%', value: 'PAID' },
                                    ]}
                                />
                                <Select
                                    allowClear
                                    placeholder="Lọc theo lớp học"
                                    value={classFilter}
                                    onChange={setClassFilter}
                                    style={{ width: 200 }}
                                    options={classNamesList.map(name => ({ label: name, value: name }))}
                                />
                            </div>

                            {!filteredRows.length ? (
                                <AccountantEmpty description="Không tìm thấy học viên nào phù hợp bộ lọc" />
                            ) : (
                                <Table
                                    rowKey={r => r.invoice._id || Math.random().toString()}
                                    dataSource={filteredRows}
                                    pagination={{ pageSize: 8, showSizeChanger: true }}
                                    scroll={{ x: 1100 }}
                                    columns={[
                                        {
                                            title: 'STT',
                                            width: 50,
                                            render: (_, __, idx) => idx + 1,
                                        },
                                        {
                                            title: 'Học viên',
                                            width: 220,
                                            render: (_, r) => (
                                                <div className={styles['accountant-person-cell']}>
                                                    <strong>{r.student.name}</strong>
                                                    <span>{r.student.email}</span>
                                                    {r.student.phone && <small style={{ color: '#829ab1', fontSize: 11 }}>{r.student.phone}</small>}
                                                </div>
                                            ),
                                        },
                                        {
                                            title: 'Lớp học & Khóa học',
                                            render: (_, r) => (
                                                <div>
                                                    <b style={{ color: '#0b3d91' }}>{r.classroomName}</b>
                                                    <div style={{ fontSize: 11, color: '#627d98' }}>{r.courseName}</div>
                                                </div>
                                            ),
                                        },
                                        {
                                            title: 'Học phí gốc',
                                            render: (_, r) => money(r.invoice.amount),
                                        },
                                        {
                                            title: 'Miễn giảm',
                                            render: (_, r) => (
                                                <span style={{ color: r.invoice.discount_amount ? '#0f62fe' : '#829ab1' }}>
                                                    {money(r.invoice.discount_amount)}
                                                </span>
                                            ),
                                        },
                                        {
                                            title: 'Phải nộp',
                                            render: (_, r) => <b>{money(r.invoice.final_amount ?? r.invoice.amount)}</b>,
                                        },
                                        {
                                            title: 'Đã nộp',
                                            render: (_, r) => <span style={{ color: '#25805d' }}>{money(r.paid)}</span>,
                                        },
                                        {
                                            title: 'Còn nợ',
                                            render: (_, r) => (
                                                <b className={r.remaining > 0 ? styles['text-danger'] : styles['text-success']}>
                                                    {money(r.remaining)}
                                                </b>
                                            ),
                                        },
                                        {
                                            title: 'Trạng thái',
                                            render: (_, r) => (
                                                r.remaining === 0
                                                    ? <Tag color="green">Đã nộp đủ</Tag>
                                                    : <Tag color="orange">Còn nợ</Tag>
                                            ),
                                        },
                                        {
                                            title: 'Thao tác nghiệp vụ',
                                            fixed: 'right',
                                            width: 200,
                                            render: (_, r) => (
                                                <Space size="small">
                                                    {r.remaining > 0 ? (
                                                        <>
                                                            <Button
                                                                type="primary"
                                                                size="small"
                                                                icon={<DollarCircleOutlined />}
                                                                onClick={() => handleOpenPayment(r)}
                                                            >
                                                                Thu tiền
                                                            </Button>
                                                            <Tooltip title="Gửi email thông báo nhắc nợ">
                                                                <Button
                                                                    size="small"
                                                                    icon={<BellOutlined />}
                                                                    onClick={() => handleOpenReminder(r)}
                                                                />
                                                            </Tooltip>
                                                        </>
                                                    ) : (
                                                        <Tag color="success">Hoàn tất</Tag>
                                                    )}
                                                    <Tooltip title="Cập nhật học bổng / miễn giảm">
                                                        <Button
                                                            size="small"
                                                            icon={<EditOutlined />}
                                                            disabled={r.invoice.status?.toUpperCase() === 'PAID'}
                                                            onClick={() => handleOpenDiscount(r)}
                                                        />
                                                    </Tooltip>
                                                </Space>
                                            ),
                                        },
                                    ]}
                                />
                            )}
                        </>
                    )}

                    {activeTab === 'classes' && (
                        <Table
                            rowKey="className"
                            dataSource={classSummaryList}
                            pagination={{ pageSize: 8 }}
                            scroll={{ x: 950 }}
                            columns={[
                                {
                                    title: 'Lớp học',
                                    render: (_, cls) => <b style={{ color: '#0b3d91', fontSize: 14 }}>{cls.className}</b>,
                                },
                                {
                                    title: 'Khóa học',
                                    dataIndex: 'courseName',
                                },
                                {
                                    title: 'Sĩ số học viên',
                                    render: (_, cls) => (
                                        <span>
                                            <b>{cls.totalStudents}</b> học viên ({cls.paidStudents} đã xong, {cls.debtStudents} còn nợ)
                                        </span>
                                    ),
                                },
                                {
                                    title: 'Tổng học phí lớp',
                                    render: (_, cls) => money(cls.totalAmount),
                                },
                                {
                                    title: 'Đã thu',
                                    render: (_, cls) => <span style={{ color: '#25805d', fontWeight: 600 }}>{money(cls.paidAmount)}</span>,
                                },
                                {
                                    title: 'Còn thiếu',
                                    render: (_, cls) => (
                                        <b className={cls.remainingAmount > 0 ? styles['text-danger'] : styles['text-success']}>
                                            {money(cls.remainingAmount)}
                                        </b>
                                    ),
                                },
                                {
                                    title: 'Tiến độ thu',
                                    width: 180,
                                    render: (_, cls) => {
                                        const pct = cls.totalAmount > 0 ? Math.round((cls.paidAmount / cls.totalAmount) * 100) : 100;
                                        return <Progress percent={pct} size="small" status={pct >= 100 ? 'success' : 'active'} />;
                                    },
                                },
                                {
                                    title: 'Thao tác',
                                    render: (_, cls) => (
                                        <Button
                                            size="small"
                                            onClick={() => {
                                                setClassFilter(cls.className);
                                                setActiveTab('students');
                                            }}
                                        >
                                            Xem học viên
                                        </Button>
                                    ),
                                },
                            ]}
                        />
                    )}
                </Card>
            </AccountantState>

            {/* Modal Thu tiền học phí */}
            <Modal
                title="Lập phiếu thu tiền học phí"
                open={payModalOpen}
                confirmLoading={savingPayment}
                okText="Xác nhận thu tiền"
                cancelText="Hủy bỏ"
                onOk={handleConfirmPayment}
                onCancel={() => setPayModalOpen(false)}
                width={560}
            >
                {selectedInvoiceRow && (
                    <div style={{ marginTop: 12 }}>
                        <div className={styles['payment-confirm-summary']}>
                            <span>Học viên:</span>
                            <b>{selectedInvoiceRow.student.name}</b>
                            <span>Lớp học:</span>
                            <b>{selectedInvoiceRow.classroomName}</b>
                            <span>Tổng tiền phải nộp:</span>
                            <b>{money(selectedInvoiceRow.invoice.final_amount ?? selectedInvoiceRow.invoice.amount)}</b>
                            <span>Đã đóng trước đó:</span>
                            <b>{money(selectedInvoiceRow.paid)}</b>
                            <span>Số tiền còn thiếu:</span>
                            <b className={styles['text-danger']} style={{ fontSize: 16 }}>
                                {money(selectedInvoiceRow.remaining)}
                            </b>
                        </div>

                        <div style={{ marginBottom: 14 }}>
                            <label className={styles['accountant-field-label']}>Số tiền thu đợt này (VNĐ) *</label>
                            <InputNumber
                                min={1000}
                                max={selectedInvoiceRow.remaining}
                                value={payAmount}
                                onChange={val => setPayAmount(Number(val) || 0)}
                                style={{ width: '100%' }}
                                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={value => value?.replace(/\$\s?|(,*)/g, '') as any}
                            />
                            <small style={{ color: '#627d98', display: 'block', marginTop: 4 }}>
                                Bằng chữ: <em>{numberToWordsVietnamese(payAmount)}</em>
                            </small>
                        </div>

                        <div style={{ marginBottom: 14 }}>
                            <label className={styles['accountant-field-label']}>Phương thức thanh toán *</label>
                            <Select
                                value={paymentMethod}
                                onChange={setPaymentMethod}
                                style={{ width: '100%' }}
                                options={[
                                    { label: 'Chuyển khoản ngân hàng (Bank Transfer)', value: 'BANK_TRANSFER' },
                                    { label: 'Tiền mặt tại quầy kế toán (Cash)', value: 'CASH' },
                                    { label: 'Cổng thanh toán điện tử VNPay', value: 'VNPAY' },
                                ]}
                            />
                        </div>

                        <div style={{ marginBottom: 14 }}>
                            <label className={styles['accountant-field-label']}>Ghi chú phiếu thu (Người nộp, mã tham chiếu ngân hàng...)</label>
                            <Input.TextArea
                                rows={2}
                                placeholder="Ví dụ: Học viên nộp tiền mặt đợt 1 / Phụ huynh chuyển khoản từ VCB..."
                                value={payNote}
                                onChange={e => setPayNote(e.target.value)}
                            />
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal Gửi thông báo nhắc nợ */}
            <Modal
                title="Gửi thông báo nhắc nợ học phí"
                open={remindModalOpen}
                confirmLoading={sendingReminder}
                okText="Gửi email thông báo"
                cancelText="Đóng"
                onOk={handleSendReminder}
                onCancel={() => setRemindModalOpen(false)}
                width={620}
            >
                {remindRow && (
                    <div style={{ marginTop: 12 }}>
                        <div style={{ marginBottom: 12 }}>
                            <label className={styles['accountant-field-label']}>Người nhận</label>
                            <Input
                                disabled
                                value={`${remindRow.student.name} (${remindRow.student.email})`}
                            />
                        </div>
                        <div style={{ marginBottom: 12 }}>
                            <label className={styles['accountant-field-label']}>Tiêu đề thông báo</label>
                            <Input
                                value={remindTitle}
                                onChange={e => setRemindTitle(e.target.value)}
                            />
                        </div>
                        <div style={{ marginBottom: 12 }}>
                            <label className={styles['accountant-field-label']}>Nội dung thông báo nhắc nợ</label>
                            <Input.TextArea
                                rows={8}
                                value={remindContent}
                                onChange={e => setRemindContent(e.target.value)}
                            />
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal Miễn giảm học phí / Học bổng */}
            <Modal
                title="Điều chỉnh Miễn giảm / Học bổng"
                open={discountModalOpen}
                confirmLoading={savingDiscount}
                okText="Cập nhật miễn giảm"
                cancelText="Hủy"
                onOk={handleSaveDiscount}
                onCancel={() => setDiscountModalOpen(false)}
                width={480}
            >
                {discountRow && (
                    <div style={{ marginTop: 12 }}>
                        <p style={{ margin: '0 0 12px', color: '#486581' }}>
                            Học viên: <b>{discountRow.student.name}</b> · Lớp: <b>{discountRow.classroomName}</b>
                        </p>
                        <p style={{ margin: '0 0 16px', color: '#486581' }}>
                            Học phí niêm yết ban đầu: <b>{money(discountRow.invoice.amount)}</b>
                        </p>
                        <div style={{ marginBottom: 12 }}>
                            <label className={styles['accountant-field-label']}>Mức giảm giá / Học bổng (VNĐ)</label>
                            <InputNumber
                                min={0}
                                max={Number(discountRow.invoice.amount) || 0}
                                value={discountAmount}
                                onChange={val => setDiscountAmount(Number(val) || 0)}
                                style={{ width: '100%' }}
                                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={value => value?.replace(/\$\s?|(,*)/g, '') as any}
                            />
                        </div>
                        <div style={{ padding: 12, background: '#f0f9ff', borderRadius: 6, fontSize: 13 }}>
                            Thành tiền sau miễn giảm:{' '}
                            <b style={{ color: '#0b3d91', fontSize: 15 }}>
                                {money(Math.max(0, (Number(discountRow.invoice.amount) || 0) - discountAmount))}
                            </b>
                        </div>
                    </div>
                )}
            </Modal>
        </main>
    );
};

export default AccountantTuition;
