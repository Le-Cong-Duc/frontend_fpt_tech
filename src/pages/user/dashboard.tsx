import { CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined, PlayCircleOutlined, RightOutlined } from '@ant-design/icons';
import styles from '@/styles/user.module.scss';

const courses = [
    { title: 'Tiếng Anh giao tiếp A2', teacher: 'Cô Nguyễn Mỹ Duyên', progress: 72, lessons: '18 / 25 bài học', color: 'mint' },
    { title: 'IELTS Foundation', teacher: 'Thầy Lê Công Đức', progress: 45, lessons: '9 / 20 bài học', color: 'blue' },
    { title: 'Kỹ năng thuyết trình', teacher: 'Cô Phan Khánh Ly', progress: 28, lessons: '4 / 14 bài học', color: 'yellow' },
];

const UserDashboard = () => (
    <main className={styles.page}>
        <section className={styles.hero}>
            <div>
                <p className={styles.eyebrow}>TRUNG TÂM HỌC TẬP</p>
                <h1>Chào buổi sáng, Minh Anh</h1>
                <p className={styles.heroText}>Bạn đang tiến bộ rất tốt. Hãy tiếp tục bài học hôm nay nhé.</p>
            </div>
            <div className={styles.streak}><span>🔥</span><strong>7 ngày</strong><small>Chuỗi học tập</small></div>
        </section>

        <section className={styles.stats} aria-label="Tổng quan học tập">
            <div><span className={styles.iconMint}><PlayCircleOutlined /></span><strong>3</strong><small>Khóa học đang học</small></div>
            <div><span className={styles.iconBlue}><CheckCircleOutlined /></span><strong>31</strong><small>Bài học đã hoàn thành</small></div>
            <div><span className={styles.iconYellow}><ClockCircleOutlined /></span><strong>12.5h</strong><small>Thời gian học tháng này</small></div>
        </section>

        <div className={styles.contentGrid}>
            <section className={styles.panel}>
                <div className={styles.panelHeader}><div><p className={styles.kicker}>TIẾP TỤC HỌC</p><h2>Khóa học của tôi</h2></div><button>Xem tất cả <RightOutlined /></button></div>
                <div className={styles.courseList}>
                    {courses.map(course => <article className={styles.course} key={course.title}>
                        <div className={`${styles.courseMark} ${styles[course.color]}`}><PlayCircleOutlined /></div>
                        <div className={styles.courseInfo}><h3>{course.title}</h3><p>{course.teacher}</p><div className={styles.progressLine}><span style={{ width: `${course.progress}%` }} /></div><small>{course.lessons} <b>{course.progress}%</b></small></div>
                        <button className={styles.continue} aria-label={`Tiếp tục ${course.title}`}><RightOutlined /></button>
                    </article>)}
                </div>
            </section>

            <aside className={styles.panel}>
                <div className={styles.panelHeader}><div><p className={styles.kicker}>LỊCH CỦA BẠN</p><h2>Lịch học sắp tới</h2></div><CalendarOutlined className={styles.calendarIcon} /></div>
                <div className={styles.schedule}><div><strong>15</strong><span>THÁNG 9</span></div><section><h3>IELTS Foundation</h3><p>18:30 - 20:00 · Phòng P.305</p></section></div>
                <div className={styles.schedule}><div><strong>17</strong><span>THÁNG 9</span></div><section><h3>Tiếng Anh giao tiếp A2</h3><p>18:30 - 20:00 · Phòng P.201</p></section></div>
                <button className={styles.outlineButton}>Xem lịch học đầy đủ</button>
            </aside>
        </div>

        <section className={styles.tip}><span>✦</span><div><strong>Mục tiêu tuần này</strong><p>Hoàn thành thêm 3 bài học để đạt huy hiệu “Tăng tốc”</p></div><div className={styles.tipProgress}><b>4 / 7</b><span><i /></span></div></section>
    </main>
);

export default UserDashboard;