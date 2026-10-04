import type { ReactNode } from 'react';
import { Button, Card, Spin } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import styles from '@/styles/client.module.scss';

export interface QuickActionCardProps {
    label: string;
    description: string;
    icon: ReactNode;
    to?: string;
    disabled?: boolean;
    loading?: boolean;
}

const QuickActionCard = ({ label, description, icon, to, disabled = false, loading = false }: QuickActionCardProps) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if (disabled || loading || !to) return;
        navigate(to);
    };

    return (
        <Card
            className={styles['client-quick-action']}
            onClick={handleClick}
            style={disabled || loading ? { opacity: 0.7, cursor: 'not-allowed' } : undefined}
        >
            <span className={styles['client-quick-icon']}>{icon}</span>
            <div>
                <strong>{label}</strong>
                <small>{loading ? 'Đang tải...' : description}</small>
            </div>
            <Button type="text" aria-label={label} disabled={disabled || loading} icon={loading ? <Spin size="small" /> : <ArrowRightOutlined />} />
        </Card>
    );
};

export default QuickActionCard;
