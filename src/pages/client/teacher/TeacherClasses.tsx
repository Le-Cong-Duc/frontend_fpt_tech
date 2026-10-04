import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Input, Spin, Tag } from 'antd';
import { SearchOutlined, TeamOutlined } from '@ant-design/icons';
import { callFetchEnrollment, callFetchMyTeachingClassrooms } from '@/config/api';
import type { IClassroomWithDetails, IPortalEnrollment } from '@/types/backend';
import styles from '@/styles/client.module.scss';

const toArray = <T,>(response: unknown): T[] => {
    const data = (response as { data?: unknown })?.data;
    if (Array.isArray(data)) return data as T[];
    if (data && typeof data === 'object' && Array.isArray((data as { result?: T[] }).result)) return (data as { result: T[] }).result;
    return [];
};

const statusText = (status?: string) => ({ OPEN: 'Đang mở', ACTIVE: 'Đang hoạt động', COMPLETED: 'Hoàn thành', CANCELLED: 'Đã hủy' }[status?.toUpperCase() || ''] || status || 'Chưa cập nhật');

const TeacherClasses = () => {
    const [classes, setClasses] = useState<IClassroomWithDetails[]>([]);
    const [students, setStudents] = useState<IPortalEnrollment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState<string>('');

    useEffect(() => {
        let active = true;
        const load = async () => {
            setLoading(true);
            setError('');
            try {
                const [classroomResponse, enrollmentResponse] = await Promise.all([
                    callFetchMyTeachingClassrooms(),
                    callFetchEnrollment('current=1&pageSize=1000&populate=student_id,class_id'),
                ]);
                if (active) {
                    const nextClasses = toArray<IClassroomWithDetails>(classroomResponse);
                    const nextStudents = toArray<IPortalEnrollment>(enrollmentResponse);
                    setClasses(nextClasses);
                    setStudents(nextStudents);
                    if (nextClasses.length) setSelectedId(current => current || nextClasses[0]._id || '');
                }
            } catch {
                if (active) setError('Không thể tải dữ liệu lớp học.');
            } finally {
                if (active) setLoading(false);
            }
        };
        load();
        return () => { active = false; };
    }, []);

    const filteredClasses = useMemo(() => classes.filter(item => `${item.class_name || ''} ${item.course_id?.name || ''} ${item.room || ''}`.toLowerCase().includes(search.toLowerCase())), [classes, search]);
    const selectedClass = filteredClasses.find(item => item._id === selectedId) || filteredClasses[0] || null;
    const studentRows = students.filter(item => item.class_id?._id === selectedClass?._id);

    return (
        <main className={`${styles.container} ${styles['student-page']}`}>
            <section className={styles['student-heading']}>
                <div>
                    <span>TEACHER / CLASSES</span>
                    <h1>Lớp học của tôi</h1>
                    <p>Danh sách các lớp bạn đang phụ trách.</p>
                </div>
            </section>

            {loading ? <div className={styles['portal-loading']}><Spin size="large" /></div> : error ? <Alert type="error" showIcon message={error} /> : null}

            {!loading && !error && (
                <>
                    {!filteredClasses.length ? (
                        <Card className={styles['portal-card']}><p>Bạn chưa được phân công lớp học nào.</p></Card>
                    ) : (
                        <>
                            <Card className={styles['portal-card']} style={{ marginBottom: 16 }}>
                                <div className={styles['student-filters']}>
                                    <Input prefix={<SearchOutlined />} placeholder="Tìm lớp học hoặc khóa học" value={search} onChange={e => setSearch(e.target.value)} />
                                </div>
                            </Card>

                            <div className={styles['student-course-grid']}>
                                {filteredClasses.map(item => (
                                    <article className={styles['student-course-card']} key={item._id}>
                                        <div className={styles['student-course-icon']}><TeamOutlined /></div>
                                        <div>
                                            <h3>{item.class_name || 'Lớp học'}</h3>
                                            <p>Khóa học: {item.course_id?.name || 'Chưa có khóa học'}</p>
                                            <p>Phòng: {item.room || 'Chưa có phòng'} · Số học viên: {item.max_student || 'Chưa cập nhật'}</p>
                                            <p>Thời gian: {item.start_time || '—'} - {item.end_time || '—'}</p>
                                            <p>Ngày bắt đầu: {item.start_date ? new Date(item.start_date).toLocaleDateString('vi-VN') : 'Chưa cập nhật'} · Kết thúc: {item.end_date ? new Date(item.end_date).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}</p>
                                        </div>
                                        <div className={styles['student-course-status']}>
                                            <Tag color="blue">{statusText(item.status)}</Tag>
                                            <Button type="primary" onClick={() => setSelectedId(item._id || '')}>Xem chi tiết</Button>
                                        </div>
                                    </article>
                                ))}
                            </div>

                            {selectedClass && (
                                <Card className={styles['portal-card']} title={selectedClass.class_name || 'Chi tiết lớp học'} style={{ marginTop: 16 }}>
                                    <p><strong>Khóa học:</strong> {selectedClass.course_id?.name || 'Chưa cập nhật'}</p>
                                    <p><strong>Phòng:</strong> {selectedClass.room || 'Chưa có phòng'}</p>
                                    <p><strong>Lịch học:</strong> {selectedClass.start_time || '—'} - {selectedClass.end_time || '—'}</p>
                                    <p><strong>Ngày bắt đầu:</strong> {selectedClass.start_date ? new Date(selectedClass.start_date).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}</p>
                                    <p><strong>Ngày kết thúc:</strong> {selectedClass.end_date ? new Date(selectedClass.end_date).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}</p>
                                    <p><strong>Status:</strong> {statusText(selectedClass.status)}</p>
                                    <p><strong>Số lượng học viên:</strong> {studentRows.length}</p>

                                    <h4 style={{ marginTop: 16 }}>Danh sách học viên</h4>
                                    {studentRows.length ? (
                                        <div>
                                            {studentRows.map((item, index) => (
                                                <div key={item._id || `${selectedClass._id}-${index}`} style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: 12, marginTop: 8 }}>
                                                    <p><strong>{index + 1}. {item.student_id?.name || 'Học viên'}</strong></p>
                                                    <p>Email: {item.student_id?.email || 'Chưa cập nhật'}</p>
                                                    <p>Trạng thái: {item.status || 'Chưa cập nhật'}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p>Chưa có học viên trong lớp này.</p>
                                    )}
                                </Card>
                            )}
                        </>
                    )}
                </>
            )}
        </main>
    );
};

export default TeacherClasses;
