import type { ReactNode } from 'react';
import { Card } from 'antd';
import styles from '@/styles/client.module.scss';

interface StatCardProps { title: string; value: string | number; description?: string; icon: ReactNode; accent?: 'teal' | 'navy' | 'green' | 'coral'; }

const StatCard = ({ title, value, description, icon, accent = 'teal' }: StatCardProps) => <Card className={`${styles['client-stat-card']} ${styles[`client-stat-${accent}`]}`}><div className={styles['client-stat-icon']}>{icon}</div><div><span>{title}</span><strong>{value}</strong>{description && <small>{description}</small>}</div></Card>;
export default StatCard;
