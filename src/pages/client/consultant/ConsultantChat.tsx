import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Avatar,
    Badge,
    Button,
    Card,
    Empty,
    Input,
    List,
    Modal,
    Select,
    Space,
    Spin,
    Tag,
    message,
} from 'antd';
import {
    CommentOutlined,
    MessageOutlined,
    PhoneOutlined,
    PlusOutlined,
    SearchOutlined,
    SendOutlined,
    UserOutlined,
} from '@ant-design/icons';
import {
    callCreateConversation,
    callCreateMessage,
    callFetchConversation,
    callFetchMessage,
} from '@/config/api';
import { useAppSelector } from '@/redux/hooks';
import {
    ConsultantState,
    dateTimeText,
    toArray,
    useConsultantData,
} from './consultant.shared';
import type { IConversation, IMessage } from '@/types/backend';
import styles from '@/styles/client.module.scss';

const ConsultantChat = () => {
    const currentUser = useAppSelector(state => state.account.user);
    const consultantData = useConsultantData();

    const [conversations, setConversations] = useState<IConversation[]>([]);
    const [messages, setMessages] = useState<IMessage[]>([]);
    const [activeId, setActiveId] = useState<string>('');
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [searchConv, setSearchConv] = useState('');
    const [error, setError] = useState('');

    // Modal tạo hội thoại mới
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [selectedParticipantId, setSelectedParticipantId] = useState<string>('');
    const [creatingConv, setCreatingConv] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Tải danh sách hội thoại và tin nhắn
    const loadChatData = async () => {
        try {
            const [convRes, msgRes] = await Promise.all([
                callFetchConversation('current=1&pageSize=100'),
                callFetchMessage('current=1&pageSize=500'),
            ]);

            const convList = toArray<IConversation>(convRes);
            const msgList = toArray<IMessage>(msgRes);

            setConversations(convList);
            setMessages(msgList);

            if (convList.length > 0 && !activeId) {
                setActiveId(convList[0]._id || '');
            }
        } catch {
            setError('Không thể tải dữ liệu tin nhắn hội thoại.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadChatData();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, activeId]);

    // Các tin nhắn của hội thoại đang chọn
    const activeMessages = useMemo(() => {
        if (!activeId) return [];
        return messages.filter(m => String((m as any).conversation_id) === activeId);
    }, [activeId, messages]);

    // Tìm thông tin đối tác trong hội thoại
    const activeConversation = useMemo(() => {
        return conversations.find(c => c._id === activeId);
    }, [activeId, conversations]);

    const participantInfo = useMemo(() => {
        if (!activeConversation) return { name: 'Khách hàng / Học viên', email: '', phone: '' };
        const participantId = (activeConversation as any).participant_id;

        // Tìm trong Leads
        const lead = consultantData.leads.find(l => l._id === participantId);
        if (lead) {
            return {
                name: lead.full_name || lead.name || 'Khách hàng',
                email: lead.email || '',
                phone: lead.phone || '',
            };
        }

        // Tìm trong Users
        const user = consultantData.users.find(u => u._id === participantId);
        if (user) {
            return {
                name: user.name || 'Học viên',
                email: user.email || '',
                phone: user.phone || '',
            };
        }

        return {
            name: typeof participantId === 'string' ? `Người dùng (${participantId.slice(-6)})` : 'Khách hàng tư vấn',
            email: '',
            phone: '',
        };
    }, [activeConversation, consultantData.leads, consultantData.users]);

    // Gửi tin nhắn
    const handleSendMessage = async () => {
        if (!text.trim() || !activeId) return;

        const content = text.trim();
        setText('');
        setSending(true);

        try {
            const res = await callCreateMessage({
                conversation_id: activeId as any,
                content,
            } as any);

            if (res?.data) {
                setMessages(prev => [...prev, res.data as IMessage]);
                scrollToBottom();
            } else {
                message.error('Không thể gửi tin nhắn');
                setText(content);
            }
        } catch {
            message.error('Lỗi mạng khi gửi tin nhắn');
            setText(content);
        } finally {
            setSending(false);
        }
    };

    // Tạo hội thoại mới với khách hàng hoặc học viên
    const handleCreateConversation = async () => {
        if (!selectedParticipantId) {
            message.warning('Vui lòng chọn khách hàng hoặc học viên');
            return;
        }

        setCreatingConv(true);
        try {
            const res = await callCreateConversation({
                participant_id: selectedParticipantId as any,
            } as any);

            if (res?.data) {
                message.success('Đã mở cuộc trò chuyện tư vấn mới!');
                setCreateModalOpen(false);
                setSelectedParticipantId('');
                await loadChatData();
                setActiveId(res.data._id || '');
            } else {
                message.error('Không thể tạo hội thoại');
            }
        } catch {
            message.error('Lỗi khi tạo cuộc trò chuyện');
        } finally {
            setCreatingConv(false);
        }
    };

    // Lọc danh sách hội thoại
    const filteredConversations = useMemo(() => {
        return conversations.filter(conv => {
            const partId = String((conv as any).participant_id || '');
            const lead = consultantData.leads.find(l => l._id === partId);
            const user = consultantData.users.find(u => u._id === partId);
            const title = (lead?.full_name || lead?.name || user?.name || partId).toLowerCase();
            return title.includes(searchConv.toLowerCase());
        });
    }, [consultantData.leads, consultantData.users, conversations, searchConv]);

    return (
        <main className={`${styles.container} ${styles['consultant-page']}`}>
            <section className={styles['consultant-page-heading']}>
                <div>
                    <span>TUYỂN SINH / TIN NHẮN TƯ VẤN</span>
                    <h1>Kênh chat & Hỗ trợ tuyển sinh</h1>
                    <p>Trao đổi trực tiếp, giải đáp thắc mắc lộ trình và chăm sóc khách hàng trực tuyến.</p>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setCreateModalOpen(true)}
                >
                    Mở hội thoại mới
                </Button>
            </section>

            <ConsultantState loading={loading} error={error}>
                <Card
                    className={`${styles['portal-card']} ${styles['consultant-chat']}`}
                    style={{ padding: 0, overflow: 'hidden' }}
                >
                    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', minHeight: 600 }}>
                        {/* Cột trái: Danh sách hội thoại */}
                        <aside style={{ borderRight: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ padding: 14, borderBottom: '1px solid #e2e8f0' }}>
                                <Input
                                    allowClear
                                    prefix={<SearchOutlined />}
                                    placeholder="Tìm cuộc trò chuyện..."
                                    value={searchConv}
                                    onChange={e => setSearchConv(e.target.value)}
                                />
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto' }}>
                                {!filteredConversations.length ? (
                                    <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có hội thoại nào" />
                                    </div>
                                ) : (
                                    <List
                                        dataSource={filteredConversations}
                                        renderItem={conv => {
                                            const partId = String((conv as any).participant_id || '');
                                            const lead = consultantData.leads.find(l => l._id === partId);
                                            const user = consultantData.users.find(u => u._id === partId);
                                            const name = lead?.full_name || lead?.name || user?.name || `Khách hàng (${partId.slice(-6)})`;

                                            const lastMsg = messages
                                                .filter(m => String((m as any).conversation_id) === conv._id)
                                                .slice(-1)[0];

                                            const isSelected = activeId === conv._id;

                                            return (
                                                <div
                                                    key={conv._id}
                                                    onClick={() => setActiveId(conv._id || '')}
                                                    style={{
                                                        padding: '12px 16px',
                                                        borderBottom: '1px solid #f1f5f9',
                                                        cursor: 'pointer',
                                                        background: isSelected ? '#e0f2fe' : 'transparent',
                                                        transition: 'background 0.2s',
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <Avatar icon={<UserOutlined />} style={{ background: isSelected ? '#0284c7' : '#94a3b8' }} />
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <strong style={{ fontSize: 13, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                    {name}
                                                                </strong>
                                                            </div>
                                                            <div style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>
                                                                {lastMsg ? String((lastMsg as any).content || '') : 'Bắt đầu cuộc trò chuyện...'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }}
                                    />
                                )}
                            </div>
                        </aside>

                        {/* Cột phải: Khung chat thread */}
                        <section style={{ display: 'flex', flexDirection: 'column', background: '#ffffff' }}>
                            {activeId ? (
                                <>
                                    {/* Header đối tác */}
                                    <div style={{ padding: '12px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <Avatar icon={<UserOutlined />} size="large" style={{ background: '#0284c7' }} />
                                            <div>
                                                <h3 style={{ margin: 0, fontSize: 15, color: '#0f172a' }}>{participantInfo.name}</h3>
                                                <span style={{ fontSize: 12, color: '#64748b' }}>
                                                    {participantInfo.email} {participantInfo.phone ? `· ${participantInfo.phone}` : ''}
                                                </span>
                                            </div>
                                        </div>
                                        <Tag color="green">Đang kết nối</Tag>
                                    </div>

                                    {/* Danh sách tin nhắn */}
                                    <div style={{ flex: 1, padding: 20, overflowY: 'auto', maxHeight: 480, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {!activeMessages.length ? (
                                            <div style={{ margin: 'auto', textAlign: 'center', color: '#94a3b8' }}>
                                                <CommentOutlined style={{ fontSize: 40, marginBottom: 8 }} />
                                                <p style={{ margin: 0 }}>Chưa có tin nhắn nào trong hội thoại này. Hãy gửi lời chào đầu tiên!</p>
                                            </div>
                                        ) : (
                                            activeMessages.map((msg, idx) => {
                                                const senderId = String((msg as any).sender_id || (msg as any).createdBy?._id || '');
                                                const isMine = senderId === currentUser._id || !(msg as any).sender_id;

                                                return (
                                                    <div
                                                        key={msg._id || idx}
                                                        style={{
                                                            alignSelf: isMine ? 'flex-end' : 'flex-start',
                                                            maxWidth: '70%',
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                padding: '10px 14px',
                                                                borderRadius: 12,
                                                                background: isMine ? '#0284c7' : '#f1f5f9',
                                                                color: isMine ? '#ffffff' : '#0f172a',
                                                                fontSize: 13,
                                                                lineHeight: 1.5,
                                                                wordBreak: 'break-word',
                                                            }}
                                                        >
                                                            {String((msg as any).content || '')}
                                                        </div>
                                                        <div
                                                            style={{
                                                                fontSize: 10,
                                                                color: '#94a3b8',
                                                                textAlign: isMine ? 'right' : 'left',
                                                                marginTop: 3,
                                                                padding: '0 4px',
                                                            }}
                                                        >
                                                            {dateTimeText((msg as any).createdAt)}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Hộp soạn thảo tin nhắn */}
                                    <div style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', gap: 10 }}>
                                        <Input
                                            placeholder="Nhập nội dung tư vấn... (Nhấn Enter để gửi)"
                                            value={text}
                                            onChange={e => setText(e.target.value)}
                                            onPressEnter={handleSendMessage}
                                            disabled={sending}
                                            style={{ height: 40 }}
                                        />
                                        <Button
                                            type="primary"
                                            icon={<SendOutlined />}
                                            loading={sending}
                                            onClick={handleSendMessage}
                                            style={{ height: 40, width: 44 }}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div style={{ margin: 'auto', textAlign: 'center', padding: 40 }}>
                                    <Empty description="Chọn một cuộc trò chuyện từ danh sách hoặc mở hội thoại mới" />
                                </div>
                            )}
                        </section>
                    </div>
                </Card>
            </ConsultantState>

            {/* Modal Mở cuộc hội thoại mới */}
            <Modal
                title="Mở cuộc hội thoại tư vấn mới"
                open={createModalOpen}
                confirmLoading={creatingConv}
                okText="Bắt đầu trò chuyện"
                cancelText="Hủy"
                onOk={handleCreateConversation}
                onCancel={() => setCreateModalOpen(false)}
                width={500}
            >
                <div style={{ marginTop: 12 }}>
                    <label className={styles['accountant-field-label']}>Chọn Khách hàng tiềm năng hoặc Học viên *</label>
                    <Select
                        showSearch
                        placeholder="Tìm theo tên hoặc số điện thoại..."
                        optionFilterProp="label"
                        value={selectedParticipantId || undefined}
                        onChange={setSelectedParticipantId}
                        style={{ width: '100%' }}
                        options={[
                            ...consultantData.leads.map(l => ({
                                label: `[Khách hàng] ${l.full_name || l.name} · SĐT: ${l.phone || 'N/A'} · ${l.course_name || ''}`,
                                value: l._id || '',
                            })),
                            ...consultantData.users.map(u => ({
                                label: `[Học viên] ${u.name} · ${u.email}`,
                                value: u._id || '',
                            })),
                        ]}
                    />
                </div>
            </Modal>
        </main>
    );
};

export default ConsultantChat;
