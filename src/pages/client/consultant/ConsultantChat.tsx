import { useEffect, useState } from 'react';
import { Alert, Button, Card, Empty, Input, List, Spin, message } from 'antd';
import { MessageOutlined, SendOutlined } from '@ant-design/icons';
import { callFetchConversation, callFetchMessage } from '@/config/api';
import type { IConversation, IMessage } from '@/types/backend';
import { toArray } from './consultant.shared';
import styles from '@/styles/client.module.scss';

const ConsultantChat = () => {
    const [conversations, setConversations] = useState<IConversation[]>([]); const [messages, setMessages] = useState<IMessage[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [active, setActive] = useState(''); const [text, setText] = useState('');
    useEffect(() => { Promise.all([callFetchConversation('current=1&pageSize=100'), callFetchMessage('current=1&pageSize=100')]).then(([conversationResponse, messageResponse]) => { setConversations(toArray<IConversation>(conversationResponse)); setMessages(toArray<IMessage>(messageResponse)); }).catch(() => setError('Không thể tải hội thoại.')).finally(() => setLoading(false)); }, []);
    if (loading) return <div className={styles['portal-loading']}><Spin size="large" /></div>;
    return <main className={`${styles.container} ${styles['consultant-page']}`}><section className={styles['consultant-page-heading']}><div><span>CONSULTANT / MESSAGES</span><h1>Tin nhắn</h1><p>Không gian trao đổi với khách hàng và học viên.</p></div></section>{error ? <Alert type="error" message={error} /> : <Card className={`${styles['portal-card']} ${styles['consultant-chat']}`} bodyStyle={{ padding: 0 }}><aside><div className={styles['chat-title']}><MessageOutlined /> Hội thoại</div>{conversations.length ? <List dataSource={conversations} renderItem={conversation => <List.Item className={active === conversation._id ? styles['chat-active'] : ''} onClick={() => setActive(conversation._id || '')}><List.Item.Meta title={String(conversation.participant_id || conversation._id || 'Hội thoại')} description="Chưa có tin nhắn cuối" /></List.Item>} /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có hội thoại" />}</aside><section className={styles['chat-thread']}>{active ? <><div className={styles['chat-messages']}>{messages.filter(item => String(item.conversation_id) === active).map(item => <div className={styles['chat-bubble']} key={item._id}>{String(item.content || '')}</div>)}</div><div className={styles['chat-composer']}><Input value={text} onChange={event => setText(event.target.value)} placeholder="Nhập tin nhắn..." /><Button type="primary" icon={<SendOutlined />} onClick={() => message.info('API gửi Message chưa được xác nhận trong backend hiện tại.')} /></div></> : <Empty description="Chọn một hội thoại để bắt đầu" />}</section></Card>}</main>;
};
export default ConsultantChat;
