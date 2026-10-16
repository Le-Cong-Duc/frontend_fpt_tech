import { useMemo, useState } from 'react';
import {
    Avatar,
    Badge,
    Button,
    Card,
    Col,
    DatePicker,
    Descriptions,
    Divider,
    Drawer,
    Form,
    Input,
    InputNumber,
    Modal,
    Popconfirm,
    Progress,
    Radio,
    Row,
    Select,
    Space,
    Table,
    Tabs,
    Tag,
    Tooltip,
    message,
} from 'antd';
import {
    BookOutlined,
    CalendarOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    EditOutlined,
    EnvironmentOutlined,
    EyeOutlined,
    FormOutlined,
    SearchOutlined,
    TeamOutlined,
    UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/redux/hooks';
import {
    AttendanceRecord,
    StudentGrade,
    TeacherEmpty,
    TeacherState,
    dateText,
    getSavedAttendance,
    getSavedGrades,
    saveAttendance,
    saveGrades,
    statusColor,
    statusTag,
    statusText,
    useTeacherData,
} from './teacher.shared';
import type { IClassroomWithDetails, IPortalEnrollment } from '@/types/backend';
import styles from '@/styles/client.module.scss';

const TeacherClasses = () => {
    const navigate = useNavigate();
    const user = useAppSelector(state => state.account.user);
    const data = useTeacherData(user._id);

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>();
    const [selectedClass, setSelectedClass] = useState<IClassroomWithDetails | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    // Modal Điểm danh
    const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
    const [attendanceClass, setAttendanceClass] = useState<IClassroomWithDetails | null>(null);
    const [attendanceDate, setAttendanceDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
    const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceRecord>>({});

    // Modal Nhập điểm & Đánh giá
    const [gradeModalOpen, setGradeModalOpen] = useState(false);
    const [gradeClass, setGradeClass] = useState<IClassroomWithDetails | null>(null);
    const [gradeRecords, setGradeRecords] = useState<Record<string, StudentGrade>>({});

    // Lọc danh sách lớp học
    const filteredClasses = useMemo(() => {
        return data.classes.filter(item => {
            const className = item.class_name || '';
            const courseName = typeof item.course_id === 'object' ? item.course_id?.name || '' : '';
            const room = item.room || '';
            const matchSearch =
                !search ||
                `${className} ${courseName} ${room}`.toLowerCase().includes(search.toLowerCase());
            const matchStatus = !statusFilter || item.status?.toUpperCase() === statusFilter;
            return matchSearch && matchStatus;
        });
    }, [data.classes, search, statusFilter]);

    // Thống kê nhanh
    const totalClasses = data.classes.length;
    const activeClasses = data.classes.filter(
        c => c.status?.toUpperCase() === 'ACTIVE' || c.status?.toUpperCase() === 'OPEN'
    ).length;
    const completedClasses = data.classes.filter(c => c.status?.toUpperCase() === 'COMPLETED').length;
    const totalStudents = data.students.length;

    // Lấy danh sách học viên theo từng lớp
    const getStudentsOfClass = (classId?: string): IPortalEnrollment[] => {
        if (!classId) return [];
        return data.students.filter(item => {
            const cid = typeof item.class_id === 'object' ? item.class_id?._id : item.class_id;
            return cid === classId;
        });
    };

    // Mở Drawer chi tiết lớp
    const handleOpenDetail = (item: IClassroomWithDetails) => {
        setSelectedClass(item);
        setDrawerOpen(true);
    };

    // Mở Modal Điểm danh
    const handleOpenAttendance = (item: IClassroomWithDetails) => {
        setAttendanceClass(item);
        const todayStr = dayjs().format('YYYY-MM-DD');
        setAttendanceDate(todayStr);
        loadAttendanceData(item._id || '', todayStr);
        setAttendanceModalOpen(true);
    };

    const loadAttendanceData = (classId: string, dateStr: string) => {
        const saved = getSavedAttendance(classId, dateStr);
        const studentsInClass = getStudentsOfClass(classId);
        const initial: Record<string, AttendanceRecord> = {};

        studentsInClass.forEach(s => {
            const sid = s._id || (typeof s.student_id === 'object' ? s.student_id?._id : '') || '';
            const sname = typeof s.student_id === 'object' ? s.student_id?.name || 'Học viên' : 'Học viên';
            if (saved[sid]) {
                initial[sid] = saved[sid];
            } else {
                initial[sid] = {
                    enrollmentId: s._id || '',
                    studentId: sid,
                    studentName: sname,
                    status: 'PRESENT',
                };
            }
        });

        setAttendanceRecords(initial);
    };

    // Lưu điểm danh
    const handleSaveAttendance = () => {
        if (!attendanceClass?._id) return;
        saveAttendance(attendanceClass._id, attendanceDate, attendanceRecords);
        message.success(`Đã lưu dữ liệu điểm danh ngày ${dayjs(attendanceDate).format('DD/MM/YYYY')} thành công!`);
        setAttendanceModalOpen(false);
    };

    // Điểm danh tất cả có mặt
    const handleMarkAllPresent = () => {
        setAttendanceRecords(prev => {
            const next = { ...prev };
            Object.keys(next).forEach(sid => {
                next[sid] = { ...next[sid], status: 'PRESENT' };
            });
            return next;
        });
        message.info('Đã đánh dấu tất cả học viên có mặt.');
    };

    // Mở Modal Nhập điểm
    const handleOpenGrades = (item: IClassroomWithDetails) => {
        setGradeClass(item);
        const classId = item._id || '';
        const saved = getSavedGrades(classId);
        const studentsInClass = getStudentsOfClass(classId);
        const initial: Record<string, StudentGrade> = {};

        studentsInClass.forEach(s => {
            const sid = s._id || (typeof s.student_id === 'object' ? s.student_id?._id : '') || '';
            const sname = typeof s.student_id === 'object' ? s.student_id?.name || 'Học viên' : 'Học viên';
            if (saved[sid]) {
                initial[sid] = saved[sid];
            } else {
                initial[sid] = {
                    enrollmentId: s._id || '',
                    studentId: sid,
                    studentName: sname,
                    attendanceScore: 10,
                    midtermScore: undefined,
                    finalScore: undefined,
                    note: '',
                };
            }
        });

        setGradeRecords(initial);
        setGradeModalOpen(true);
    };

    // Lưu bảng điểm
    const handleSaveGrades = () => {
        if (!gradeClass?._id) return;
        saveGrades(gradeClass._id, gradeRecords);
        message.success(`Đã lưu bảng điểm và đánh giá cho lớp ${gradeClass.class_name}!`);
        setGradeModalOpen(false);
    };

    // Cột bảng học viên trong Drawer
    const studentColumns = [
        {
            title: 'Học viên',
            key: 'student',
            render: (_: unknown, record: IPortalEnrollment) => (
                <Space>
                    <Avatar style={{ backgroundColor: '#1677ff' }}>
                        {(typeof record.student_id === 'object' ? record.student_id?.name : 'HV')
                            ?.slice(0, 2)
                            .toUpperCase()}
                    </Avatar>
                    <div>
                        <div style={{ fontWeight: 600 }}>
                            {typeof record.student_id === 'object' ? record.student_id?.name : 'Học viên'}
                        </div>
                        <div style={{ fontSize: 12, color: '#888' }}>
                            {typeof record.student_id === 'object' ? record.student_id?.email : '—'}
                        </div>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Số điện thoại',
            key: 'phone',
            render: (_: unknown, record: IPortalEnrollment) =>
                typeof record.student_id === 'object' ? record.student_id?.phone || '—' : '—',
        },
        {
            title: 'Ngày đăng ký',
            dataIndex: 'register_date',
            key: 'register_date',
            render: (value?: string) => dateText(value),
        },
        {
            title: 'Trạng thái học vụ',
            dataIndex: 'status',
            key: 'status',
            render: (value?: string) => statusTag(value),
        },
    ];

    return (
        <main className={`${styles.container} ${styles['student-page']}`}>
            <section className={styles['student-heading']}>
                <div>
                    <span>TEACHER / ACADEMICS</span>
                    <h1>Lớp học phụ trách</h1>
                    <p>Quản lý toàn diện các lớp giảng dạy, sĩ số học viên, điểm danh chuyên cần và đánh giá kết quả.</p>
                </div>
            </section>

            <TeacherState loading={data.loading} error={data.error}>
                {/* Thống kê học vụ */}
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                    <Col xs={24} sm={12} lg={6}>
                        <Card className={styles['portal-card']} style={{ borderLeft: '4px solid #1677ff' }}>
                            <span style={{ color: '#888', fontSize: 13 }}>Tổng lớp phụ trách</span>
                            <h2 style={{ margin: '6px 0 0', color: '#1677ff' }}>{totalClasses} lớp</h2>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card className={styles['portal-card']} style={{ borderLeft: '4px solid #52c41a' }}>
                            <span style={{ color: '#888', fontSize: 13 }}>Lớp đang giảng dạy</span>
                            <h2 style={{ margin: '6px 0 0', color: '#52c41a' }}>{activeClasses} lớp</h2>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card className={styles['portal-card']} style={{ borderLeft: '4px solid #722ed1' }}>
                            <span style={{ color: '#888', fontSize: 13 }}>Tổng số học viên</span>
                            <h2 style={{ margin: '6px 0 0', color: '#722ed1' }}>{totalStudents} học viên</h2>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card className={styles['portal-card']} style={{ borderLeft: '4px solid #fa8c16' }}>
                            <span style={{ color: '#888', fontSize: 13 }}>Lớp đã hoàn thành</span>
                            <h2 style={{ margin: '6px 0 0', color: '#fa8c16' }}>{completedClasses} lớp</h2>
                        </Card>
                    </Col>
                </Row>

                {/* Bộ lọc tìm kiếm */}
                <Card className={styles['portal-card']} style={{ marginBottom: 16 }}>
                    <div className={styles['student-filters']}>
                        <Input
                            prefix={<SearchOutlined />}
                            placeholder="Tìm tên lớp, khóa học hoặc phòng học..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ maxWidth: 360 }}
                        />
                        <Select
                            allowClear
                            placeholder="Lọc theo trạng thái"
                            value={statusFilter}
                            onChange={setStatusFilter}
                            style={{ minWidth: 170 }}
                            options={[
                                { label: 'Đang mở (OPEN)', value: 'OPEN' },
                                { label: 'Đang học (ACTIVE)', value: 'ACTIVE' },
                                { label: 'Hoàn thành (COMPLETED)', value: 'COMPLETED' },
                                { label: 'Đã hủy (CANCELLED)', value: 'CANCELLED' },
                            ]}
                        />
                    </div>
                </Card>

                {/* Danh sách lớp học */}
                {!filteredClasses.length ? (
                    <TeacherEmpty description="Không tìm thấy lớp học nào phù hợp với điều kiện tìm kiếm." />
                ) : (
                    <Row gutter={[16, 16]}>
                        {filteredClasses.map(item => {
                            const studentsInClass = getStudentsOfClass(item._id);
                            const courseTitle =
                                typeof item.course_id === 'object' ? item.course_id?.name : 'Khóa học';
                            const max = Number(item.max_student || 30);
                            const currentCount = studentsInClass.length;
                            const percent = Math.min(100, Math.round((currentCount / (max || 1)) * 100));

                            return (
                                <Col xs={24} md={12} lg={8} key={item._id}>
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
                                                    {item.class_name || 'Lớp học'}
                                                </h3>
                                                <span style={{ color: '#888', fontSize: 13 }}>
                                                    {courseTitle}
                                                </span>
                                            </div>
                                            {statusTag(item.status)}
                                        </div>

                                        <div style={{ fontSize: 13, color: '#555', marginBottom: 16, flex: 1 }}>
                                            <p style={{ margin: '4px 0' }}>
                                                <EnvironmentOutlined style={{ marginRight: 6 }} />
                                                <b>Phòng học:</b> {item.room || 'Chưa xếp phòng'}
                                            </p>
                                            <p style={{ margin: '4px 0' }}>
                                                <ClockCircleOutlined style={{ marginRight: 6 }} />
                                                <b>Ca học:</b> {item.start_time || '—'} ~ {item.end_time || '—'}
                                            </p>
                                            <p style={{ margin: '4px 0' }}>
                                                <CalendarOutlined style={{ marginRight: 6 }} />
                                                <b>Thời gian:</b> {dateText(item.start_date)} ~ {dateText(item.end_date)}
                                            </p>

                                            <div style={{ marginTop: 12 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                                                    <span>Sĩ số học viên:</span>
                                                    <b>{currentCount} / {max} học viên</b>
                                                </div>
                                                <Progress percent={percent} size="small" status={percent >= 100 ? 'exception' : 'active'} />
                                            </div>
                                        </div>

                                        <Divider style={{ margin: '12px 0' }} />

                                        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
                                            <Button
                                                size="small"
                                                icon={<EyeOutlined />}
                                                onClick={() => handleOpenDetail(item)}
                                            >
                                                Chi tiết ({currentCount})
                                            </Button>

                                            <Space>
                                                <Tooltip title="Điểm danh buổi học">
                                                    <Button
                                                        size="small"
                                                        type="primary"
                                                        ghost
                                                        icon={<CheckCircleOutlined />}
                                                        onClick={() => handleOpenAttendance(item)}
                                                    >
                                                        Điểm danh
                                                    </Button>
                                                </Tooltip>
                                                <Tooltip title="Nhập điểm & Đánh giá">
                                                    <Button
                                                        size="small"
                                                        icon={<EditOutlined />}
                                                        onClick={() => handleOpenGrades(item)}
                                                    >
                                                        Đánh giá
                                                    </Button>
                                                </Tooltip>
                                            </Space>
                                        </Space>
                                    </Card>
                                </Col>
                            );
                        })}
                    </Row>
                )}
            </TeacherState>

            {/* Drawer Chi tiết Lớp học & Danh sách học viên */}
            <Drawer
                title={
                    <Space>
                        <TeamOutlined />
                        <span>{selectedClass?.class_name || 'Chi tiết lớp học'}</span>
                        {statusTag(selectedClass?.status)}
                    </Space>
                }
                width={720}
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                extra={
                    <Space>
                        <Button
                            type="primary"
                            icon={<CheckCircleOutlined />}
                            onClick={() => {
                                if (selectedClass) handleOpenAttendance(selectedClass);
                            }}
                        >
                            Điểm danh
                        </Button>
                        <Button
                            icon={<EditOutlined />}
                            onClick={() => {
                                if (selectedClass) handleOpenGrades(selectedClass);
                            }}
                        >
                            Chấm điểm
                        </Button>
                    </Space>
                }
            >
                {selectedClass && (
                    <>
                        <Descriptions title="Thông tin học vụ" bordered size="small" column={{ xs: 1, sm: 2 }}>
                            <Descriptions.Item label="Mã lớp">{selectedClass._id || '—'}</Descriptions.Item>
                            <Descriptions.Item label="Khóa học">
                                {typeof selectedClass.course_id === 'object' ? selectedClass.course_id?.name : '—'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Phòng học">{selectedClass.room || 'Chưa có phòng'}</Descriptions.Item>
                            <Descriptions.Item label="Khung giờ">
                                {selectedClass.start_time || '—'} - {selectedClass.end_time || '—'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Khai giảng">{dateText(selectedClass.start_date)}</Descriptions.Item>
                            <Descriptions.Item label="Bế giảng">{dateText(selectedClass.end_date)}</Descriptions.Item>
                            <Descriptions.Item label="Sĩ số lớp">
                                {getStudentsOfClass(selectedClass._id).length} / {selectedClass.max_student || 30} học viên
                            </Descriptions.Item>
                            <Descriptions.Item label="Trạng thái">{statusText(selectedClass.status)}</Descriptions.Item>
                        </Descriptions>

                        <Divider />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <h3 style={{ margin: 0, fontSize: 16 }}>
                                Danh sách học viên ({getStudentsOfClass(selectedClass._id).length})
                            </h3>
                        </div>

                        <Table
                            rowKey="_id"
                            dataSource={getStudentsOfClass(selectedClass._id)}
                            columns={studentColumns}
                            pagination={{ pageSize: 8 }}
                            locale={{ emptyText: 'Chưa có học viên nào đăng ký vào lớp này.' }}
                        />
                    </>
                )}
            </Drawer>

            {/* Modal Điểm danh học viên */}
            <Modal
                title={
                    <Space>
                        <CheckCircleOutlined style={{ color: '#1677ff' }} />
                        <span>Điểm danh học viên - {attendanceClass?.class_name}</span>
                    </Space>
                }
                open={attendanceModalOpen}
                onCancel={() => setAttendanceModalOpen(false)}
                onOk={handleSaveAttendance}
                okText="Lưu dữ liệu điểm danh"
                cancelText="Hủy"
                width={800}
            >
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <Space>
                        <b>Chọn ngày điểm danh:</b>
                        <DatePicker
                            allowClear={false}
                            value={dayjs(attendanceDate)}
                            onChange={d => {
                                if (d && attendanceClass?._id) {
                                    const nextDate = d.format('YYYY-MM-DD');
                                    setAttendanceDate(nextDate);
                                    loadAttendanceData(attendanceClass._id, nextDate);
                                }
                            }}
                        />
                    </Space>

                    <Button size="small" type="dashed" onClick={handleMarkAllPresent}>
                        Đánh dấu tất cả Có mặt
                    </Button>
                </div>

                <div style={{ maxHeight: 420, overflowY: 'auto' }}>
                    {getStudentsOfClass(attendanceClass?._id).length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#888', padding: 24 }}>
                            Lớp học hiện chưa có học viên nào.
                        </p>
                    ) : (
                        getStudentsOfClass(attendanceClass?._id).map((student, idx) => {
                            const sid = student._id || (typeof student.student_id === 'object' ? student.student_id?._id : '') || '';
                            const sname = typeof student.student_id === 'object' ? student.student_id?.name || 'Học viên' : 'Học viên';
                            const semail = typeof student.student_id === 'object' ? student.student_id?.email || '' : '';
                            const currentRecord = attendanceRecords[sid] || { status: 'PRESENT' };

                            return (
                                <div
                                    key={sid || idx}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '10px 12px',
                                        borderBottom: '1px solid #f0f0f0',
                                        flexWrap: 'wrap',
                                        gap: 8,
                                    }}
                                >
                                    <Space>
                                        <Avatar size="small" style={{ backgroundColor: '#1677ff' }}>
                                            {sname.slice(0, 1).toUpperCase()}
                                        </Avatar>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{sname}</div>
                                            <div style={{ fontSize: 12, color: '#888' }}>{semail}</div>
                                        </div>
                                    </Space>

                                    <Radio.Group
                                        size="small"
                                        value={currentRecord.status}
                                        onChange={e => {
                                            const newStatus = e.target.value;
                                            setAttendanceRecords(prev => ({
                                                ...prev,
                                                [sid]: {
                                                    ...prev[sid],
                                                    enrollmentId: student._id || '',
                                                    studentId: sid,
                                                    studentName: sname,
                                                    status: newStatus,
                                                },
                                            }));
                                        }}
                                    >
                                        <Radio.Button value="PRESENT" style={{ color: '#52c41a' }}>Có mặt</Radio.Button>
                                        <Radio.Button value="LATE" style={{ color: '#faad14' }}>Đi muộn</Radio.Button>
                                        <Radio.Button value="EXCUSED" style={{ color: '#1677ff' }}>Có phép</Radio.Button>
                                        <Radio.Button value="ABSENT" style={{ color: '#ff4d4f' }}>Vắng</Radio.Button>
                                    </Radio.Group>
                                </div>
                            );
                        })
                    )}
                </div>
            </Modal>

            {/* Modal Nhập điểm & Đánh giá năng lực */}
            <Modal
                title={
                    <Space>
                        <EditOutlined style={{ color: '#1677ff' }} />
                        <span>Bảng điểm & Đánh giá học tập - {gradeClass?.class_name}</span>
                    </Space>
                }
                open={gradeModalOpen}
                onCancel={() => setGradeModalOpen(false)}
                onOk={handleSaveGrades}
                okText="Lưu bảng điểm"
                cancelText="Hủy"
                width={850}
            >
                <div style={{ maxHeight: 450, overflowY: 'auto' }}>
                    {getStudentsOfClass(gradeClass?._id).length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#888', padding: 24 }}>
                            Lớp học hiện chưa có học viên nào.
                        </p>
                    ) : (
                        getStudentsOfClass(gradeClass?._id).map((student, idx) => {
                            const sid = student._id || (typeof student.student_id === 'object' ? student.student_id?._id : '') || '';
                            const sname = typeof student.student_id === 'object' ? student.student_id?.name || 'Học viên' : 'Học viên';
                            const currentGrade = gradeRecords[sid] || {};

                            const att = currentGrade.attendanceScore ?? 10;
                            const mid = currentGrade.midtermScore;
                            const fin = currentGrade.finalScore;

                            let gpaText = '—';
                            if (mid !== undefined && fin !== undefined) {
                                const avg = Number((att * 0.1 + mid * 0.4 + fin * 0.5).toFixed(1));
                                gpaText = `${avg} (${avg >= 8.5 ? 'Xuất sắc' : avg >= 7 ? 'Khá' : avg >= 5 ? 'Đạt' : 'Chưa đạt'})`;
                            }

                            return (
                                <Card
                                    key={sid || idx}
                                    size="small"
                                    style={{ marginBottom: 12, background: '#fafafa' }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <Space>
                                            <Avatar size="small" style={{ backgroundColor: '#722ed1' }}>
                                                {sname.slice(0, 1).toUpperCase()}
                                            </Avatar>
                                            <span style={{ fontWeight: 600 }}>{sname}</span>
                                        </Space>
                                        <Tag color="purple">ĐTB: {gpaText}</Tag>
                                    </div>

                                    <Row gutter={[12, 8]}>
                                        <Col xs={24} sm={8}>
                                            <div style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>Chuyên cần (10%):</div>
                                            <InputNumber
                                                min={0}
                                                max={10}
                                                step={0.5}
                                                style={{ width: '100%' }}
                                                value={att}
                                                onChange={val => {
                                                    setGradeRecords(prev => ({
                                                        ...prev,
                                                        [sid]: { ...prev[sid], studentName: sname, attendanceScore: val ?? 0 },
                                                    }));
                                                }}
                                            />
                                        </Col>
                                        <Col xs={24} sm={8}>
                                            <div style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>Giữa kỳ (40%):</div>
                                            <InputNumber
                                                min={0}
                                                max={10}
                                                step={0.5}
                                                placeholder="Điểm GK"
                                                style={{ width: '100%' }}
                                                value={mid}
                                                onChange={val => {
                                                    setGradeRecords(prev => ({
                                                        ...prev,
                                                        [sid]: { ...prev[sid], studentName: sname, midtermScore: val ?? undefined },
                                                    }));
                                                }}
                                            />
                                        </Col>
                                        <Col xs={24} sm={8}>
                                            <div style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>Cuối khóa (50%):</div>
                                            <InputNumber
                                                min={0}
                                                max={10}
                                                step={0.5}
                                                placeholder="Điểm CK"
                                                style={{ width: '100%' }}
                                                value={fin}
                                                onChange={val => {
                                                    setGradeRecords(prev => ({
                                                        ...prev,
                                                        [sid]: { ...prev[sid], studentName: sname, finalScore: val ?? undefined },
                                                    }));
                                                }}
                                            />
                                        </Col>
                                        <Col xs={24}>
                                            <Input
                                                placeholder="Nhận xét / Đánh giá quá trình học tập..."
                                                value={currentGrade.note || ''}
                                                onChange={e => {
                                                    const text = e.target.value;
                                                    setGradeRecords(prev => ({
                                                        ...prev,
                                                        [sid]: { ...prev[sid], studentName: sname, note: text },
                                                    }));
                                                }}
                                            />
                                        </Col>
                                    </Row>
                                </Card>
                            );
                        })
                    )}
                </div>
            </Modal>
        </main>
    );
};

export default TeacherClasses;
