import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Alert, Card, Empty, Spin, Tag } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, UserOutlined } from '@ant-design/icons';
import { callFetchClassroom, callFetchCourse, callFetchMyAssignedLeads } from '@/config/api';
import type { IClassroomWithDetails, ICourse, ILead } from '@/types/backend';
import styles from '@/styles/client.module.scss';

export const toArray = <T,>(response: unknown): T[] => {
    const data = (response as { data?: unknown })?.data;
    if (Array.isArray(data)) return data as T[];
    if (data && typeof data === 'object' && Array.isArray((data as { result?: T[] }).result)) return (data as { result: T[] }).result;
    return [];
};
export const money = (value?: string | number) => value === undefined || value === '' ? 'Liên hệ' : `${Number(value).toLocaleString('vi-VN')} đ`;
export const statusText = (status?: string) => ({ INVITED: 'Khách mời', NEW: 'Khách mới', CONSULTED: 'Đã tư vấn', REGISTERED: 'Đã đăng ký', CONTACTED: 'Đã liên hệ' }[status?.toUpperCase() || ''] || status || 'Chưa cập nhật');
export const statusColor = (status?: string) => status?.toUpperCase() === 'REGISTERED' ? 'green' : status?.toUpperCase() === 'CONSULTED' || status?.toUpperCase() === 'CONTACTED' ? 'blue' : 'gold';
export const statusTag = (status?: string) => <Tag color={statusColor(status)}>{statusText(status)}</Tag>;
export const ConsultantState = ({ loading, error, children }: { loading: boolean; error: string; children: ReactNode }) => loading ? <div className={styles['portal-loading']}><Spin size="large" /></div> : error ? <Alert type="error" showIcon message={error} /> : <>{children}</>;
export const ConsultantEmpty = ({ description }: { description: string }) => <Card className={styles['portal-card']}><Empty description={description} /></Card>;

export interface ConsultantData { leads: ILead[]; courses: ICourse[]; classrooms: IClassroomWithDetails[]; }
export const useConsultantData = () => {
    const [data, setData] = useState<ConsultantData>({ leads: [], courses: [], classrooms: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const refresh = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const [leadResponse, courseResponse, classroomResponse] = await Promise.all([
                callFetchMyAssignedLeads(), callFetchCourse('current=1&pageSize=1000'), callFetchClassroom('current=1&pageSize=1000&populate=course_id,teacher_id'),
            ]);
            setData({ leads: toArray<ILead>(leadResponse), courses: toArray<ICourse>(courseResponse), classrooms: toArray<IClassroomWithDetails>(classroomResponse) });
        } catch { setError('Không thể tải dữ liệu tư vấn. Vui lòng thử lại sau.'); }
        finally { setLoading(false); }
    }, []);
    useEffect(() => { refresh(); }, [refresh]);
    return { ...data, loading, error, refresh };
};
export const useLeadStats = (leads: ILead[]) => useMemo(() => ({ total: leads.length, newLeads: leads.filter(lead => !lead.status || ['NEW', 'INVITED'].includes(lead.status.toUpperCase())).length, consulted: leads.filter(lead => ['CONSULTED', 'CONTACTED'].includes(lead.status?.toUpperCase() || '')).length, registered: leads.filter(lead => lead.status?.toUpperCase() === 'REGISTERED').length }), [leads]);
export const StatCard = ({ title, value, icon, accent }: { title: string; value: number; icon: ReactNode; accent: string }) => <Card className={`${styles['consultant-stat']} ${styles[`stat-${accent}`]}`}><div className={styles['consultant-stat-icon']}>{icon}</div><div><span>{title}</span><strong>{value}</strong></div></Card>;
export const LeadIcon = ({ status }: { status?: string }) => status?.toUpperCase() === 'REGISTERED' ? <CheckCircleOutlined /> : status?.toUpperCase() === 'CONSULTED' ? <ClockCircleOutlined /> : <UserOutlined />;
