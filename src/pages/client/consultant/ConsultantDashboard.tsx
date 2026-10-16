import { useMemo } from 'react';
import { Button, Card, Col, Progress, Row, Space, Table, Tag, Tooltip } from 'antd';
import {
    ArrowRightOutlined,
    BookOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    ContactsOutlined,
    MessageOutlined,
    PhoneOutlined,
    PlusOutlined,
    RiseOutlined,
    TeamOutlined,
    UserAddOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useAppSelector } from '@/redux/hooks';
import {
    ConsultantEmpty,
    ConsultantState,
    LeadIcon,
    StatCard,
    dateText,
    money,
    statusTag,
    useConsultantData,
    useLeadStats,
} from './consultant.shared';
import type { ILead } from '@/types/backend';
import styles from '@/styles/client.module.scss';

const ConsultantDashboard = () => {
    const navigate = useNavigate();
    const user = useAppSelector(state => state.account.user);
    const data = useConsultantData();
    const stats = useLeadStats(data.leads);

    // Khách hàng cần liên hệ (mới hoặc chưa chốt)
    const pendingLeads = useMemo(() => {
        return data.leads
            .filter(lead => {
                const s = lead.status?.toUpperCase() || 'NEW';
                return s !== 'REGISTERED' && s !== 'CANCELLED';
            })
            .sort((a, b) => {
                const tA = new Date((a as any).createdAt || 0).getTime();
                const tB = new Date((b as any).createdAt || 0).getTime();
                return tB - tA;
            })
            .slice(0, 6);
    }, [data.leads]);

    // Các khóa học nổi bật
    const popularCourses = useMemo(() => {
        return data.courses.slice(0, 5);
    }, [data.courses]);

    return (
        <main className={`${styles.container} ${styles['consultant-page']}`}>
            {/* Header chào mừng Tư vấn viên */}
            <section className={styles['consultant-welcome']}>
                <div>
                    <span>BAN TUYỂN SINH · BẢNG ĐIỀU HÀNH TƯ VẤN</span>
                    <h1>Xin chào, {user.name || 'Tư vấn viên'}!</h1>
                    <p>
                        Hôm nay là {dayjs().format('dddd, DD/MM/YYYY')}. Quản lý phễu tuyển sinh, chăm sóc khách hàng và chốt ghi danh học viên.
                    </p>
                </div>
                <Space wrap>
                    <Button
                        type="primary"
                        icon={<UserAddOutlined />}
                        onClick={() => navigate('/client/consultant/customers')}
                    >
                        Thêm khách hàng mới
                    </Button>
                    <Button
                        icon={<TeamOutlined />}
                        onClick={() => navigate('/client/consultant/enrollments')}
                    >
                        Ghi danh vào lớp
                    </Button>
                    <Button
                        icon={<MessageOutlined />}
                        onClick={() => navigate('/client/consultant/chat')}
                    >
                        Mở tin nhắn tư vấn
                    </Button>
                </Space>
            </section>

            <ConsultantState loading={data.loading} error={data.error}>
                {/* 4 Thẻ KPI Tuyển sinh */}
                <Row gutter={[16, 16]} style={{ marginBottom: 18 }}>
                    <Col xs={24} sm={12} lg={6}>
                        <StatCard
                            title="Tổng khách hàng được giao"
                            value={stats.total}
                            subValue="Toàn bộ data trong danh sách"
                            icon={<ContactsOutlined />}
                            accent="teal"
                        />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <StatCard
                            title="Khách mới cần liên hệ"
                            value={stats.newLeads}
                            subValue="Cần gọi điện trong 24h"
                            icon={<UserAddOutlined />}
                            accent="coral"
                        />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <StatCard
                            title="Đang trong quá trình tư vấn"
                            value={stats.consulted + stats.contacted}
                            subValue={`${stats.consulted} ca chuyên sâu, ${stats.contacted} đã kết nối`}
                            icon={<MessageOutlined />}
                            accent="navy"
                        />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <StatCard
                            title="Đã chốt đăng ký thành công"
                            value={stats.registered}
                            subValue={`Tỷ lệ chuyển đổi: ${stats.conversionRate}%`}
                            icon={<CheckCircleOutlined />}
                            accent="green"
                        />
                    </Col>
                </Row>

                {/* Phễu chuyển đổi tuyển sinh (Funnel Bar) */}
                <Card className={styles['portal-card']} style={{ marginBottom: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                        <div>
                            <strong style={{ fontSize: 15, color: '#102a43' }}>Tiến độ phễu tuyển sinh (Admissions Pipeline)</strong>
                            <div style={{ fontSize: 12, color: '#627d98' }}>Chuyển hóa từ khách hàng tiềm năng đến ghi danh chính thức</div>
                        </div>
                        <Button type="link" onClick={() => navigate('/client/consultant/follow-up')}>
                            Xem bảng Kanban phễu <ArrowRightOutlined />
                        </Button>
                    </div>

                    <Row gutter={[12, 12]}>
                        <Col xs={12} sm={6}>
                            <div style={{ padding: 12, background: '#fff7ed', borderRadius: 8, borderLeft: '4px solid #fa8c16' }}>
                                <div style={{ fontSize: 12, color: '#8c4b00' }}>1. Khách hàng mới</div>
                                <div style={{ fontSize: 20, fontWeight: 700, color: '#fa8c16' }}>{stats.newLeads}</div>
                            </div>
                        </Col>
                        <Col xs={12} sm={6}>
                            <div style={{ padding: 12, background: '#e6fffb', borderRadius: 8, borderLeft: '4px solid #13c2c2' }}>
                                <div style={{ fontSize: 12, color: '#00474f' }}>2. Đã liên hệ</div>
                                <div style={{ fontSize: 20, fontWeight: 700, color: '#13c2c2' }}>{stats.contacted}</div>
                            </div>
                        </Col>
                        <Col xs={12} sm={6}>
                            <div style={{ padding: 12, background: '#e6f7ff', borderRadius: 8, borderLeft: '4px solid #1890ff' }}>
                                <div style={{ fontSize: 12, color: '#003a8c' }}>3. Đang tư vấn</div>
                                <div style={{ fontSize: 20, fontWeight: 700, color: '#1890ff' }}>{stats.consulted}</div>
                            </div>
                        </Col>
                        <Col xs={12} sm={6}>
                            <div style={{ padding: 12, background: '#f6ffed', borderRadius: 8, borderLeft: '4px solid #52c41a' }}>
                                <div style={{ fontSize: 12, color: '#135200' }}>4. Đã đăng ký học</div>
                                <div style={{ fontSize: 20, fontWeight: 700, color: '#52c41a' }}>{stats.registered}</div>
                            </div>
                        </Col>
                    </Row>
                </Card>

                {/* Grid 2 cột: Bảng Khách hàng cần follow-up & Khóa học */}
                <Row gutter={[18, 18]} className={styles['consultant-dashboard-grid']}>
                    {/* Cột trái: Khách hàng cần chăm sóc */}
                    <Col xs={24} lg={15}>
                        <Card
                            className={styles['portal-card']}
                            title="Khách hàng tiềm năng cần chăm sóc"
                            extra={
                                <Button type="link" onClick={() => navigate('/client/consultant/customers')}>
                                    Xem tất cả ({data.leads.length}) <ArrowRightOutlined />
                                </Button>
                            }
                        >
                            {!pendingLeads.length ? (
                                <ConsultantEmpty description="Tất cả khách hàng đã được chăm sóc hoặc đã đăng ký học!" />
                            ) : (
                                <Table
                                    size="small"
                                    pagination={false}
                                    rowKey="_id"
                                    dataSource={pendingLeads}
                                    scroll={{ x: 650 }}
                                    columns={[
                                        {
                                            title: 'Khách hàng',
                                            render: (_, lead: ILead) => (
                                                <div className={styles['consultant-person-cell']}>
                                                    <strong>
                                                        <LeadIcon status={lead.status} /> {lead.full_name || lead.name}
                                                    </strong>
                                                    <span>{lead.email}</span>
                                                </div>
                                            ),
                                        },
                                        {
                                            title: 'Số điện thoại',
                                            dataIndex: 'phone',
                                            render: phone => (
                                                <span style={{ color: '#0f62fe', fontWeight: 600 }}>
                                                    <PhoneOutlined /> {phone || 'Chưa có SĐT'}
                                                </span>
                                            ),
                                        },
                                        {
                                            title: 'Khóa học quan tâm',
                                            dataIndex: 'course_name',
                                            render: name => <b>{name || 'Chưa xác định'}</b>,
                                        },
                                        {
                                            title: 'Trạng thái',
                                            dataIndex: 'status',
                                            render: statusTag,
                                        },
                                        {
                                            title: 'Thao tác',
                                            render: (_, lead: ILead) => (
                                                <Space size="small">
                                                    <Button
                                                        size="small"
                                                        type="primary"
                                                        onClick={() => navigate('/client/consultant/customers')}
                                                    >
                                                        Tư vấn
                                                    </Button>
                                                </Space>
                                            ),
                                        },
                                    ]}
                                />
                            )}
                        </Card>
                    </Col>

                    {/* Cột phải: Khóa học & Hiệu suất */}
                    <Col xs={24} lg={9}>
                        <Card
                            className={styles['portal-card']}
                            title="Chương trình đào tạo mở tuyển sinh"
                            style={{ marginBottom: 18 }}
                            extra={
                                <Button type="link" onClick={() => navigate('/client/consultant/courses')}>
                                    Kho khóa học <ArrowRightOutlined />
                                </Button>
                            }
                        >
                            <div className={styles['consultant-interest-list']}>
                                {popularCourses.map(course => {
                                    const openClasses = data.classrooms.filter(
                                        c => (c.course_id?._id === course._id || c.course_id === course._id) && c.status === 'OPEN'
                                    );
                                    return (
                                        <div key={course._id} style={{ padding: '8px 0', borderBottom: '1px solid #f0f4f8' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <strong style={{ color: '#0b3d91', fontSize: 14 }}>{course.name}</strong>
                                                <Tag color="blue">{openClasses.length} lớp mở</Tag>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#627d98', marginTop: 4 }}>
                                                <span>Cấp độ: {course.level || 'Cơ bản đến nâng cao'}</span>
                                                <b style={{ color: '#0f62fe' }}>{money(course.price)}</b>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>

                        <Card className={styles['portal-card']} title="Tỷ lệ chốt tuyển sinh (Conversion Rate)">
                            <div style={{ textAlign: 'center', padding: '16px 0' }}>
                                <Progress
                                    type="circle"
                                    percent={stats.conversionRate}
                                    strokeColor={{
                                        '0%': '#108ee9',
                                        '100%': '#52c41a',
                                    }}
                                />
                                <div style={{ marginTop: 12, fontSize: 13, color: '#486581' }}>
                                    Đã chốt thành công: <b>{stats.registered}</b> / {stats.total} khách hàng
                                </div>
                            </div>
                        </Card>
                    </Col>
                </Row>
            </ConsultantState>
        </main>
    );
};

export default ConsultantDashboard;
