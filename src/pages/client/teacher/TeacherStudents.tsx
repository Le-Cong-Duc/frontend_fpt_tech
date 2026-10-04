import { useEffect, useMemo, useState } from 'react';
import { Alert, Card, Input, Select, Spin } from 'antd';
import { SearchOutlined, TeamOutlined } from '@ant-design/icons';
import { callFetchMyStudents } from '@/config/api';
import type { IPortalEnrollment } from '@/types/backend';
import styles from '@/styles/client.module.scss';

const toArray = <T,>(response: unknown): T[] => {
    const data = (response as { data?: unknown })?.data;
    if (Array.isArray(data)) return data as T[];
    if (data && typeof data === 'object' && Array.isArray((data as { result?: T[] }).result)) return (data as { result: T[] }).result;
    return [];
};

const TeacherStudents = () => {
    const [students, setStudents] = useState<IPortalEnrollment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [classFilter, setClassFilter] = useState<string>();
    const [statusFilter, setStatusFilter] = useState<string>();

    useEffect(() => {
        let active = true;
        const load = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await callFetchMyStudents();
                if (active) setStudents(toArray<IPortalEnrollment>(response));
            } catch {
                if (active) setError('Không thể tải danh sách học viên.');
            } finally {
                if (active) setLoading(false);
            }
        };
        load();
        return () => { active = false; };
    }, []);

    const classOptions = useMemo(() => Array.from(new Set(students.map(item => item.class_id?.class_name).filter(Boolean) as string[])).map(value => ({ label: value, value })), [students]);

    const filteredStudents = useMemo(() => students.filter(item => {
        const haystack = `${item.student_id?.name || ''} ${item.student_id?.email || ''} ${item.class_id?.class_name || ''}`.toLowerCase();
        const matchesSearch = haystack.includes(search.toLowerCase());
        const matchesClass = !classFilter || item.class_id?.class_name === classFilter;
        const matchesStatus = !statusFilter || item.status?.toUpperCase() === statusFilter.toUpperCase();
        return matchesSearch && matchesClass && matchesStatus;
    }), [classFilter, search, statusFilter, students]);

    return (
        <main className={`${styles.container} ${styles['student-page']}`}>
            <section className={styles['student-heading']}>
                <div>
                    <span>TEACHER / STUDENTS</span>
                    <h1>Học viên của tôi</h1>
                    <p>Quản lý các học viên thuộc các lớp bạn phụ trách.</p>
                </div>
            </section>

            {loading ? <div className={styles['portal-loading']}><Spin size="large" /></div> : error ? <Alert type="error" showIcon message={error} /> : null}

            {!loading && !error && (
                <Card className={styles['portal-card']}>
                    <div className={styles['student-filters']}>
                        <Input prefix={<SearchOutlined />} placeholder="Tìm tên hoặc email học viên" value={search} onChange={e => setSearch(e.target.value)} />
                        <Select allowClear placeholder="Lớp học" value={classFilter} onChange={setClassFilter} options={classOptions} />
                        <Select allowClear placeholder="Trạng thái" value={statusFilter} onChange={setStatusFilter} options={[{ label: 'Đang học', value: 'STUDYING' }, { label: 'Hoàn thành', value: 'COMPLETED' }, { label: 'Chờ thanh toán', value: 'WAITING_PAYMENT' }, { label: 'Đã hủy', value: 'CANCELLED' }]} />
                    </div>

                    {!filteredStudents.length ? (
                        <div style={{ padding: 16 }}>Chưa có học viên.</div>
                    ) : (
                        <div style={{ marginTop: 16 }}>
                            {filteredStudents.map((item, index) => (
                                <div key={item._id || `${item.student_id?._id || 'student'}-${index}`} style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: 12, marginBottom: 12 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                                        <div>
                                            <strong>{index + 1}. {item.student_id?.name || 'Học viên'}</strong>
                                            <div>Email: {item.student_id?.email || 'Chưa cập nhật'}</div>
                                            <div>Phone: {item.student_id?.phone || 'Chưa cập nhật'}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div><TeamOutlined /> {item.class_id?.class_name || 'Chưa có lớp'}</div>
                                            <div>Khóa học: {item.class_id?.course_id?.name || 'Chưa cập nhật'}</div>
                                            <div>Trạng thái: {item.status || 'Chưa cập nhật'}</div>
                                        </div>
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

export default TeacherStudents;
