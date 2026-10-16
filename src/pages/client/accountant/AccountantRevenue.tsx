import { useMemo, useState } from 'react';
import {
    Button,
    Card,
    Col,
    DatePicker,
    Progress,
    Row,
    Select,
    Space,
    Statistic,
    Table,
    Tag,
    message,
} from 'antd';
import {
    BankOutlined,
    CreditCardOutlined,
    DollarCircleOutlined,
    DownloadOutlined,
    FileDoneOutlined,
    RiseOutlined,
    WalletOutlined,
} from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import {
    AccountantEmpty,
    AccountantState,
    StatCard,
    dateText,
    dateTimeText,
    exportToCsv,
    money,
    paymentMethodText,
    useAccountantData,
    useInvoiceRows,
    type AccountantInvoice,
    type InvoiceRow,
} from './accountant.shared';
import styles from '@/styles/client.module.scss';

const AccountantRevenue = () => {
    const data = useAccountantData();
    const rows = useInvoiceRows(data);

    const [periodType, setPeriodType] = useState<'month' | 'year' | 'all'>('year');
    const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());

    // Các hóa đơn đã thanh toán
    const paidRows = useMemo(() => {
        return rows.filter(r => r.invoice.status?.toUpperCase() === 'PAID');
    }, [rows]);

    // Lọc theo kỳ được chọn
    const filteredRows = useMemo(() => {
        if (periodType === 'all') return paidRows;

        return paidRows.filter(r => {
            const rawDate = r.invoice.updatedAt || r.invoice.createdAt;
            if (!rawDate) return true;
            const d = dayjs(rawDate);
            if (periodType === 'month') {
                return d.month() === selectedDate.month() && d.year() === selectedDate.year();
            }
            if (periodType === 'year') {
                return d.year() === selectedDate.year();
            }
            return true;
        });
    }, [paidRows, periodType, selectedDate]);

    // Tổng doanh thu kỳ chọn
    const totalPeriodRevenue = useMemo(() => {
        return filteredRows.reduce((sum, r) => sum + (Number(r.invoice.final_amount ?? r.invoice.amount) || 0), 0);
    }, [filteredRows]);

    // Doanh thu theo 12 tháng của năm được chọn
    const monthlyData = useMemo(() => {
        const targetYear = selectedDate.year();
        const months = Array.from({ length: 12 }, (_, idx) => {
            const monthTotal = paidRows
                .filter(r => {
                    const rawDate = r.invoice.updatedAt || r.invoice.createdAt;
                    if (!rawDate) return false;
                    const d = dayjs(rawDate);
                    return d.month() === idx && d.year() === targetYear;
                })
                .reduce((s, r) => s + (Number(r.invoice.final_amount ?? r.invoice.amount) || 0), 0);

            return {
                month: `Thg ${idx + 1}`,
                value: monthTotal,
            };
        });

        const maxVal = Math.max(...months.map(m => m.value), 1);
        return { months, maxVal };
    }, [paidRows, selectedDate]);

    // Phân tích doanh thu theo từng Khóa học
    const courseBreakdown = useMemo(() => {
        const map = new Map<string, { courseName: string; studentCount: number; revenue: number }>();

        filteredRows.forEach(r => {
            const cName = r.courseName || 'Khóa học tiêu chuẩn';
            const curr = map.get(cName) || { courseName: cName, studentCount: 0, revenue: 0 };
            curr.studentCount += 1;
            curr.revenue += (Number(r.invoice.final_amount ?? r.invoice.amount) || 0);
            map.set(cName, curr);
        });

        return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
    }, [filteredRows]);

    // Phân tích theo phương thức thanh toán
    const methodBreakdown = useMemo(() => {
        let bank = 0;
        let cash = 0;
        let vnpay = 0;

        filteredRows.forEach(r => {
            const invId = r.invoice._id;
            const pay = data.payments.find(p => {
                const pInvId = typeof p.invoice_id === 'string' ? p.invoice_id : p.invoice_id?._id;
                return pInvId === invId;
            });

            const amt = Number(r.invoice.final_amount ?? r.invoice.amount ?? 0);
            const m = pay?.payment_method?.toUpperCase();
            if (m === 'CASH') cash += amt;
            else if (m === 'VNPAY') vnpay += amt;
            else bank += amt;
        });

        const total = totalPeriodRevenue || 1;
        return {
            bank,
            cash,
            vnpay,
            bankPct: Math.round((bank / total) * 100),
            cashPct: Math.round((cash / total) * 100),
            vnpayPct: Math.round((vnpay / total) * 100),
        };
    }, [data.payments, filteredRows, totalPeriodRevenue]);

    // Xuất CSV báo cáo doanh thu
    const handleExportCsv = () => {
        const headers = ['Mã hóa đơn', 'Học viên', 'Email', 'Lớp học', 'Khóa học', 'Số tiền thu', 'Ngày hoàn tất'];
        const exportRows = filteredRows.map(r => [
            r.invoice._id || '',
            r.student.name,
            r.student.email,
            r.classroomName,
            r.courseName,
            r.invoice.final_amount ?? r.invoice.amount ?? 0,
            dateText(r.invoice.updatedAt || r.invoice.createdAt),
        ]);
        exportToCsv(`Bao_cao_doanh_thu_${new Date().toISOString().slice(0, 10)}`, headers, exportRows);
        message.success('Đã xuất báo cáo doanh thu thành công!');
    };

    return (
        <main className={`${styles.container} ${styles['accountant-page']}`}>
            <section className={styles['accountant-page-heading']}>
                <div>
                    <span>TÀI CHÍNH / BÁO CÁO DOANH THU</span>
                    <h1>Báo cáo doanh thu & Phân tích tài chính</h1>
                    <p>Phân tích hiệu quả thu học phí theo thời gian, theo chương trình đào tạo và phương thức thanh toán.</p>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div className={styles['accountant-period-filter']}>
                        <Select
                            value={periodType}
                            onChange={setPeriodType}
                            options={[
                                { label: 'Theo năm', value: 'year' },
                                { label: 'Theo tháng', value: 'month' },
                                { label: 'Toàn bộ thời gian', value: 'all' },
                            ]}
                            style={{ width: 140 }}
                        />
                        {periodType !== 'all' && (
                            <DatePicker
                                picker={periodType === 'year' ? 'year' : 'month'}
                                value={selectedDate}
                                onChange={val => val && setSelectedDate(val)}
                                format={periodType === 'year' ? 'YYYY' : 'MM/YYYY'}
                            />
                        )}
                    </div>
                    <Button icon={<DownloadOutlined />} onClick={handleExportCsv}>
                        Xuất báo cáo (CSV)
                    </Button>
                </div>
            </section>

            <AccountantState loading={data.loading} error={data.error}>
                {/* 4 Thẻ tổng quan */}
                <Row gutter={[16, 16]} style={{ marginBottom: 18 }}>
                    <Col xs={24} sm={12} lg={6}>
                        <StatCard
                            title="Doanh thu thực tế kỳ chọn"
                            value={money(totalPeriodRevenue)}
                            subValue={`Ghi nhận trong ${periodType === 'all' ? 'toàn bộ thời gian' : periodType === 'year' ? `năm ${selectedDate.year()}` : `tháng ${selectedDate.month() + 1}/${selectedDate.year()}`}`}
                            icon={<RiseOutlined />}
                            accent="teal"
                        />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <StatCard
                            title="Giao dịch đã thu tiền"
                            value={filteredRows.length}
                            subValue="Số lượt học viên hoàn tất học phí"
                            icon={<CreditCardOutlined />}
                            accent="green"
                        />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <StatCard
                            title="Doanh thu trung bình / GD"
                            value={money(filteredRows.length > 0 ? Math.round(totalPeriodRevenue / filteredRows.length) : 0)}
                            subValue="Giá trị trung bình mỗi hồ sơ"
                            icon={<DollarCircleOutlined />}
                            accent="navy"
                        />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <StatCard
                            title="Hóa đơn còn nợ cần thu"
                            value={rows.filter(r => r.remaining > 0).length}
                            subValue={`Tổng công nợ: ${money(rows.reduce((s, r) => s + r.remaining, 0))}`}
                            icon={<FileDoneOutlined />}
                            accent="coral"
                        />
                    </Col>
                </Row>

                {/* Grid 2 cột: Biểu đồ cột 12 tháng & Tỷ trọng phương thức */}
                <Row gutter={[18, 18]} className={styles['accountant-revenue-grid']}>
                    <Col xs={24} lg={15}>
                        <Card className={styles['portal-card']} title={`Biến động doanh thu theo tháng (Năm ${selectedDate.year()})`}>
                            <div className={styles['revenue-chart']}>
                                {monthlyData.months.map(item => (
                                    <div className={styles['revenue-bar-wrap']} key={item.month}>
                                        <div
                                            className={styles['revenue-bar']}
                                            style={{ height: `${Math.max(8, (item.value / monthlyData.maxVal) * 100)}%` }}
                                            title={`${item.month}: ${money(item.value)}`}
                                        />
                                        <span>{item.month}</span>
                                        <small style={{ fontSize: 9, color: '#627d98' }}>{money(item.value)}</small>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </Col>

                    <Col xs={24} lg={9}>
                        <Card className={styles['portal-card']} title="Cơ cấu phương thức thanh toán">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '8px 0' }}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                                        <span><BankOutlined /> Chuyển khoản ngân hàng</span>
                                        <b>{money(methodBreakdown.bank)} ({methodBreakdown.bankPct}%)</b>
                                    </div>
                                    <Progress percent={methodBreakdown.bankPct} strokeColor="#0f62fe" showInfo={false} />
                                </div>

                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                                        <span><WalletOutlined /> Tiền mặt tại quầy</span>
                                        <b>{money(methodBreakdown.cash)} ({methodBreakdown.cashPct}%)</b>
                                    </div>
                                    <Progress percent={methodBreakdown.cashPct} strokeColor="#25805d" showInfo={false} />
                                </div>

                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                                        <span><CreditCardOutlined /> Cổng thanh toán VNPay</span>
                                        <b>{money(methodBreakdown.vnpay)} ({methodBreakdown.vnpayPct}%)</b>
                                    </div>
                                    <Progress percent={methodBreakdown.vnpayPct} strokeColor="#7852ff" showInfo={false} />
                                </div>
                            </div>

                            <div style={{ marginTop: 20, padding: 14, background: '#f8fafc', borderRadius: 8 }}>
                                <Statistic
                                    title="Tổng tiền thu trong kỳ"
                                    value={totalPeriodRevenue}
                                    formatter={val => money(Number(val))}
                                    valueStyle={{ color: '#0b3d91', fontWeight: 700, fontSize: 22 }}
                                />
                            </div>
                        </Card>
                    </Col>
                </Row>

                {/* Bảng phân tích theo Khóa học */}
                <Card className={styles['portal-card']} title="Phân bổ doanh thu theo Khóa học đào tạo" style={{ marginBottom: 18 }}>
                    <Table
                        rowKey="courseName"
                        dataSource={courseBreakdown}
                        pagination={false}
                        columns={[
                            {
                                title: 'Khóa học',
                                render: (_, c) => <b style={{ color: '#0b3d91', fontSize: 14 }}>{c.courseName}</b>,
                            },
                            {
                                title: 'Số học viên đã thu tiền',
                                render: (_, c) => <span>{c.studentCount} học viên</span>,
                            },
                            {
                                title: 'Tổng doanh thu',
                                render: (_, c) => <b>{money(c.revenue)}</b>,
                            },
                            {
                                title: 'Tỷ trọng đóng góp',
                                render: (_, c) => {
                                    const pct = totalPeriodRevenue > 0 ? Math.round((c.revenue / totalPeriodRevenue) * 100) : 0;
                                    return (
                                        <div style={{ width: 160 }}>
                                            <Progress percent={pct} size="small" />
                                        </div>
                                    );
                                },
                            },
                        ]}
                    />
                </Card>

                {/* Bảng kê chi tiết các giao dịch trong kỳ */}
                <Card className={styles['portal-card']} title="Chi tiết các khoản thu trong kỳ báo cáo">
                    {!filteredRows.length ? (
                        <AccountantEmpty description="Chưa có giao dịch thu tiền nào trong kỳ này" />
                    ) : (
                        <Table
                            rowKey={r => r.invoice._id || Math.random().toString()}
                            dataSource={filteredRows}
                            pagination={{ pageSize: 8, showSizeChanger: true }}
                            scroll={{ x: 950 }}
                            columns={[
                                {
                                    title: 'Mã hóa đơn',
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
                                    title: 'Số tiền thu',
                                    render: (_, r) => (
                                        <b style={{ color: '#0b3d91', fontSize: 14 }}>
                                            {money(r.invoice.final_amount ?? r.invoice.amount)}
                                        </b>
                                    ),
                                },
                                {
                                    title: 'Ngày hoàn tất',
                                    render: (_, r) => dateText(r.invoice.updatedAt || r.invoice.createdAt),
                                },
                                {
                                    title: 'Trạng thái',
                                    render: () => <Tag color="success">Đã hoàn tất</Tag>,
                                },
                            ]}
                        />
                    )}
                </Card>
            </AccountantState>
        </main>
    );
};

export default AccountantRevenue;
