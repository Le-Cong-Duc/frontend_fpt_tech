import { useMemo, useState } from 'react';
import { Button, Card, Input, Modal, Select, Space, Table, Tag, message } from 'antd';
import { CheckOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons';
import { callCreatePayment, callUpdateInvoice } from '@/config/api';
import { useNavigate } from 'react-router-dom';
import { AccountantEmpty, AccountantState, dateText, getClassName, getStudentName, money, statusTag, useAccountantData, useInvoiceRows, type AccountantInvoice } from './accountant.shared';
import styles from '@/styles/client.module.scss';

const AccountantTuition = () => {
    const navigate = useNavigate();
    const data = useAccountantData();
    const rows = useInvoiceRows(data);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<string>();
    const [selectedInvoice, setSelectedInvoice] = useState<AccountantInvoice | null>(null);
    const [method, setMethod] = useState('BANK_TRANSFER');
    const [saving, setSaving] = useState(false);
    const filtered = useMemo(() => rows.filter(row => {
        const haystack = `${row.invoice._id || ''} ${getStudentName(row.invoice, data.enrollments, data.users)} ${getClassName(row.invoice, data.enrollments, data.classrooms)}`.toLowerCase();
        return haystack.includes(search.toLowerCase()) && (!status || row.invoice.status?.toUpperCase() === status);
    }), [data, rows, search, status]);

    const confirmPayment = async () => {
        if (!selectedInvoice?._id) return;
        setSaving(true);
        const payment = await callCreatePayment({ invoice_id: selectedInvoice._id, payment_method: method, payment_date: new Date().toISOString() });
        if (payment?.data) {
            await callUpdateInvoice({ status: 'PAID' }, selectedInvoice._id);
            message.success('Đã xác nhận thanh toán');
            setSelectedInvoice(null);
            await data.refresh();
        } else message.error(payment?.message || 'Không thể xác nhận thanh toán');
        setSaving(false);
    };

    return <main className={`${styles.container} ${styles['accountant-page']}`}><section className={styles['accountant-page-heading']}><div><span>FINANCE / TUITION</span><h1>Quản lý học phí</h1><p>Theo dõi công nợ và số tiền còn thiếu của từng học viên.</p></div><Button type="primary" onClick={() => navigate('/client/accountant/invoices')}>Tạo hóa đơn</Button></section><AccountantState loading={data.loading} error={data.error}>{!rows.length ? <AccountantEmpty description="Chưa có dữ liệu học phí" /> : <Card className={styles['portal-card']}><div className={styles['accountant-filters']}><Input allowClear prefix={<SearchOutlined />} placeholder="Tìm học viên, email hoặc mã hóa đơn" value={search} onChange={event => setSearch(event.target.value)} /><Select allowClear placeholder="Trạng thái" value={status} onChange={setStatus} options={[{ label: 'Đã thanh toán', value: 'PAID' }, { label: 'Chưa thanh toán', value: 'UNPAID' }, { label: 'Thanh toán một phần', value: 'PARTIAL' }, { label: 'Đã hủy', value: 'CANCELLED' }]} /></div><Table rowKey={(row) => row.invoice._id || Math.random()} pagination={{ pageSize: 8, showSizeChanger: true }} scroll={{ x: 980 }} dataSource={filtered} columns={[{ title: 'STT', width: 60, render: (_: unknown, __: unknown, index: number) => index + 1 }, { title: 'Học viên', render: (_: unknown, row) => <div className={styles['accountant-person-cell']}><strong>{getStudentName(row.invoice, data.enrollments, data.users)}</strong><span>{row.invoice._id}</span></div> }, { title: 'Lớp', render: (_: unknown, row) => getClassName(row.invoice, data.enrollments, data.classrooms) }, { title: 'Số tiền', render: (_: unknown, row) => money(row.invoice.amount) }, { title: 'Đã đóng', render: (_: unknown, row) => money(row.paid) }, { title: 'Còn thiếu', render: (_: unknown, row) => <b className={row.invoice.final_amount! - row.paid > 0 ? styles['text-danger'] : styles['text-success']}>{money(Math.max((row.invoice.final_amount || row.invoice.amount || 0) - row.paid))}</b> }, { title: 'Trạng thái', dataIndex: ['invoice', 'status'], render: (_: unknown, row) => statusTag(row.invoice.status) }, { title: 'Thao tác', fixed: 'right', render: (_: unknown, row) => <Space><Button aria-label="Xem hóa đơn" icon={<EyeOutlined />} onClick={() => navigate('/client/accountant/invoices')} /><Button aria-label="Xác nhận thanh toán" type="primary" icon={<CheckOutlined />} disabled={row.invoice.status?.toUpperCase() === 'PAID' || row.invoice.status?.toUpperCase() === 'CANCELLED'} onClick={() => setSelectedInvoice(row.invoice)} /></Space> }]} /></Card>}</AccountantState><Modal title="Xác nhận thanh toán" open={Boolean(selectedInvoice)} confirmLoading={saving} okText="Xác nhận" cancelText="Hủy" onOk={confirmPayment} onCancel={() => setSelectedInvoice(null)}><div className={styles['payment-confirm-summary']}><span>Mã hóa đơn</span><b>{selectedInvoice?._id}</b><span>Số tiền</span><b>{money(selectedInvoice?.final_amount || selectedInvoice?.amount)}</b></div><label className={styles['accountant-field-label']}>Phương thức thanh toán</label><Select value={method} onChange={setMethod} style={{ width: '100%' }} options={[{ label: 'Chuyển khoản', value: 'BANK_TRANSFER' }, { label: 'Tiền mặt', value: 'CASH' }, { label: 'VNPay', value: 'VNPAY' }]} /><p className={styles.muted}>Thời gian ghi nhận: {dateText(new Date().toISOString())}</p></Modal></main>;
};

export default AccountantTuition;
