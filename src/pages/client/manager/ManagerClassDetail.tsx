import { useEffect, useState } from 'react';
import { Alert, Button, Card, Descriptions, Empty, Spin } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { callFetchClassroomById } from '@/config/api';
import type { IClassroomWithDetails } from '@/types/backend';
import { statusTag } from './manager.shared';
import styles from '@/styles/client.module.scss';

const ManagerClassDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [classroom, setClassroom] = useState<IClassroomWithDetails>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;
        const load = async () => {
            setLoading(true);
            setError('');
            try {
                if (!id) {
                    setError('Không xác định được lớp học.');
                    return;
                }
                const response = await callFetchClassroomById(id);
                if (active) setClassroom(response.data as IClassroomWithDetails | undefined);
            } catch {
                if (active) setError('Không thể tải thông tin lớp học.');
            } finally {
                if (active) setLoading(false);
            }
        };
        load();
        return () => { active = false; };
    }, [id]);

    return (
        <main className={`${styles.container} ${styles['manager-page']}`}>
            <section className={styles['manager-welcome']}>
                <div>
                    <span>MANAGER / CLASSES</span>
                    <h1>Chi tiết lớp học</h1>
                    <p>Thông tin lớp và học vụ liên quan.</p>
                </div>
            </section>

            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/client/manager/classes')} style={{ marginBottom: 16 }}>
                Danh sách lớp
            </Button>

            {loading ? <div className={styles['portal-loading']}><Spin size="large" /></div> : error ? <Alert type="error" showIcon message={error} /> : !classroom ? (
                <Card className={styles['portal-card']}><Empty description="Không tìm thấy lớp học" /></Card>
            ) : (
                <Card className={styles['portal-card']} title={classroom.class_name || 'Lớp học'}>
                    <Descriptions bordered column={{ xs: 1, sm: 2 }}>
                        <Descriptions.Item label="Khóa học">{classroom.course_id?.name || 'Chưa gán khóa học'}</Descriptions.Item>
                        <Descriptions.Item label="Giảng viên">{classroom.teacher_id?.name || 'Chưa phân công'}</Descriptions.Item>
                        <Descriptions.Item label="Phòng học">{classroom.room || 'Chưa cập nhật'}</Descriptions.Item>
                        <Descriptions.Item label="Sĩ số tối đa">{classroom.max_student || 'Chưa cập nhật'}</Descriptions.Item>
                        <Descriptions.Item label="Thời gian">{classroom.start_time || '—'} - {classroom.end_time || '—'}</Descriptions.Item>
                        <Descriptions.Item label="Ngày học">{classroom.start_date || 'Chưa cập nhật'} - {classroom.end_date || 'Chưa cập nhật'}</Descriptions.Item>
                        <Descriptions.Item label="Trạng thái">{statusTag(classroom.status)}</Descriptions.Item>
                    </Descriptions>
                </Card>
            )}
        </main>
    );
};

export default ManagerClassDetail;