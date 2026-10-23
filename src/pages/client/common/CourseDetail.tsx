import { useEffect, useState } from 'react';
import { Alert, Button, Empty, message, Spin } from 'antd';
import { ArrowLeftOutlined, BookOutlined, CreditCardOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { callFetchCourseById } from '@/config/api';
import { useAppSelector } from '@/redux/hooks';
import { canRegisterForCourse } from '@/config/portal';
import type { ICourse } from '@/types/backend';
import styles from '@/styles/client.module.scss';

const CourseDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated, isLoading: accountLoading, user } = useAppSelector(state => state.account);
    const [course, setCourse] = useState<ICourse>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const handleRegistration = () => {
        if (accountLoading) return;
        if (!isAuthenticated) {
            message.warning('Bạn cần đăng nhập để tiếp tục.');
            navigate(`/login?callback=${encodeURIComponent(`/client/courses/${id}/checkout`)}`);
            return;
        }
        if (!canRegisterForCourse(user.role?.name)) {
            message.error('Vai trò tài khoản hiện tại không được phép đăng ký khóa học.');
            return;
        }
        navigate(`/client/courses/${id}/checkout`);
    };

    useEffect(() => {
        let active = true;
        const loadCourse = async () => {
            setLoading(true);
            setCourse(undefined);
            setError('');

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
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/')}>Quay lại danh sách khóa học</Button>
    </main>;

    return (
        <main className={`${styles.container} ${styles['course-detail']}`}>
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Quay lại</Button>
            <section className={styles['detail-hero']}>
                <span className={styles['course-icon']}><BookOutlined /></span>
                <h1>{course.name}</h1>
                <p>{course.description || 'Chương trình học thực tế và hiện đại.'}</p>
            </section>
            <section className={styles['detail-main']}>
                <h2>Thông tin khóa học</h2>
                <div className={styles['detail-facts']}>
                    <span><b>Cấp độ</b>{course.level || 'Mọi trình độ'}</span>
                    <span><b>Thời lượng</b>{course.duration || 'Linh hoạt'}</span>
                    <span><b>Học phí</b>{course.price ? `${Number(course.price).toLocaleString('vi-VN')} đ` : 'Liên hệ'}</span>
                </div>
                <h2>Chi tiết chương trình</h2>
                <p>{course.description || 'Thông tin chi tiết của chương trình sẽ được trung tâm cập nhật sớm nhất.'}</p>
                <div className={styles['detail-extra-grid']}>
                    <article>
                        <b>Mã khóa học</b>
                        <span>{course._id || 'Đang cập nhật'}</span>
                    </article>
                    <article>
                        <b>Trạng thái tuyển sinh</b>
                        <span>{course.status || 'Đang cập nhật'}</span>
                    </article>
                    <article>
                        <b>Đối tượng phù hợp</b>
                        <span>Học viên ở trình độ {course.level || 'phù hợp với chương trình'}.</span>
                    </article>
                </div>
                <h2>Quy trình đăng ký</h2>
                <ol className={styles['detail-registration-steps']}>
                    <li>Kiểm tra thông tin và học phí của khóa học.</li>
                    <li>Chọn “Đăng ký khóa học” và chọn một lớp đang tuyển sinh.</li>
                    <li>Hệ thống tạo đăng ký và hóa đơn học phí để bạn theo dõi trong mục Hóa đơn.</li>
                </ol>
                <div className={styles['detail-actions']}>
                    <Button type="primary" size="large" icon={<CreditCardOutlined />} disabled={accountLoading} onClick={handleRegistration}>
                        Đăng ký khóa học
                    </Button>
                </div>
            </section>
        </main>
    );
};

export default CourseDetail;
