import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Input, Spin } from 'antd';
import { MessageOutlined } from '@ant-design/icons';
import { callCreateMessage, callFetchConversation, callFetchMessage } from '@/config/api';
import { useAppSelector } from '@/redux/hooks';
import type { IConversation, IMessage } from '@/types/backend';
import styles from '@/styles/client.module.scss';

const toArray = <T,>(response: unknown): T[] => {
    const data = (response as { data?: unknown })?.data;
    if (Array.isArray(data)) return data as T[];
    if (data && typeof data === 'object' && Array.isArray((data as { result?: T[] }).result)) return (data as { result: T[] }).result;
    return [];
};

const TeacherChat = () => {
    const user = useAppSelector(state => state.account.user);
    const [conversations, setConversations] = useState<IConversation[]>([]);
    const [messages, setMessages] = useState<IMessage[]>([]);
    const [selectedId, setSelectedId] = useState<string>('');
    const [draft, setDraft] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');

    const refreshConversations = async () => {
        try {
            const response = await callFetchConversation('current=1&pageSize=1000');
            const next = toArray<IConversation>(response);
            setConversations(next);
            if (next.length && !selectedId) setSelectedId(next[0]._id || '');
        } catch {
            setError('Không thể tải cuộc trò chuyện.');
        }
    };

    useEffect(() => {
        let active = true;
        const load = async () => {
            setLoading(true);
            setError('');
            try {
                await refreshConversations();
            } catch {
                if (active) setError('Không thể tải cuộc trò chuyện.');
            } finally {
                if (active) setLoading(false);
            }
        };
        load();
        return () => { active = false; };
    }, []);

    useEffect(() => {
        if (!selectedId) return;
        const loadMessages = async () => {
            try {
                const response = await callFetchMessage(`current=1&pageSize=1000&conversation_id=${selectedId}`);
                setMessages(toArray<IMessage>(response));
            } catch {
                setError('Không thể tải tin nhắn của cuộc trò chuyện.');
            }
        };
        loadMessages();
    }, [selectedId]);

    const selectedConversation = useMemo(() => conversations.find(item => item._id === selectedId) || conversations[0], [conversations, selectedId]);

    const handleSend = async () => {
        if (!selectedConversation?._id || !draft.trim()) return;
        setSending(true);
        try {
            await callCreateMessage({
                conversation_id: selectedConversation._id,
                sender_id: user._id,
                content: draft.trim(),
                createdAt: new Date().toISOString(),
            } as IMessage);
            setDraft('');
            const response = await callFetchMessage(`current=1&pageSize=1000&conversation_id=${selectedConversation._id}`);
            setMessages(toArray<IMessage>(response));
        } catch {
            setError('Không thể gửi tin nhắn.');
        } finally {
            setSending(false);
        }
    };

    return (
        <main className={`${styles.container} ${styles['student-page']}`}>
            <section className={styles['student-heading']}>
                <div>
                    <span>TEACHER / CHAT</span>
                    <h1>Chat</h1>
                    <p>Trao đổi với học viên, quản lý hoặc đối tượng có liên quan.</p>
                </div>
            </section>

            {loading ? <div className={styles['portal-loading']}><Spin size="large" /></div> : error ? <Alert type="error" showIcon message={error} /> : null}

            {!loading && !error && (
                <Card className={styles['portal-card']}>
                    {!conversations.length ? (
                        <div style={{ padding: 16 }}>Chưa có cuộc trò chuyện nào.</div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 320px) minmax(0, 1fr)', gap: 16 }}>
                            <div>
                                {conversations.map(item => (
                                    <div
                                        key={item._id}
                                        onClick={() => setSelectedId(item._id || '')}
                                        style={{
                                            padding: 12,
                                            borderRadius: 8,
                                            border: item._id === selectedConversation?._id ? '1px solid #1677ff' : '1px solid #f0f0f0',
                                            marginBottom: 8,
                                            cursor: 'pointer',
                                            background: item._id === selectedConversation?._id ? '#f6faff' : '#fff',
                                        }}
                                    >
                                        <div style={{ fontWeight: 600 }}>{(item as { title?: string; name?: string })?.title || (item as { title?: string; name?: string })?.name || 'Cuộc trò chuyện'}</div>
                                        <small>{(item as { last_message?: string })?.last_message || 'Chưa có tin nhắn'}</small>
                                    </div>
                                ))}
                            </div>
                            <div>
                                <div style={{ marginBottom: 12, padding: 12, borderRadius: 8, background: '#f5f5f5' }}>
                                    <strong>{(selectedConversation as { title?: string; name?: string })?.title || (selectedConversation as { name?: string })?.name || 'Cuộc trò chuyện'}</strong>
                                </div>
                                <div style={{ minHeight: 220, maxHeight: 320, overflowY: 'auto', paddingRight: 8 }}>
                                    {messages.length ? messages.map(item => (
                                        <div key={item._id} style={{ marginBottom: 8, padding: 8, borderRadius: 8, background: item.sender_id === user._id ? '#e6f4ff' : '#f5f5f5' }}>
                                            <div style={{ fontWeight: 600 }}>{typeof item.sender === 'object' ? ((item.sender as { name?: string })?.name || 'Bạn') : 'Bạn'}</div>
                                            <div>{String((item as { content?: string; message?: string }).content ?? (item as { content?: string; message?: string }).message ?? 'Tin nhắn')}</div>
                                        </div>
                                    )) : <div>Chọn một cuộc trò chuyện để bắt đầu.</div>}
                                </div>
                                <div style={{ marginTop: 16 }}>
                                    <Input.TextArea rows={3} value={draft} onChange={e => setDraft(e.target.value)} placeholder="Nhập tin nhắn..." />
                                    <Button type="primary" icon={<MessageOutlined />} loading={sending} onClick={handleSend} style={{ marginTop: 12 }}>
                                        Gửi tin nhắn
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </Card>
            )}
        </main>
    );
};

export default TeacherChat;
