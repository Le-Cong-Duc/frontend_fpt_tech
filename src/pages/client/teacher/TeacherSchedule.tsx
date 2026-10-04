import { useEffect, useMemo, useState } from 'react';
import { Alert, Card, Input, Spin, Tag } from 'antd';
import { CalendarOutlined, SearchOutlined } from '@ant-design/icons';
import { callFetchMyTeachingClassrooms } from '@/config/api';
import type { IClassroomWithDetails } from '@/types/backend';
import styles from '@/styles/client.module.scss';

const toArray = <T,>(response: unknown): T[] => {
    const data = (response as { data?: unknown })?.data;
    if (Array.isArray(data)) return data as T[];
    if (data && typeof data === 'object' && Array.isArray((data as { result?: T[] }).result)) return (data as { result: T[] }).result;
    return [];
};

const statusText = (status?: string) => ({ OPEN: 'Đang mở', ACTIVE: 'Đang hoạt động', COMPLETED: 'Hoàn thành', CANCELLED: 'Đã hủy' }[status?.toUpperCase() || ''] || status || 'Chưa cập nhật');

const TeacherSchedule = () => {
    const [classes, setClasses] = useState<IClassroomWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');

    useEffect(() => {
        let active = true;
        const load = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await callFetchMyTeachingClassrooms();
                if (active) setClasses(toArray<IClassroomWithDetails>(response));
            } catch {
                if (active) setError('Không thể tải lịch giảng dạy.');
            } finally {
                if (active) setLoading(false);
            }
        };
        load();
        return () => { active = false; };
    }, []);

    const rows = useMemo(() => [...classes]
        .filter(item => `${item.class_name || ''} ${item.course_id?.name || ''} ${item.room || ''}`.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => new Date(a.start_date || 0).getTime() - new Date(b.start_date || 0).getTime()), [classes, search]);

    return (
        <main className={`${styles.container} ${styles['student-page']}`}>
            <section className={styles['student-heading']}>
                <div>
                    <span>TEACHER / SCHEDULE</span>
                    <h1>Lịch giảng dạy</h1>
                    <p>Lịch học và lịch dạy của các lớp bạn phụ trách.</p>
                </div>
            </section>

            {loading ? <div className={styles['portal-loading']}><Spin size="large" /></div> : error ? <Alert type="error" showIcon message={error} /> : null}

            {!loading && !error && (
                <Card className={styles['portal-card']}>
                    <div className={styles['student-filters']}>
                        <Input prefix={<SearchOutlined />} placeholder="Tìm lớp hoặc khóa học" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>

                    {!rows.length ? (
                        <div style={{ padding: 16 }}>Bạn chưa có lịch giảng dạy.</div>
                    ) : (
                        <div style={{ marginTop: 16 }}>
                            {rows.map(item => (
                                <div key={item._id} style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: 12, marginBottom: 12 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ width: 38, height: 38, borderRadius: 8, background: '#e6f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CalendarOutlined /></div>
                                            <div>
                                                <strong>{item.course_id?.name || 'Khóa học'}</strong>
                                                <div>{item.class_name || 'Lớp học'} · Phòng {item.room || 'Chưa có phòng'}</div>
                                            </div>
                                        </div>
                                        <Tag color="blue">{statusText(item.status)}</Tag>
                                    </div>
                                    <div style={{ marginTop: 10 }}>
                                        <div>Ngày: {item.start_date ? new Date(item.start_date).toLocaleDateString('vi-VN') : 'Chưa cập nhật'} - {item.end_date ? new Date(item.end_date).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}</div>
                                        <div>Giờ: {item.start_time || '—'} - {item.end_time || '—'}</div>
                                        <div>Trạng thái lớp: {statusText(item.status)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            )}
        </main>
    );
};

export default TeacherSchedule;
