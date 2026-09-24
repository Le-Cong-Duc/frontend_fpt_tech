import { useMemo, useState } from 'react';
import { Card, Empty, Input, Select, Table, Tag } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { AccountantEmpty, AccountantState, dateText, getStudentName, money, useAccountantData, type AccountantInvoice } from './accountant.shared';
import styles from '@/styles/client.module.scss';

const AccountantPayments = () => {
    const data = useAccountantData();
    const [search, setSearch] = useState('');
    const [method, setMethod] = useState<string>();
    const payments = useMemo(() => data.payments.filter(payment => {
        const invoice = typeof payment.invoice_id === 'object' ? payment.invoice_id : data.invoices.find(item => item._id === payment.invoice_id);
        const text = `${payment._id || ''} ${payment.invoice_id || ''} ${invoice ? getStudentName(invoice as AccountantInvoice, data.enrollments, data.users) : ''}`.toLowerCase();
        return text.includes(search.toLowerCase()) && (!method || payment.payment_method === method);
    }), [data, method, search]);

    return <main className={`${styles.container} ${styles['accountant-page']}`}><section className={styles['accountant-page-heading']}><div><span>FINANCE / PAYMENTS</span><h1>Lịch sử thanh toán</h1><p>Tất cả giao dịch đã ghi nhận, sắp xếp theo thời gian mới nhất.</p></div></section><AccountantState loading={data.loading} error={data.error}>{!data.payments.length ? <AccountantEmpty description="Chưa có giao dịch thanh toán" /> : <Card className={styles['portal-card']}><div className={styles['accountant-filters']}><Input allowClear prefix={<SearchOutlined />} placeholder="Tìm mã thanh toán, hóa đơn hoặc học viên" value={search} onChange={event => setSearch(event.target.value)} /><Select allowClear placeholder="Phương thức" value={method} onChange={setMethod} options={[{ label: 'Chuyển khoản', value: 'BANK_TRANSFER' }, { label: 'Tiền mặt', value: 'CASH' }, { label: 'VNPay', value: 'VNPAY' }]} /></div><Table rowKey={(row) => row._id || `${row.invoice_id}-${row.payment_date}`} dataSource={payments} pagination={{ pageSize: 10 }} scroll={{ x: 900 }} columns={[{ title: 'Mã thanh toán', render: (_: unknown, payment) => payment._id?.slice(-10).toUpperCase() }, { title: 'Mã hóa đơn', render: (_: unknown, payment) => typeof payment.invoice_id === 'string' ? payment.invoice_id.slice(-10).toUpperCase() : payment.invoice_id?._id?.slice(-10).toUpperCase() }, { title: 'Học viên', render: (_: unknown, payment) => { const invoice = typeof payment.invoice_id === 'object' ? payment.invoice_id : data.invoices.find(item => item._id === payment.invoice_id); return invoice ? getStudentName(invoice as AccountantInvoice, data.enrollments, data.users) : 'Chưa cập nhật'; } }, { title: 'Số tiền', render: (_: unknown, payment) => { const invoice = typeof payment.invoice_id === 'object' ? payment.invoice_id : data.invoices.find(item => item._id === payment.invoice_id); return <b>{money(invoice?.final_amount || invoice?.amount)}</b>; } }, { title: 'Phương thức', dataIndex: 'payment_method', render: (value?: string) => value === 'BANK_TRANSFER' ? 'Chuyển khoản' : value === 'CASH' ? 'Tiền mặt' : value || 'Chưa cập nhật' }, { title: 'Ngày thanh toán', dataIndex: 'payment_date', render: dateText }, { title: 'Trạng thái', render: () => <Tag color="green">Đã ghi nhận</Tag> }]} /></Card>}</AccountantState></main>;
};

export default AccountantPayments;
