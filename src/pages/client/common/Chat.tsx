import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
    Tabs,
    Tag,
    Tooltip,
    message,
} from 'antd';
import {
    CommentOutlined,
    MessageOutlined,
    PhoneOutlined,
    PlusOutlined,
    SearchOutlined,
    SendOutlined,
    TeamOutlined,
    UserOutlined,
    SyncOutlined,
} from '@ant-design/icons';
import {
    callCreateConversation,
    callCreateMessage,
    callFetchConversation,
    callFetchContacts,
    callFetchMessage,
    callFetchMyConversations,
    callFetchUser,
} from '@/config/api';
import { useAppSelector } from '@/redux/hooks';
import type { IConversation, IMessage, IUser } from '@/types/backend';
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

export const getRoleName = (user?: IUser | { name?: string; role?: { name?: string } } | null): string => {
    if (!user) return 'Người dùng';
    const role = (user as any).role?.name || (user as any).role || '';
    const norm = String(role).toUpperCase();
    if (norm.includes('ADMIN') || norm.includes('QUAN TRI')) return 'Quản trị viên';
    if (norm.includes('TEACHER') || norm.includes('GIANG VIEN')) return 'Giảng viên';
    if (norm.includes('STUDENT') || norm.includes('HOC VIEN')) return 'Học viên';
    if (norm.includes('CONSULTANT') || norm.includes('TU VAN')) return 'Tư vấn viên';
    if (norm.includes('MANAGER') || norm.includes('QUAN LY')) return 'Quản lý';
    if (norm.includes('ACCOUNTANT') || norm.includes('KE TOAN')) return 'Kế toán';
    return role || 'Thành viên';
};

export const getRoleColor = (roleText: string): string => {
    switch (roleText) {
        case 'Quản trị viên': return 'red';
        case 'Giảng viên': return 'blue';
        case 'Học viên': return 'green';
        case 'Tư vấn viên': return 'purple';
        case 'Quản lý': return 'gold';
        case 'Kế toán': return 'cyan';
        default: return 'default';
    }
};

const CommonChat = () => {
    const currentUser = useAppSelector(state => state.account.user);

    const [conversations, setConversations] = useState<IConversation[]>([]);
    const [messages, setMessages] = useState<IMessage[]>([]);
    const [users, setUsers] = useState<IUser[]>([]);
    const [activeId, setActiveId] = useState<string>('');
    const [draft, setDraft] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [searchConv, setSearchConv] = useState('');
    const [searchContact, setSearchContact] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>();
    const [sidebarTab, setSidebarTab] = useState<'conversations' | 'contacts'>('conversations');

    // Modal tạo hội thoại
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [selectedUserToChat, setSelectedUserToChat] = useState<string>();
    const [isCreatingConv, setIsCreatingConv] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Tải dữ liệu ban đầu
    const fetchChatData = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        try {
            const [convRes, msgRes, userRes] = await Promise.all([
                callFetchMyConversations().catch(() => callFetchConversation('current=1&pageSize=200')),
                callFetchMessage('current=1&pageSize=1000'),
                callFetchContacts('current=1&pageSize=1000').catch(() => callFetchUser('current=1&pageSize=1000')),
            ]);

            const convList = toArray<IConversation>(convRes);
            const msgList = toArray<IMessage>(msgRes);
            const userList = toArray<IUser>(userRes);

            setConversations(convList);
            setMessages(msgList);
            if (userList.length > 0) {
                setUsers(userList);
            }

            if (convList.length > 0 && !activeId) {
                setActiveId(convList[0]._id || '');
            }
        } catch {
            if (!isSilent) message.error('Không thể tải dữ liệu tin nhắn hội thoại');
        } finally {
            if (!isSilent) setLoading(false);
        }
    }, [activeId]);

    useEffect(() => {
        fetchChatData();
    }, [fetchChatData]);

    // Polling tự động lấy tin nhắn mới mỗi 4s để chat thời gian thực mượt mà
    useEffect(() => {
        const interval = setInterval(() => {
            fetchChatData(true);
        }, 4000);
        return () => clearInterval(interval);
    }, [fetchChatData]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, activeId]);

    // Tìm thông tin đối tác trong hội thoại đang chọn
    const activeConversation = useMemo(() => {
        return conversations.find(c => c._id === activeId);
    }, [activeId, conversations]);

    const activePartnerInfo = useMemo(() => {
        if (!activeConversation) return { name: 'Người dùng', email: '', role: 'Thành viên', id: '' };

        const currentIdStr = String(currentUser?._id || '');
        const participants = (activeConversation as any).participants || [];
        let partnerId = '';
        let populatedPartner: any = null;

        if (Array.isArray(participants)) {
            const other = participants.find((p: any) => {
                const pId = typeof p === 'string' ? p : p?._id;
                return pId && String(pId) !== currentIdStr;
            });
            if (other && typeof other === 'object') {
                populatedPartner = other;
                partnerId = String(other._id || '');
            } else if (typeof other === 'string') {
                partnerId = other;
            }
        }

        if (!partnerId) {
            const pId = (activeConversation as any).participant_id;
            if (pId && typeof pId === 'object') {
                populatedPartner = pId;
                partnerId = String(pId._id || '');
            } else if (typeof pId === 'string') {
                partnerId = pId;
            }
        }

        // Tìm trong users hoặc dùng thông tin đã populate từ backend
        const matchedUser = users.find(u => String(u._id) === partnerId) || populatedPartner;
        if (matchedUser) {
            const role = getRoleName(matchedUser);
            return {
                name: matchedUser.name || 'Người dùng',
                email: matchedUser.email || '',
                role,
                id: matchedUser._id || partnerId,
            };
        }

        // Fallback title của conversation
        return {
            name: (activeConversation as any).title || (partnerId ? `Người dùng (${partnerId.slice(-6)})` : 'Hội thoại trực tuyến'),
            email: '',
            role: 'Thành viên',
            id: partnerId,
        };
    }, [activeConversation, currentUser?._id, users]);

    // Các tin nhắn của hội thoại hiện tại
    const currentMessages = useMemo(() => {
        if (!activeId) return [];
        return messages.filter(m => String((m as any).conversation_id) === activeId);
    }, [activeId, messages]);

    // Gửi tin nhắn
    const handleSendMessage = async () => {
        if (!draft.trim() || !activeId) return;

        const content = draft.trim();
        setDraft('');
        setSending(true);

        try {
            const res = await callCreateMessage({
                conversation_id: activeId as any,
                content,
                sender_id: (currentUser?._id || undefined) as any,
            } as any);

            if (res?.data) {
                setMessages(prev => [...prev, res.data as IMessage]);
                scrollToBottom();
                // Refresh conversations list để cập nhật last_message
                fetchChatData(true);
            } else {
                message.error('Không thể gửi tin nhắn');
                setDraft(content);
            }
        } catch {
            message.error('Lỗi khi gửi tin nhắn');
            setDraft(content);
        } finally {
            setSending(false);
        }
    };

    // Mở hoặc tạo hội thoại với 1 người dùng cụ thể
    const startChatWithUser = async (targetUserId: string) => {
        const currentIdStr = String(currentUser?._id || '');
        const targetIdStr = String(targetUserId || '');
        if (!targetIdStr || targetIdStr === currentIdStr) return;

        setIsCreatingConv(true);
        try {
            const partnerUser = users.find(u => String(u._id) === targetIdStr);
            const partnerName = partnerUser?.name || 'Người dùng';
            const title = `Chat: ${currentUser?.name || 'Tôi'} - ${partnerName}`;

            const participants = [currentIdStr, targetIdStr].filter(Boolean);

            const res = await callCreateConversation({
                title,
                participant_id: targetIdStr as any,
                participants: participants as any,
                type: 'DIRECT',
            } as any);

            const convData = (res as any)?.data;
            if (convData && convData._id) {
                await fetchChatData(true);
                setActiveId(convData._id);
                setSidebarTab('conversations');
                setCreateModalOpen(false);
                setSelectedUserToChat(undefined);
                message.success(`Đã mở cuộc trò chuyện với ${partnerName}`);
            } else {
                message.error('Không thể mở cuộc trò chuyện');
            }
        } catch (error: any) {
            console.error('Lỗi khi tạo chat:', error);
            message.error(error?.response?.data?.message || 'Lỗi khi tạo cuộc trò chuyện');
        } finally {
            setIsCreatingConv(false);
        }
    };

    // Danh sách hội thoại lọc theo search
    const filteredConversations = useMemo(() => {
        const currentIdStr = String(currentUser?._id || '');
        return conversations.filter(conv => {
            const title = String((conv as any).title || '').toLowerCase();
            const lastMsg = String((conv as any).last_message || '').toLowerCase();

            // Tìm tên partner
            const participants = (conv as any).participants || [];
            let partnerName = '';
            if (Array.isArray(participants)) {
                const other = participants.find((p: any) => {
                    const pId = typeof p === 'string' ? p : p?._id;
                    return pId && String(pId) !== currentIdStr;
                });
                const otherId = typeof other === 'string' ? other : other?._id;
                const u = users.find(user => String(user._id) === String(otherId));
                if (u) partnerName = u.name.toLowerCase();
            }

            const term = searchConv.toLowerCase();
            return title.includes(term) || lastMsg.includes(term) || partnerName.includes(term);
        });
    }, [conversations, currentUser?._id, searchConv, users]);

    // Danh bạ liên hệ lọc theo vai trò và search
    const filteredContacts = useMemo(() => {
        const currentIdStr = String(currentUser?._id || '');
        return users
            .filter(u => u._id && String(u._id) !== currentIdStr)
            .filter(u => {
                const role = getRoleName(u);
                const matchRole = !roleFilter || role === roleFilter;
                const matchSearch = `${u.name} ${u.email} ${u.phone || ''}`
                    .toLowerCase()
                    .includes(searchContact.toLowerCase());
                return matchRole && matchSearch;
            });
    }, [currentUser?._id, roleFilter, searchContact, users]);

    return (
        <div className={`${styles.container} ${styles['consultant-page']}`} style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: 24 }}>
            <section className={styles['consultant-page-heading']}>
                <div>
                    <span>HỆ THỐNG GIAO TIẾP & TRỢ GIÚP TRỰC TUYẾN</span>
                    <h1>Kênh tin nhắn & Trao đổi học tập</h1>
                    <p>Trao đổi mượt mà giữa Học viên, Giảng viên, Ban Tư vấn tuyển sinh và Ban Quản lý.</p>
                </div>
                <Space>
                    <Button icon={<SyncOutlined />} onClick={() => fetchChatData()}>
                        Làm mới
                    </Button>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setCreateModalOpen(true)}
                        style={{ background: '#0284c7' }}
                    >
                        Trò chuyện mới
                    </Button>
                </Space>
            </section>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                    <Spin size="large" />
                    <p style={{ marginTop: 12, color: '#627d98' }}>Đang tải kênh hội thoại...</p>
                </div>
            ) : (
                <div
                    style={{
                        background: '#ffffff',
                        borderRadius: 16,
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 24px -4px rgba(15, 23, 42, 0.08)',
                        display: 'flex',
                        height: 'calc(100vh - 210px)',
                        minHeight: 580,
                        maxHeight: 820,
                        overflow: 'hidden',
                    }}
                >
                    {/* Cột trái: Tab Hội thoại / Danh bạ */}
                    <aside
                        style={{
                            width: 360,
                            minWidth: 320,
                            maxWidth: 380,
                            flexShrink: 0,
                            borderRight: '1px solid #e2e8f0',
                            background: '#f8fafc',
                            display: 'flex',
                            flexDirection: 'column',
                            height: '100%',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Header Tabs */}
                        <div style={{ padding: '8px 14px 0', borderBottom: '1px solid #e2e8f0', background: '#ffffff', flexShrink: 0 }}>
                            <Tabs
                                activeKey={sidebarTab}
                                onChange={k => setSidebarTab(k as any)}
                                items={[
                                    {
                                        key: 'conversations',
                                        label: (
                                            <span style={{ fontWeight: 600 }}>
                                                <MessageOutlined /> Hội thoại ({filteredConversations.length})
                                            </span>
                                        ),
                                    },
                                    {
                                        key: 'contacts',
                                        label: (
                                            <span style={{ fontWeight: 600 }}>
                                                <TeamOutlined /> Danh bạ ({filteredContacts.length})
                                            </span>
                                        ),
                                    },
                                ]}
                            />
                        </div>

                        {/* Tab 1: Danh sách hội thoại */}
                        {sidebarTab === 'conversations' && (
                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                                <div style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', background: '#ffffff', flexShrink: 0 }}>
                                    <Input
                                        allowClear
                                        prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                                        placeholder="Tìm kiếm hội thoại..."
                                        value={searchConv}
                                        onChange={e => setSearchConv(e.target.value)}
                                        style={{ borderRadius: 8 }}
                                    />
                                </div>

                                <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                                    {!filteredConversations.length ? (
                                        <div style={{ padding: '40px 16px', textAlign: 'center' }}>
                                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có cuộc trò chuyện nào" />
                                            <Button
                                                size="small"
                                                type="link"
                                                onClick={() => setSidebarTab('contacts')}
                                                style={{ marginTop: 8 }}
                                            >
                                                Mở danh bạ để bắt đầu nhắn tin
                                            </Button>
                                        </div>
                                    ) : (
                                        <List
                                            dataSource={filteredConversations}
                                            renderItem={conv => {
                                                const isSelected = activeId === conv._id;

                                                // Tìm partner
                                                const currentIdStr = String(currentUser?._id || '');
                                                const participants = (conv as any).participants || [];
                                                let partnerUser: IUser | undefined;
                                                if (Array.isArray(participants)) {
                                                    const other = participants.find((p: any) => {
                                                        const pId = typeof p === 'string' ? p : p?._id;
                                                        return pId && String(pId) !== currentIdStr;
                                                    });
                                                    const otherId = typeof other === 'string' ? other : other?._id;
                                                    partnerUser = users.find(u => String(u._id) === String(otherId)) || (typeof other === 'object' ? other : undefined);
                                                }
                                                if (!partnerUser) {
                                                    const pId = (conv as any).participant_id;
                                                    const idStr = typeof pId === 'string' ? pId : pId?._id;
                                                    partnerUser = users.find(u => String(u._id) === String(idStr)) || (typeof pId === 'object' ? pId : undefined);
                                                }

                                                const partnerName = partnerUser?.name || (conv as any).title || 'Người dùng';
                                                const role = getRoleName(partnerUser);
                                                const roleColor = getRoleColor(role);
                                                const lastMsg = (conv as any).last_message || 'Bắt đầu cuộc trò chuyện...';

                                                return (
                                                    <div
                                                        key={conv._id}
                                                        onClick={() => setActiveId(conv._id || '')}
                                                        style={{
                                                            padding: '12px 14px',
                                                            borderBottom: '1px solid #f1f5f9',
                                                            cursor: 'pointer',
                                                            background: isSelected ? '#e0f2fe' : 'transparent',
                                                            borderLeft: isSelected ? '4px solid #0284c7' : '4px solid transparent',
                                                            transition: 'all 0.15s ease',
                                                        }}
                                                        onMouseEnter={e => {
                                                            if (!isSelected) e.currentTarget.style.background = '#f1f5f9';
                                                        }}
                                                        onMouseLeave={e => {
                                                            if (!isSelected) e.currentTarget.style.background = 'transparent';
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                            <Avatar
                                                                icon={<UserOutlined />}
                                                                size={42}
                                                                style={{
                                                                    background: isSelected ? '#0284c7' : '#94a3b8',
                                                                    flexShrink: 0,
                                                                }}
                                                            />
                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                                                                    <strong style={{ fontSize: 13, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                        {partnerName}
                                                                    </strong>
                                                                    <Tag color={roleColor} style={{ fontSize: 10, lineHeight: '18px', padding: '0 4px', margin: 0 }}>
                                                                        {role}
                                                                    </Tag>
                                                                </div>
                                                                <div style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                    {lastMsg}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }}
                                        />
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Tab 2: Danh bạ liên hệ */}
                        {sidebarTab === 'contacts' && (
                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                                <div style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', background: '#ffffff', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <Input
                                        allowClear
                                        prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                                        placeholder="Tìm tên, email..."
                                        value={searchContact}
                                        onChange={e => setSearchContact(e.target.value)}
                                        style={{ borderRadius: 8 }}
                                    />
                                    <Select
                                        allowClear
                                        placeholder="Lọc vai trò thành viên"
                                        value={roleFilter}
                                        onChange={setRoleFilter}
                                        style={{ width: '100%' }}
                                        options={[
                                            { label: 'Tất cả vai trò', value: '' },
                                            { label: 'Giảng viên', value: 'Giảng viên' },
                                            { label: 'Học viên', value: 'Học viên' },
                                            { label: 'Tư vấn viên', value: 'Tư vấn viên' },
                                            { label: 'Quản lý đào tạo', value: 'Quản lý' },
                                            { label: 'Kế toán tài vụ', value: 'Kế toán' },
                                        ]}
                                    />
                                </div>

                                <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                                    {!filteredContacts.length ? (
                                        <div style={{ padding: '40px 16px', textAlign: 'center' }}>
                                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không tìm thấy liên hệ nào" />
                                        </div>
                                    ) : (
                                        <List
                                            dataSource={filteredContacts}
                                            renderItem={u => {
                                                const role = getRoleName(u);
                                                const color = getRoleColor(role);

                                                return (
                                                    <div
                                                        key={u._id}
                                                        onClick={() => startChatWithUser(u._id || '')}
                                                        style={{
                                                            padding: '12px 14px',
                                                            borderBottom: '1px solid #f1f5f9',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            transition: 'background 0.15s ease',
                                                        }}
                                                        onMouseEnter={e => (e.currentTarget.style.background = '#f1f5f9')}
                                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                                                            <Avatar icon={<UserOutlined />} size={38} style={{ background: '#0284c7', flexShrink: 0 }} />
                                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                                <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                    {u.name}
                                                                </div>
                                                                <div style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                    {u.email}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 8 }}>
                                                            <Tag color={color} style={{ fontSize: 10, margin: 0 }}>
                                                                {role}
                                                            </Tag>
                                                            <Tooltip title="Nhắn tin ngay">
                                                                <Button
                                                                    type="text"
                                                                    size="small"
                                                                    icon={<MessageOutlined style={{ color: '#0284c7', fontSize: 16 }} />}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        startChatWithUser(u._id || '');
                                                                    }}
                                                                />
                                                            </Tooltip>
                                                        </div>
                                                    </div>
                                                );
                                            }}
                                        />
                                    )}
                                </div>
                            </div>
                        )}
                    </aside>

                    {/* Cột phải: Khung chat trực tiếp */}
                    <section
                        style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            background: '#ffffff',
                            minWidth: 0,
                            height: '100%',
                            overflow: 'hidden',
                        }}
                    >
                        {activeId ? (
                            <>
                                {/* Header đối tác */}
                                <div
                                    style={{
                                        height: 68,
                                        minHeight: 68,
                                        flexShrink: 0,
                                        padding: '0 24px',
                                        borderBottom: '1px solid #e2e8f0',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        background: '#ffffff',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                        <Avatar icon={<UserOutlined />} size={44} style={{ background: '#0284c7' }} />
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                                                    {activePartnerInfo.name}
                                                </h3>
                                                <Tag color={getRoleColor(activePartnerInfo.role)} style={{ margin: 0 }}>
                                                    {activePartnerInfo.role}
                                                </Tag>
                                            </div>
                                            <span style={{ fontSize: 12, color: '#64748b' }}>
                                                {activePartnerInfo.email || 'Thành viên hệ thống FPT Education'}
                                            </span>
                                        </div>
                                    </div>
                                    <Badge status="processing" text={<span style={{ color: '#16a34a', fontSize: 13, fontWeight: 500 }}>Trực tuyến</span>} />
                                </div>

                                {/* Danh sách tin nhắn */}
                                <div
                                    style={{
                                        flex: 1,
                                        padding: '20px 24px',
                                        overflowY: 'auto',
                                        minHeight: 0,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 14,
                                        background: '#f8fafc',
                                    }}
                                >
                                    {!currentMessages.length ? (
                                        <div style={{ margin: 'auto', textAlign: 'center', color: '#94a3b8', padding: 24 }}>
                                            <CommentOutlined style={{ fontSize: 48, marginBottom: 12, color: '#cbd5e1' }} />
                                            <h4 style={{ margin: '0 0 6px', color: '#475569', fontSize: 15 }}>Chưa có tin nhắn nào trong hội thoại này</h4>
                                            <span style={{ fontSize: 13, color: '#94a3b8' }}>Hãy gửi lời chào đầu tiên để bắt đầu kết nối ngay!</span>
                                        </div>
                                    ) : (
                                        currentMessages.map((msg, idx) => {
                                            const senderId = String((msg as any).sender_id || (msg as any).createdBy?._id || '');
                                            const isMine = senderId === String(currentUser?._id || '') || !(msg as any).sender_id;

                                            const createdAt = (msg as any).createdAt;
                                            const timeText = createdAt
                                                ? `${new Date(createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} · ${new Date(createdAt).toLocaleDateString('vi-VN')}`
                                                : '';

                                            return (
                                                <div
                                                    key={msg._id || idx}
                                                    style={{
                                                        alignSelf: isMine ? 'flex-end' : 'flex-start',
                                                        maxWidth: '70%',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: isMine ? 'flex-end' : 'flex-start',
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            padding: '10px 16px',
                                                            borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                                            background: isMine ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : '#ffffff',
                                                            color: isMine ? '#ffffff' : '#1e293b',
                                                            fontSize: 14,
                                                            lineHeight: 1.55,
                                                            boxShadow: isMine ? '0 2px 6px rgba(2, 132, 199, 0.25)' : '0 1px 3px rgba(0,0,0,0.06)',
                                                            border: isMine ? 'none' : '1px solid #e2e8f0',
                                                            wordBreak: 'break-word',
                                                            whiteSpace: 'pre-wrap',
                                                        }}
                                                    >
                                                        {String((msg as any).content || '')}
                                                    </div>
                                                    {timeText && (
                                                        <div
                                                            style={{
                                                                fontSize: 11,
                                                                color: '#94a3b8',
                                                                marginTop: 3,
                                                                padding: '0 4px',
                                                            }}
                                                        >
                                                            {timeText}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Hộp soạn thảo tin nhắn */}
                                <div
                                    style={{
                                        minHeight: 68,
                                        flexShrink: 0,
                                        padding: '12px 20px',
                                        borderTop: '1px solid #e2e8f0',
                                        background: '#ffffff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12,
                                    }}
                                >
                                    <Input
                                        placeholder="Nhập nội dung tin nhắn... (Nhấn Enter để gửi)"
                                        value={draft}
                                        onChange={e => setDraft(e.target.value)}
                                        onPressEnter={(e) => {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }}
                                        disabled={sending}
                                        style={{
                                            height: 44,
                                            borderRadius: 10,
                                            fontSize: 14,
                                            background: '#f8fafc',
                                            border: '1px solid #cbd5e1',
                                        }}
                                    />
                                    <Button
                                        type="primary"
                                        icon={<SendOutlined />}
                                        loading={sending}
                                        disabled={!draft.trim()}
                                        onClick={handleSendMessage}
                                        style={{
                                            height: 44,
                                            padding: '0 20px',
                                            borderRadius: 10,
                                            background: '#0284c7',
                                            fontWeight: 600,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6,
                                        }}
                                    >
                                        Gửi
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div style={{ margin: 'auto', textAlign: 'center', padding: 40, maxWidth: 440 }}>
                                <div
                                    style={{
                                        width: 76,
                                        height: 76,
                                        margin: '0 auto 16px',
                                        borderRadius: '50%',
                                        background: '#e0f2fe',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#0284c7',
                                        fontSize: 34,
                                    }}
                                >
                                    <MessageOutlined />
                                </div>
                                <h3 style={{ margin: '0 0 8px', color: '#0f172a', fontSize: 17, fontWeight: 700 }}>
                                    Kênh tin nhắn & Trao đổi trực tiếp
                                </h3>
                                <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: 13, lineHeight: 1.6 }}>
                                    Chọn một cuộc trò chuyện từ danh sách bên trái hoặc mở Danh bạ để liên hệ với Giảng viên, Học viên, Tư vấn viên và Quản lý.
                                </p>
                                <Button
                                    type="primary"
                                    icon={<TeamOutlined />}
                                    onClick={() => setSidebarTab('contacts')}
                                    style={{ borderRadius: 8, height: 38, background: '#0284c7' }}
                                >
                                    Mở Danh bạ thành viên
                                </Button>
                            </div>
                        )}
                    </section>
                </div>
            )}

            {/* Modal Bắt đầu trò chuyện mới */}
            <Modal
                title="Bắt đầu cuộc trò chuyện mới"
                open={createModalOpen}
                confirmLoading={isCreatingConv}
                okButtonProps={{ disabled: !selectedUserToChat }}
                okText="Bắt đầu nhắn tin"
                cancelText="Hủy"
                onOk={() => selectedUserToChat && startChatWithUser(selectedUserToChat)}
                onCancel={() => {
                    setCreateModalOpen(false);
                    setSelectedUserToChat(undefined);
                }}
                width={520}
            >
                <div style={{ marginTop: 12 }}>
                    <p style={{ margin: '0 0 10px', color: '#64748b', fontSize: 13 }}>
                        Chọn thành viên trong hệ thống (Học viên, Giảng viên, Tư vấn viên, Quản lý, Kế toán) để bắt đầu:
                    </p>
                    <Select
                        showSearch
                        placeholder="Tìm theo tên, email hoặc vai trò..."
                        optionFilterProp="label"
                        value={selectedUserToChat}
                        onChange={setSelectedUserToChat}
                        style={{ width: '100%' }}
                        options={users
                            .filter(u => u._id && String(u._id) !== String(currentUser?._id))
                            .map(u => ({
                                label: `${u.name} (${getRoleName(u)}) · ${u.email}`,
                                value: u._id || '',
                            }))}
                    />
                </div>
            </Modal>
        </div>
    );
};

export default CommonChat;
