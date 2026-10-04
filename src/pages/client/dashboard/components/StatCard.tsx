import type { ReactNode } from 'react';
import { Card, Spin } from 'antd';
import styles from '@/styles/client.module.scss';

export interface StatCardProps {
    title: string;
    value: string | number;
    description?: string;
    icon: ReactNode;
    accent?: 'teal' | 'navy' | 'green' | 'coral';
    loading?: boolean;
    emptyText?: string;
}

const StatCard = ({
    title,
    value,
    description,
    icon,
    accent = 'teal',
    loading = false,
    emptyText,
}: StatCardProps) => (
    <Card className={`${styles['client-stat-card']} ${styles[`client-stat-${accent}`]}`}>
        <div className={styles['client-stat-icon']}>{icon}</div>
        <div>
            <span>{title}</span>
            {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', minHeight: 32 }}>
                    <Spin size="small" />
                </div>
            ) : (
                <strong>{value || emptyText || '—'}</strong>
            )}
            {description && !loading && <small>{description}</small>}
        </div>
    </Card>
);

export default StatCard;
