import { useMemo, useState } from 'react';
import { Button, Card, Col, Descriptions, Input, Modal, Row, Space, Tag } from 'antd';
import {
    CalendarOutlined,
    ClockCircleOutlined,
    EnvironmentOutlined,
    EyeOutlined,
    SearchOutlined,
    TeamOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { StudentEmpty, StudentState, enrollmentCourse, statusTag, useStudentData } from './student.shared';
import type { IPortalEnrollment } from '@/types/backend';
import styles from '@/styles/client.module.scss';

const StudentClasses = () => {
    const navigate = useNavigate();
    const data = useStudentData('enrollments');
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<IPortalEnrollment | null>(null);

    const classes = useMemo(() => {
        return data.enrollments.filter(enrollment => {
            if (!enrollment.class_id) return false;
            const className = enrollment.class_id?.class_name || '';
            const courseName = enrollmentCourse(enrollment);
            const teacherName = enrollment.class_id?.teacher_id?.name || '';
            const room = enrollment.class_id?.room || '';
            return (
                !search ||
                `${className} ${courseName} ${teacherName} ${room}`.toLowerCase().includes(search.toLowerCase())
            );
        });
    }, [data.enrollments, search]);

    return (
        <main className={`${styles.container} ${styles['student-page']}`}>
            <section className={styles['student-heading']}>
                <div>
                    <span>STUDENT / CLASSES</span>
                    <h1>Lớp học của tôi</h1>
                    <p>Danh sách các lớp học bạn đang tham gia, giảng viên phụ trách và phòng học tương ứng.</p>
                </div>
            </section>

            <StudentState loading={data.loading} error={data.error}>
                <div className={styles['student-filters']}>
                    <Input
                        prefix={<SearchOutlined />}
                        placeholder="Tìm lớp theo tên lớp, khóa học, giảng viên hoặc phòng..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ maxWidth: 400 }}
                    />
                </div>

                {!classes.length ? (
                    <StudentEmpty description="Bạn chưa được phân công hoặc chưa tham gia lớp học nào." />
                ) : (
                    <Row gutter={[16, 16]}>
                        {classes.map((enrollment, index) => {
                            const classroom = enrollment.class_id;
                            return (
                                <Col xs={24} md={12} lg={8} key={enrollment._id || classroom?._id || index}>
                                    <Card
                                        hoverable
                                        className={styles['portal-card']}
                                        style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 12 }}>
                                            <div className={styles['student-course-icon']}>
                                                <TeamOutlined />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                                                    {classroom?.class_name || 'Lớp học'}
                                                </h3>
                                                <Tag color="cyan" style={{ marginTop: 4 }}>
                                                    {enrollmentCourse(enrollment)}
                                                </Tag>
                                            </div>
                                            {statusTag(enrollment.status)}
                                        </div>

                                        <div style={{ fontSize: 13, color: '#555', marginBottom: 16, flex: 1 }}>
                                            <p style={{ margin: '6px 0' }}>
                                                <UserOutlined style={{ marginRight: 6, color: '#1677ff' }} />
                                                <b>Giảng viên:</b> {classroom?.teacher_id?.name || 'Chưa cập nhật'}
                                            </p>
                                            <p style={{ margin: '6px 0' }}>
                                                <EnvironmentOutlined style={{ marginRight: 6, color: '#52c41a' }} />
                                                <b>Phòng học:</b> {classroom?.room || 'Chưa có phòng'}
                                            </p>
                                            <p style={{ margin: '6px 0' }}>
                                                <ClockCircleOutlined style={{ marginRight: 6, color: '#fa8c16' }} />
                                                <b>Khung giờ:</b> {classroom?.start_time || '—'} - {classroom?.end_time || '—'}
                                            </p>
                                            {classroom?.start_date && (
                                                <p style={{ margin: '6px 0' }}>
                                                    <CalendarOutlined style={{ marginRight: 6 }} />
                                                    <b>Lịch trình:</b> {classroom.start_date} ~ {classroom.end_date || 'Tiếp tục'}
                                                </p>
                                            )}
                                        </div>

                                        <Space style={{ width: '100%', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid #f0f0f0' }}>
                                            <Button
                                                size="small"
                                                icon={<EyeOutlined />}
                                                onClick={() => setSelected(enrollment)}
                                            >
                                                Chi tiết lớp
                                            </Button>
                                            <Button
                                                size="small"
                                                type="primary"
                                                ghost
                                                icon={<CalendarOutlined />}
                                                onClick={() => navigate('/client/student/schedule')}
                                            >
                                                Thời khóa biểu
                                            </Button>
                                        </Space>
                                    </Card>
                                </Col>
                            );
                        })}
                    </Row>
                )}
            </StudentState>

            <Modal
                title={`Chi tiết lớp học: ${selected?.class_id?.class_name || ''}`}
                open={Boolean(selected)}
                footer={
                    <Button type="primary" onClick={() => setSelected(null)}>
                        Đóng
                    </Button>
                }
                onCancel={() => setSelected(null)}
                width={650}
            >
                {selected && (
                    <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
                        <Descriptions.Item label="Lớp học" span={2}>
                            <b>{selected.class_id?.class_name}</b>
                        </Descriptions.Item>
                        <Descriptions.Item label="Khóa học" span={2}>
                            {enrollmentCourse(selected)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Giảng viên phụ trách">
                            {selected.class_id?.teacher_id?.name || 'Chưa cập nhật'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Email giảng viên">
                            {selected.class_id?.teacher_id?.email || '—'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Phòng học">
                            <Tag color="green">{selected.class_id?.room || 'Chưa xếp phòng'}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Sĩ số tối đa">
                            {selected.class_id?.max_student || '—'} học viên
                        </Descriptions.Item>
                        <Descriptions.Item label="Khung giờ học">
                            {selected.class_id?.start_time || '—'} - {selected.class_id?.end_time || '—'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Trạng thái học vụ">
                            {statusTag(selected.status)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày bắt đầu">
                            {selected.class_id?.start_date || 'Chưa cập nhật'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày kết thúc">
                            {selected.class_id?.end_date || 'Chưa cập nhật'}
                        </Descriptions.Item>
                    </Descriptions>
                )}
            </Modal>
        </main>
    );
};

export default StudentClasses;
