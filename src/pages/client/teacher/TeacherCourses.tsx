import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Input, Select, Spin, Tag } from 'antd';
import { BookOutlined, SearchOutlined } from '@ant-design/icons';
import { callFetchMyTeachingClassrooms } from '@/config/api';
import type { IClassroomWithDetails, ICourse } from '@/types/backend';
import styles from '@/styles/client.module.scss';

const toArray = <T,>(response: unknown): T[] => {
    const data = (response as { data?: unknown })?.data;
    if (Array.isArray(data)) return data as T[];
    if (data && typeof data === 'object' && Array.isArray((data as { result?: T[] }).result)) return (data as { result: T[] }).result;
    return [];
};

const statusText = (status?: string) => ({ OPEN: 'Đang mở', ACTIVE: 'Đang hoạt động', COMPLETED: 'Hoàn thành', CANCELLED: 'Đã hủy' }[status?.toUpperCase() || ''] || status || 'Chưa cập nhật');

const TeacherCourses = () => {
    const [classes, setClasses] = useState<IClassroomWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<string>();
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');

    useEffect(() => {
        let active = true;
        const load = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await callFetchMyTeachingClassrooms();
                if (active) setClasses(toArray<IClassroomWithDetails>(response));
            } catch {
                if (active) setError('Không thể tải dữ liệu khóa học.');
            } finally {
                if (active) setLoading(false);
            }
        };
        load();
        return () => { active = false; };
    }, []);

    const courses = useMemo(() => {
        const map = new Map<string, ICourse & { classCount: number; status?: string; classrooms: IClassroomWithDetails[] }>();

        classes.forEach(item => {
            const course = item.course_id;
            if (!course || !course._id) return;
            const existing = map.get(course._id) || { ...course, classCount: 0, classrooms: [] };
            existing.classCount += 1;
            existing.classrooms.push(item);
            existing.status = item.status || existing.status;
            map.set(course._id, existing);
        });

        return Array.from(map.values());
    }, [classes]);

    const filteredCourses = useMemo(() => courses.filter(course => {
        const matchesSearch = `${course.name || ''} ${course.description || ''}`.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = !status || (course.status || 'ACTIVE').toUpperCase() === status.toUpperCase();
        return matchesSearch && matchesStatus;
    }), [courses, search, status]);

    const selectedCourse = filteredCourses.find(item => item._id === selectedCourseId) || filteredCourses[0] || courses[0];

    useEffect(() => {
        if (!selectedCourse && courses.length) setSelectedCourseId(courses[0]._id || '');
        else if (selectedCourse && !selectedCourseId) setSelectedCourseId(selectedCourse._id || '');
    }, [courses, selectedCourse, selectedCourseId]);

    return (
        <main className={`${styles.container} ${styles['student-page']}`}>
            <section className={styles['student-heading']}>
                <div>
                    <span>TEACHER / COURSES</span>
                    <h1>Khóa học của tôi</h1>
                    <p>Các khóa học bạn đang phụ trách trong trung tâm.</p>
                </div>
            </section>

            {loading ? <div className={styles['portal-loading']}><Spin size="large" /></div> : error ? <Alert type="error" showIcon message={error} /> : null}

            {!loading && !error && (
                <>
                    {!filteredCourses.length ? (
                        <Card className={styles['portal-card']}><p>Bạn chưa được phân công khóa học nào.</p></Card>
                    ) : (
                        <>
                            <Card className={styles['portal-card']} style={{ marginBottom: 16 }}>
                                <div className={styles['student-filters']}>
                                    <Input prefix={<SearchOutlined />} placeholder="Tìm khóa học" value={search} onChange={e => setSearch(e.target.value)} />
                                    <Select allowClear placeholder="Trạng thái" value={status} onChange={setStatus} options={[
                                        { label: 'Đang hoạt động', value: 'ACTIVE' },
                                        { label: 'Đang mở', value: 'OPEN' },
                                        { label: 'Hoàn thành', value: 'COMPLETED' },
                                        { label: 'Đã hủy', value: 'CANCELLED' },
                                    ]} />
                                </div>
                            </Card>

                            <div className={styles['student-course-grid']}>
                                {filteredCourses.map(course => (
                                    <article className={styles['student-course-card']} key={course._id}>
                                        <div className={styles['student-course-icon']}><BookOutlined /></div>
                                        <div>
                                            <h3>{course.name}</h3>
                                            <p>{course.description || 'Chưa có mô tả khóa học.'}</p>
                                            <p>Level: {course.level || 'Chưa cập nhật'} · Thời lượng: {course.duration || 'Chưa cập nhật'}</p>
                                            <p>{course.classCount} lớp đang giảng dạy</p>
                                        </div>
                                        <div className={styles['student-course-status']}>
                                            <Tag color="blue">{statusText(course.status || 'ACTIVE')}</Tag>
                                            <Button type="primary" onClick={() => setSelectedCourseId(course._id || '')}>Xem chi tiết</Button>
                                        </div>
                                    </article>
                                ))}
                            </div>

                            {selectedCourse && (
                                <Card className={styles['portal-card']} title={selectedCourse.name} style={{ marginTop: 16 }}>
                                    <p><strong>Mã khóa học:</strong> {selectedCourse._id || 'Chưa có mã'}</p>
                                    <p><strong>Mô tả:</strong> {selectedCourse.description || 'Chưa có mô tả'}</p>
                                    <p><strong>Level:</strong> {selectedCourse.level || 'Chưa cập nhật'}</p>
                                    <p><strong>Thời lượng:</strong> {selectedCourse.duration || 'Chưa cập nhật'}</p>
                                    <p><strong>Status:</strong> {statusText(selectedCourse.status || 'ACTIVE')}</p>

                                    <h4 style={{ marginTop: 16 }}>Các lớp đang dạy</h4>
                                    {(selectedCourse.classrooms || []).map(item => (
                                        <div key={item._id} style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: 12, marginTop: 8 }}>
                                            <p><strong>{item.class_name || 'Lớp học'}</strong> · Phòng {item.room || 'Chưa có phòng'}</p>
                                            <p>Học viên: {item.max_student || 'Chưa cập nhật'} · Thời gian: {item.start_time || '—'} - {item.end_time || '—'}</p>
                                            <p>Ngày bắt đầu: {item.start_date ? new Date(item.start_date).toLocaleDateString('vi-VN') : 'Chưa cập nhật'} · Ngày kết thúc: {item.end_date ? new Date(item.end_date).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}</p>
                                            <Tag color="green">{statusText(item.status)}</Tag>
                                        </div>
                                    ))}
                                </Card>
                            )}
                        </>
                    )}
                </>
            )}
        </main>
    );
};

export default TeacherCourses;
