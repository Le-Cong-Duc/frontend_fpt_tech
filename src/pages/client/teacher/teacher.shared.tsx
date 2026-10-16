import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Alert, Card, Empty, Spin, Tag } from 'antd';
import {
    callFetchClassroom,
    callFetchCourse,
    callFetchEnrollment,
    callFetchMyTeachingClassrooms,
    callFetchMyStudents,
} from '@/config/api';
import type {
    IClassroomWithDetails,
    ICourse,
    IPortalEnrollment,
    IUserSummary,
} from '@/types/backend';
import styles from '@/styles/client.module.scss';

export interface StudentGrade {
    enrollmentId: string;
    studentId: string;
    studentName: string;
    attendanceScore?: number;
    midtermScore?: number;
    finalScore?: number;
    note?: string;
    evaluatedAt?: string;
}

export interface AttendanceRecord {
    enrollmentId: string;
    studentId: string;
    studentName: string;
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
    note?: string;
}

export interface TeacherData {
    classes: IClassroomWithDetails[];
    courses: ICourse[];
    students: IPortalEnrollment[];
}

const emptyTeacherData: TeacherData = {
    classes: [],
    courses: [],
    students: [],
};

export const toArray = <T,>(response: unknown): T[] => {
    if (!response) return [];
    const data = (response as { data?: unknown })?.data;
    if (Array.isArray(data)) return data as T[];
    if (data && typeof data === 'object' && Array.isArray((data as { result?: T[] }).result)) {
        return (data as { result: T[] }).result;
    }
    if (Array.isArray(response)) return response as T[];
    return [];
};

export const dateText = (value?: string) => (value ? new Date(value).toLocaleDateString('vi-VN') : 'Chưa cập nhật');

export const statusText = (status?: string) =>
    ({
        OPEN: 'Đang mở',
        ACTIVE: 'Đang hoạt động',
        COMPLETED: 'Hoàn thành',
        CANCELLED: 'Đã hủy',
        STUDYING: 'Đang học',
        WAITING_PAYMENT: 'Chờ thanh toán',
    }[status?.toUpperCase() || ''] ||
    status ||
    'Chưa cập nhật');

export const statusColor = (status?: string) =>
    ['ACTIVE', 'OPEN', 'STUDYING', 'PRESENT'].includes(status?.toUpperCase() || '')
        ? 'green'
        : ['CANCELLED', 'ABSENT'].includes(status?.toUpperCase() || '')
          ? 'red'
          : ['WAITING_PAYMENT', 'LATE', 'EXCUSED'].includes(status?.toUpperCase() || '')
            ? 'gold'
            : 'blue';

export const statusTag = (status?: string) => <Tag color={statusColor(status)}>{statusText(status)}</Tag>;

export const TeacherState = ({
    loading,
    error,
    children,
}: {
    loading: boolean;
    error: string;
    children: ReactNode;
}) =>
    loading ? (
        <div className={styles['portal-loading']}>
            <Spin size="large" />
        </div>
    ) : error ? (
        <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />
    ) : (
        <>{children}</>
    );

export const TeacherEmpty = ({ description }: { description: string }) => (
    <Card className={styles['portal-card']}>
        <Empty description={description} />
    </Card>
);

// Helpers cho Điểm danh & Nhập điểm (Local Storage Persistence)
export const getAttendanceStorageKey = (classId: string, sessionDate: string) =>
    `teacher_attendance_${classId}_${sessionDate}`;

export const getSavedAttendance = (classId: string, sessionDate: string): Record<string, AttendanceRecord> => {
    try {
        const raw = localStorage.getItem(getAttendanceStorageKey(classId, sessionDate));
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
};

export const saveAttendance = (
    classId: string,
    sessionDate: string,
    records: Record<string, AttendanceRecord>
) => {
    try {
        localStorage.setItem(getAttendanceStorageKey(classId, sessionDate), JSON.stringify(records));
    } catch {
        // ignore
    }
};

export const getGradesStorageKey = (classId: string) => `teacher_grades_${classId}`;

export const getSavedGrades = (classId: string): Record<string, StudentGrade> => {
    try {
        const raw = localStorage.getItem(getGradesStorageKey(classId));
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
};

export const saveGrades = (classId: string, records: Record<string, StudentGrade>) => {
    try {
        localStorage.setItem(getGradesStorageKey(classId), JSON.stringify(records));
    } catch {
        // ignore
    }
};

export const useTeacherData = (providedTeacherId?: string) => {
    const [data, setData] = useState<TeacherData>(emptyTeacherData);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const effectiveTeacherId =
        providedTeacherId || (typeof window !== 'undefined' ? localStorage.getItem('user_id') || '' : '');

    const refresh = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [classroomRes, enrollmentRes, courseRes] = await Promise.all([
                callFetchMyTeachingClassrooms(effectiveTeacherId).catch(() => ({ data: [] })),
                callFetchEnrollment('pageSize=1000&populate=student_id,class_id').catch(() => ({ data: [] })),
                callFetchCourse('pageSize=1000').catch(() => ({ data: [] })),
            ]);

            const rawCourses = toArray<ICourse>(courseRes);
            const rawClasses = toArray<IClassroomWithDetails>(classroomRes);
            const rawEnrollments = toArray<IPortalEnrollment>(enrollmentRes);

            const courseMap = new Map<string, ICourse>(rawCourses.map(c => [c._id || '', c]));
            const classMap = new Map<string, IClassroomWithDetails>(rawClasses.map(c => [c._id || '', c]));

            // Enrich classes với Course chi tiết
            const enrichedClasses: IClassroomWithDetails[] = rawClasses.map(item => {
                const courseId =
                    typeof item.course_id === 'string'
                        ? item.course_id
                        : typeof item.course_id === 'object'
                          ? item.course_id?._id
                          : '';
                const matchedCourse = courseId ? courseMap.get(courseId) : undefined;
                return {
                    ...item,
                    course_id: matchedCourse || item.course_id,
                };
            });

            // Lọc các lớp do giảng viên này phụ trách nếu có ID
            let myClasses = enrichedClasses;
            if (effectiveTeacherId) {
                const teacherFilter = enrichedClasses.filter(item => {
                    const teacherId =
                        typeof item.teacher_id === 'string'
                            ? item.teacher_id
                            : typeof item.teacher_id === 'object'
                              ? item.teacher_id?._id
                              : '';
                    return teacherId === effectiveTeacherId;
                });
                // Nếu tìm thấy lớp của giảng viên thì dùng, nếu dữ liệu mẫu chưa gán thì giữ các lớp hiện có
                if (teacherFilter.length > 0) {
                    myClasses = teacherFilter;
                }
            }

            const myClassIdSet = new Set(myClasses.map(c => c._id).filter(Boolean));

            // Enrich và lọc Enrollments (học viên trong các lớp của giảng viên)
            const myStudents: IPortalEnrollment[] = rawEnrollments
                .map(item => {
                    const classId =
                        typeof item.class_id === 'string'
                            ? item.class_id
                            : typeof item.class_id === 'object'
                              ? item.class_id?._id
                              : '';
                    const matchedClass = classId ? classMap.get(classId) : undefined;
                    return {
                        ...item,
                        class_id: matchedClass || item.class_id,
                    };
                })
                .filter(item => {
                    const classId =
                        typeof item.class_id === 'string'
                            ? item.class_id
                            : typeof item.class_id === 'object'
                              ? item.class_id?._id
                              : '';
                    return classId ? myClassIdSet.has(classId) : true;
                });

            // Danh sách khóa học giảng viên đang dạy
            const myCourseIdSet = new Set(
                myClasses
                    .map(c => (typeof c.course_id === 'object' ? c.course_id?._id : c.course_id))
                    .filter(Boolean)
            );
            const myCourses = rawCourses.filter(c => c._id && myCourseIdSet.has(c._id));

            setData({
                classes: myClasses,
                courses: myCourses.length ? myCourses : rawCourses,
                students: myStudents,
            });
        } catch {
            setError('Không thể tải dữ liệu giảng viên. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    }, [effectiveTeacherId]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return { ...data, loading, error, refresh, effectiveTeacherId };
};
