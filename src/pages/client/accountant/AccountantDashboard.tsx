import { Card, Col, Row, Table, Tag } from 'antd';
import { CreditCardOutlined, FileDoneOutlined, RiseOutlined, UserOutlined } from '@ant-design/icons';
import { useAppSelector } from '@/redux/hooks';
import { AccountantEmpty, AccountantState, StatCard, dateText, getClassName, getStudentName, money, statusTag, useAccountantData, useInvoiceRows } from './accountant.shared';
import styles from '@/styles/client.module.scss';

const AccountantDashboard = () => {
    const user = useAppSelector(state => state.account.user);
    const data = useAccountantData();
    const rows = useInvoiceRows(data);
    const paidInvoices = rows.filter(row => row.invoice.status?.toUpperCase() === 'PAID');
    const unpaidInvoices = rows.filter(row => row.invoice.status?.toUpperCase() !== 'PAID' && row.invoice.status?.toUpperCase() !== 'CANCELLED');
    const revenue = paidInvoices.reduce((sum, row) => sum + (row.invoice.final_amount || row.invoice.amount || 0), 0);
    const recentPayments = [...data.payments].sort((a, b) => new Date(b.payment_date || 0).getTime() - new Date(a.payment_date || 0).getTime()).slice(0, 6);

    return <main className={`${styles.container} ${styles['accountant-page']}`}>
        <section className={styles['accountant-welcome']}><div><span>ACCOUNTANT WORKSPACE</span><h1>Xin chào, {user.name || 'Kế toán'}</h1><p>Theo dõi học phí, hóa đơn và dòng tiền của trung tâm trong một nơi.</p></div><div className={styles['accountant-welcome-badge']}><RiseOutlined /></div></section>
        <AccountantState loading={data.loading} error={data.error}>
            {!data.invoices.length && !data.payments.length ? <AccountantEmpty description="Chưa có dữ liệu tài chính" /> : <>
                <Row gutter={[16, 16]} className={styles['accountant-stat-grid']}>
                    <Col xs={24} sm={12} lg={6}><StatCard title="Doanh thu đã thu" value={money(revenue)} icon={<RiseOutlined />} accent="teal" /></Col>
                    <Col xs={24} sm={12} lg={6}><StatCard title="Tổng hóa đơn" value={data.invoices.length} icon={<FileDoneOutlined />} accent="navy" /></Col>
                    <Col xs={24} sm={12} lg={6}><StatCard title="Đã thanh toán" value={paidInvoices.length} icon={<CreditCardOutlined />} accent="green" /></Col>
                    <Col xs={24} sm={12} lg={6}><StatCard title="Chờ thanh toán" value={unpaidInvoices.length} icon={<UserOutlined />} accent="coral" /></Col>
                </Row>
                <Row gutter={[18, 18]} className={styles['accountant-lower-grid']}>
                    <Col xs={24} lg={15}><Card className={styles['portal-card']} title="Thanh toán gần đây"><Table size="middle" pagination={false} rowKey={(row) => row._id || `${row.invoice_id}-${row.payment_date}`} dataSource={recentPayments} scroll={{ x: 650 }} columns={[{ title: 'Học viên', render: (_: unknown, payment) => { const invoice = typeof payment.invoice_id === 'object' ? payment.invoice_id : data.invoices.find(item => item._id === payment.invoice_id); return invoice ? getStudentName(invoice, data.enrollments, data.users) : 'Chưa cập nhật'; } }, { title: 'Hóa đơn', render: (_: unknown, payment) => typeof payment.invoice_id === 'string' ? payment.invoice_id.slice(-8).toUpperCase() : payment.invoice_id?._id?.slice(-8).toUpperCase() }, { title: 'Số tiền', render: (_: unknown, payment) => { const invoice = typeof payment.invoice_id === 'object' ? payment.invoice_id : data.invoices.find(item => item._id === payment.invoice_id); return <b>{money(invoice?.final_amount || invoice?.amount)}</b>; } }, { title: 'Ngày', dataIndex: 'payment_date', render: dateText }, { title: 'Trạng thái', render: () => <Tag color="green">Đã ghi nhận</Tag> }]} /></Card></Col>
                    <Col xs={24} lg={9}><Card className={styles['portal-card']} title="Học viên chưa đóng phí"><div className={styles['accountant-unpaid-list']}>{unpaidInvoices.slice(0, 5).map(row => <div className={styles['accountant-unpaid-item']} key={row.invoice._id}><div><strong>{getStudentName(row.invoice, data.enrollments, data.users)}</strong><span>{getClassName(row.invoice, data.enrollments, data.classrooms)}</span></div><b>{money((row.invoice.final_amount || row.invoice.amount || 0) - row.paid)}</b></div>)}{!unpaidInvoices.length && <p className={styles.muted}>Tất cả hóa đơn đã được thanh toán.</p>}</div></Card></Col>
                </Row>
                <Card className={`${styles['portal-card']} ${styles['accountant-new-invoices']}`} title="Hóa đơn mới tạo"><Table size="small" pagination={{ pageSize: 5 }} rowKey="_id" dataSource={[...data.invoices].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).slice(0, 8)} scroll={{ x: 700 }} columns={[{ title: 'Mã hóa đơn', render: (_: unknown, invoice) => invoice._id?.slice(-10).toUpperCase() }, { title: 'Học viên', render: (_: unknown, invoice) => getStudentName(invoice, data.enrollments, data.users) }, { title: 'Thành tiền', render: (_: unknown, invoice) => <b>{money(invoice.final_amount || invoice.amount)}</b> }, { title: 'Ngày tạo', dataIndex: 'createdAt', render: dateText }, { title: 'Trạng thái', dataIndex: 'status', render: statusTag }]} /></Card>
            </>}
        </AccountantState>
    </main>;
};

export default AccountantDashboard;
