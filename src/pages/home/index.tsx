import styles from 'styles/client.module.scss';
import CourseCard from '@/components/client/card/course.card';

const HomePage = () => {
    return (
        <div className={`${styles["container"]} ${styles["home-section"]}`}>
            <CourseCard />
        </div>
    )
}

export default HomePage;