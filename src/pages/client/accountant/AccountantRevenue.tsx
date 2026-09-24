import { useMemo, useState } from 'react';
import { Card, Col, DatePicker, Row, Select, Statistic, Table } from 'antd';
import { CreditCardOutlined, FileDoneOutlined, RiseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { AccountantEmpty, AccountantState, StatCard, getStudentName, money, useAccountantData, useInvoiceRows } from './accountant.shared';
import styles from '@/styles/client.module.scss';

const AccountantRevenue = () => {
    const data = useAccountantData();
    const rows = useInvoiceRows(data);
    const [period, setPeriod] = useState('year');
    const [month, setMonth] = useState(dayjs());
    const paid = rows.filter(row => row.invoice.status?.toUpperCase() === 'PAID');
    const filtered = useMemo(() => paid.filter(row => {
        if (!row.invoice.createdAt) return true;
        const created = dayjs(row.invoice.createdAt);
        return period === 'month' ? created.month() === month.month() && created.year() === month.year() : created.year() === month.year();
    }), [month, paid, period]);
    const revenue = filtered.reduce((sum, row) => sum + (row.invoice.final_amount || row.invoice.amount || 0), 0);
    const monthly = Array.from({ length: 12 }, (_, index) => ({ month: `T${index + 1}`, value: paid.filter(row => row.invoice.createdAt && dayjs(row.invoice.createdAt).month() === index && dayjs(row.invoice.createdAt).year() === month.year()).reduce((sum, row) => sum + (row.invoice.final_amount || row.invoice.amount || 0), 0) }));
    const maxMonthly = Math.max(...monthly.map(item => item.value), 1);

    return <main className={`${styles.container} ${styles['accountant-page']}`}><section className={styles['accountant-page-heading']}><div><span>FINANCE / REVENUE</span><h1>Thống kê doanh thu</h1><p>Nhìn rõ hiệu quả thu học phí theo thời gian và từng giao dịch.</p></div><div className={styles['accountant-period-filter']}><Select value={period} onChange={setPeriod} options={[{ label: 'Theo tháng', value: 'month' }, { label: 'Theo năm', value: 'year' }]} /><DatePicker picker={period === 'year' ? 'year' : 'month'} value={month} onChange={value => value && setMonth(value)} /></div></section><AccountantState loading={data.loading} error={data.error}>{!data.invoices.length ? <AccountantEmpty description="Chưa có dữ liệu doanh thu" /> : <><Row gutter={[16, 16]}><Col xs={24} sm={8}><StatCard title="Doanh thu kỳ chọn" value={money(revenue)} icon={<RiseOutlined />} accent="teal" /></Col><Col xs={24} sm={8}><StatCard title="Giao dịch đã thu" value={filtered.length} icon={<CreditCardOutlined />} accent="green" /></Col><Col xs={24} sm={8}><StatCard title="Hóa đơn chờ thu" value={rows.filter(row => row.invoice.status?.toUpperCase() !== 'PAID').length} icon={<FileDoneOutlined />} accent="coral" /></Col></Row><Row gutter={[18, 18]} className={styles['accountant-revenue-grid']}><Col xs={24} lg={15}><Card className={styles['portal-card']} title="Doanh thu theo tháng"><div className={styles['revenue-chart']}>{monthly.map(item => <div className={styles['revenue-bar-wrap']} key={item.month}><div className={styles['revenue-bar']} style={{ height: `${Math.max(7, item.value / maxMonthly * 100)}%` }} title={money(item.value)} /><span>{item.month}</span></div>)}</div></Card></Col><Col xs={24} lg={9}><Card className={styles['portal-card']} title="Tổng quan kỳ chọn"><Statistic title="Tổng doanh thu" value={revenue} suffix="đ" formatter={value => Number(value).toLocaleString('vi-VN')} /><div className={styles['revenue-summary']}><span>Đã thanh toán <b>{filtered.length}</b></span><span>Chưa thanh toán <b>{rows.filter(row => row.invoice.status?.toUpperCase() !== 'PAID').length}</b></span></div></Card></Col></Row><Card className={styles['portal-card']} title="Doanh thu theo giao dịch"><Table rowKey={(row) => row.invoice._id || 'invoice'} pagination={{ pageSize: 8 }} scroll={{ x: 720 }} dataSource={filtered} columns={[{ title: 'Học viên', render: (_: unknown, row) => getStudentName(row.invoice, data.enrollments, data.users) }, { title: 'Mã hóa đơn', render: (_: unknown, row) => row.invoice._id?.slice(-10).toUpperCase() }, { title: 'Ngày tạo', dataIndex: ['invoice', 'createdAt'], render: (value?: string) => value ? dayjs(value).format('DD/MM/YYYY') : 'Chưa cập nhật' }, { title: 'Thành tiền', render: (_: unknown, row) => <b>{money(row.invoice.final_amount || row.invoice.amount)}</b> }]} /></Card></>}</AccountantState></main>;
};

export default AccountantRevenue;
