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
    Tag,
} from 'antd';
import {
    BookOutlined,
    CalendarOutlined,
    DollarCircleOutlined,
    EyeOutlined,
    IdcardOutlined,
    SearchOutlined,
    TeamOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
    ConsultantEmpty,
    ConsultantState,
    StatCard,
    money,
    useConsultantData,
} from './consultant.shared';
import type { IClassroomWithDetails, ICourse } from '@/types/backend';
import styles from '@/styles/client.module.scss';

const ConsultantCourses = () => {
    const navigate = useNavigate();
    const data = useConsultantData();

    const [search, setSearch] = useState('');
    const [levelFilter, setLevelFilter] = useState<string>();
    const [selectedCourse, setSelectedCourse] = useState<ICourse | null>(null);

    // Lọc danh sách khóa học
    const filteredCourses = useMemo(() => {
        return data.courses.filter(course => {
            const name = course.name || '';
            const desc = course.description || '';
            const matchSearch = `${name} ${desc}`.toLowerCase().includes(search.toLowerCase());
            const matchLevel = !levelFilter || course.level === levelFilter;
            return matchSearch && matchLevel;
        });
    }, [data.courses, levelFilter, search]);

    // Các lớp học đang mở của khóa học được chọn
    const openClassesForSelected = useMemo(() => {
        if (!selectedCourse?._id) return [];
        return data.classrooms.filter(c => {
            const cId = typeof c.course_id === 'string' ? c.course_id : (c.course_id as any)?._id;
            return cId === selectedCourse._id;
        });
    }, [data.classrooms, selectedCourse]);

    const levelOptions = useMemo(() => {
        return Array.from(new Set(data.courses.map(c => c.level).filter(Boolean)));
    }, [data.courses]);

    return (
        <main className={`${styles.container} ${styles['consultant-page']}`}>
            <section className={styles['consultant-page-heading']}>
                <div>
                    <span>TUYỂN SINH / KHO KHÓA HỌC</span>
                    <h1>Kho chương trình đào tạo & Lộ trình tư vấn</h1>
                    <p>Tra cứu thông tin chi tiết các khóa học, học phí niêm yết và lịch khai giảng các lớp đang mở.</p>
                </div>
            </section>

            <ConsultantState loading={data.loading} error={data.error}>
                {/* 3 Thẻ thống kê */}
                <Row gutter={[16, 16]} style={{ marginBottom: 18 }}>
                    <Col xs={24} sm={8}>
                        <StatCard
                            title="Tổng chương trình đào tạo"
                            value={data.courses.length}
                            subValue="Khóa học đang hoạt động"
                            icon={<BookOutlined />}
                            accent="teal"
                        />
                    </Col>
                    <Col xs={24} sm={8}>
                        <StatCard
                            title="Tổng lớp học đang mở"
                            value={data.classrooms.filter(c => c.status === 'OPEN' || !c.status).length}
                            subValue="Sẵn sàng tiếp nhận học viên"
                            icon={<IdcardOutlined />}
                            accent="green"
                        />
                    </Col>
                    <Col xs={24} sm={8}>
                        <StatCard
                            title="Số lớp đã tuyển đủ sĩ số"
                            value={data.classrooms.filter(c => c.status === 'FULL').length}
                            subValue="Đã chốt danh sách"
                            icon={<TeamOutlined />}
                            accent="navy"
                        />
                    </Col>
                </Row>

                <Card className={styles['portal-card']}>
                    {/* Thanh lọc tìm kiếm */}
                    <div className={styles['consultant-filters']} style={{ marginBottom: 16 }}>
                        <Input
                            allowClear
                            prefix={<SearchOutlined />}
                            placeholder="Tìm kiếm theo tên khóa học hoặc nội dung mô tả..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ flex: 2 }}
                        />
                        <Select
                            allowClear
                            placeholder="Lọc theo cấp độ"
                            value={levelFilter}
                            onChange={setLevelFilter}
                            style={{ width: 220 }}
                            options={levelOptions.map(l => ({ label: l, value: l }))}
                        />
                    </div>

                    {!filteredCourses.length ? (
                        <ConsultantEmpty description="Không tìm thấy khóa học nào phù hợp" />
                    ) : (
                        <Table
                            rowKey="_id"
                            dataSource={filteredCourses}
                            pagination={{ pageSize: 8, showSizeChanger: true }}
                            scroll={{ x: 1000 }}
                            columns={[
                                {
                                    title: 'Khóa học',
                                    render: (_, c: ICourse) => (
                                        <div className={styles['consultant-person-cell']}>
                                            <strong style={{ fontSize: 14, color: '#0b3d91' }}>
                                                <BookOutlined style={{ marginRight: 6 }} /> {c.name}
                                            </strong>
                                            <span style={{ color: '#627d98', maxWidth: 300 }}>{c.description || 'Chương trình đào tạo chuẩn quốc tế'}</span>
                                        </div>
                                    ),
                                },
                                {
                                    title: 'Cấp độ',
                                    dataIndex: 'level',
                                    render: l => <Tag color="blue">{l || 'Cơ bản đến nâng cao'}</Tag>,
                                },
                                {
                                    title: 'Thời lượng',
                                    dataIndex: 'duration',
                                    render: d => <span>{d || 'Linh hoạt (3-6 tháng)'}</span>,
                                },
                                {
                                    title: 'Học phí niêm yết',
                                    render: (_, c: ICourse) => (
                                        <b style={{ color: '#0f62fe', fontSize: 14 }}>
                                            {money(c.price)}
                                        </b>
                                    ),
                                },
                                {
                                    title: 'Lớp đang mở',
                                    render: (_, c: ICourse) => {
                                        const openCount = data.classrooms.filter(
                                            cls => (cls.course_id?._id === c._id || cls.course_id === c._id) && (cls.status === 'OPEN' || !cls.status)
                                        ).length;
                                        return <Tag color={openCount > 0 ? 'green' : 'default'}>{openCount} lớp mở</Tag>;
                                    },
                                },
                                {
                                    title: 'Thao tác tư vấn',
                                    fixed: 'right',
                                    width: 220,
                                    render: (_, c: ICourse) => (
                                        <Space size="small">
                                            <Button
                                                size="small"
                                                icon={<EyeOutlined />}
                                                onClick={() => setSelectedCourse(c)}
                                            >
                                                Lịch lớp
                                            </Button>
                                            <Button
                                                type="primary"
                                                size="small"
                                                icon={<TeamOutlined />}
                                                onClick={() => navigate('/client/consultant/enrollments')}
                                            >
                                                Tư vấn ghi danh
                                            </Button>
                                        </Space>
                                    ),
                                },
                            ]}
                        />
                    )}
                </Card>
            </ConsultantState>

            {/* Modal Chi tiết khóa học & Lịch các lớp đang mở */}
            <Modal
                title={`Chi tiết chương trình: ${selectedCourse?.name}`}
                open={Boolean(selectedCourse)}
                footer={[
                    <Button key="close" onClick={() => setSelectedCourse(null)}>
                        Đóng
                    </Button>,
                    <Button
                        key="enroll"
                        type="primary"
                        icon={<TeamOutlined />}
                        onClick={() => {
                            setSelectedCourse(null);
                            navigate('/client/consultant/enrollments');
                        }}
                    >
                        Tư vấn ghi danh khóa này
                    </Button>,
                ]}
                onCancel={() => setSelectedCourse(null)}
                width={700}
            >
                {selectedCourse && (
                    <div style={{ marginTop: 12 }}>
                        <Descriptions bordered size="small" column={2}>
                            <Descriptions.Item label="Tên khóa học" span={2}>
                                <b>{selectedCourse.name}</b>
                            </Descriptions.Item>
                            <Descriptions.Item label="Cấp độ">{selectedCourse.level || 'Cơ bản đến nâng cao'}</Descriptions.Item>
                            <Descriptions.Item label="Thời lượng">{selectedCourse.duration || 'Linh hoạt'}</Descriptions.Item>
                            <Descriptions.Item label="Học phí niêm yết" span={2}>
                                <b style={{ color: '#0f62fe', fontSize: 16 }}>{money(selectedCourse.price)}</b>
                            </Descriptions.Item>
                            <Descriptions.Item label="Mô tả đào tạo" span={2}>
                                {selectedCourse.description || 'Chương trình đào tạo thực chiến tại FPT Education.'}
                            </Descriptions.Item>
                        </Descriptions>

                        <div style={{ marginTop: 20 }}>
                            <h4 style={{ margin: '0 0 10px', color: '#102a43', fontSize: 15 }}>
                                Danh sách lớp học trực thuộc ({openClassesForSelected.length} lớp)
                            </h4>
                            {!openClassesForSelected.length ? (
                                <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                                    Hiện chưa có lớp học nào được xếp lịch cho khóa học này. Vui lòng liên hệ Quản lý đào tạo.
                                </p>
                            ) : (
                                <Table
                                    size="small"
                                    rowKey="_id"
                                    pagination={false}
                                    dataSource={openClassesForSelected}
                                    columns={[
                                        {
                                            title: 'Tên lớp',
                                            dataIndex: 'class_name',
                                            render: name => <b>{name}</b>,
                                        },
                                        {
                                            title: 'Phòng học',
                                            dataIndex: 'room',
                                            render: r => <span>{r || 'Online'}</span>,
                                        },
                                        {
                                            title: 'Khung giờ học',
                                            render: (_, cls: IClassroomWithDetails) => (
                                                <span>
                                                    <CalendarOutlined style={{ marginRight: 4 }} />
                                                    {cls.start_time || 'Ca học'} - {cls.end_time || ''}
                                                </span>
                                            ),
                                        },
                                        {
                                            title: 'Trạng thái',
                                            dataIndex: 'status',
                                            render: s => <Tag color={s === 'OPEN' || !s ? 'green' : 'orange'}>{s || 'Đang mở'}</Tag>,
                                        },
                                    ]}
                                />
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </main>
    );
};

export default ConsultantCourses;
