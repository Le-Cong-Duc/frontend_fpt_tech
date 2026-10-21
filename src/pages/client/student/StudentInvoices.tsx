import { useMemo, useState } from 'react';
import {
    Button,
    Card,
    Col,
    Descriptions,
    Input,
    Modal,
    Row,
    Select,
    Space,
    Table,
} from 'antd';
import {
    CheckCircleOutlined,
    CreditCardOutlined,
    EyeOutlined,
    FileTextOutlined,
    SearchOutlined,
} from '@ant-design/icons';
import { useAppSelector } from '@/redux/hooks';
import {
    StudentEmpty,
    StudentState,
    dateText,
    invoiceCourse,
    money,
    statusTag,
    updateLocalInvoice,
    useStudentData,
} from './student.shared';
import type { IPortalInvoice } from '@/types/backend';
import styles from '@/styles/client.module.scss';
import PaymentRequestModal from '@/components/client/PaymentRequestModal';

const StudentInvoices = () => {
    const user = useAppSelector(state => state.account.user);
    const data = useStudentData(user._id);

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>();
    const [selected, setSelected] = useState<IPortalInvoice | null>(null);

    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [payingInvoice, setPayingInvoice] = useState<IPortalInvoice | null>(null);

    const invoices = useMemo(() => {
        return data.invoices.filter(item => {
            const courseName = invoiceCourse(item);
            const className = item.enrollment_id?.class_id?.class_name || '';
            const matchSearch =
                !search ||
                `${item._id || ''} ${courseName} ${className}`.toLowerCase().includes(search.toLowerCase());
            const matchStatus = !statusFilter || item.status?.toUpperCase() === statusFilter;
            return matchSearch && matchStatus;
        });
    }, [data.invoices, search, statusFilter]);

    // Thống kê nhanh học phí
    const totalAmount = useMemo(() => {
        return data.invoices.reduce((sum, inv) => sum + (inv.final_amount || inv.amount || 0), 0);
    }, [data.invoices]);

    const paidAmount = useMemo(() => {
        return data.invoices
            .filter(inv => inv.status?.toUpperCase() === 'PAID')
            .reduce((sum, inv) => sum + (inv.final_amount || inv.amount || 0), 0);
    }, [data.invoices]);

    const unpaidAmount = totalAmount - paidAmount;

    // Mở modal thanh toán
    const handleOpenPayment = (invoice: IPortalInvoice) => {
        setPayingInvoice(invoice);
        setPaymentModalOpen(true);
    };

    return (
        <main className={`${styles.container} ${styles['student-page']}`}>
            <section className={styles['student-heading']}>
                <div>
                    <span>STUDENT / FINANCE</span>
                    <h1>Hóa đơn học phí</h1>
                    <p>Tra cứu chi tiết các khoản học phí, hạn thanh toán và thực hiện thanh toán trực tuyến.</p>
                </div>
            </section>

            <StudentState loading={data.loading} error={data.error}>
                {/* Thống kê học phí */}
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                    <Col xs={24} sm={8}>
                        <Card className={styles['portal-card']} style={{ borderLeft: '4px solid #1677ff' }}>
                            <span style={{ color: '#888', fontSize: 13 }}>Tổng học phí các khóa</span>
                            <h2 style={{ margin: '6px 0 0', color: '#1677ff' }}>{money(totalAmount)}</h2>
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card className={styles['portal-card']} style={{ borderLeft: '4px solid #52c41a' }}>
                            <span style={{ color: '#888', fontSize: 13 }}>Đã hoàn tất thanh toán</span>
                            <h2 style={{ margin: '6px 0 0', color: '#52c41a' }}>{money(paidAmount)}</h2>
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card className={styles['portal-card']} style={{ borderLeft: '4px solid #f5222d' }}>
                            <span style={{ color: '#888', fontSize: 13 }}>Học phí cần thanh toán</span>
                            <h2 style={{ margin: '6px 0 0', color: unpaidAmount > 0 ? '#f5222d' : '#52c41a' }}>
                                {money(unpaidAmount)}
                            </h2>
                        </Card>
                    </Col>
                </Row>

                {!data.invoices.length ? (
                    <StudentEmpty description="Tài khoản của bạn hiện chưa có hóa đơn học phí nào." />
                ) : (
                    <Card className={styles['portal-card']}>
                        <div className={styles['student-filters']}>
                            <Input
                                prefix={<SearchOutlined />}
                                placeholder="Tìm mã hóa đơn, tên môn hoặc lớp..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{ minWidth: 260 }}
                            />
                            <Select
                                allowClear
                                placeholder="Lọc theo trạng thái"
                                value={statusFilter}
                                onChange={setStatusFilter}
                                style={{ minWidth: 180 }}
                                options={[
                                    { label: 'Đã thanh toán (PAID)', value: 'PAID' },
                                    { label: 'Chưa thanh toán (UNPAID)', value: 'UNPAID' },
                                    { label: 'Chờ thanh toán (WAITING_PAYMENT)', value: 'WAITING_PAYMENT' },
                                    { label: 'Chờ xác nhận', value: 'WAITING_CONFIRMATION' },
                                    { label: 'Quá hạn (OVERDUE)', value: 'OVERDUE' },
                                ]}
                            />
                        </div>

                        <Table
                            rowKey="_id"
                            dataSource={invoices}
                            pagination={{ pageSize: 8, showTotal: total => `Tổng số ${total} hóa đơn` }}
                            scroll={{ x: 880 }}
                            columns={[
                                {
                                    title: 'STT',
                                    width: 60,
                                    render: (_: unknown, __: unknown, index: number) => index + 1,
                                },
                                {
                                    title: 'Mã hóa đơn',
                                    render: (_: unknown, item) => (
                                        <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                                            {item._id?.slice(-8).toUpperCase() || '—'}
                                        </span>
                                    ),
                                },
                                {
                                    title: 'Khóa học',
                                    render: (_: unknown, item) => (
                                        <b style={{ color: '#1677ff' }}>{invoiceCourse(item)}</b>
                                    ),
                                },
                                {
                                    title: 'Lớp học',
                                    render: (_: unknown, item) =>
                                        item.enrollment_id?.class_id?.class_name || 'Chưa cập nhật',
                                },
                                {
                                    title: 'Số tiền gốc',
                                    render: (_: unknown, item) => money(item.amount),
                                },
                                {
                                    title: 'Giảm giá',
                                    render: (_: unknown, item) =>
                                        item.discount_amount ? (
                                            <span style={{ color: '#52c41a' }}>-{money(item.discount_amount)}</span>
                                        ) : (
                                            '—'
                                        ),
                                },
                                {
                                    title: 'Thành tiền',
                                    render: (_: unknown, item) => (
                                        <b style={{ color: '#d4380d', fontSize: 14 }}>
                                            {money(item.final_amount || item.amount)}
                                        </b>
                                    ),
                                },
                                {
                                    title: 'Ngày tạo',
                                    dataIndex: 'createdAt',
                                    render: (val?: string) => dateText(val),
                                },
                                {
                                    title: 'Trạng thái',
                                    dataIndex: 'status',
                                    render: statusTag,
                                },
                                {
                                    title: 'Thao tác',
                                    fixed: 'right',
                                    render: (_: unknown, item) => {
                                        const status = item.status?.toUpperCase();
                                        const isPaid = status === 'PAID';
                                        const isPending = status === 'WAITING_CONFIRMATION';
                                        return (
                                            <Space>
                                                <Button
                                                    size="small"
                                                    icon={<EyeOutlined />}
                                                    onClick={() => setSelected(item)}
                                                >
                                                    Chi tiết
                                                </Button>
                                                {!isPaid && !isPending && (
                                                    <Button
                                                        size="small"
                                                        type="primary"
                                                        icon={<CreditCardOutlined />}
                                                        onClick={() => handleOpenPayment(item)}
                                                    >
                                                        Thanh toán
                                                    </Button>
                                                )}
                                            </Space>
                                        );
                                    },
                                },
                            ]}
                        />
                    </Card>
                )}
            </StudentState>

            {/* Modal Chi tiết Hóa đơn */}
            <Modal
                title="Chi tiết hóa đơn học phí"
                open={Boolean(selected)}
                footer={
                    !['PAID', 'WAITING_CONFIRMATION'].includes(selected?.status?.toUpperCase() || '') ? (
                        <Space>
                            <Button onClick={() => setSelected(null)}>Đóng</Button>
                            <Button
                                type="primary"
                                icon={<CreditCardOutlined />}
                                onClick={() => {
                                    const inv = selected;
                                    setSelected(null);
                                    if (inv) handleOpenPayment(inv);
                                }}
                            >
                                Thanh toán ngay
                            </Button>
                        </Space>
                    ) : (
                        <Button type="primary" onClick={() => setSelected(null)}>
                            Đóng
                        </Button>
                    )
                }
                onCancel={() => setSelected(null)}
                width={650}
            >
                {selected && (
                    <Descriptions bordered column={1} size="small">
                        <Descriptions.Item label="Mã hóa đơn">{selected._id}</Descriptions.Item>
                        <Descriptions.Item label="Khóa học">{invoiceCourse(selected)}</Descriptions.Item>
                        <Descriptions.Item label="Lớp học">
                            {selected.enrollment_id?.class_id?.class_name || 'Chưa cập nhật'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Học viên">
                            {user.name} ({user.email})
                        </Descriptions.Item>
                        <Descriptions.Item label="Số tiền gốc">{money(selected.amount)}</Descriptions.Item>
                        <Descriptions.Item label="Giảm giá / Ưu đãi">
                            {money(selected.discount_amount || 0)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Tổng số tiền thanh toán">
                            <b style={{ color: '#d4380d', fontSize: 16 }}>
                                {money(selected.final_amount || selected.amount)}
                            </b>
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày xuất hóa đơn">
                            {dateText(selected.createdAt as any)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Trạng thái">{statusTag(selected.status)}</Descriptions.Item>
                    </Descriptions>
                )}
            </Modal>

            {/* Modal Thanh toán học phí trực tuyến */}
            <PaymentRequestModal
                invoice={paymentModalOpen ? payingInvoice : null}
                userName={user.name}
                onClose={() => {
                    setPaymentModalOpen(false);
                    setPayingInvoice(null);
                }}
                onRequested={() => {
                    if (payingInvoice?._id) updateLocalInvoice(user._id, payingInvoice._id, { status: 'WAITING_CONFIRMATION' });
                    setPaymentModalOpen(false);
                    setPayingInvoice(null);
                    void data.refresh();
                }}
            />
        </main>
    );
};

export default StudentInvoices;
