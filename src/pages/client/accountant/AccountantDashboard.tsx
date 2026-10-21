import { useMemo } from 'react';
import { Button, Card, Col, Progress, Row, Space, Table, Tag, Tooltip } from 'antd';
import {
    ArrowRightOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    CreditCardOutlined,
    DollarCircleOutlined,
    ExclamationCircleOutlined,
    FileAddOutlined,
    FileTextOutlined,
    RiseOutlined,
    WalletOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useAppSelector } from '@/redux/hooks';
import {
    AccountantEmpty,
    AccountantState,
    StatCard,
    dateText,
    dateTimeText,
    money,
    paymentMethodText,
    statusTag,
    useAccountantData,
    useInvoiceRows,
    type AccountantInvoice,
    type AccountantPayment,
} from './accountant.shared';
import styles from '@/styles/client.module.scss';

const AccountantDashboard = () => {
    const navigate = useNavigate();
    const user = useAppSelector(state => state.account.user);
    const data = useAccountantData();
    const rows = useInvoiceRows(data);

    // Tính toán các chỉ số tài chính cốt lõi
    const {
        paidInvoices,
        unpaidInvoices,
        totalRevenue,
        totalReceivable,
        collectionRate,
        recentPayments,
        topDebtors,
    } = useMemo(() => {
        const paid = rows.filter(r => r.invoice.status?.toUpperCase() === 'PAID');
        const unpaid = rows.filter(r => r.invoice.status?.toUpperCase() !== 'PAID' && r.invoice.status?.toUpperCase() !== 'CANCELLED');

        const revenue = paid.reduce((sum, r) => sum + (Number(r.invoice.final_amount ?? r.invoice.amount ?? 0)), 0);
        const receivable = unpaid.reduce((sum, r) => sum + r.remaining, 0);
        const totalBilled = revenue + receivable;
        const rate = totalBilled > 0 ? Math.round((revenue / totalBilled) * 100) : 100;

        const paymentsSorted = [...data.payments].sort((a, b) => {
            const timeA = new Date(a.payment_date || (a as any).createdAt || 0).getTime();
            const timeB = new Date(b.payment_date || (b as any).createdAt || 0).getTime();
            return timeB - timeA;
        }).slice(0, 6);

        const debtors = [...unpaid].sort((a, b) => b.remaining - a.remaining).slice(0, 5);

        return {
            paidInvoices: paid,
            unpaidInvoices: unpaid,
            totalRevenue: revenue,
            totalReceivable: receivable,
            collectionRate: rate,
            recentPayments: paymentsSorted,
            topDebtors: debtors,
        };
    }, [data.payments, rows]);

    // Thống kê doanh thu 6 tháng gần nhất
    const monthlyStats = useMemo(() => {
        const months: { label: string; value: number }[] = [];
        for (let i = 5; i >= 0; i--) {
            const d = dayjs().subtract(i, 'month');
            const m = d.month();
            const y = d.year();
            const val = paidInvoices
                .filter(r => {
                    const created = r.invoice.createdAt ? dayjs(r.invoice.createdAt) : null;
                    return created && created.month() === m && created.year() === y;
                })
                .reduce((s, r) => s + (Number(r.invoice.final_amount ?? r.invoice.amount ?? 0)), 0);
            months.push({ label: `Thg ${m + 1}`, value: val });
        }
        const maxVal = Math.max(...months.map(m => m.value), 1);
        return { months, maxVal };
    }, [paidInvoices]);

    return (
        <main className={`${styles.container} ${styles['accountant-page']}`}>
            {/* Header chào mừng Kế toán */}
            <section className={styles['accountant-welcome']}>
                <div>
                    <span>TÀI CHÍNH & KẾ TOÁN · BẢNG ĐIỀU HÀNH</span>
                    <h1>Kính chào, {user.name || 'Kế toán viên'}!</h1>
                    <p>
                        Hôm nay là {dayjs().format('dddd, DD/MM/YYYY')}. Theo dõi doanh thu, công nợ học phí và dòng tiền thực tế của toàn hệ thống.
                    </p>
                </div>
                <Space className={styles['accountant-header-actions']}>
                    <Button
                        type="primary"
                        icon={<DollarCircleOutlined />}
                        onClick={() => navigate('/client/accountant/payments')}
                    >
                        Lập phiếu thu tại quầy
                    </Button>
                    <Button
                        icon={<FileAddOutlined />}
                        onClick={() => navigate('/client/accountant/invoices')}
                    >
                        Tạo hóa đơn học phí
                    </Button>
                </Space>
            </section>

            <AccountantState loading={data.loading} error={data.error}>
                {/* 4 Thẻ KPI Tài chính chính */}
                <Row gutter={[16, 16]} className={styles['accountant-stat-grid']}>
                    <Col xs={24} sm={12} lg={6}>
                        <StatCard
                            title="Doanh thu thực thu"
                            value={money(totalRevenue)}
                            subValue={`Từ ${paidInvoices.length} hóa đơn đã hoàn tất`}
                            icon={<DollarCircleOutlined />}
                            accent="teal"
                        />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <StatCard
                            title="Công nợ cần thu"
                            value={money(totalReceivable)}
                            subValue={`${unpaidInvoices.length} hóa đơn còn thiếu`}
                            icon={<WalletOutlined />}
                            accent="coral"
                        />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <StatCard
                            title="Tỷ lệ thu hồi học phí"
                            value={`${collectionRate}%`}
                            subValue="Chỉ tiêu hoàn thành ngân sách"
                            icon={<RiseOutlined />}
                            accent="green"
                        />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <StatCard
                            title="Tổng số hóa đơn"
                            value={data.invoices.length}
                            subValue={`${data.payments.length} phiếu thu đã lập`}
                            icon={<FileTextOutlined />}
                            accent="navy"
                        />
                    </Col>
                </Row>

                {/* Khu vực thao tác nhanh */}
                <Card className={styles['portal-card']} style={{ marginBottom: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                        <div>
                            <strong style={{ fontSize: 15, color: '#102a43' }}>Truy cập nhanh nghiệp vụ kế toán</strong>
                            <p style={{ margin: 0, fontSize: 12, color: '#627d98' }}>Điều hướng nhanh tới các phân hệ kế toán tài vụ</p>
                        </div>
                        <Space wrap>
                            <Button onClick={() => navigate('/client/accountant/tuition')} icon={<WalletOutlined />}>
                                Quản lý học phí & Công nợ
                            </Button>
                            <Button onClick={() => navigate('/client/accountant/invoices')} icon={<FileTextOutlined />}>
                                Quản lý hóa đơn
                            </Button>
                            <Button onClick={() => navigate('/client/accountant/payments')} icon={<CreditCardOutlined />}>
                                Sổ quỹ & Phiếu thu
                            </Button>
                            <Button onClick={() => navigate('/client/accountant/revenue')} icon={<RiseOutlined />}>
                                Báo cáo doanh thu
                            </Button>
                        </Space>
                    </div>
                </Card>

                {/* Grid 2 cột: Biểu đồ doanh thu & Cảnh báo công nợ */}
                <Row gutter={[18, 18]} className={styles['accountant-lower-grid']}>
                    {/* Cột trái: Biểu đồ doanh thu 6 tháng & Bảng thanh toán gần đây */}
                    <Col xs={24} lg={15}>
                        <Card className={styles['portal-card']} title="Doanh thu thu học phí 6 tháng gần nhất" style={{ marginBottom: 18 }}>
                            <div className={styles['revenue-chart']}>
                                {monthlyStats.months.map(item => (
                                    <div className={styles['revenue-bar-wrap']} key={item.label}>
                                        <div
                                            className={styles['revenue-bar']}
                                            style={{ height: `${Math.max(10, (item.value / monthlyStats.maxVal) * 100)}%` }}
                                            title={`${item.label}: ${money(item.value)}`}
                                        />
                                        <span>{item.label}</span>
                                        <small style={{ fontSize: 9, color: '#627d98' }}>{money(item.value)}</small>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        <Card
                            className={styles['portal-card']}
                            title="Giao dịch thanh toán mới nhất"
                            extra={
                                <Button type="link" onClick={() => navigate('/client/accountant/payments')}>
                                    Xem tất cả <ArrowRightOutlined />
                                </Button>
                            }
                        >
                            {!recentPayments.length ? (
                                <AccountantEmpty description="Chưa có giao dịch thu tiền nào" />
                            ) : (
                                <Table
                                    size="small"
                                    pagination={false}
                                    rowKey={r => r._id || `${r.invoice_id}-${r.payment_date}`}
                                    dataSource={recentPayments}
                                    scroll={{ x: 650 }}
                                    columns={[
                                        {
                                            title: 'Mã phiếu thu',
                                            render: (_: unknown, p: AccountantPayment) => (
                                                <b className={styles['invoice-code']}>
                                                    REC-{p._id?.slice(-8).toUpperCase() || 'NEW'}
                                                </b>
                                            ),
                                        },
                                        {
                                            title: 'Học viên',
                                            render: (_: unknown, p: AccountantPayment) => {
                                                const inv = typeof p.invoice_id === 'object'
                                                    ? p.invoice_id
                                                    : data.invoices.find(item => item._id === p.invoice_id);
                                                const invRow = rows.find(r => r.invoice._id === inv?._id);
                                                return invRow?.student.name || 'Học viên';
                                            },
                                        },
                                        {
                                            title: 'Số tiền',
                                            render: (_: unknown, p: AccountantPayment) => {
                                                const inv = typeof p.invoice_id === 'object'
                                                    ? p.invoice_id
                                                    : data.invoices.find(item => item._id === p.invoice_id);
                                                return <b style={{ color: '#0f62fe' }}>{money(inv?.final_amount || inv?.amount)}</b>;
                                            },
                                        },
                                        {
                                            title: 'Phương thức',
                                            dataIndex: 'payment_method',
                                            render: (val?: string) => <Tag color="blue">{paymentMethodText(val)}</Tag>,
                                        },
                                        {
                                            title: 'Thời gian',
                                            dataIndex: 'payment_date',
                                            render: val => dateTimeText(val),
                                        },
                                    ]}
                                />
                            )}
                        </Card>
                    </Col>

                    {/* Cột phải: Top học viên nợ học phí & Phân bổ phương thức */}
                    <Col xs={24} lg={9}>
                        <Card
                            className={styles['portal-card']}
                            title="Học viên nợ học phí cần thu"
                            style={{ marginBottom: 18 }}
                            extra={
                                <Button type="link" onClick={() => navigate('/client/accountant/tuition')}>
                                    Chi tiết <ArrowRightOutlined />
                                </Button>
                            }
                        >
                            {!topDebtors.length ? (
                                <div style={{ textAlign: 'center', padding: '24px 0', color: '#25805d' }}>
                                    <CheckCircleOutlined style={{ fontSize: 32, marginBottom: 8 }} />
                                    <p style={{ margin: 0 }}>Tất cả học viên đã hoàn tất đóng học phí!</p>
                                </div>
                            ) : (
                                <div className={styles['accountant-unpaid-list']}>
                                    {topDebtors.map(debtor => (
                                        <div className={styles['accountant-unpaid-item']} key={debtor.invoice._id}>
                                            <div style={{ flex: 1 }}>
                                                <strong>{debtor.student.name}</strong>
                                                <span>Lớp: {debtor.classroomName}</span>
                                                <small style={{ display: 'block', color: '#829ab1', fontSize: 11 }}>
                                                    {debtor.student.email}
                                                </small>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <b className={styles['text-danger']}>{money(debtor.remaining)}</b>
                                                <div>
                                                    <Button
                                                        size="small"
                                                        type="link"
                                                        onClick={() => navigate('/client/accountant/tuition')}
                                                    >
                                                        Thu tiền
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>

                        <Card className={styles['portal-card']} title="Chỉ tiêu hoàn thành ngân sách">
                            <div style={{ textAlign: 'center', padding: '16px 0' }}>
                                <Progress
                                    type="dashboard"
                                    percent={collectionRate}
                                    format={percent => `${percent}%`}
                                    strokeColor={{
                                        '0%': '#108ee9',
                                        '100%': '#87d068',
                                    }}
                                />
                                <div style={{ marginTop: 12, fontSize: 13, color: '#486581' }}>
                                    Đã thu: <b>{money(totalRevenue)}</b> / Tổng {money(totalRevenue + totalReceivable)}
                                </div>
                            </div>
                        </Card>
                    </Col>
                </Row>

                {/* Hàng bảng Hóa đơn phát hành gần đây */}
                <Card
                    className={`${styles['portal-card']} ${styles['accountant-new-invoices']}`}
                    title="Hóa đơn học phí mới tạo"
                    style={{ marginTop: 18 }}
                    extra={
                        <Button type="link" onClick={() => navigate('/client/accountant/invoices')}>
                            Xem tất cả hóa đơn <ArrowRightOutlined />
                        </Button>
                    }
                >
                    <Table
                        size="small"
                        pagination={{ pageSize: 5 }}
                        rowKey="_id"
                        dataSource={[...data.invoices]
                            .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
                            .slice(0, 10)}
                        scroll={{ x: 750 }}
                        columns={[
                            {
                                title: 'Mã hóa đơn',
                                render: (_: unknown, inv: AccountantInvoice) => (
                                    <b className={styles['invoice-code']}>
                                        INV-{inv._id?.slice(-8).toUpperCase() || 'NEW'}
                                    </b>
                                ),
                            },
                            {
                                title: 'Học viên',
                                render: (_: unknown, inv: AccountantInvoice) => {
                                    const r = rows.find(item => item.invoice._id === inv._id);
                                    return r?.student.name || 'Học viên';
                                },
                            },
                            {
                                title: 'Lớp học',
                                render: (_: unknown, inv: AccountantInvoice) => {
                                    const r = rows.find(item => item.invoice._id === inv._id);
                                    return r?.classroomName || 'Chưa cập nhật';
                                },
                            },
                            {
                                title: 'Số tiền phải nộp',
                                render: (_: unknown, inv: AccountantInvoice) => <b>{money(inv.final_amount ?? inv.amount)}</b>,
                            },
                            {
                                title: 'Ngày phát hành',
                                dataIndex: 'createdAt',
                                render: dateText,
                            },
                            {
                                title: 'Trạng thái',
                                dataIndex: 'status',
                                render: statusTag,
                            },
                            {
                                title: 'Thao tác',
                                render: (_: unknown, inv: AccountantInvoice) => (
                                    <Button
                                        size="small"
                                        onClick={() => navigate('/client/accountant/invoices')}
                                    >
                                        Xem chi tiết
                                    </Button>
                                ),
                            },
                        ]}
                    />
                </Card>
            </AccountantState>
        </main>
    );
};

export default AccountantDashboard;
