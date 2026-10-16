import { useMemo, useState } from 'react';
import { Button, Card, Col, Descriptions, Input, Modal, Row, Select, Space, Table, Tag } from 'antd';
import {
    CheckCircleOutlined,
    CreditCardOutlined,
    EyeOutlined,
    PrinterOutlined,
    SearchOutlined,
} from '@ant-design/icons';
import { useAppSelector } from '@/redux/hooks';
import {
    StudentEmpty,
    StudentState,
    dateText,
    invoiceCourse,
    money,
    useStudentData,
} from './student.shared';
import type { IPortalPayment } from '@/types/backend';
import styles from '@/styles/client.module.scss';

const StudentPayments = () => {
    const user = useAppSelector(state => state.account.user);
    const data = useStudentData('payments');

    const [search, setSearch] = useState('');
    const [methodFilter, setMethodFilter] = useState<string>();
    const [selected, setSelected] = useState<IPortalPayment | null>(null);

    const payments = useMemo(() => {
        return data.payments.filter(item => {
            const courseName = invoiceCourse(item.invoice_id as any);
            const invoiceId = item.invoice_id?._id || '';
            const matchSearch =
                !search ||
                `${item._id || ''} ${invoiceId} ${courseName}`.toLowerCase().includes(search.toLowerCase());
            const matchMethod = !methodFilter || item.payment_method === methodFilter;
            return matchSearch && matchMethod;
        });
    }, [data.payments, search, methodFilter]);

    const totalPaid = useMemo(() => {
        return data.payments.reduce((sum, item) => {
            const amount = item.invoice_id?.final_amount || item.invoice_id?.amount || 0;
            return sum + amount;
        }, 0);
    }, [data.payments]);

    const latestPayment = useMemo(() => {
        if (!data.payments.length) return null;
        return data.payments[0];
    }, [data.payments]);

    return (
        <main className={`${styles.container} ${styles['student-page']}`}>
            <section className={styles['student-heading']}>
                <div>
                    <span>STUDENT / FINANCE</span>
                    <h1>Lịch sử giao dịch & Thanh toán</h1>
                    <p>Theo dõi biên lai thu tiền, phương thức giao dịch và lịch sử thanh toán học phí cá nhân.</p>
                </div>
            </section>

            <StudentState loading={data.loading} error={data.error}>
                {/* Thống kê giao dịch */}
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                    <Col xs={24} sm={8}>
                        <Card className={styles['portal-card']} style={{ borderLeft: '4px solid #1677ff' }}>
                            <span style={{ color: '#888', fontSize: 13 }}>Tổng số giao dịch</span>
                            <h2 style={{ margin: '6px 0 0', color: '#1677ff' }}>{data.payments.length} lượt</h2>
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card className={styles['portal-card']} style={{ borderLeft: '4px solid #52c41a' }}>
                            <span style={{ color: '#888', fontSize: 13 }}>Tổng tiền đã thanh toán</span>
                            <h2 style={{ margin: '6px 0 0', color: '#52c41a' }}>{money(totalPaid)}</h2>
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card className={styles['portal-card']} style={{ borderLeft: '4px solid #722ed1' }}>
                            <span style={{ color: '#888', fontSize: 13 }}>Giao dịch gần nhất</span>
                            <h2 style={{ margin: '6px 0 0', color: '#722ed1', fontSize: 18 }}>
                                {latestPayment ? dateText(latestPayment.payment_date) : 'Chưa có giao dịch'}
                            </h2>
                        </Card>
                    </Col>
                </Row>

                {!data.payments.length ? (
                    <StudentEmpty description="Bạn chưa có bất kỳ giao dịch thanh toán nào được ghi nhận." />
                ) : (
                    <Card className={styles['portal-card']}>
                        <div className={styles['student-filters']}>
                            <Input
                                prefix={<SearchOutlined />}
                                placeholder="Tìm theo mã giao dịch, mã hóa đơn hoặc môn học..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{ minWidth: 300 }}
                            />
                            <Select
                                allowClear
                                placeholder="Phương thức thanh toán"
                                value={methodFilter}
                                onChange={setMethodFilter}
                                style={{ minWidth: 200 }}
                                options={[
                                    { label: 'Chuyển khoản (BANK_TRANSFER)', value: 'BANK_TRANSFER' },
                                    { label: 'Tiền mặt (CASH)', value: 'CASH' },
                                ]}
                            />
                        </div>

                        <Table
                            rowKey="_id"
                            dataSource={payments}
                            pagination={{ pageSize: 8, showTotal: total => `Tổng số ${total} giao dịch` }}
                            scroll={{ x: 800 }}
                            columns={[
                                {
                                    title: 'STT',
                                    width: 60,
                                    render: (_: unknown, __: unknown, index: number) => index + 1,
                                },
                                {
                                    title: 'Mã giao dịch',
                                    render: (_: unknown, item) => (
                                        <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                                            {item._id?.slice(-8).toUpperCase() || '—'}
                                        </span>
                                    ),
                                },
                                {
                                    title: 'Mã hóa đơn',
                                    render: (_: unknown, item) => (
                                        <span style={{ fontFamily: 'monospace' }}>
                                            {item.invoice_id?._id?.slice(-8).toUpperCase() || '—'}
                                        </span>
                                    ),
                                },
                                {
                                    title: 'Khóa học',
                                    render: (_: unknown, item) => (
                                        <b style={{ color: '#1677ff' }}>
                                            {invoiceCourse(item.invoice_id as any)}
                                        </b>
                                    ),
                                },
                                {
                                    title: 'Số tiền đã nộp',
                                    render: (_: unknown, item) => (
                                        <b style={{ color: '#52c41a' }}>
                                            {money(item.invoice_id?.final_amount || item.invoice_id?.amount)}
                                        </b>
                                    ),
                                },
                                {
                                    title: 'Phương thức',
                                    dataIndex: 'payment_method',
                                    render: (val?: string) =>
                                        val === 'BANK_TRANSFER' ? (
                                            <Tag color="blue">Chuyển khoản</Tag>
                                        ) : val === 'CASH' ? (
                                            <Tag color="orange">Tiền mặt</Tag>
                                        ) : (
                                            <Tag>{val || 'Chưa cập nhật'}</Tag>
                                        ),
                                },
                                {
                                    title: 'Ngày thanh toán',
                                    dataIndex: 'payment_date',
                                    render: (val?: string) => dateText(val),
                                },
                                {
                                    title: 'Trạng thái',
                                    render: () => <Tag color="green">Đã ghi nhận</Tag>,
                                },
                                {
                                    title: 'Biên lai',
                                    render: (_: unknown, item) => (
                                        <Button
                                            size="small"
                                            icon={<EyeOutlined />}
                                            onClick={() => setSelected(item)}
                                        >
                                            Xem biên lai
                                        </Button>
                                    ),
                                },
                            ]}
                        />
                    </Card>
                )}
            </StudentState>

            {/* Modal Xem Biên lai thanh toán */}
            <Modal
                title={
                    <Space>
                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                        <span>Biên lai xác nhận thu học phí</span>
                    </Space>
                }
                open={Boolean(selected)}
                footer={
                    <Space>
                        <Button icon={<PrinterOutlined />} onClick={() => window.print()}>
                            In biên lai
                        </Button>
                        <Button type="primary" onClick={() => setSelected(null)}>
                            Đóng
                        </Button>
                    </Space>
                }
                onCancel={() => setSelected(null)}
                width={600}
            >
                {selected && (
                    <div style={{ padding: '10px 0' }}>
                        <div
                            style={{
                                textAlign: 'center',
                                paddingBottom: 16,
                                marginBottom: 16,
                                borderBottom: '1px dashed #d9d9d9',
                            }}
                        >
                            <h3 style={{ margin: 0, color: '#1677ff' }}>TRUNG TÂM ĐÀO TẠO FPT EDUCATION</h3>
                            <span style={{ color: '#888', fontSize: 12 }}>PHIẾU XÁC NHẬN THU HỌC PHÍ</span>
                        </div>

                        <Descriptions column={1} bordered size="small">
                            <Descriptions.Item label="Mã giao dịch">
                                <b>{selected._id}</b>
                            </Descriptions.Item>
                            <Descriptions.Item label="Mã hóa đơn">
                                {selected.invoice_id?._id || '—'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Khóa học">
                                {invoiceCourse(selected.invoice_id as any)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Học viên nộp tiền">
                                {user.name} ({user.email})
                            </Descriptions.Item>
                            <Descriptions.Item label="Số tiền đã nộp">
                                <b style={{ color: '#52c41a', fontSize: 16 }}>
                                    {money(selected.invoice_id?.final_amount || selected.invoice_id?.amount)}
                                </b>
                            </Descriptions.Item>
                            <Descriptions.Item label="Hình thức thanh toán">
                                {selected.payment_method === 'BANK_TRANSFER' ? 'Chuyển khoản ngân hàng' : 'Tiền mặt'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Thời gian giao dịch">
                                {dateText(selected.payment_date)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Trạng thái chứng từ">
                                <Tag color="green">GIAO DỊCH HỢP LỆ</Tag>
                            </Descriptions.Item>
                        </Descriptions>
                    </div>
                )}
            </Modal>
        </main>
    );
};

export default StudentPayments;
