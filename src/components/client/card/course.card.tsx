import { Card, Col, Empty, Row, Spin } from 'antd';
import { useEffect, useState } from 'react';
import { callFetchCourse } from '@/config/api';
import type { ICourse } from '@/types/backend';
import styles from 'styles/client.module.scss';

const CourseCard = () => {
    const [courses, setCourses] = useState<ICourse[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCourses = async () => {
            const response = await callFetchCourse('current=1&pageSize=8');
            if (response.data) setCourses(response.data.result);
            setIsLoading(false);
        };

        fetchCourses();
    }, []);

    return (
        <div className={styles['course-section']}>
            <Spin spinning={isLoading}>
                <Row gutter={[20, 20]}>
                    <Col span={24}>
                        <span className={styles['title']}>Khóa học</span>
                    </Col>
                    {courses.map((course) => (
                        <Col span={24} md={8} key={course._id}>
                            <Card title={course.name}>
                                <p>{course.description}</p>
                                <p>Cấp độ: {course.level || 'Chưa cập nhật'}</p>
                                <p>Thời lượng: {course.duration || 'Chưa cập nhật'}</p>
                                <p>Học phí: {course.price ?? 'Chưa cập nhật'}</p>
                                <p>Trạng thái: {course.status || 'Chưa cập nhật'}</p>
                            </Card>
                        </Col>
                    ))}
                    {!courses.length && !isLoading && (
                        <Col span={24}>
                            <Empty description="Chưa có khóa học" />
                        </Col>
                    )}
                </Row>
            </Spin>
        </div>
    );
};

export default CourseCard;
