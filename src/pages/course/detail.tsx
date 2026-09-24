import { useEffect, useState } from 'react';
import { Button, Empty, Spin } from 'antd';
import { ArrowLeftOutlined, BookOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { callFetchCourseById } from '@/config/api';
import type { ICourse } from '@/types/backend';
import styles from '@/styles/client.module.scss';

const CourseDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState<ICourse>();
    const [loading, setLoading] = useState(true);
    useEffect(() => { if (id) callFetchCourseById(id).then(response => { if (response.data?.data) setCourse(response.data.data); }).finally(() => setLoading(false)); }, [id]);
    if (loading) return <div className={styles['portal-loading']}><Spin /></div>;
    if (!course) return <div className={styles.container}><Empty description="Không tìm thấy khóa học" /></div>;
    return <main className={`${styles.container} ${styles['course-detail']}`}><Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Quay lại</Button><section className={styles['detail-hero']}><span className={styles['course-icon']}><BookOutlined /></span><h1>{course.name}</h1><p>{course.description || 'Chương trình học thực tế và hiện đại.'}</p></section><section className={styles['detail-main']}><h2>Thông tin khóa học</h2><div className={styles['detail-facts']}><span><b>Cấp độ</b>{course.level || 'Mọi trình độ'}</span><span><b>Thời lượng</b>{course.duration || 'Linh hoạt'}</span><span><b>Học phí</b>{course.price ? `${Number(course.price).toLocaleString('vi-VN')} đ` : 'Liên hệ'}</span></div></section></main>;
};

export default CourseDetailPage;
