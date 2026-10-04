import { Card } from 'antd';
import { CalendarOutlined, TeamOutlined } from '@ant-design/icons';
import { StudentEmpty, StudentState, enrollmentCourse, statusTag, useStudentData } from './student.shared';
import styles from '@/styles/client.module.scss';

const StudentClasses = () => {
    const data = useStudentData('enrollments');
    const classes = data.enrollments.filter(enrollment => enrollment.class_id);

    return (
        <main className={`${styles.container} ${styles['student-page']}`}>
            <section className={styles['student-heading']}>
                <div>
                    <span>STUDENT / CLASSES</span>
                    <h1>Lớp học của tôi</h1>
                    <p>Thông tin lớp, phòng học và lịch học trong các khóa đã đăng ký.</p>
                </div>
            </section>

            <StudentState loading={data.loading} error={data.error}>
                {!classes.length ? (
                    <StudentEmpty description="Bạn chưa tham gia lớp học nào." />
                ) : (
                    <div className={styles['student-course-grid']}>
                        {classes.map((enrollment, index) => {
                            const classroom = enrollment.class_id;
                            return (
                                <article className={styles['student-course-card']} key={enrollment._id || classroom?._id || index}>
                                    <div className={styles['student-course-icon']}><TeamOutlined /></div>
                                    <div>
                                        <h3>{classroom?.class_name || 'Lớp học'}</h3>
                                        <p>Khóa học: {enrollmentCourse(enrollment)}</p>
                                        <p>Giảng viên: {classroom?.teacher_id?.name || 'Chưa cập nhật'}</p>
                                        <p>Phòng: {classroom?.room || 'Chưa cập nhật'}</p>
                                        <p><CalendarOutlined /> {classroom?.start_date || 'Chưa có ngày bắt đầu'} · {classroom?.start_time || '—'} - {classroom?.end_time || '—'}</p>
                                    </div>
                                    {statusTag(enrollment.status)}
                                </article>
                            );
                        })}
                    </div>
                )}
            </StudentState>
        </main>
    );
};

export default StudentClasses;
