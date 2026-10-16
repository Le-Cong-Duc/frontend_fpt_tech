import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Avatar,
    Badge,
    Button,
    Card,
    Col,
    Divider,
    Empty,
    Input,
    Modal,
    Row,
    Select,
    Space,
    Spin,
    Tag,
    message,
} from 'antd';
import {
    MessageOutlined,
    PlusOutlined,
    SearchOutlined,
    SendOutlined,
    TeamOutlined,
    UserOutlined,
} from '@ant-design/icons';
import {
    callCreateConversation,
    callCreateMessage,
    callFetchConversation,
    callFetchMessage,
} from '@/config/api';
import { useAppSelector } from '@/redux/hooks';
import { TeacherState, useTeacherData } from './teacher.shared';
import type { IConversation, IMessage } from '@/types/backend';
import styles from '@/styles/client.module.scss';

const toArray = <T,>(response: unknown): T[] => {
    if (!response) return [];
    const data = (response as { data?: unknown })?.data;
    if (Array.isArray(data)) return data as T[];
    if (data && typeof data === 'object' && Array.isArray((data as { result?: T[] }).result)) {
        return (data as { result: T[] }).result;
    }
    return [];
};

const TeacherChat = () => {
    const user = useAppSelector(state => state.account.user);
    const teacherData = useTeacherData(user._id);

    const [conversations, setConversations] = useState<IConversation[]>([]);
    const [messages, setMessages] = useState<IMessage[]>([]);
    const [selectedId, setSelectedId] = useState<string>('');
    const [draft, setDraft] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [searchConv, setSearchConv] = useState('');
    const [error, setError] = useState('');

    // Modal tạo hội thoại mới
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [newConvTitle, setNewConvTitle] = useState('');
    const [selectedClassForChat, setSelectedClassForChat] = useState<string>();
    const [isCreatingConv, setIsCreatingConv] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const refreshConversations = async () => {
        try {
            const response = await callFetchConversation('pageSize=1000').catch(() => ({ data: [] }));
            let next = toArray<IConversation>(response);

            // Nếu server chưa có cuộc hội thoại nào, tự động gợi ý các kênh chat theo các lớp giảng viên đang dạy
            if (!next.length && teacherData.classes.length) {
                const sampleConvs: IConversation[] = teacherData.classes.map(c => ({
                    _id: `conv_${c._id}`,
                    title: `Kênh thảo luận: ${c.class_name}`,
                    last_message: 'Kênh trao đổi học vụ của lớp',
                    type: 'CLASS_GROUP',
                }));
                next = sampleConvs;
            }

            setConversations(next);
            if (next.length && !selectedId) {
                setSelectedId(next[0]._id || '');
            }
        } catch {
            setError('Không thể tải danh sách cuộc trò chuyện.');
        }
    };

    useEffect(() => {
        let active = true;
        const load = async () => {
            setLoading(true);
            setError('');
            try {
                await refreshConversations();
            } finally {
                if (active) setLoading(false);
            }
        };
        load();
        return () => {
            active = false;
        };
    }, [teacherData.classes]);

    useEffect(() => {
        if (!selectedId) return;
        const loadMessages = async () => {
            try {
                const response = await callFetchMessage(
                    `pageSize=1000&conversation_id=${selectedId}`
                ).catch(() => ({ data: [] }));
                setMessages(toArray<IMessage>(response));
                setTimeout(scrollToBottom, 100);
            } catch {
                // ignore
            }
        };
        loadMessages();
    }, [selectedId]);

    const filteredConversations = useMemo(() => {
        return conversations.filter(c => {
            const name = (c as { title?: string; name?: string })?.title || (c as { name?: string })?.name || '';
            return name.toLowerCase().includes(searchConv.toLowerCase());
        });
    }, [conversations, searchConv]);

    const selectedConversation = useMemo(
        () => conversations.find(item => item._id === selectedId) || conversations[0],
        [conversations, selectedId]
    );

    const handleSend = async () => {
        if (!selectedConversation?._id || !draft.trim()) return;
        const contentToSend = draft.trim();
        setSending(true);

        const tempMessage: IMessage = {
            _id: `msg_${Date.now()}`,
            conversation_id: selectedConversation._id,
            sender_id: user._id,
            content: contentToSend,
            createdAt: new Date().toISOString(),
        } as unknown as IMessage;

        setMessages(prev => [...prev, tempMessage]);
        setDraft('');
        setTimeout(scrollToBottom, 50);

        try {
            await callCreateMessage({
                conversation_id: selectedConversation._id,
                sender_id: user._id,
                content: contentToSend,
            } as unknown as IMessage);
        } catch {
            // Không crash UI
        } finally {
            setSending(false);
        }
    };

    // Tạo kênh trao đổi mới
    const handleCreateConversation = async () => {
        if (!newConvTitle.trim()) {
            return message.warning('Vui lòng nhập tên cuộc trò chuyện.');
        }

        setIsCreatingConv(true);
        try {
            const convId = `conv_${Date.now()}`;
            const newConv: IConversation = {
                _id: convId,
                title: newConvTitle.trim(),
                last_message: 'Cuộc trò chuyện mới được tạo',
                createdAt: new Date().toISOString(),
            };

            try {
                const res = await callCreateConversation({
                    title: newConvTitle.trim(),
                } as unknown as IConversation);
                if (res?.data?._id) {
                    newConv._id = res.data._id;
                }
            } catch {
                // ignore
            }

            setConversations(prev => [newConv, ...prev]);
            setSelectedId(newConv._id || '');
            setNewConvTitle('');
            setSelectedClassForChat(undefined);
            setCreateModalOpen(false);
            message.success('Đã tạo kênh trao đổi mới!');
        } finally {
            setIsCreatingConv(false);
        }
    };

    const convTitle = (c?: IConversation) =>
        (c as { title?: string; name?: string })?.title || (c as { name?: string })?.name || 'Kênh trao đổi';

    return (
        <main className={`${styles.container} ${styles['student-page']}`}>
            <section className={styles['student-heading']}>
                <div>
                    <span>TEACHER / COMMUNICATION</span>
                    <h1>Kênh trao đổi & Tin nhắn</h1>
                    <p>Hỗ trợ học viên, trao đổi học vụ với các lớp phụ trách và ban đào tạo.</p>
                </div>
            </section>

            <TeacherState loading={loading} error={error}>
                <Card className={styles['portal-card']} bodyStyle={{ padding: 0 }}>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'minmax(260px, 340px) minmax(0, 1fr)',
                            minHeight: 580,
                        }}
                    >
                        {/* Cột trái: Danh sách hội thoại */}
                        <div
                            style={{
                                borderRight: '1px solid #f0f0f0',
                                display: 'flex',
                                flexDirection: 'column',
                                background: '#fafafa',
                            }}
                        >
                            <div style={{ padding: 16, borderBottom: '1px solid #f0f0f0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Hội thoại ({conversations.length})</h3>
                                    <Button
                                        size="small"
                                        type="primary"
                                        icon={<PlusOutlined />}
                                        onClick={() => setCreateModalOpen(true)}
                                    >
                                        Tạo kênh
                                    </Button>
                                </div>
                                <Input
                                    prefix={<SearchOutlined />}
                                    placeholder="Tìm cuộc trò chuyện..."
                                    value={searchConv}
                                    onChange={e => setSearchConv(e.target.value)}
                                    allowClear
                                />
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
                                {!filteredConversations.length ? (
                                    <Empty description="Không có cuộc trò chuyện nào" style={{ marginTop: 40 }} />
                                ) : (
                                    filteredConversations.map(item => {
                                        const isSelected = item._id === selectedConversation?._id;
                                        return (
                                            <div
                                                key={item._id}
                                                onClick={() => setSelectedId(item._id || '')}
                                                style={{
                                                    display: 'flex',
                                                    gap: 12,
                                                    alignItems: 'center',
                                                    padding: '12px 14px',
                                                    borderRadius: 8,
                                                    marginBottom: 6,
                                                    cursor: 'pointer',
                                                    background: isSelected ? '#e6f4ff' : '#fff',
                                                    border: isSelected ? '1px solid #91caff' : '1px solid #f0f0f0',
                                                    transition: 'all 0.2s',
                                                }}
                                            >
                                                <Avatar style={{ backgroundColor: isSelected ? '#1677ff' : '#8c8c8c' }}>
                                                    <TeamOutlined />
                                                </Avatar>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div
                                                        style={{
                                                            fontWeight: isSelected ? 600 : 500,
                                                            color: isSelected ? '#1677ff' : '#262626',
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                        }}
                                                    >
                                                        {convTitle(item)}
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: 12,
                                                            color: '#8c8c8c',
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                        }}
                                                    >
                                                        {(item as { last_message?: string })?.last_message || 'Bắt đầu cuộc trò chuyện...'}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Cột phải: Khung chat */}
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>
                            {selectedConversation ? (
                                <>
                                    {/* Header Chat */}
                                    <div
                                        style={{
                                            padding: '14px 20px',
                                            borderBottom: '1px solid #f0f0f0',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Space>
                                            <Avatar style={{ backgroundColor: '#1677ff' }}>
                                                <TeamOutlined />
                                            </Avatar>
                                            <div>
                                                <h4 style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>
                                                    {convTitle(selectedConversation)}
                                                </h4>
                                                <span style={{ fontSize: 12, color: '#52c41a' }}>● Đang hoạt động</span>
                                            </div>
                                        </Space>
                                    </div>

                                    {/* Danh sách tin nhắn */}
                                    <div
                                        style={{
                                            flex: 1,
                                            overflowY: 'auto',
                                            padding: 20,
                                            background: '#f9fafb',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 12,
                                        }}
                                    >
                                        {!messages.length ? (
                                            <div style={{ textAlign: 'center', color: '#888', marginTop: 80 }}>
                                                <MessageOutlined style={{ fontSize: 40, color: '#d9d9d9', marginBottom: 12 }} />
                                                <p>Chưa có tin nhắn trong cuộc trò chuyện này.</p>
                                                <p style={{ fontSize: 12 }}>Hãy gửi lời chào đầu tiên đến các học viên!</p>
                                            </div>
                                        ) : (
                                            messages.map((item, idx) => {
                                                const isMe = item.sender_id === user._id;
                                                const content =
                                                    (item as { content?: string; message?: string }).content ??
                                                    (item as { message?: string }).message ??
                                                    '';

                                                return (
                                                    <div
                                                        key={item._id || idx}
                                                        style={{
                                                            display: 'flex',
                                                            justifyContent: isMe ? 'flex-end' : 'flex-start',
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                maxWidth: '70%',
                                                                padding: '10px 16px',
                                                                borderRadius: isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                                                                background: isMe ? '#1677ff' : '#fff',
                                                                color: isMe ? '#fff' : '#262626',
                                                                boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                                                                border: isMe ? 'none' : '1px solid #f0f0f0',
                                                            }}
                                                        >
                                                            {!isMe && (
                                                                <div style={{ fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 2 }}>
                                                                    Học viên / Thành viên
                                                                </div>
                                                            )}
                                                            <div style={{ fontSize: 14, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                                                                {content}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Khung nhập tin nhắn */}
                                    <div style={{ padding: '14px 20px', borderTop: '1px solid #f0f0f0', background: '#fff' }}>
                                        <Space.Compact style={{ width: '100%' }}>
                                            <Input
                                                placeholder="Nhập tin nhắn... (Nhấn Enter để gửi)"
                                                value={draft}
                                                onChange={e => setDraft(e.target.value)}
                                                onPressEnter={handleSend}
                                                size="large"
                                            />
                                            <Button
                                                type="primary"
                                                icon={<SendOutlined />}
                                                size="large"
                                                loading={sending}
                                                onClick={handleSend}
                                            >
                                                Gửi
                                            </Button>
                                        </Space.Compact>
                                    </div>
                                </>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                    <Empty description="Chọn một cuộc trò chuyện để bắt đầu." />
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            </TeacherState>

            {/* Modal Tạo kênh trao đổi mới */}
            <Modal
                title="Tạo kênh trao đổi học vụ mới"
                open={createModalOpen}
                onCancel={() => setCreateModalOpen(false)}
                onOk={handleCreateConversation}
                okText="Tạo kênh"
                cancelText="Hủy"
                confirmLoading={isCreatingConv}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Chọn lớp học nhanh:</div>
                        <Select
                            placeholder="Chọn lớp học phụ trách..."
                            style={{ width: '100%' }}
                            value={selectedClassForChat}
                            onChange={(classId, option) => {
                                setSelectedClassForChat(classId);
                                if (option) {
                                    setNewConvTitle(`Kênh thảo luận lớp: ${(option as { label: string }).label}`);
                                }
                            }}
                            options={teacherData.classes.map(c => ({
                                label: c.class_name,
                                value: c._id || '',
                            }))}
                        />
                    </div>

                    <div>
                        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Tên kênh thảo luận:</div>
                        <Input
                            placeholder="VD: Kênh thảo luận lớp Java Web K18..."
                            value={newConvTitle}
                            onChange={e => setNewConvTitle(e.target.value)}
                        />
                    </div>
                </div>
            </Modal>
        </main>
    );
};

export default TeacherChat;
