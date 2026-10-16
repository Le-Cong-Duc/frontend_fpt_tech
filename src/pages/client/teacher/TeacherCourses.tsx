import { useMemo, useState } from 'react';
import {
    Badge,
    Button,
    Card,
    Col,
    Descriptions,
    Divider,
    Input,
    Modal,
    Row,
    Select,
    Space,
    Tag,
} from 'antd';
import {
    BookOutlined,
    CalendarOutlined,
    ClockCircleOutlined,
    EnvironmentOutlined,
    EyeOutlined,
    ReadOutlined,
    SearchOutlined,
    TeamOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/redux/hooks';
import { money } from '../student/student.shared';
import {
    TeacherEmpty,
    TeacherState,
    dateText,
    statusTag,
    statusText,
    useTeacherData,
} from './teacher.shared';
import type { IClassroomWithDetails, ICourse } from '@/types/backend';
import styles from '@/styles/client.module.scss';

interface EnrichedTeacherCourse extends ICourse {
    classCount: number;
    studentCount: number;
    classrooms: IClassroomWithDetails[];
}

const TeacherCourses = () => {
    const navigate = useNavigate();
    const user = useAppSelector(state => state.account.user);
    const data = useTeacherData(user._id);

    const [search, setSearch] = useState('');
    const [levelFilter, setLevelFilter] = useState<string>();
    const [selectedCourse, setSelectedCourse] = useState<EnrichedTeacherCourse | null>(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);

    // Tính toán các khóa học của giảng viên và lớp học tương ứng
    const enrichedCourses = useMemo<EnrichedTeacherCourse[]>(() => {
        const map = new Map<string, EnrichedTeacherCourse>();

        data.courses.forEach(c => {
            if (!c._id) return;
            map.set(c._id, {
                ...c,
                classCount: 0,
                studentCount: 0,
                classrooms: [],
            });
        });

        data.classes.forEach(cls => {
            const courseId =
                typeof cls.course_id === 'object' ? cls.course_id?._id : cls.course_id;
            if (!courseId) return;

            const target = map.get(courseId);
            if (target) {
                target.classCount += 1;
                target.classrooms.push(cls);
                const studentsInClass = data.students.filter(s => {
                    const cid = typeof s.class_id === 'object' ? s.class_id?._id : s.class_id;
                    return cid === cls._id;
                });
                target.studentCount += studentsInClass.length;
            }
        });

        // Chỉ giữ các khóa học giảng viên đang dạy (hoặc toàn bộ nếu chưa có lớp riêng)
        const coursesWithClasses = Array.from(map.values()).filter(c => c.classCount > 0);
        return coursesWithClasses.length ? coursesWithClasses : Array.from(map.values());
    }, [data.courses, data.classes, data.students]);

    // Lọc khóa học
    const filteredCourses = useMemo(() => {
        return enrichedCourses.filter(c => {
            const matchSearch =
                !search ||
                `${c.name || ''} ${c.description || ''}`.toLowerCase().includes(search.toLowerCase());
            const matchLevel = !levelFilter || c.level?.toUpperCase() === levelFilter.toUpperCase();
            return matchSearch && matchLevel;
        });
    }, [enrichedCourses, search, levelFilter]);

    // Mở modal xem chi tiết giáo trình
    const handleViewCourse = (course: EnrichedTeacherCourse) => {
        setSelectedCourse(course);
        setDetailModalOpen(true);
    };

    return (
        <main className={`${styles.container} ${styles['student-page']}`}>
            <section className={styles['student-heading']}>
                <div>
                    <span>TEACHER / CURRICULUM</span>
                    <h1>Chương trình đào tạo & Khóa học</h1>
                    <p>Tra cứu giáo trình đào tạo, mục tiêu bài giảng và quản lý các lớp học trực thuộc từng khóa.</p>
                </div>
            </section>

            <TeacherState loading={data.loading} error={data.error}>
                {/* Thống kê khóa học */}
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                    <Col xs={24} sm={8}>
                        <Card className={styles['portal-card']} style={{ borderLeft: '4px solid #1677ff' }}>
                            <span style={{ color: '#888', fontSize: 13 }}>Khóa học đang phụ trách</span>
                            <h2 style={{ margin: '6px 0 0', color: '#1677ff' }}>{enrichedCourses.length} khóa học</h2>
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card className={styles['portal-card']} style={{ borderLeft: '4px solid #52c41a' }}>
                            <span style={{ color: '#888', fontSize: 13 }}>Tổng số lớp giảng dạy</span>
                            <h2 style={{ margin: '6px 0 0', color: '#52c41a' }}>{data.classes.length} lớp</h2>
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card className={styles['portal-card']} style={{ borderLeft: '4px solid #722ed1' }}>
                            <span style={{ color: '#888', fontSize: 13 }}>Tổng học viên theo học</span>
                            <h2 style={{ margin: '6px 0 0', color: '#722ed1' }}>{data.students.length} học viên</h2>
                        </Card>
                    </Col>
                </Row>

                {/* Bộ lọc */}
                <Card className={styles['portal-card']} style={{ marginBottom: 16 }}>
                    <div className={styles['student-filters']}>
                        <Input
                            prefix={<SearchOutlined />}
                            placeholder="Tìm kiếm theo tên khóa học hoặc mô tả kiến thức..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ minWidth: 280 }}
                        />
                        <Select
                            allowClear
                            placeholder="Trình độ (Level)"
                            value={levelFilter}
                            onChange={setLevelFilter}
                            style={{ minWidth: 160 }}
                            options={[
                                { label: 'Cơ bản (BEGINNER)', value: 'BEGINNER' },
                                { label: 'Trung cấp (INTERMEDIATE)', value: 'INTERMEDIATE' },
                                { label: 'Nâng cao (ADVANCED)', value: 'ADVANCED' },
                            ]}
                        />
                    </div>
                </Card>

                {/* Danh sách thẻ khóa học */}
                {!filteredCourses.length ? (
                    <TeacherEmpty description="Không tìm thấy khóa học nào phù hợp với điều kiện lọc." />
                ) : (
                    <Row gutter={[16, 16]}>
                        {filteredCourses.map(course => (
                            <Col xs={24} md={12} lg={8} key={course._id}>
                                <Card
                                    hoverable
                                    className={styles['portal-card']}
                                    style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 12 }}>
                                        <div className={styles['student-course-icon']}>
                                            <BookOutlined />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                                                {course.name}
                                            </h3>
                                            <Tag color="cyan" style={{ marginTop: 4 }}>
                                                {course.level || 'Chưa phân cấp'}
                                            </Tag>
                                        </div>
                                    </div>

                                    <div style={{ fontSize: 13, color: '#555', marginBottom: 16, flex: 1 }}>
                                        <p style={{ margin: '4px 0', minHeight: 38, color: '#666' }}>
                                            {course.description || 'Chương trình đào tạo chuẩn công nghệ FPT.'}
                                        </p>
                                        <Divider style={{ margin: '10px 0' }} />
                                        <p style={{ margin: '4px 0' }}>
                                            <ClockCircleOutlined style={{ marginRight: 6 }} />
                                            <b>Thời lượng học:</b> {course.duration || 'Chưa cập nhật'}
                                        </p>
                                        <p style={{ margin: '4px 0' }}>
                                            <TeamOutlined style={{ marginRight: 6 }} />
                                            <b>Lớp giảng dạy:</b>{' '}
                                            <b style={{ color: '#1677ff' }}>{course.classCount} lớp</b> ({course.studentCount} học viên)
                                        </p>
                                    </div>

                                    <Divider style={{ margin: '12px 0' }} />

                                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                        <Button
                                            size="small"
                                            icon={<EyeOutlined />}
                                            onClick={() => handleViewCourse(course)}
                                        >
                                            Giáo trình & Lớp
                                        </Button>
                                        <Button
                                            size="small"
                                            type="primary"
                                            ghost
                                            onClick={() => navigate('/client/teacher/classes')}
                                        >
                                            Vào lớp dạy
                                        </Button>
                                    </Space>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}
            </TeacherState>

            {/* Modal Chi tiết Khóa học & Các lớp trực thuộc */}
            <Modal
                title={
                    <Space>
                        <ReadOutlined style={{ color: '#1677ff' }} />
                        <span>Giáo trình & Chi tiết khóa học - {selectedCourse?.name}</span>
                    </Space>
                }
                open={detailModalOpen}
                onCancel={() => setDetailModalOpen(false)}
                footer={[
                    <Button key="close" onClick={() => setDetailModalOpen(false)}>
                        Đóng
                    </Button>,
                    <Button
                        key="classes"
                        type="primary"
                        onClick={() => {
                            setDetailModalOpen(false);
                            navigate('/client/teacher/classes');
                        }}
                    >
                        Đến trang Quản lý lớp học
                    </Button>,
                ]}
                width={700}
            >
                {selectedCourse && (
                    <>
                        <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }}>
                            <Descriptions.Item label="Tên khóa học" span={2}>
                                <b>{selectedCourse.name}</b>
                            </Descriptions.Item>
                            <Descriptions.Item label="Cấp độ (Level)">
                                <Tag color="blue">{selectedCourse.level || 'Mọi cấp độ'}</Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Thời lượng">
                                {selectedCourse.duration || 'Chưa cập nhật'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Học phí niêm yết">
                                {money(selectedCourse.price)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Số lớp đang dạy">
                                {selectedCourse.classCount} lớp học
                            </Descriptions.Item>
                            <Descriptions.Item label="Mô tả giáo trình" span={2}>
                                {selectedCourse.description || 'Chưa có tài liệu mô tả chi tiết.'}
                            </Descriptions.Item>
                        </Descriptions>

                        <Divider style={{ margin: '16px 0' }} />

                        <h4 style={{ marginBottom: 12 }}>Các lớp bạn đang giảng dạy môn này:</h4>
                        {!selectedCourse.classrooms.length ? (
                            <p style={{ color: '#888' }}>Bạn hiện chưa có lớp học nào được phân công cho khóa học này.</p>
                        ) : (
                            <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                                {selectedCourse.classrooms.map(cls => (
                                    <div
                                        key={cls._id}
                                        style={{
                                            border: '1px solid #f0f0f0',
                                            borderRadius: 8,
                                            padding: 12,
                                            marginBottom: 8,
                                            background: '#fafafa',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            flexWrap: 'wrap',
                                            gap: 8,
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{cls.class_name}</div>
                                            <div style={{ fontSize: 12, color: '#666' }}>
                                                Phòng {cls.room || 'Chưa xếp'} · Ca {cls.start_time || '—'} - {cls.end_time || '—'}
                                            </div>
                                            <div style={{ fontSize: 12, color: '#888' }}>
                                                Thời gian: {dateText(cls.start_date)} ~ {dateText(cls.end_date)}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            {statusTag(cls.status)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </Modal>
        </main>
    );
};

export default TeacherCourses;
