import type { ReactNode } from 'react';
import { Button, Card } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import styles from '@/styles/client.module.scss';

const QuickActionCard = ({ label, description, icon, to }: { label: string; description: string; icon: ReactNode; to: string }) => {
    const navigate = useNavigate();
    return <Card className={styles['client-quick-action']} onClick={() => navigate(to)}><span className={styles['client-quick-icon']}>{icon}</span><div><strong>{label}</strong><small>{description}</small></div><Button type="text" aria-label={label} icon={<ArrowRightOutlined />} /></Card>;
};
export default QuickActionCard;
