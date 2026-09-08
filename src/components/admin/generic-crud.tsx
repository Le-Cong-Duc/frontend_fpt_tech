import { useEffect, useMemo, useState } from 'react';
import { Button, DatePicker, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Table, Tag, message, notification } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import { ALL_PERMISSIONS } from '@/config/permissions';
import Access from '@/components/share/access';
import {
    callCreateClassroom, callCreateCourse, callCreateEnrollment, callCreateInvoice, callCreateLead, callCreatePayment,
    callDeleteClassroom, callDeleteCourse, callDeleteEnrollment, callDeleteInvoice, callDeleteLead, callDeletePayment,
    callFetchClassroom, callFetchCourse, callFetchEnrollment, callFetchInvoice, callFetchLead, callFetchPayment,
    callUpdateClassroom, callUpdateCourse, callUpdateEnrollment, callUpdateInvoice, callUpdateLead, callUpdatePayment,
} from '@/config/api';

export type CrudModule = 'courses' | 'classrooms' | 'enrollments' | 'invoices' | 'payments' | 'leads';
type FieldType = 'text' | 'number' | 'date' | 'select';
type CrudRecord = Record<string, any> & { _id?: string; createdAt?: string; updatedAt?: string };

interface FieldConfig {
    name: string;
    label: string;
    type?: FieldType;
    required?: boolean;
    options?: { label: string; value: string }[];
}

const configs: Record<CrudModule, { title: string; fields: FieldConfig[]; permission: keyof typeof ALL_PERMISSIONS }> = {
    courses: {
        title: 'Courses', permission: 'COURSES', fields: [
            { name: 'name', label: 'Tên khóa học', required: true },
            { name: 'description', label: 'Mô tả' }, { name: 'level', label: 'Trình độ' },
            { name: 'duration', label: 'Thời lượng' }, { name: 'price', label: 'Học phí' }, { name: 'status', label: 'Trạng thái' },
        ],
    },
    classrooms: {
        title: 'Classrooms', permission: 'CLASSROOMS', fields: [
            { name: 'course_id', label: 'Course ID', required: true }, { name: 'teacher_id', label: 'Teacher ID', required: true },
            { name: 'room', label: 'Phòng học', required: true }, { name: 'class_name', label: 'Tên lớp', required: true },
            { name: 'max_student', label: 'Số học viên tối đa', type: 'number', required: true },
            { name: 'start_time', label: 'Thời gian bắt đầu', required: true }, { name: 'end_time', label: 'Thời gian kết thúc', required: true },
            { name: 'status', label: 'Trạng thái', type: 'select', options: [{ label: 'OPEN', value: 'OPEN' }, { label: 'COMPLETED', value: 'COMPLETED' }, { label: 'CANCELLED', value: 'CANCELLED' }] },
        ],
    },
    enrollments: {
        title: 'Enrollments', permission: 'ENROLLMENTS', fields: [
            { name: 'student_id', label: 'Student ID', required: true }, { name: 'class_id', label: 'Class ID', required: true },
            { name: 'register_date', label: 'Ngày đăng ký', type: 'date', required: true },
            { name: 'status', label: 'Trạng thái', type: 'select', options: ['STUDYING', 'COMPLETED', 'CANCELLED', 'WAITING_PAYMENT'].map(value => ({ label: value, value })) },
        ],
    },
    invoices: {
        title: 'Invoices', permission: 'INVOICES', fields: [
            { name: 'enrollment_id', label: 'Enrollment ID', required: true }, { name: 'amount', label: 'Số tiền', type: 'number', required: true },
            { name: 'discount_amount', label: 'Giảm giá', type: 'number', required: true }, { name: 'final_amount', label: 'Thành tiền', type: 'number', required: true },
            { name: 'status', label: 'Trạng thái' }, { name: 'create_at', label: 'Ngày tạo', type: 'date' },
        ],
    },
    payments: {
        title: 'Payments', permission: 'PAYMENTS', fields: [
            { name: 'invoice_id', label: 'Invoice ID', required: true }, { name: 'payment_method', label: 'Phương thức thanh toán', required: true },
            { name: 'payment_date', label: 'Ngày thanh toán', type: 'date', required: true },
        ],
    },
    leads: {
        title: 'Leads', permission: 'LEADS', fields: [
            { name: 'full_name', label: 'Họ tên', required: true }, { name: 'phone', label: 'Số điện thoại', required: true },
            { name: 'email', label: 'Email', required: true }, { name: 'course_name', label: 'Khóa học quan tâm', required: true },
            { name: 'consultant_id', label: 'Consultant ID' }, { name: 'status', label: 'Trạng thái' }, { name: 'note', label: 'Ghi chú' },
        ],
    },
};

const apiByModule: Record<CrudModule, { list: (query?: string) => Promise<any>; create: (value: any) => Promise<any>; update: (value: any, id: string) => Promise<any>; remove: (id: string) => Promise<any> }> = {
    courses: { list: callFetchCourse, create: callCreateCourse, update: callUpdateCourse, remove: callDeleteCourse },
    classrooms: { list: callFetchClassroom, create: callCreateClassroom, update: callUpdateClassroom, remove: callDeleteClassroom },
    enrollments: { list: callFetchEnrollment, create: callCreateEnrollment, update: callUpdateEnrollment, remove: callDeleteEnrollment },
    invoices: { list: callFetchInvoice, create: callCreateInvoice, update: callUpdateInvoice, remove: callDeleteInvoice },
    payments: { list: callFetchPayment, create: callCreatePayment, update: callUpdatePayment, remove: callDeletePayment },
    leads: { list: callFetchLead, create: callCreateLead, update: callUpdateLead, remove: callDeleteLead },
};

const formatValue = (value: any, field: FieldConfig) => {
    if (value === undefined || value === null || value === '') return '-';
    if (field.type === 'date') return dayjs(value).format('DD-MM-YYYY HH:mm');
    return String(value);
};

const GenericCrud = ({ module }: { module: CrudModule }) => {
    const config = configs[module];
    const api = apiByModule[module];
    const [form] = Form.useForm();
    const [items, setItems] = useState<CrudRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<CrudRecord | null>(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    const load = async (current = page) => {
        setLoading(true);
        const query = `current=${current}&pageSize=10&sort=-updatedAt${search ? `&search=${encodeURIComponent(search)}` : ''}`;
        const response = await api.list(query);
        setItems(response.data?.data?.result ?? response.data?.result ?? []);
        setTotal(response.data?.data?.meta?.total ?? response.data?.meta?.total ?? 0);
        setLoading(false);
    };

    useEffect(() => { load(page); }, [page]);

    const visibleItems = useMemo(() => search ? items.filter(item => JSON.stringify(item).toLowerCase().includes(search.toLowerCase())) : items, [items, search]);
    const openCreate = () => { setEditing(null); form.resetFields(); setOpen(true); };
    const openEdit = (record: CrudRecord) => { setEditing(record); form.setFieldsValue({ ...record, ...Object.fromEntries(config.fields.filter(field => field.type === 'date' && record[field.name]).map(field => [field.name, dayjs(record[field.name])])) }); setOpen(true); };

    const submit = async (values: CrudRecord) => {
        const payload = { ...values };
        config.fields.filter(field => field.type === 'date' && payload[field.name]).forEach(field => { payload[field.name] = payload[field.name].toISOString(); });
        const response = editing?._id ? await api.update(payload, editing._id) : await api.create(payload);
        if (response.data) { message.success(`${editing ? 'Cập nhật' : 'Tạo'} ${config.title} thành công`); setOpen(false); await load(page); }
        else notification.error({ message: 'Có lỗi xảy ra', description: response.message });
    };

    const remove = async (id?: string) => { if (!id) return; const response = await api.remove(id); if (response.data) { message.success(`Xóa ${config.title} thành công`); await load(page); } else notification.error({ message: 'Có lỗi xảy ra', description: response.message }); };

    const columns: ColumnsType<CrudRecord> = [
        { title: 'ID', dataIndex: '_id', width: 220, ellipsis: true },
        ...config.fields.slice(0, 5).map(field => ({ title: field.label, dataIndex: field.name, render: (value: any, record: CrudRecord) => field.type === 'select' ? <Tag>{formatValue(value, field)}</Tag> : formatValue(record[field.name], field) })),
        { title: 'Ngày cập nhật', dataIndex: 'updatedAt', render: (value: string) => value ? dayjs(value).format('DD-MM-YYYY HH:mm') : '-' },
        { title: 'Thao tác', fixed: 'right' as const, width: 100, render: (_: any, record: CrudRecord) => <Space><Access permission={ALL_PERMISSIONS[config.permission].UPDATE} hideChildren><EditOutlined style={{ color: '#f59e0b', fontSize: 18 }} onClick={() => openEdit(record)} /></Access><Access permission={ALL_PERMISSIONS[config.permission].DELETE} hideChildren><Popconfirm title="Xác nhận xóa" description="Bạn có chắc chắn muốn xóa bản ghi này?" onConfirm={() => remove(record._id)} okText="Xác nhận" cancelText="Hủy"><DeleteOutlined style={{ color: '#ff4d4f', fontSize: 18 }} /></Popconfirm></Access></Space> },
    ];

    return <Access permission={ALL_PERMISSIONS[config.permission].GET_PAGINATE}>
        <div style={{ background: '#fff', padding: 20, borderRadius: 8 }}>
            <Space style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 style={{ margin: 0 }}>Danh sách {config.title}</h2>
                <Space><Input.Search placeholder="Tìm kiếm" allowClear onSearch={value => { setSearch(value); setPage(1); }} style={{ width: 220 }} /><Access permission={ALL_PERMISSIONS[config.permission].CREATE} hideChildren><Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Thêm mới</Button></Access></Space>
            </Space>
            <Table rowKey="_id" loading={loading} columns={columns} dataSource={visibleItems} scroll={{ x: 1100 }} pagination={{ current: page, pageSize: 10, total, showSizeChanger: false, onChange: setPage, showTotal: (value, range) => `${range[0]}-${range[1]} trên ${value} bản ghi` }} />
            <Modal title={`${editing ? 'Cập nhật' : 'Tạo mới'} ${config.title}`} open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()} destroyOnClose width={760} okText={editing ? 'Cập nhật' : 'Tạo mới'} cancelText="Hủy">
                <Form form={form} layout="vertical" onFinish={submit}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0 16px' }}>
                        {config.fields.map(field => <Form.Item key={field.name} name={field.name} label={field.label} rules={[{ required: field.required, message: `Vui lòng nhập ${field.label}` }]}>
                            {field.type === 'number' ? <InputNumber style={{ width: '100%' }} /> : field.type === 'date' ? <DatePicker showTime style={{ width: '100%' }} /> : field.type === 'select' ? <Select options={field.options} allowClear /> : <Input.TextArea autoSize={field.name === 'description' || field.name === 'note' ? { minRows: 2, maxRows: 4 } : undefined} />}
                        </Form.Item>)}
                    </div>
                </Form>
            </Modal>
        </div>
    </Access>;
};

export default GenericCrud;
