import { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Button,
    Card,
    Col,
    Empty,
    Form,
    Input,
    InputNumber,
    Modal,
    Row,
    Select,
    Space,
    Spin,
    Statistic,
    Table,
    Tag,
    message,
} from 'antd';
import {
    BarChartOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    DollarOutlined,
    DownloadOutlined,
    FileAddOutlined,
    FileTextOutlined,
    PlusOutlined,
    PrinterOutlined,
    ReloadOutlined,
    SearchOutlined,
    TeamOutlined,
    WalletOutlined,
} from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import {
    callCreateInvoice,
    callCreatePayment,
    callFetchEnrollment,
    callFetchInvoice,
    callFetchPayment,
    callUpdateInvoice,
} from '@/config/api';
import type { IEnrollment, IInvoice, IPayment, IUserSummary } from '@/types/backend';
import portalStyles from '@/styles/client.module.scss';

const styles = {
    loading: portalStyles['accountant-loading'],
    panel: portalStyles['accountant-panel'],
    workspace: portalStyles['accountant-workspace'],
    toolbar: portalStyles['accountant-toolbar'],
    searchInput: portalStyles['accountant-search-input'],
    content: portalStyles['accountant-content'],
    searchHint: portalStyles['accountant-search-hint'],
    confirmBox: portalStyles['accountant-confirm-box'],
    statCard: portalStyles['accountant-stat-card'],
    teal: portalStyles['accountant-teal'],
    orange: portalStyles['accountant-orange'],
    blue: portalStyles['accountant-blue'],
    purple: portalStyles['accountant-purple'],
    dashboardGrid: portalStyles['accountant-dashboard-grid'],
    chart: portalStyles['accountant-chart'],
    barColumn: portalStyles['accountant-bar-column'],
    barValue: portalStyles['accountant-bar-value'],
    bar: portalStyles['accountant-bar'],
    debtorRow: portalStyles['accountant-debtor-row'],
    reportChart: portalStyles['accountant-report-chart'],
    reportColumn: portalStyles['accountant-report-column'],
    reportBar: portalStyles['accountant-report-bar'],
};

type ViewKey = 'home' | 'fees' | 'create-invoice' | 'confirm-payment' | 'payment-history' | 'invoices' | 'export' | 'revenue' | 'debtors';
type EnrollmentRecord = Omit<IEnrollment, 'student_id' | 'class_id'> & {
    student_id?: string | IUserSummary;
    class_id?: string | { _id?: string; class_name?: string; course_id?: { name?: string } | string };
    isSample?: boolean;
};
type InvoiceRecord = Omit<IInvoice, 'enrollment_id'> & { enrollment_id?: string | EnrollmentRecord; createdAt?: string; updatedAt?: string; isSample?: boolean };
type PaymentRecord = Omit<IPayment, 'invoice_id'> & { invoice_id?: string | InvoiceRecord; createdAt?: string; isSample?: boolean };

const sampleEnrollments: EnrollmentRecord[] = [
    { _id: 'sample-enrollment-01', student_id: { _id: 'sample-student-01', name: 'Nguyễn Yến Nhi', email: 'yen.nhi@example.com' }, class_id: { _id: 'sample-class-01', class_name: 'IELTS Intermediate', course_id: { name: 'IELTS Intermediate' } }, status: 'STUDYING', isSample: true },
    { _id: 'sample-enrollment-02', student_id: { _id: 'sample-student-02', name: 'Lê Công Đức', email: 'cong.duc@example.com' }, class_id: { _id: 'sample-class-02', class_name: 'TOPIK II', course_id: { name: 'TOPIK II' } }, status: 'STUDYING', isSample: true },
];
const sampleInvoices: InvoiceRecord[] = [
    { _id: 'INV-DEMO-001', enrollment_id: sampleEnrollments[0], amount: 2200000, discount_amount: 0, final_amount: 2200000, status: 'UNPAID', isSample: true },
    { _id: 'INV-DEMO-002', enrollment_id: sampleEnrollments[1], amount: 4500000, discount_amount: 300000, final_amount: 4200000, status: 'PAID', isSample: true },
];
const samplePayments: PaymentRecord[] = [
    { _id: 'TXN-DEMO-001', invoice_id: sampleInvoices[1], payment_method: 'BANK_TRANSFER', payment_date: new Date().toISOString(), isSample: true },
    { _id: 'TXN-DEMO-002', invoice_id: sampleInvoices[1], payment_method: 'CASH', payment_date: new Date(Date.now() - 86400000 * 3).toISOString(), isSample: true },
];

const navigation: { key: ViewKey; label: string; icon: React.ReactNode; section?: string }[] = [
    { key: 'home', label: 'Trang chủ', icon: <BarChartOutlined /> },
    { key: 'fees', label: 'Học phí học viên', icon: <TeamOutlined />, section: 'HỌC PHÍ' },
    { key: 'create-invoice', label: 'Tạo hóa đơn', icon: <FileAddOutlined /> },
    { key: 'confirm-payment', label: 'Xác nhận thanh toán', icon: <CheckCircleOutlined />, section: 'THANH TOÁN' },
    { key: 'payment-history', label: 'Lịch sử thanh toán', icon: <ClockCircleOutlined /> },
    { key: 'invoices', label: 'Xem hóa đơn', icon: <FileTextOutlined />, section: 'HÓA ĐƠN' },
    { key: 'export', label: 'Xuất hóa đơn', icon: <DownloadOutlined /> },
    { key: 'revenue', label: 'Doanh thu theo tháng', icon: <BarChartOutlined />, section: 'THỐNG KÊ' },
    { key: 'debtors', label: 'Học viên chưa đóng phí', icon: <WalletOutlined /> },
];

const viewTitles: Record<ViewKey, { title: string; description: string }> = {
    home: { title: 'Trang chủ kế toán', description: 'Thanh toán, hóa đơn và thống kê doanh thu' },
    fees: { title: 'Học phí học viên', description: 'Theo dõi các khoản học phí cần thu' },
    'create-invoice': { title: 'Tạo hóa đơn', description: 'Lập hóa đơn học phí mới cho học viên' },
    'confirm-payment': { title: 'Xác nhận thanh toán', description: 'Duyệt các hóa đơn học viên đã thanh toán' },
    'payment-history': { title: 'Lịch sử thanh toán', description: 'Tra cứu các giao dịch đã xác nhận' },
    invoices: { title: 'Xem hóa đơn', description: 'Danh sách toàn bộ hóa đơn trong hệ thống' },
    export: { title: 'Xuất hóa đơn', description: 'Xem trước và xuất hóa đơn cho học viên' },
    revenue: { title: 'Doanh thu theo tháng', description: 'Theo dõi doanh thu học phí theo từng tháng' },
    debtors: { title: 'Học viên chưa đóng phí', description: 'Danh sách học viên đang có khoản phí cần nhắc' },
};

const toArray = <T,>(response: unknown): T[] => {
    const data = (response as { data?: unknown })?.data;
    if (Array.isArray(data)) return data as T[];
    if (data && typeof data === 'object' && Array.isArray((data as { result?: T[] }).result)) return (data as { result: T[] }).result;
    return [];
};

const idOf = (value?: string | { _id?: string }) => typeof value === 'string' ? value : value?._id || '';
const studentName = (enrollment?: string | EnrollmentRecord) => {
    if (!enrollment || typeof enrollment === 'string') return 'Chưa cập nhật';
    return typeof enrollment.student_id === 'string' ? enrollment.student_id : enrollment.student_id?.name || 'Chưa cập nhật';
};
const courseName = (enrollment?: string | EnrollmentRecord) => {
    if (!enrollment || typeof enrollment === 'string' || !enrollment.class_id || typeof enrollment.class_id === 'string') return 'Chưa cập nhật';
    return typeof enrollment.class_id.course_id === 'string' ? enrollment.class_id.course_id : enrollment.class_id.course_id?.name || 'Chưa cập nhật';
};
const className = (enrollment?: string | EnrollmentRecord) => {
    if (!enrollment || typeof enrollment === 'string' || !enrollment.class_id || typeof enrollment.class_id === 'string') return 'Chưa cập nhật';
    return enrollment.class_id.class_name || 'Chưa cập nhật';
};
const money = (value?: number) => `${Number(value || 0).toLocaleString('vi-VN')} đ`;
const dateText = (value?: string) => value ? new Date(value).toLocaleDateString('vi-VN') : 'Chưa cập nhật';
const statusLabel = (value?: string) => value?.toUpperCase() === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán';

const printInvoice = (invoice: InvoiceRecord) => {
    const enrollment = typeof invoice.enrollment_id === 'object' ? invoice.enrollment_id : undefined;
    const printWindow = window.open('', '_blank', 'width=760,height=720');
    if (!printWindow) return;
    printWindow.document.write(`<html><head><title>Hóa đơn ${invoice._id || ''}</title><style>body{font-family:Arial,sans-serif;padding:40px;color:#17233b}h1{color:#1f6f78}table{width:100%;border-collapse:collapse;margin-top:24px}td{padding:12px;border-bottom:1px solid #ddd}.total{font-size:20px;font-weight:700;color:#e85d04}</style></head><body><h1>HÓA ĐƠN HỌC PHÍ</h1><p>Mã hóa đơn: ${invoice._id || 'Chưa cập nhật'}</p><table><tr><td>Học viên</td><td>${studentName(enrollment)}</td></tr><tr><td>Khóa học</td><td>${courseName(enrollment)}</td></tr><tr><td>Lớp học</td><td>${className(enrollment)}</td></tr><tr><td>Số tiền</td><td class="total">${money(invoice.final_amount ?? invoice.amount)}</td></tr><tr><td>Trạng thái</td><td>${statusLabel(invoice.status)}</td></tr></table><p>Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}</p><script>window.print()</script></body></html>`);
    printWindow.document.close();
};

const AccountantPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
    const [payments, setPayments] = useState<PaymentRecord[]>([]);
    const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([]);
    const [activeSearch, setActiveSearch] = useState('');
    const [invoiceModal, setInvoiceModal] = useState(false);
    const [paymentModal, setPaymentModal] = useState<InvoiceRecord | null>(null);
    const [editingInvoice, setEditingInvoice] = useState<InvoiceRecord | null>(null);
    const [invoiceForm] = Form.useForm();
    const [paymentForm] = Form.useForm();
    const activeView = (searchParams.get('view') as ViewKey) || 'home';
    const title = viewTitles[activeView] || viewTitles.home;

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            const [invoiceResponse, paymentResponse, enrollmentResponse] = await Promise.all([
                callFetchInvoice('current=1&pageSize=1000&populate=enrollment_id'),
                callFetchPayment('current=1&pageSize=1000&populate=invoice_id'),
                callFetchEnrollment('current=1&pageSize=1000&populate=student_id,class_id'),
            ]);
            const nextInvoices = toArray<InvoiceRecord>(invoiceResponse);
            const nextPayments = toArray<PaymentRecord>(paymentResponse);
            const nextEnrollments = toArray<EnrollmentRecord>(enrollmentResponse);
            const useSamples = !nextInvoices.length && !nextPayments.length && !nextEnrollments.length;
            setInvoices(useSamples ? sampleInvoices : nextInvoices);
            setPayments(useSamples ? samplePayments : nextPayments);
            setEnrollments(useSamples ? sampleEnrollments : nextEnrollments);
        } catch {
            setError('Không thể tải dữ liệu kế toán. Vui lòng kiểm tra quyền truy cập và thử lại.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const unpaidInvoices = useMemo(() => invoices.filter(invoice => invoice.status?.toUpperCase() !== 'PAID'), [invoices]);
    const paidInvoices = useMemo(() => invoices.filter(invoice => invoice.status?.toUpperCase() === 'PAID'), [invoices]);
    const paidRevenue = useMemo(() => paidInvoices.reduce((sum, invoice) => sum + Number(invoice.final_amount ?? invoice.amount ?? 0), 0), [paidInvoices]);
    const currentMonthPayments = useMemo(() => payments.filter(payment => payment.payment_date && new Date(payment.payment_date).getMonth() === new Date().getMonth() && new Date(payment.payment_date).getFullYear() === new Date().getFullYear()), [payments]);
    const filteredInvoices = useMemo(() => {
        const keyword = activeSearch.toLowerCase().trim();
        if (!keyword) return invoices;
        return invoices.filter(invoice => `${invoice._id} ${studentName(invoice.enrollment_id)} ${courseName(invoice.enrollment_id)} ${className(invoice.enrollment_id)}`.toLowerCase().includes(keyword));
    }, [activeSearch, invoices]);
    const monthlyRevenue = useMemo(() => Array.from({ length: 6 }, (_, index) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (5 - index), 1);
        const value = paidInvoices.filter(invoice => {
            const sourceDate = invoice.updatedAt || invoice.createdAt;
            if (!sourceDate) return false;
            const invoiceDate = new Date(sourceDate);
            return invoiceDate.getMonth() === date.getMonth() && invoiceDate.getFullYear() === date.getFullYear();
        }).reduce((sum, invoice) => sum + Number(invoice.final_amount ?? invoice.amount ?? 0), 0);
        return { label: `${date.getMonth() + 1}/${date.getFullYear()}`, value };
    }), [paidInvoices]);

    const openCreateInvoice = (invoice?: InvoiceRecord) => {
        if (invoice?.isSample) {
            message.info('Đây là dữ liệu mẫu, hãy tạo hóa đơn mới để ghi dữ liệu thật.');
            return;
        }
        setEditingInvoice(invoice || null);
        invoiceForm.setFieldsValue(invoice ? { enrollment_id: idOf(invoice.enrollment_id), amount: invoice.amount, discount_amount: invoice.discount_amount || 0, final_amount: invoice.final_amount ?? invoice.amount } : { discount_amount: 0 });
        setInvoiceModal(true);
    };
    const saveInvoice = async (values: { enrollment_id: string; amount: number; discount_amount?: number; final_amount?: number }) => {
        const payload = { ...values, final_amount: values.final_amount ?? values.amount - Number(values.discount_amount || 0), status: editingInvoice?.status || 'UNPAID' };
        const response = editingInvoice?._id ? await callUpdateInvoice(payload, editingInvoice._id) : await callCreateInvoice(payload);
        if (response.data) {
            message.success(editingInvoice ? 'Đã cập nhật hóa đơn' : 'Đã tạo hóa đơn');
            setInvoiceModal(false);
            await loadData();
        } else message.error(response.message || 'Không thể lưu hóa đơn');
    };
    const confirmPayment = async (values: { payment_method: string }) => {
        if (!paymentModal?._id) return;
        if (paymentModal.isSample) {
            message.info('Đây là giao dịch minh họa, chưa thể cập nhật vào cơ sở dữ liệu.');
            setPaymentModal(null);
            return;
        }
        const response = await callCreatePayment({ invoice_id: paymentModal._id, payment_method: values.payment_method, payment_date: new Date().toISOString() });
        if (!response.data) {
            message.error(response.message || 'Không thể ghi nhận thanh toán');
            return;
        }
        await callUpdateInvoice({ status: 'PAID' }, paymentModal._id);
        message.success('Đã xác nhận thanh toán và ghi nhận thời gian');
        setPaymentModal(null);
        paymentForm.resetFields();
        await loadData();
    };
    const goTo = (view: ViewKey) => setSearchParams({ view });

    const invoiceColumns = [
        { title: 'Mã hóa đơn', dataIndex: '_id', ellipsis: true },
        { title: 'Học viên', render: (_: unknown, row: InvoiceRecord) => studentName(row.enrollment_id) },
        { title: 'Khóa học', render: (_: unknown, row: InvoiceRecord) => courseName(row.enrollment_id) },
        { title: 'Số tiền', render: (_: unknown, row: InvoiceRecord) => <b>{money(row.final_amount ?? row.amount)}</b> },
        { title: 'Trạng thái', render: (_: unknown, row: InvoiceRecord) => <Tag color={row.status?.toUpperCase() === 'PAID' ? 'green' : 'orange'}>{statusLabel(row.status)}</Tag> },
    ];

    const renderView = () => {
        if (loading) return <div className={styles.loading}><Spin size="large" /></div>;
        if (error) return <Alert type="error" showIcon message={error} action={<Button icon={<ReloadOutlined />} onClick={loadData}>Thử lại</Button>} />;
        if (activeView === 'home') return <Overview invoices={invoices} unpaidInvoices={unpaidInvoices} paidRevenue={paidRevenue} currentMonthPayments={currentMonthPayments} monthlyRevenue={monthlyRevenue} onCreate={() => openCreateInvoice()} onConfirm={setPaymentModal} onNavigate={goTo} />;
        if (activeView === 'fees') return <FeesView enrollments={enrollments} invoices={invoices} onCreate={() => openCreateInvoice()} />;
        if (activeView === 'create-invoice') return <InvoiceCreateView invoices={invoices} onCreate={() => openCreateInvoice()} onEdit={openCreateInvoice} />;
        if (activeView === 'confirm-payment') return <PaymentConfirmView invoices={unpaidInvoices} onConfirm={setPaymentModal} />;
        if (activeView === 'payment-history') return <PaymentHistoryView payments={payments} />;
        if (activeView === 'invoices') return <Card className={styles.panel}><Table rowKey="_id" columns={[...invoiceColumns, { title: 'Thao tác', render: (_: unknown, row: InvoiceRecord) => <Space><Button type="link" onClick={() => printInvoice(row)}>Xem</Button>{row.status?.toUpperCase() !== 'PAID' && <Button type="link" onClick={() => openCreateInvoice(row)}>Sửa</Button>}</Space> }]} dataSource={filteredInvoices} pagination={{ pageSize: 8 }} scroll={{ x: 820 }} /></Card>;
        if (activeView === 'export') return <ExportView invoices={filteredInvoices} onExport={printInvoice} />;
        if (activeView === 'revenue') return <RevenueView monthlyRevenue={monthlyRevenue} paidRevenue={paidRevenue} />;
        return <DebtorsView invoices={unpaidInvoices} onCreate={() => openCreateInvoice()} />;
    };

    return <main className={`${portalStyles.container} ${portalStyles['portal-section']} ${styles.workspace}`}>
        <section className={portalStyles['portal-hero']}><span>KẾ TOÁN</span><h1>{title.title}</h1><p>{title.description}</p></section>
        <div className={styles.toolbar}><Input className={styles.searchInput} prefix={<SearchOutlined />} placeholder="Tìm kiếm..." allowClear onChange={event => setActiveSearch(event.target.value)} /></div>
        <div className={styles.content}>{activeSearch && <div className={styles.searchHint}>Đang lọc theo: <b>{activeSearch}</b></div>}{renderView()}</div>
        <Modal title={editingInvoice ? 'Chỉnh sửa hóa đơn' : 'Tạo hóa đơn'} open={invoiceModal} onCancel={() => setInvoiceModal(false)} footer={null} destroyOnClose>
            <Form form={invoiceForm} layout="vertical" onFinish={saveInvoice} onValuesChange={(changed, values) => { if ('amount' in changed || 'discount_amount' in changed) invoiceForm.setFieldValue('final_amount', Number(values.amount || 0) - Number(values.discount_amount || 0)); }}>
                <Form.Item name="enrollment_id" label="Học viên / khóa học" rules={[{ required: true, message: 'Chọn học viên' }]}><Select showSearch optionFilterProp="label" options={enrollments.map(enrollment => ({ value: enrollment._id, label: `${studentName(enrollment)} · ${courseName(enrollment)}` }))} /></Form.Item>
                <Row gutter={12}><Col span={12}><Form.Item name="amount" label="Số tiền" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col><Col span={12}><Form.Item name="discount_amount" label="Giảm giá"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col></Row>
                <Form.Item name="final_amount" label="Thành tiền" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
                <Button type="primary" htmlType="submit" block icon={<FileAddOutlined />}>{editingInvoice ? 'Lưu thay đổi' : 'Tạo hóa đơn'}</Button>
            </Form>
        </Modal>
        <Modal title="Xác nhận thanh toán" open={Boolean(paymentModal)} onCancel={() => setPaymentModal(null)} footer={null} destroyOnClose>
            {paymentModal && <><DescriptionsInvoice invoice={paymentModal} /><Form form={paymentForm} layout="vertical" onFinish={confirmPayment}><Form.Item name="payment_method" label="Phương thức thanh toán" initialValue="BANK_TRANSFER" rules={[{ required: true }]}><Select options={[{ value: 'BANK_TRANSFER', label: 'Chuyển khoản' }, { value: 'CASH', label: 'Tiền mặt' }, { value: 'VNPAY', label: 'Ví điện tử' }]} /></Form.Item><Button type="primary" htmlType="submit" block icon={<CheckCircleOutlined />}>Xác nhận và ghi nhận thời gian</Button></Form></>}
        </Modal>
    </main>;
};

const DescriptionsInvoice = ({ invoice }: { invoice: InvoiceRecord }) => <div className={styles.confirmBox}><span>Học viên</span><b>{studentName(invoice.enrollment_id)}</b><span>Khóa học</span><b>{courseName(invoice.enrollment_id)}</b><span>Số tiền</span><strong>{money(invoice.final_amount ?? invoice.amount)}</strong></div>;

const Overview = ({ invoices, unpaidInvoices, paidRevenue, currentMonthPayments, monthlyRevenue, onCreate, onConfirm, onNavigate }: { invoices: InvoiceRecord[]; unpaidInvoices: InvoiceRecord[]; paidRevenue: number; currentMonthPayments: PaymentRecord[]; monthlyRevenue: { label: string; value: number }[]; onCreate: () => void; onConfirm: (invoice: InvoiceRecord) => void; onNavigate: (view: ViewKey) => void }) => <>
    <Row gutter={[14, 14]}>{[{ label: 'Doanh thu đã thu', value: money(paidRevenue), icon: <DollarOutlined />, color: 'teal' }, { label: 'Hóa đơn chưa thanh toán', value: unpaidInvoices.length, icon: <FileTextOutlined />, color: 'orange' }, { label: 'Giao dịch tháng này', value: currentMonthPayments.length, icon: <CheckCircleOutlined />, color: 'blue' }, { label: 'Học viên còn nợ phí', value: new Set(unpaidInvoices.map(item => studentName(item.enrollment_id))).size, icon: <TeamOutlined />, color: 'purple' }].map(item => <Col xs={24} sm={12} xl={6} key={item.label}><Card className={`${styles.statCard} ${styles[item.color as 'teal' | 'orange' | 'blue' | 'purple']}`}><Statistic title={item.label} value={item.value} prefix={item.icon} /></Card></Col>)}</Row>
    <Row gutter={[14, 14]} className={styles.dashboardGrid}><Col xs={24} xl={15}><Card className={styles.panel} title="Doanh thu theo tháng" extra={<Button type="link" onClick={() => onNavigate('revenue')}>Xem báo cáo</Button>}><div className={styles.chart}>{monthlyRevenue.map(item => <div className={styles.barColumn} key={item.label}><div className={styles.barValue}>{item.value ? `${Math.round(item.value / 1000000)}tr` : '-'}</div><div className={styles.bar} style={{ height: `${Math.max(8, Math.min(100, item.value / Math.max(...monthlyRevenue.map(entry => entry.value), 1) * 100))}%` }} /><span>{item.label}</span></div>)}</div></Card></Col><Col xs={24} xl={9}><Card className={styles.panel} title="Học viên chưa đóng phí" extra={<Button type="link" onClick={() => onNavigate('debtors')}>Xem tất cả</Button>}>{unpaidInvoices.slice(0, 4).map(invoice => <div className={styles.debtorRow} key={invoice._id}><div><b>{studentName(invoice.enrollment_id)}</b><small>{courseName(invoice.enrollment_id)}</small></div><Tag color="orange">{money(invoice.final_amount ?? invoice.amount)}</Tag></div>)}{!unpaidInvoices.length && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có công nợ" />}</Card></Col></Row>
    <Card className={styles.panel} title="Hóa đơn cần xử lý" extra={<Space><Button icon={<PlusOutlined />} onClick={onCreate}>Tạo hóa đơn</Button><Button type="primary" onClick={() => unpaidInvoices[0] && onConfirm(unpaidInvoices[0])}>Xác nhận thanh toán</Button></Space>}><Table rowKey="_id" pagination={false} columns={[{ title: 'Mã hóa đơn', dataIndex: '_id' }, { title: 'Học viên', render: (_: unknown, row: InvoiceRecord) => studentName(row.enrollment_id) }, { title: 'Số tiền', render: (_: unknown, row: InvoiceRecord) => money(row.final_amount ?? row.amount) }, { title: 'Trạng thái', render: (_: unknown, row: InvoiceRecord) => <Tag color={row.status?.toUpperCase() === 'PAID' ? 'green' : 'orange'}>{statusLabel(row.status)}</Tag> }]} dataSource={invoices.slice(0, 5)} /></Card>
</>;

const FeesView = ({ enrollments, invoices, onCreate }: { enrollments: EnrollmentRecord[]; invoices: InvoiceRecord[]; onCreate: () => void }) => <Card className={styles.panel} title="Danh sách học phí" extra={<Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>Tạo hóa đơn</Button>}><Table rowKey="_id" dataSource={enrollments} pagination={{ pageSize: 8 }} columns={[{ title: 'Học viên', render: (_: unknown, row: EnrollmentRecord) => studentName(row) }, { title: 'Khóa học', render: (_: unknown, row: EnrollmentRecord) => courseName(row) }, { title: 'Lớp học', render: (_: unknown, row: EnrollmentRecord) => className(row) }, { title: 'Học phí', render: (_: unknown, row: EnrollmentRecord) => { const invoice = invoices.find(item => idOf(item.enrollment_id) === row._id); return invoice ? money(invoice.final_amount ?? invoice.amount) : 'Chưa lập hóa đơn'; } }, { title: 'Trạng thái', render: (_: unknown, row: EnrollmentRecord) => { const invoice = invoices.find(item => idOf(item.enrollment_id) === row._id); return <Tag color={invoice?.status?.toUpperCase() === 'PAID' ? 'green' : 'orange'}>{invoice ? statusLabel(invoice.status) : 'Chưa lập hóa đơn'}</Tag>; } }]} /></Card>;
const InvoiceCreateView = ({ invoices, onCreate, onEdit }: { invoices: InvoiceRecord[]; onCreate: () => void; onEdit: (invoice: InvoiceRecord) => void }) => <Card className={styles.panel} title="Quản lý hóa đơn" extra={<Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>Tạo hóa đơn</Button>}><Table rowKey="_id" dataSource={invoices} pagination={{ pageSize: 8 }} columns={[{ title: 'Mã hóa đơn', dataIndex: '_id' }, { title: 'Học viên', render: (_: unknown, row: InvoiceRecord) => studentName(row.enrollment_id) }, { title: 'Số tiền', render: (_: unknown, row: InvoiceRecord) => money(row.final_amount ?? row.amount) }, { title: 'Thao tác', render: (_: unknown, row: InvoiceRecord) => row.status?.toUpperCase() === 'PAID' ? <Tag color="green">Đã khóa</Tag> : <Button type="link" onClick={() => onEdit(row)}>Chỉnh sửa</Button> }]} /></Card>;
const PaymentConfirmView = ({ invoices, onConfirm }: { invoices: InvoiceRecord[]; onConfirm: (invoice: InvoiceRecord) => void }) => <Card className={styles.panel} title="Hóa đơn chờ xác nhận"><Table rowKey="_id" dataSource={invoices} pagination={{ pageSize: 8 }} columns={[{ title: 'Mã hóa đơn', dataIndex: '_id' }, { title: 'Học viên', render: (_: unknown, row: InvoiceRecord) => studentName(row.enrollment_id) }, { title: 'Số tiền', render: (_: unknown, row: InvoiceRecord) => money(row.final_amount ?? row.amount) }, { title: 'Trạng thái', render: () => <Tag color="orange">Chờ xác nhận</Tag> }, { title: 'Thao tác', render: (_: unknown, row: InvoiceRecord) => <Button type="primary" onClick={() => onConfirm(row)}>Xác nhận</Button> }]} /></Card>;
const PaymentHistoryView = ({ payments }: { payments: PaymentRecord[] }) => <Card className={styles.panel} title="Giao dịch gần đây"><Table rowKey="_id" dataSource={payments} pagination={{ pageSize: 8 }} columns={[{ title: 'Mã giao dịch', dataIndex: '_id' }, { title: 'Học viên', render: (_: unknown, row: PaymentRecord) => typeof row.invoice_id === 'object' ? studentName(row.invoice_id.enrollment_id) : 'Chưa cập nhật' }, { title: 'Số tiền', render: (_: unknown, row: PaymentRecord) => typeof row.invoice_id === 'object' ? money(row.invoice_id.final_amount ?? row.invoice_id.amount) : '-' }, { title: 'Phương thức', dataIndex: 'payment_method' }, { title: 'Thời gian', render: (_: unknown, row: PaymentRecord) => dateText(row.payment_date) }, { title: 'Trạng thái', render: () => <Tag color="green">Thành công</Tag> }]} /></Card>;
const ExportView = ({ invoices, onExport }: { invoices: InvoiceRecord[]; onExport: (invoice: InvoiceRecord) => void }) => <Card className={styles.panel} title="Chọn hóa đơn xuất"><Table rowKey="_id" dataSource={invoices} pagination={{ pageSize: 8 }} columns={[{ title: 'Mã hóa đơn', dataIndex: '_id' }, { title: 'Học viên', render: (_: unknown, row: InvoiceRecord) => studentName(row.enrollment_id) }, { title: 'Số tiền', render: (_: unknown, row: InvoiceRecord) => money(row.final_amount ?? row.amount) }, { title: 'Thao tác', render: (_: unknown, row: InvoiceRecord) => <Button icon={<PrinterOutlined />} onClick={() => onExport(row)}>Xem / Xuất PDF</Button> }]} /></Card>;
const RevenueView = ({ monthlyRevenue, paidRevenue }: { monthlyRevenue: { label: string; value: number }[]; paidRevenue: number }) => <><Card className={styles.panel} title="Biểu đồ doanh thu"><div className={styles.reportChart}>{monthlyRevenue.map(item => <div className={styles.reportColumn} key={item.label}><div className={styles.reportBar} style={{ height: `${Math.max(10, Math.min(100, item.value / Math.max(...monthlyRevenue.map(entry => entry.value), 1) * 100))}%` }} /><b>{money(item.value)}</b><span>{item.label}</span></div>)}</div></Card><Card className={styles.panel}><Statistic title="Tổng doanh thu đã ghi nhận" value={money(paidRevenue)} /></Card></>;
const DebtorsView = ({ invoices, onCreate }: { invoices: InvoiceRecord[]; onCreate: () => void }) => <Card className={styles.panel} title="Danh sách học viên chưa đóng phí"><Table rowKey="_id" dataSource={invoices} pagination={{ pageSize: 8 }} columns={[{ title: 'Học viên', render: (_: unknown, row: InvoiceRecord) => studentName(row.enrollment_id) }, { title: 'Khóa học', render: (_: unknown, row: InvoiceRecord) => courseName(row.enrollment_id) }, { title: 'Số tiền nợ', render: (_: unknown, row: InvoiceRecord) => <b>{money(row.final_amount ?? row.amount)}</b> }, { title: 'Thao tác', render: () => <Button onClick={onCreate}>Tạo hóa đơn</Button> }]} /></Card>;

export default AccountantPage;
