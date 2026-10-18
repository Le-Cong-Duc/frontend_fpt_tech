import { useEffect, useState } from 'react';
import { Alert, Button, Empty, Spin } from 'antd';
import { ArrowLeftOutlined, CreditCardOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { callFetchCourseById } from '@/config/api';
import type { ICourse } from '@/types/backend';
import styles from '@/styles/client.module.scss';

const CourseCheckout = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState<ICourse>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;

        const loadCourse = async () => {
            if (!id) {
                setError('Không xác định được khóa học.');
                setLoading(false);
                return;
            }

            try {
                const response = await callFetchCourseById(id);
                if (active && response.data) setCourse(response.data);
                else if (active) setError('Không tìm thấy khóa học.');
            } catch {
                if (active) setError('Không thể tải thông tin khóa học. Vui lòng thử lại sau.');
            } finally {
                if (active) setLoading(false);
            }
        };

        loadCourse();
        return () => { active = false; };
    }, [id]);

    if (loading) return <main className={`${styles.container} ${styles['portal-loading']}`}><Spin size="large" /></main>;
    if (error || !course) return <main className={styles.container}>
        {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
        <Empty description="Không tìm thấy khóa học" />
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/')}>Trở về trang chủ</Button>
    </main>;

    const tuition = course.price ? `${Number(course.price).toLocaleString('vi-VN')} đ` : 'Liên hệ';

    return (
        <main className={`${styles.container} ${styles['course-checkout']}`}>
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/')}>Trở về trang chủ</Button>
            <section className={styles['checkout-layout']}>
                <article className={styles['checkout-course-summary']}>
                    <span className={styles['checkout-eyebrow']}>XÁC NHẬN THANH TOÁN</span>
                    <h1>{course.name}</h1>
                    <p>{course.description || 'Chương trình học thực tế và hiện đại.'}</p>
                    <dl>
                        <div><dt>Trình độ</dt><dd>{course.level || 'Mọi trình độ'}</dd></div>
                        <div><dt>Thời lượng</dt><dd>{course.duration || 'Linh hoạt'}</dd></div>
                        <div><dt>Học phí</dt><dd className={styles['checkout-price']}>{tuition}</dd></div>
                    </dl>
                </article>
                <aside className={styles['checkout-payment']}>
                    <CreditCardOutlined className={styles['checkout-payment-icon']} />
                    <h2>Thanh toán học phí</h2>
                    <p>Quét mã QR để hoàn tất thanh toán.</p>
                    <div className={styles['checkout-qr-placeholder']} aria-label="Khu vực mã QR sẽ được cập nhật sau" />
                    <small>Mã QR sẽ được cung cấp khi hệ thống thanh toán được kết nối.</small>
                </aside>
            </section>
        </main>
    );
};

export default CourseCheckout;
