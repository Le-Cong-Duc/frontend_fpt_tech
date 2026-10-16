import { useMemo, useState } from 'react';
import {
    Button,
    Card,
    Empty,
    Input,
    Modal,
    Select,
    Space,
    Tag,
    Tooltip,
    message,
} from 'antd';
import {
    ArrowRightOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    EditOutlined,
    MessageOutlined,
    PhoneOutlined,
    PlusOutlined,
    SearchOutlined,
    TeamOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { callUpdateLead } from '@/config/api';
import {
    ConsultantEmpty,
    ConsultantState,
    LeadIcon,
    statusTag,
    useConsultantData,
} from './consultant.shared';
import type { ILead } from '@/types/backend';
import styles from '@/styles/client.module.scss';

const PIPELINE_STAGES = [
    { key: 'NEW', title: '1. Khách mới tiếp nhận', color: '#fa8c16' },
    { key: 'CONTACTED', title: '2. Đã liên hệ / Kết nối', color: '#13c2c2' },
    { key: 'CONSULTED', title: '3. Đang tư vấn lộ trình', color: '#1890ff' },
    { key: 'REGISTERED', title: '4. Đã chốt đăng ký học', color: '#52c41a' },
];

const ConsultantFollowUp = () => {
    const navigate = useNavigate();
    const data = useConsultantData();

    const [search, setSearch] = useState('');
    const [courseFilter, setCourseFilter] = useState<string>();

    // Modal cập nhật nhật ký chăm sóc
    const [noteModalOpen, setNoteModalOpen] = useState(false);
    const [activeLead, setActiveLead] = useState<ILead | null>(null);
    const [leadNote, setLeadNote] = useState('');
    const [savingNote, setSavingNote] = useState(false);

    // Lọc theo search và course
    const filteredLeads = useMemo(() => {
        return data.leads.filter(lead => {
            const name = lead.full_name || lead.name || '';
            const phone = lead.phone || '';
            const matchSearch = `${name} ${phone} ${lead.course_name}`.toLowerCase().includes(search.toLowerCase());
            const matchCourse = !courseFilter || lead.course_name === courseFilter;
            return matchSearch && matchCourse;
        });
    }, [courseFilter, data.leads, search]);

    // Phân nhóm theo các cột Pipeline
    const columnsData = useMemo(() => {
        return PIPELINE_STAGES.map(stage => {
            const items = filteredLeads.filter(lead => {
                const s = lead.status?.toUpperCase() || 'NEW';
                return s === stage.key;
            });
            return {
                ...stage,
                items,
            };
        });
    }, [filteredLeads]);

    // Chuyển giai đoạn nhanh của Lead
    const handleMoveStage = async (lead: ILead, nextStage: string) => {
        if (!lead._id) return;
        try {
            const res = await callUpdateLead({ status: nextStage }, lead._id);
            if (res?.data) {
                message.success(`Đã chuyển khách hàng sang giai đoạn ${nextStage}`);
                await data.refresh();
            } else {
                message.error('Không thể cập nhật trạng thái');
            }
        } catch {
            message.error('Lỗi khi chuyển trạng thái');
        }
    };

    // Mở modal ghi chú tư vấn
    const handleOpenNote = (lead: ILead) => {
        setActiveLead(lead);
        setLeadNote(lead.note || '');
        setNoteModalOpen(true);
    };

    // Lưu nhật ký tư vấn
    const handleSaveNote = async () => {
        if (!activeLead?._id) return;
        setSavingNote(true);
        try {
            const res = await callUpdateLead({ note: leadNote }, activeLead._id);
            if (res?.data) {
                message.success('Đã lưu nhật ký tư vấn thành công!');
                setNoteModalOpen(false);
                await data.refresh();
            } else {
                message.error('Không thể lưu nhật ký');
            }
        } catch {
            message.error('Lỗi khi lưu ghi chú');
        } finally {
            setSavingNote(false);
        }
    };

    const courseOptions = useMemo(() => {
        return Array.from(new Set(data.leads.map(l => l.course_name).filter(Boolean)));
    }, [data.leads]);

    return (
        <main className={`${styles.container} ${styles['consultant-page']}`}>
            <section className={styles['consultant-page-heading']}>
                <div>
                    <span>TUYỂN SINH / PIPELINE CHĂM SÓC</span>
                    <h1>Theo dõi phễu tư vấn & Lịch sử chăm sóc</h1>
                    <p>Bảng điều hành Kanban quản lý quy trình chuyển hóa khách hàng từ tiếp nhận đến ghi danh.</p>
                </div>
                <Space>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => navigate('/client/consultant/customers')}
                    >
                        Thêm khách hàng
                    </Button>
                </Space>
            </section>

            <ConsultantState loading={data.loading} error={data.error}>
                {/* Bộ lọc Kanban */}
                <div className={styles['consultant-filters']} style={{ marginBottom: 18 }}>
                    <Input
                        allowClear
                        prefix={<SearchOutlined />}
                        placeholder="Tìm kiếm khách hàng theo tên, số điện thoại..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ flex: 2 }}
                    />
                    <Select
                        allowClear
                        placeholder="Lọc theo khóa học"
                        value={courseFilter}
                        onChange={setCourseFilter}
                        style={{ width: 240 }}
                        options={courseOptions.map(c => ({ label: c, value: c }))}
                    />
                </div>

                {/* Bảng Kanban 4 cột */}
                <div className={styles['consultant-kanban']}>
                    {columnsData.map(col => (
                        <div key={col.key} className={styles['consultant-column']}>
                            {/* Header cột */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 8, borderBottom: `2px solid ${col.color}` }}>
                                <strong style={{ color: col.color, fontSize: 14 }}>{col.title}</strong>
                                <Tag color={col.key === 'REGISTERED' ? 'green' : 'blue'}>{col.items.length}</Tag>
                            </div>

                            {/* Danh sách thẻ khách hàng */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {!col.items.length ? (
                                    <div style={{ padding: '24px 0', textAlign: 'center', color: '#94a3b8' }}>
                                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có khách hàng" />
                                    </div>
                                ) : (
                                    col.items.map(lead => (
                                        <Card
                                            key={lead._id}
                                            size="small"
                                            className={styles['consultant-lead-card']}
                                            style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                                                <strong style={{ fontSize: 14, color: '#102a43' }}>
                                                    {lead.full_name || lead.name}
                                                </strong>
                                                <LeadIcon status={lead.status} />
                                            </div>

                                            <div style={{ fontSize: 12, color: '#0f62fe', fontWeight: 600, marginBottom: 4 }}>
                                                <PhoneOutlined /> {lead.phone || 'Chưa có SĐT'}
                                            </div>

                                            <div style={{ fontSize: 12, color: '#475569', marginBottom: 6 }}>
                                                Khóa học: <b>{lead.course_name || 'Chưa chọn'}</b>
                                            </div>

                                            {lead.note && (
                                                <div style={{ fontSize: 11, color: '#64748b', background: '#f8fafc', padding: '6px 8px', borderRadius: 4, marginBottom: 10, fontStyle: 'italic' }}>
                                                    "{lead.note}"
                                                </div>
                                            )}

                                            {/* Hành động trên từng thẻ */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTop: '1px solid #f1f5f9' }}>
                                                <Tooltip title="Cập nhật nhật ký chăm sóc">
                                                    <Button
                                                        size="small"
                                                        icon={<EditOutlined />}
                                                        onClick={() => handleOpenNote(lead)}
                                                    >
                                                        Ghi chú
                                                    </Button>
                                                </Tooltip>

                                                <Space size="small">
                                                    {col.key === 'NEW' && (
                                                        <Button
                                                            size="small"
                                                            type="primary"
                                                            onClick={() => handleMoveStage(lead, 'CONTACTED')}
                                                        >
                                                            Đã gọi
                                                        </Button>
                                                    )}
                                                    {col.key === 'CONTACTED' && (
                                                        <Button
                                                            size="small"
                                                            type="primary"
                                                            onClick={() => handleMoveStage(lead, 'CONSULTED')}
                                                        >
                                                            Tư vấn
                                                        </Button>
                                                    )}
                                                    {col.key === 'CONSULTED' && (
                                                        <Button
                                                            size="small"
                                                            type="primary"
                                                            style={{ background: '#52c41a', borderColor: '#52c41a' }}
                                                            onClick={() => navigate('/client/consultant/enrollments')}
                                                        >
                                                            Ghi danh
                                                        </Button>
                                                    )}
                                                    {col.key === 'REGISTERED' && (
                                                        <Tag color="success">Đã nhập học</Tag>
                                                    )}
                                                </Space>
                                            </div>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </ConsultantState>

            {/* Modal Ghi chú chăm sóc khách hàng */}
            <Modal
                title={`Nhật ký chăm sóc: ${activeLead?.full_name || activeLead?.name}`}
                open={noteModalOpen}
                confirmLoading={savingNote}
                okText="Lưu nhật ký"
                cancelText="Hủy"
                onOk={handleSaveNote}
                onCancel={() => setNoteModalOpen(false)}
                width={520}
            >
                <div style={{ marginTop: 12 }}>
                    <p style={{ margin: '0 0 10px', color: '#627d98', fontSize: 13 }}>
                        Ghi lại nội dung cuộc gọi, nhu cầu của học viên, lịch hẹn gọi lại...
                    </p>
                    <Input.TextArea
                        rows={5}
                        placeholder="Ví dụ: Học viên quan tâm lớp buổi tối, xin học phí ưu đãi sinh viên, hẹn chiều thứ 5 gọi lại chốt hồ sơ..."
                        value={leadNote}
                        onChange={e => setLeadNote(e.target.value)}
                    />
                </div>
            </Modal>
        </main>
    );
};

export default ConsultantFollowUp;
