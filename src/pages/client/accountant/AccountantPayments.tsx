import { useMemo, useState } from 'react';
import {
    Button,
    Card,
    Col,
    DatePicker,
    Form,
    Input,
    InputNumber,
    Modal,
    Row,
    Select,
    Space,
    Table,
    Tag,
    Tooltip,
    message,
} from 'antd';
import {
    BankOutlined,
    CreditCardOutlined,
    DollarCircleOutlined,
    DownloadOutlined,
    EyeOutlined,
    PlusOutlined,
    PrinterOutlined,
    SearchOutlined,
    WalletOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { callCreatePayment, callUpdateInvoice } from '@/config/api';
import { useAppSelector } from '@/redux/hooks';
import {
    AccountantEmpty,
    AccountantState,
    StatCard,
    dateText,
    dateTimeText,
    exportToCsv,
    money,
    numberToWordsVietnamese,
    paymentMethodText,
    useAccountantData,
    useInvoiceRows,
    type AccountantInvoice,
    type AccountantPayment,
    type InvoiceRow,
} from './accountant.shared';
import styles from '@/styles/client.module.scss';

interface PaymentDetailRecord {
    payment: AccountantPayment;
    invoice?: AccountantInvoice;
    studentName: string;
    studentEmail: string;
    className: string;
    courseName: string;
    amount: number;
}

const AccountantPayments = () => {
    const currentUser = useAppSelector(state => state.account.user);
    const data = useAccountantData();
    const rows = useInvoiceRows(data);

    const [form] = Form.useForm();
    const [search, setSearch] = useState('');
    const [methodFilter, setMethodFilter] = useState<string>();

    // State lập phiếu thu mới
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRow | null>(null);
    const [saving, setSaving] = useState(false);

    // State in biên lai thu tiền
    const [receiptModalOpen, setReceiptModalOpen] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState<PaymentDetailRecord | null>(null);

    // Danh sách các khoản thanh toán kết hợp thông tin chi tiết
    const paymentRecords: PaymentDetailRecord[] = useMemo(() => {
        return [...data.payments]
            .sort((a, b) => {
                const tA = new Date(a.payment_date || (a as any).createdAt || 0).getTime();
                const tB = new Date(b.payment_date || (b as any).createdAt || 0).getTime();
                return tB - tA;
            })
            .map(payment => {
                const invoiceId = typeof payment.invoice_id === 'string'
                    ? payment.invoice_id
                    : payment.invoice_id?._id;

                const invRow = rows.find(r => r.invoice._id === invoiceId);
                const inv = invRow?.invoice || (typeof payment.invoice_id === 'object' ? payment.invoice_id : undefined);

                return {
                    payment,
                    invoice: inv,
                    studentName: invRow?.student.name || 'Học viên',
                    studentEmail: invRow?.student.email || '',
                    className: invRow?.classroomName || 'Chưa xếp lớp',
                    courseName: invRow?.courseName || 'Khóa học',
                    amount: Number(inv?.final_amount ?? inv?.amount ?? 0),
                };
            });
    }, [data.payments, rows]);

    // Thống kê theo phương thức
    const stats = useMemo(() => {
        let total = 0;
        let bankTransfer = 0;
        let cash = 0;
        let vnpay = 0;

        paymentRecords.forEach(item => {
            total += item.amount;
            const m = item.payment.payment_method?.toUpperCase();
            if (m === 'BANK_TRANSFER') bankTransfer += item.amount;
            else if (m === 'CASH') cash += item.amount;
            else if (m === 'VNPAY') vnpay += item.amount;
            else bankTransfer += item.amount;
        });

        return {
            total,
            count: paymentRecords.length,
            bankTransfer,
            cash,
            vnpay,
        };
    }, [paymentRecords]);

    // Lọc theo search & method
    const filteredRecords = useMemo(() => {
        return paymentRecords.filter(item => {
            const payId = item.payment._id || '';
            const invId = typeof item.payment.invoice_id === 'string' ? item.payment.invoice_id : item.payment.invoice_id?._id || '';
            const matchSearch = `${payId} ${invId} ${item.studentName} ${item.studentEmail} ${item.className}`
                .toLowerCase()
                .includes(search.toLowerCase());

            const matchMethod = !methodFilter || item.payment.payment_method?.toUpperCase() === methodFilter;

            return matchSearch && matchMethod;
        });
    }, [methodFilter, paymentRecords, search]);

    // Các hóa đơn chưa thanh toán hoặc nợ một phần để lập phiếu thu
    const unpaidInvoiceOptions = useMemo(() => {
        return rows
            .filter(r => r.remaining > 0 && r.invoice.status?.toUpperCase() !== 'CANCELLED')
            .map(r => ({
                value: r.invoice._id || '',
                label: `INV-${r.invoice._id?.slice(-8).toUpperCase()} · ${r.student.name} · ${r.classroomName} (Còn nợ: ${money(r.remaining)})`,
                row: r,
            }));
    }, [rows]);

    // Mở modal lập phiếu thu
    const handleOpenCreateReceipt = () => {
        form.resetFields();
        setSelectedInvoice(null);
        form.setFieldsValue({
            payment_method: 'BANK_TRANSFER',
            payment_date: dayjs(),
        });
        setCreateModalOpen(true);
    };

    // Khi chọn hóa đơn trong form lập phiếu thu
    const handleSelectInvoice = (invoiceId: string) => {
        const option = unpaidInvoiceOptions.find(o => o.value === invoiceId);
        if (option) {
            setSelectedInvoice(option.row);
            form.setFieldsValue({
                amount: option.row.remaining,
                payer_name: option.row.student.name,
            });
        }
    };

    // Xác nhận lập phiếu thu
    const handleCreateReceipt = async (values: any) => {
        if (!selectedInvoice?.invoice._id) {
            message.warning('Vui lòng chọn hóa đơn cần thu');
            return;
        }

        setSaving(true);
        try {
            const res = await callCreatePayment({
                invoice_id: selectedInvoice.invoice._id,
                payment_method: values.payment_method,
                payment_date: values.payment_date ? values.payment_date.toISOString() : new Date().toISOString(),
            } as any);

            if (res?.data) {
                // Tự động chuyển trạng thái hóa đơn sang PAID
                await callUpdateInvoice({ status: 'PAID' }, selectedInvoice.invoice._id);

                message.success('Đã lập phiếu thu tiền thành công!');
                setCreateModalOpen(false);

                // Mở ngay biên lai thu tiền để in
                const newRecord: PaymentDetailRecord = {
                    payment: res.data as AccountantPayment,
                    invoice: selectedInvoice.invoice,
                    studentName: selectedInvoice.student.name,
                    studentEmail: selectedInvoice.student.email,
                    className: selectedInvoice.classroomName,
                    courseName: selectedInvoice.courseName,
                    amount: Number(selectedInvoice.invoice.final_amount ?? selectedInvoice.invoice.amount ?? 0),
                };
                setSelectedReceipt(newRecord);
                setReceiptModalOpen(true);

                await data.refresh();
            } else {
                message.error(res?.message || 'Không thể tạo phiếu thu');
            }
        } catch {
            message.error('Lỗi trong quá trình lập phiếu thu');
        } finally {
            setSaving(false);
        }
    };

    // Mở modal in biên lai
    const handleOpenPrintReceipt = (record: PaymentDetailRecord) => {
        setSelectedReceipt(record);
        setReceiptModalOpen(true);
    };

    // Xuất CSV sổ quỹ
    const handleExportCsv = () => {
        const headers = ['Mã phiếu thu', 'Mã hóa đơn', 'Học viên', 'Email', 'Lớp học', 'Khóa học', 'Số tiền thu', 'Phương thức', 'Ngày thu'];
        const exportRows = filteredRecords.map(r => [
            r.payment._id || '',
            typeof r.payment.invoice_id === 'string' ? r.payment.invoice_id : r.payment.invoice_id?._id || '',
            r.studentName,
            r.studentEmail,
            r.className,
            r.courseName,
            r.amount,
            paymentMethodText(r.payment.payment_method),
            dateText(r.payment.payment_date),
        ]);
        exportToCsv(`So_quy_thu_tien_${new Date().toISOString().slice(0, 10)}`, headers, exportRows);
        message.success('Đã xuất sổ quỹ thu tiền thành công!');
    };

    return (
        <main className={`${styles.container} ${styles['accountant-page']}`}>
            <section className={styles['accountant-page-heading']}>
                <div>
                    <span>TÀI CHÍNH / SỔ QUỸ & PHIẾU THU</span>
                    <h1>Lịch sử thanh toán & Quản lý phiếu thu</h1>
                    <p>Theo dõi toàn bộ dòng tiền thu về, ghi nhận phiếu thu tại quầy và in biên lai thu học phí.</p>
                </div>
                <Space>
                    <Button icon={<DownloadOutlined />} onClick={handleExportCsv}>
                        Xuất sổ quỹ (CSV)
                    </Button>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleOpenCreateReceipt}
                    >
                        Lập phiếu thu tại quầy
                    </Button>
                </Space>
            </section>

            <AccountantState loading={data.loading} error={data.error}>
                {/* 4 Thẻ thống kê dòng tiền */}
                <Row gutter={[16, 16]} style={{ marginBottom: 18 }}>
                    <Col xs={24} sm={12} lg={6}>
                        <StatCard
                            title="Tổng số tiền thực thu"
                            value={money(stats.total)}
                            subValue={`Ghi nhận từ ${stats.count} phiếu thu`}
                            icon={<DollarCircleOutlined />}
                            accent="teal"
                        />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <StatCard
                            title="Chuyển khoản ngân hàng"
                            value={money(stats.bankTransfer)}
                            subValue="Thu qua tài khoản FPT Education"
                            icon={<BankOutlined />}
                            accent="navy"
                        />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <StatCard
                            title="Tiền mặt tại quầy"
                            value={money(stats.cash)}
                            subValue="Thu trực tiếp tại phòng Kế toán"
                            icon={<WalletOutlined />}
                            accent="green"
                        />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <StatCard
                            title="Cổng VNPay / Thẻ"
                            value={money(stats.vnpay)}
                            subValue="Thanh toán trực tuyến"
                            icon={<CreditCardOutlined />}
                            accent="coral"
                        />
                    </Col>
                </Row>

                <Card className={styles['portal-card']}>
                    {/* Thanh lọc tìm kiếm */}
                    <div className={styles['accountant-filters']} style={{ marginBottom: 16 }}>
                        <Input
                            allowClear
                            prefix={<SearchOutlined />}
                            placeholder="Tìm kiếm theo mã phiếu thu, mã HĐ, tên học viên hoặc lớp học..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ flex: 2 }}
                        />
                        <Select
                            allowClear
                            placeholder="Lọc theo phương thức"
                            value={methodFilter}
                            onChange={setMethodFilter}
                            style={{ width: 220 }}
                            options={[
                                { label: 'Tất cả phương thức', value: '' },
                                { label: 'Chuyển khoản ngân hàng', value: 'BANK_TRANSFER' },
                                { label: 'Tiền mặt tại quầy', value: 'CASH' },
                                { label: 'Cổng thanh toán VNPay', value: 'VNPAY' },
                            ]}
                        />
                    </div>

                    {!filteredRecords.length ? (
                        <AccountantEmpty description="Chưa có dữ liệu phiếu thu nào" />
                    ) : (
                        <Table<PaymentDetailRecord>
                            rowKey={r => r.payment._id || Math.random().toString()}
                            dataSource={filteredRecords}
                            pagination={{ pageSize: 8, showSizeChanger: true }}
                            scroll={{ x: 1050 }}
                            columns={[
                                {
                                    title: 'Mã phiếu thu',
                                    render: (_, r) => (
                                        <b className={styles['invoice-code']}>
                                            REC-{r.payment._id?.slice(-8).toUpperCase() || 'NEW'}
                                        </b>
                                    ),
                                },
                                {
                                    title: 'Mã hóa đơn',
                                    render: (_, r) => {
                                        const invId = typeof r.payment.invoice_id === 'string'
                                            ? r.payment.invoice_id
                                            : r.payment.invoice_id?._id;
                                        return <span>INV-{invId?.slice(-8).toUpperCase()}</span>;
                                    },
                                },
                                {
                                    title: 'Học viên',
                                    render: (_, r) => (
                                        <div className={styles['accountant-person-cell']}>
                                            <strong>{r.studentName}</strong>
                                            <span>{r.studentEmail}</span>
                                        </div>
                                    ),
                                },
                                {
                                    title: 'Lớp học & Khóa học',
                                    render: (_, r) => (
                                        <div>
                                            <b>{r.className}</b>
                                            <div style={{ fontSize: 11, color: '#627d98' }}>{r.courseName}</div>
                                        </div>
                                    ),
                                },
                                {
                                    title: 'Số tiền thu',
                                    render: (_, r) => (
                                        <b style={{ color: '#0b3d91', fontSize: 14 }}>
                                            {money(r.amount)}
                                        </b>
                                    ),
                                },
                                {
                                    title: 'Phương thức thanh toán',
                                    render: (_, r) => {
                                        const m = r.payment.payment_method?.toUpperCase();
                                        const color = m === 'CASH' ? 'green' : m === 'VNPAY' ? 'purple' : 'blue';
                                        return <Tag color={color}>{paymentMethodText(r.payment.payment_method)}</Tag>;
                                    },
                                },
                                {
                                    title: 'Ngày thu tiền',
                                    render: (_, r) => dateTimeText(r.payment.payment_date),
                                },
                                {
                                    title: 'Trạng thái',
                                    render: () => <Tag color="success">Đã ghi sổ</Tag>,
                                },
                                {
                                    title: 'Thao tác',
                                    fixed: 'right',
                                    width: 140,
                                    render: (_, r) => (
                                        <Tooltip title="Xem & In biên lai thu tiền">
                                            <Button
                                                type="primary"
                                                ghost
                                                size="small"
                                                icon={<PrinterOutlined />}
                                                onClick={() => handleOpenPrintReceipt(r)}
                                            >
                                                In biên lai
                                            </Button>
                                        </Tooltip>
                                    ),
                                },
                            ]}
                        />
                    )}
                </Card>
            </AccountantState>

            {/* Modal Lập phiếu thu tiền tại quầy */}
            <Modal
                title="Lập phiếu thu tiền học phí tại quầy / Chuyển khoản"
                open={createModalOpen}
                confirmLoading={saving}
                okText="Ghi nhận & In biên lai"
                cancelText="Hủy bỏ"
                onOk={() => form.submit()}
                onCancel={() => setCreateModalOpen(false)}
                width={620}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleCreateReceipt}
                    style={{ marginTop: 12 }}
                >
                    <Form.Item
                        name="invoice_id"
                        label="Chọn hóa đơn học phí cần thanh toán *"
                        rules={[{ required: true, message: 'Vui lòng chọn hóa đơn cần thu tiền' }]}
                    >
                        <Select
                            showSearch
                            placeholder="Chọn hóa đơn còn nợ của học viên..."
                            optionFilterProp="label"
                            onChange={handleSelectInvoice}
                            options={unpaidInvoiceOptions}
                        />
                    </Form.Item>

                    {selectedInvoice && (
                        <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, marginBottom: 16 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                                <div>Học viên: <b>{selectedInvoice.student.name}</b></div>
                                <div>Lớp học: <b>{selectedInvoice.classroomName}</b></div>
                                <div>Tổng học phí: <b>{money(selectedInvoice.invoice.final_amount ?? selectedInvoice.invoice.amount)}</b></div>
                                <div>Số tiền còn thiếu: <b className={styles['text-danger']}>{money(selectedInvoice.remaining)}</b></div>
                            </div>
                        </div>
                    )}

                    <Row gutter={12}>
                        <Col span={12}>
                            <Form.Item
                                name="amount"
                                label="Số tiền thực thu (VNĐ) *"
                                rules={[{ required: true, message: 'Vui lòng nhập số tiền' }]}
                            >
                                <InputNumber
                                    min={1000}
                                    style={{ width: '100%' }}
                                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={value => value?.replace(/\$\s?|(,*)/g, '') as any}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="payment_method"
                                label="Phương thức thanh toán *"
                                rules={[{ required: true }]}
                            >
                                <Select
                                    options={[
                                        { label: 'Chuyển khoản ngân hàng (Bank Transfer)', value: 'BANK_TRANSFER' },
                                        { label: 'Tiền mặt tại quầy (Cash)', value: 'CASH' },
                                        { label: 'Cổng thanh toán VNPay', value: 'VNPAY' },
                                    ]}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={12}>
                        <Col span={12}>
                            <Form.Item
                                name="payer_name"
                                label="Người nộp tiền (Học viên hoặc phụ huynh)"
                            >
                                <Input placeholder="Họ tên người nộp tiền..." />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="payment_date"
                                label="Ngày thu tiền"
                            >
                                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name="note"
                        label="Lý do thu / Ghi chú giao dịch"
                    >
                        <Input.TextArea rows={2} placeholder="Ví dụ: Thu học phí kỳ 1 năm học 2026..." />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Modal Xem & In Biên lai thu tiền học phí chuẩn kế toán */}
            <Modal
                title="Biên lai thu tiền học phí"
                open={receiptModalOpen}
                footer={[
                    <Button key="close" onClick={() => setReceiptModalOpen(false)}>
                        Đóng
                    </Button>,
                    <Button
                        key="print"
                        type="primary"
                        icon={<PrinterOutlined />}
                        onClick={() => window.print()}
                    >
                        In biên lai thu tiền
                    </Button>,
                ]}
                onCancel={() => setReceiptModalOpen(false)}
                width={740}
            >
                {selectedReceipt && (
                    <div className={styles['accountant-financial-doc']}>
                        {/* Header biên lai */}
                        <div className={styles['financial-doc-header']}>
                            <div className={styles['financial-doc-logo']}>
                                <div>
                                    <div className={styles['financial-doc-brand']}>HỆ THỐNG GIÁO DỤC FPT</div>
                                    <div className={styles['financial-doc-sub']}>TRUNG TÂM ĐÀO TẠO CÔNG NGHỆ CHẤT LƯỢNG CAO</div>
                                    <div className={styles['financial-doc-sub']}>Phòng Kế toán - Tài vụ</div>
                                </div>
                            </div>
                            <div className={styles['financial-doc-meta']}>
                                <div><b>Số biên lai:</b> REC-{selectedReceipt.payment._id?.slice(-8).toUpperCase() || 'NEW'}</div>
                                <div><b>Mã HĐ:</b> INV-{typeof selectedReceipt.payment.invoice_id === 'string' ? selectedReceipt.payment.invoice_id.slice(-8).toUpperCase() : selectedReceipt.payment.invoice_id?._id?.slice(-8).toUpperCase()}</div>
                                <div><b>Ngày lập:</b> {dateText(selectedReceipt.payment.payment_date || new Date())}</div>
                            </div>
                        </div>

                        {/* Tiêu đề */}
                        <div className={styles['financial-doc-title']}>
                            <h2>BIÊN LAI THU TIỀN HỌC PHÍ</h2>
                            <p>(Liên 2: Giao cho học viên lưu trữ chứng từ)</p>
                        </div>

                        {/* Nội dung biên lai */}
                        <div className={styles['financial-doc-body']}>
                            <div className={styles['financial-doc-row']}>
                                <span><b>Họ và tên người nộp tiền:</b></span>
                                <span>{selectedReceipt.studentName}</span>
                            </div>
                            <div className={styles['financial-doc-row']}>
                                <span><b>Học viên:</b></span>
                                <span>{selectedReceipt.studentName} ({selectedReceipt.studentEmail})</span>
                            </div>
                            <div className={styles['financial-doc-row']}>
                                <span><b>Lớp học tiếp nhận:</b></span>
                                <span>{selectedReceipt.className}</span>
                            </div>
                            <div className={styles['financial-doc-row']}>
                                <span><b>Lý do nộp:</b></span>
                                <span>Nộp học phí chương trình {selectedReceipt.courseName}</span>
                            </div>
                            <div className={styles['financial-doc-row']}>
                                <span><b>Hình thức thu tiền:</b></span>
                                <span>{paymentMethodText(selectedReceipt.payment.payment_method)}</span>
                            </div>

                            <div style={{ marginTop: 20, padding: '16px', background: '#f8fafc', borderRadius: 6 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15 }}>
                                    <span><b>Số tiền đã thu:</b></span>
                                    <b style={{ color: '#0b3d91', fontSize: 18 }}>{money(selectedReceipt.amount)}</b>
                                </div>
                                <div style={{ marginTop: 6, fontSize: 13, color: '#486581' }}>
                                    Viết bằng chữ: <em>{numberToWordsVietnamese(selectedReceipt.amount)}</em>
                                </div>
                            </div>
                        </div>

                        {/* Chữ ký 3 bên */}
                        <div className={styles['financial-doc-signatures']}>
                            <div>
                                <div className={styles['signature-role']}>NGƯỜI NỘP TIỀN</div>
                                <div className={styles['signature-note']}>(Ký, ghi rõ họ tên)</div>
                                <div className={styles['signature-space']} />
                                <div>{selectedReceipt.studentName}</div>
                            </div>
                            <div>
                                <div className={styles['signature-role']}>NGƯỜI THU TIỀN</div>
                                <div className={styles['signature-note']}>(Ký, ghi rõ họ tên)</div>
                                <div className={styles['signature-space']} />
                                <div>{currentUser.name || 'Thủ quỹ Kế toán'}</div>
                            </div>
                            <div>
                                <div className={styles['signature-role']}>KẾ TOÁN TRƯỞNG</div>
                                <div className={styles['signature-note']}>(Ký, đóng dấu nếu có)</div>
                                <div className={styles['signature-space']} />
                                <div>FPT Education System</div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </main>
    );
};

export default AccountantPayments;
