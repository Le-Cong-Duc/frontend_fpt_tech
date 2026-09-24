import { useMemo, useState } from 'react';
import { Button, Card, Col, Descriptions, Form, Input, InputNumber, Modal, Row, Select, Space, Table, Tag, message } from 'antd';
import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { callCreateInvoice, callDeleteInvoice, callUpdateInvoice } from '@/config/api';
import { AccountantEmpty, AccountantState, dateText, getClassName, getStudentName, money, statusTag, useAccountantData, useInvoiceRows, type AccountantInvoice } from './accountant.shared';
import type { IInvoice } from '@/types/backend';
import styles from '@/styles/client.module.scss';

const AccountantInvoices = () => {
    const data = useAccountantData();
    const rows = useInvoiceRows(data);
    const [form] = Form.useForm<Omit<IInvoice, '_id'>>();
    const [formOpen, setFormOpen] = useState(false);
    const [detail, setDetail] = useState<AccountantInvoice | null>(null);
    const [editingId, setEditingId] = useState('');
    const [saving, setSaving] = useState(false);
    const [filter, setFilter] = useState<string>();
    const [search, setSearch] = useState('');
    const visible = useMemo(() => rows.filter(row => {
        const text = `${row.invoice._id || ''} ${getStudentName(row.invoice, data.enrollments, data.users)}`.toLowerCase();
        return text.includes(search.toLowerCase()) && (!filter || row.invoice.status?.toUpperCase() === filter);
    }), [data, filter, rows, search]);
    const openForm = (invoice?: AccountantInvoice) => {
        setEditingId(invoice?._id || '');
        form.setFieldsValue(invoice ? { enrollment_id: typeof invoice.enrollment_id === 'string' ? invoice.enrollment_id : invoice.enrollment_id._id || '', amount: invoice.amount, discount_amount: invoice.discount_amount, final_amount: invoice.final_amount, status: invoice.status } : { status: 'UNPAID', amount: 0, discount_amount: 0, final_amount: 0 });
        setFormOpen(true);
    };
    const saveInvoice = async (values: Omit<IInvoice, '_id'>) => {
        setSaving(true);
        const payload = { ...values, final_amount: Math.max(0, Number(values.amount || 0) - Number(values.discount_amount || 0)) };
        const response = editingId ? await callUpdateInvoice(payload, editingId) : await callCreateInvoice(payload);
        setSaving(false);
        if (!response?.data) return message.error(response?.message || 'Không thể lưu hóa đơn');
        message.success(editingId ? 'Đã cập nhật hóa đơn' : 'Đã tạo hóa đơn');
        setFormOpen(false);
        await data.refresh();
    };
    const removeInvoice = async (invoice: AccountantInvoice) => {
        if (!invoice._id || invoice.status?.toUpperCase() === 'PAID') return;
        const response = await callDeleteInvoice(invoice._id);
        if (response?.data) { message.success('Đã hủy hóa đơn'); await data.refresh(); } else message.error(response?.message || 'Không thể hủy hóa đơn');
    };

    return <main className={`${styles.container} ${styles['accountant-page']}`}><section className={styles['accountant-page-heading']}><div><span>FINANCE / INVOICES</span><h1>Quản lý hóa đơn</h1><p>Tạo, tra cứu và kiểm soát trạng thái các hóa đơn học phí.</p></div><Button type="primary" icon={<PlusOutlined />} onClick={() => openForm()}>Tạo hóa đơn</Button></section><AccountantState loading={data.loading} error={data.error}>{!rows.length ? <AccountantEmpty description="Chưa có hóa đơn" /> : <Card className={styles['portal-card']}><div className={styles['accountant-filters']}><Input placeholder="Tìm kiếm nhanh trong bảng" /><Select allowClear placeholder="Lọc trạng thái" value={filter} onChange={setFilter} options={[{ label: 'Đã thanh toán', value: 'PAID' }, { label: 'Chưa thanh toán', value: 'UNPAID' }, { label: 'Một phần', value: 'PARTIAL' }, { label: 'Đã hủy', value: 'CANCELLED' }]} /></div><Table rowKey={(row) => row.invoice._id || 'invoice'} dataSource={visible} pagination={{ pageSize: 8 }} scroll={{ x: 1050 }} columns={[{ title: 'Mã hóa đơn', render: (_: unknown, row) => <b className={styles['invoice-code']}>{row.invoice._id?.slice(-10).toUpperCase()}</b> }, { title: 'Học viên', render: (_: unknown, row) => getStudentName(row.invoice, data.enrollments, data.users) }, { title: 'Lớp', render: (_: unknown, row) => getClassName(row.invoice, data.enrollments, data.classrooms) }, { title: 'Số tiền', render: (_: unknown, row) => money(row.invoice.amount) }, { title: 'Giảm giá', render: (_: unknown, row) => money(row.invoice.discount_amount) }, { title: 'Thành tiền', render: (_: unknown, row) => <b>{money(row.invoice.final_amount || row.invoice.amount)}</b> }, { title: 'Trạng thái', render: (_: unknown, row) => statusTag(row.invoice.status) }, { title: 'Ngày tạo', render: (_: unknown, row) => dateText(row.invoice.createdAt) }, { title: 'Thao tác', fixed: 'right', render: (_: unknown, row) => <Space><Button aria-label="Xem chi tiết" icon={<EyeOutlined />} onClick={() => setDetail(row.invoice)} /><Button aria-label="Chỉnh sửa" icon={<EditOutlined />} disabled={row.invoice.status?.toUpperCase() === 'PAID'} onClick={() => openForm(row.invoice)} /><Button danger aria-label="Hủy hóa đơn" icon={<DeleteOutlined />} disabled={row.invoice.status?.toUpperCase() === 'PAID'} onClick={() => removeInvoice(row.invoice)} /></Space> }]} /></Card>}</AccountantState><Modal title={editingId ? 'Chỉnh sửa hóa đơn' : 'Tạo hóa đơn'} open={formOpen} width={680} confirmLoading={saving} okText="Lưu hóa đơn" cancelText="Hủy" onOk={() => form.submit()} onCancel={() => setFormOpen(false)}><Form form={form} layout="vertical" onFinish={saveInvoice}><Form.Item name="enrollment_id" label="Học viên / đăng ký" rules={[{ required: true, message: 'Vui lòng chọn học viên' }]}><Select showSearch optionFilterProp="label" options={data.enrollments.map(enrollment => ({ value: enrollment._id || '', label: `${enrollment._id || ''} - ${typeof enrollment.student_id === 'string' ? enrollment.student_id : enrollment.student_id?.name || ''}` })).filter(item => item.value)} /></Form.Item><Row gutter={12}><Col span={12}><Form.Item name="amount" label="Số tiền" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col><Col span={12}><Form.Item name="discount_amount" label="Giảm giá"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col></Row><Form.Item name="status" label="Trạng thái"><Select options={[{ label: 'Chưa thanh toán', value: 'UNPAID' }, { label: 'Thanh toán một phần', value: 'PARTIAL' }, { label: 'Đã thanh toán', value: 'PAID' }, { label: 'Đã hủy', value: 'CANCELLED' }]} /></Form.Item></Form></Modal><Modal title="Chi tiết hóa đơn" open={Boolean(detail)} footer={null} onCancel={() => setDetail(null)}><Descriptions column={1} bordered size="small"><Descriptions.Item label="Mã hóa đơn">{detail?._id}</Descriptions.Item><Descriptions.Item label="Học viên">{detail ? getStudentName(detail, data.enrollments, data.users) : ''}</Descriptions.Item><Descriptions.Item label="Lớp học">{detail ? getClassName(detail, data.enrollments, data.classrooms) : ''}</Descriptions.Item><Descriptions.Item label="Số tiền">{money(detail?.amount)}</Descriptions.Item><Descriptions.Item label="Giảm giá">{money(detail?.discount_amount)}</Descriptions.Item><Descriptions.Item label="Thành tiền"><b>{money(detail?.final_amount || detail?.amount)}</b></Descriptions.Item><Descriptions.Item label="Trạng thái">{statusTag(detail?.status)}</Descriptions.Item><Descriptions.Item label="Ngày tạo">{dateText(detail?.createdAt)}</Descriptions.Item></Descriptions><Button className={styles['portal-action']} onClick={() => { setDetail(null); if (detail) openForm(detail); }} disabled={detail?.status?.toUpperCase() === 'PAID'} icon={<EditOutlined />}>Chỉnh sửa</Button></Modal></main>;
};

export default AccountantInvoices;
