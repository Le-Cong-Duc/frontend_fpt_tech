import { Alert, Empty, List, Spin, Tag } from 'antd';
import type { ReactNode } from 'react';
import styles from '@/styles/client.module.scss';

export interface ActivityItem {
    key: string;
    title: string;
    detail?: string;
    icon?: ReactNode;
    status?: string;
}

interface RecentActivityProps {
    items: ActivityItem[];
    title?: string;
    loading?: boolean;
    error?: string;
    emptyText?: string;
}

const RecentActivity = ({
    items,
    title = 'Hoạt động gần đây',
    loading = false,
    error,
    emptyText = 'Chưa có hoạt động',
}: RecentActivityProps) => (
    <section className={styles['client-dashboard-panel']}>
        <div className={styles['client-panel-heading']}>
            <h2>{title}</h2>
            <span>{items.length} mục</span>
        </div>

        {loading ? (
            <div className={styles['portal-loading']}><Spin size="small" /></div>
        ) : error ? (
            <Alert type="error" showIcon message={error} />
        ) : items.length ? (
            <List
                dataSource={items.slice(0, 6)}
                renderItem={item => (
                    <List.Item>
                        <List.Item.Meta
                            avatar={<span className={styles['client-activity-icon']}>{item.icon}</span>}
                            title={item.title}
                            description={item.detail}
                        />
                        {item.status && <Tag color="blue">{item.status}</Tag>}
                    </List.Item>
                )}
            />
        ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} />
        )}
    </section>
);

export default RecentActivity;
