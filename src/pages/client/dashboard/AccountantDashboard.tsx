import { Alert, Col, Row } from 'antd';
import { CreditCardOutlined, FileTextOutlined, RiseOutlined, WalletOutlined } from '@ant-design/icons';
import { useAppSelector } from '@/redux/hooks';
import { useAccountantData, money, invoiceStatusText } from '@/pages/client/accountant/accountant.shared';
import styles from '@/styles/client.module.scss';
import StatCard from './components/StatCard';
import QuickActionCard from './components/QuickActionCard';
import RecentActivity, { type ActivityItem } from './components/RecentActivity';

const AccountantDashboard = () => {
    const user = useAppSelector(state => state.account.user);
    const { invoices, payments, loading, error } = useAccountantData();

    const totalPaid = invoices.filter(item => item.status?.toUpperCase() === 'PAID').reduce((sum, item) => sum + Number(item.final_amount ?? item.amount ?? 0), 0);
    const unpaidInvoices = invoices.filter(item => item.status?.toUpperCase() !== 'PAID').length;
    const paidInvoices = invoices.filter(item => item.status?.toUpperCase() === 'PAID').length;

    const stats = [
        { title: 'Tổng hóa đơn', value: invoices.length, icon: <FileTextOutlined />, accent: 'teal' as const },
        { title: 'Chưa thanh toán', value: unpaidInvoices, icon: <WalletOutlined />, accent: 'navy' as const },
        { title: 'Đã thanh toán', value: paidInvoices, icon: <CreditCardOutlined />, accent: 'green' as const },
        { title: 'Doanh thu', value: money(totalPaid), icon: <RiseOutlined />, accent: 'coral' as const },
    ];

    const activities: ActivityItem[] = payments.slice(0, 6).map(payment => ({
        key: payment._id || payment.payment_date || 'payment',
        title: payment.payment_method || 'Giao dịch thanh toán',
        detail: `${payment.payment_date ? new Date(payment.payment_date).toLocaleDateString('vi-VN') : 'Chưa cập nhật'} · ${payment.invoice_id || 'Hóa đơn'}`,
        icon: <CreditCardOutlined />,
        status: 'Đã ghi nhận',
    }));

    const quickActions = [
        { label: 'Học phí', description: 'Theo dõi công nợ học viên', icon: <WalletOutlined />, to: '/client/accountant/tuition' },
        { label: 'Hóa đơn', description: 'Danh sách hóa đơn', icon: <FileTextOutlined />, to: '/client/accountant/invoices' },
        { label: 'Thanh toán', description: 'Lịch sử giao dịch', icon: <CreditCardOutlined />, to: '/client/accountant/payments' },
        { label: 'Doanh thu', description: 'Báo cáo doanh thu', icon: <RiseOutlined />, to: '/client/accountant/revenue' },
    ];

    return (
        <main className={`${styles.container} ${styles['client-dashboard-page']}`}>
            <section className={styles['client-welcome']}>
                <div>
                    <span>ACCOUNTANT / DASHBOARD</span>
                    <h1>Xin chào, {user.name || 'Kế toán'}!</h1>
                    <p>Theo dõi hóa đơn, thanh toán và doanh thu của trung tâm trong một nơi.</p>
                </div>
            </section>

            {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}

            <Row gutter={[16, 16]}>
                {stats.map(stat => (
                    <Col xs={24} sm={12} lg={6} key={stat.title}>
                        <StatCard
                            title={stat.title}
                            value={stat.value}
                            icon={stat.icon}
                            accent={stat.accent}
                            loading={loading}
                            emptyText="0"
                        />
                    </Col>
                ))}
            </Row>

            <section className={styles['client-quick-grid']}>
                {quickActions.map(action => (
                    <QuickActionCard key={action.to} {...action} />
                ))}
            </section>

            <Row gutter={[18, 18]} className={styles['client-dashboard-main']}>
                <Col xs={24} lg={15}>
                    <RecentActivity
                        title="Thanh toán gần đây"
                        items={activities}
                        loading={loading}
                        error={error}
                        emptyText="Chưa có giao dịch thanh toán"
                    />
                </Col>

                <Col xs={24} lg={9}>
                    <section className={styles['client-dashboard-panel']}>
                        <div className={styles['client-panel-heading']}>
                            <h2>Tình trạng tài chính</h2>
                        </div>

                        <div style={{ display: 'grid', gap: 12 }}>
                            <div className={styles['client-event-row']}>
                                <FileTextOutlined />
                                <div>
                                    <strong>Hóa đơn chưa thanh toán</strong>
                                    <span>{unpaidInvoices} hóa đơn</span>
                                </div>
                            </div>

                            <div className={styles['client-event-row']}>
                                <CreditCardOutlined />
                                <div>
                                    <strong>Đã thu</strong>
                                    <span>{money(totalPaid)}</span>
                                </div>
                            </div>

                            <div className={styles['client-event-row']}>
                                <RiseOutlined />
                                <div>
                                    <strong>Hóa đơn đã thanh toán</strong>
                                    <span>{paidInvoices} hóa đơn</span>
                                </div>
                            </div>
                        </div>

                        {!loading && invoices.length > 0 && (
                            <div style={{ marginTop: 16 }}>
                                {invoices.slice(0, 3).map(invoice => (
                                    <div key={invoice._id || 'invoice'} className={styles['client-event-row']}>
                                        <FileTextOutlined />
                                        <div>
                                            <strong>{invoiceStatusText(invoice.status)}</strong>
                                            <span>{money(Number(invoice.final_amount ?? invoice.amount ?? 0))}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </Col>
            </Row>
        </main>
    );
};

export default AccountantDashboard;
