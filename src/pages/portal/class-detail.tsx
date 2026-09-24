import { useEffect, useState } from 'react';
import { Button, Descriptions, Empty, Spin } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { callFetchClassroomById } from '@/config/api';
import type { IClassroomWithDetails } from '@/types/backend';
import styles from '@/styles/client.module.scss';

const ClassDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [classroom, setClassroom] = useState<IClassroomWithDetails>();
    const [loading, setLoading] = useState(true);
    useEffect(() => { if (id) callFetchClassroomById(id).then(response => setClassroom(response.data as IClassroomWithDetails)).finally(() => setLoading(false)); }, [id]);
    if (loading) return <div className={styles['portal-loading']}><Spin /></div>;
    if (!classroom) return <main className={styles.container}><Empty description="Không tìm thấy lớp học" /></main>;
    return <main className={`${styles.container} ${styles['portal-section']}`}><Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Quay lại</Button><div className={styles['portal-hero']}><div><span>LỚP HỌC</span><h1>{classroom.class_name || 'Lớp học'}</h1><p>{classroom.course_id?.name || 'Chưa gán khóa học'}</p></div></div><div className={styles['portal-content']}><Descriptions className={styles['portal-card']} bordered column={{ xs: 1, sm: 2 }}><Descriptions.Item label="Phòng học">{classroom.room || 'Chưa cập nhật'}</Descriptions.Item><Descriptions.Item label="Giảng viên">{classroom.teacher_id?.name || 'Chưa cập nhật'}</Descriptions.Item><Descriptions.Item label="Thời gian">{classroom.start_time || 'Chưa cập nhật'} - {classroom.end_time || 'Chưa cập nhật'}</Descriptions.Item><Descriptions.Item label="Trạng thái">{classroom.status || 'Chưa cập nhật'}</Descriptions.Item></Descriptions></div></main>;
};

export default ClassDetailPage;
