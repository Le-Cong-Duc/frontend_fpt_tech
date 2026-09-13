import { Empty, Spin } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOutlined, ClockCircleOutlined, DollarOutlined, SearchOutlined, TeamOutlined } from '@ant-design/icons';
import { callFetchCourse } from '@/config/api';
import type { ICourse } from '@/types/backend';
import styles from 'styles/client.module.scss';

const CourseCard = () => {
    const [courses, setCourses] = useState<ICourse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await callFetchCourse('current=1&pageSize=12');
                const responseData = response.data as unknown as {
                    result?: ICourse[];
                    data?: { result?: ICourse[] };
                };
                const result = responseData?.result ?? responseData?.data?.result;

                if (Array.isArray(result)) setCourses(result);
                else setError('Không thể tải danh sách khóa học.');
            } catch {
                setError('Không thể tải danh sách khóa học. Vui lòng thử lại sau.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchCourses();
    }, []);

    const filteredCourses = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase();
        if (!keyword) return courses;
        return courses.filter(course =>
            [course.name, course.description, course.level, course.status]
                .some(value => value?.toLowerCase().includes(keyword))
        );
    }, [courses, searchTerm]);

    const formatPrice = (price?: string | number) => {
        if (price === undefined || price === '') return 'Liên hệ';
        const numericPrice = Number(price);
        return Number.isNaN(numericPrice)
            ? String(price)
            : `${numericPrice.toLocaleString('vi-VN')} đ`;
    };

    return (
        <div className={styles['course-section']}>
            <div className={styles['course-hero']}>
                <div>
                    <span className={styles['eyebrow']}>TRUNG TÂM ĐÀO TẠO</span>
                    <h1>Khóa học dành cho bạn</h1>
                    <p>Khám phá lộ trình học tập phù hợp và bắt đầu nâng cấp kỹ năng hôm nay.</p>
                </div>
                <div className={styles['hero-mark']}><BookOutlined /></div>
            </div>
            <div className={styles['course-toolbar']}>
                <div>
                    <h2>Danh sách khóa học</h2>
                    <span>{courses.length} chương trình đang mở</span>
                </div>
                <label className={styles['course-search']}>
                    <SearchOutlined />
                    <input
                        value={searchTerm}
                        onChange={event => setSearchTerm(event.target.value)}
                        placeholder="Tìm khóa học..."
                        aria-label="Tìm khóa học"
                    />
                </label>
            </div>
            <Spin spinning={isLoading}>
                {error ? (
                    <div className={styles['course-state']} role="alert">{error}</div>
                ) : filteredCourses.length ? (
                    <div className={styles['course-grid']}>
                        {filteredCourses.map(course => (
                            <article className={styles['course-card']} key={course._id ?? course.name}>
                                <div className={styles['course-card-top']}>
                                    <span className={styles['course-icon']}><BookOutlined /></span>
                                    <span className={styles['course-status']}>{course.status || 'Đang tuyển sinh'}</span>
                                </div>
                                <h3>{course.name}</h3>
                                <p className={styles['course-description']}>{course.description || 'Chương trình học được thiết kế thực tế, dễ tiếp cận và phù hợp nhiều trình độ.'}</p>
                                <div className={styles['course-meta']}>
                                    <span><TeamOutlined /> {course.level || 'Mọi trình độ'}</span>
                                    <span><ClockCircleOutlined /> {course.duration || 'Linh hoạt'}</span>
                                </div>
                                <div className={styles['course-footer']}>
                                    <span><DollarOutlined /> {formatPrice(course.price)}</span>
                                    <button type="button" onClick={() => navigate(`/courses/${course._id}`)}>Xem chi tiết</button>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className={styles['course-state']}>
                        <Empty description={searchTerm ? 'Không tìm thấy khóa học phù hợp' : 'Chưa có khóa học'} />
                    </div>
                )}
            </Spin>
        </div>
    );
};

export default CourseCard;
