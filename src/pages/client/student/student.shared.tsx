import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Alert, Card, Empty, Spin, Tag } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { callFetchClassroom, callFetchCourse, callFetchMyEnrollments, callFetchMyInvoices, callFetchMyPayments } from '@/config/api';
import type { IClassroomWithDetails, ICourse, IPortalEnrollment, IPortalInvoice, IPortalPayment } from '@/types/backend';
import styles from '@/styles/client.module.scss';

export interface StudentData {
    enrollments: IPortalEnrollment[];
    invoices: IPortalInvoice[];
    payments: IPortalPayment[];
    courses: ICourse[];
    classrooms: IClassroomWithDetails[];
}

const emptyData: StudentData = {
    enrollments: [],
    invoices: [],
    payments: [],
    courses: [],
    classrooms: []
};

export const toArray = <T,>(response: unknown): T[] => {
    const data = (response as { data?: unknown })?.data;
    if (Array.isArray(data)) return data as T[];
    if (data && typeof data === 'object' && Array.isArray((data as { result?: T[] }).result)) {
        return (data as { result: T[] }).result;
    }
    return [];
};

export const money = (value?: number) => `${(value || 0).toLocaleString('vi-VN')} đ`;
export const dateText = (value?: string) => value ? new Date(value).toLocaleDateString('vi-VN') : 'Chưa cập nhật';

export const statusText = (value?: string) => ({
    STUDYING: 'Đang học',
    ACTIVE: 'Đang học',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy',
    WAITING_PAYMENT: 'Chờ thanh toán',
    PAID: 'Đã thanh toán',
    UNPAID: 'Chưa thanh toán',
    PARTIAL: 'Thanh toán một phần',
    OVERDUE: 'Quá hạn'
}[value?.toUpperCase() || ''] || value || 'Chưa cập nhật');

export const statusColor = (value?: string) =>
    ['STUDYING', 'ACTIVE', 'PAID'].includes(value?.toUpperCase() || '')
        ? 'green'
        : ['CANCELLED', 'OVERDUE'].includes(value?.toUpperCase() || '')
            ? 'red'
            : 'gold';

export const statusTag = (value?: string) => <Tag color={statusColor(value)}>{statusText(value)}</Tag>;

export const StudentState = ({ loading, error, children }: { loading: boolean; error: string; children: ReactNode }) =>
    loading ? <div className={styles['portal-loading']}><Spin size="large" /></div> : error ? <Alert type="error" showIcon message={error} /> : <>{children}</>;

export const StudentEmpty = ({ description }: { description: string }) =>
    <Card className={styles['portal-card']}><Empty description={description} /></Card>;

export const useStudentData = (scope: 'all' | 'enrollments' | 'invoices' | 'payments' = 'all') => {
    const [data, setData] = useState<StudentData>(emptyData);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const refresh = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [enrollmentsRes, invoicesRes, paymentsRes, coursesRes, classroomsRes] = await Promise.all([
                scope === 'invoices' || scope === 'payments' ? Promise.resolve(undefined) : callFetchMyEnrollments(),
                scope === 'enrollments' || scope === 'payments' ? Promise.resolve(undefined) : callFetchMyInvoices(),
                scope === 'enrollments' || scope === 'invoices' ? Promise.resolve(undefined) : callFetchMyPayments(),
                callFetchCourse('pageSize=1000'),
                callFetchClassroom('pageSize=1000&populate=course_id,teacher_id')
            ]);

            const rawCourses = toArray<ICourse>(coursesRes);
            const rawClassrooms = toArray<IClassroomWithDetails>(classroomsRes);
            const courseMap = new Map<string, ICourse>(rawCourses.map(c => [c._id || '', c]));
            const classMap = new Map<string, IClassroomWithDetails>(rawClassrooms.map(c => [c._id || '', c]));

            // Enrich enrollments with classroom and course details
            const rawEnrollments = enrollmentsRes ? toArray<IPortalEnrollment>(enrollmentsRes) : [];
            const enrichedEnrollments = rawEnrollments.map(item => {
                const classId = typeof item.class_id === 'string' ? item.class_id : item.class_id?._id;
                const matchedClass = classId ? classMap.get(classId) : undefined;
                const baseClass = matchedClass || (typeof item.class_id === 'object' ? item.class_id : undefined);

                if (baseClass) {
                    const courseId = typeof baseClass.course_id === 'string' ? baseClass.course_id : baseClass.course_id?._id;
                    const matchedCourse = courseId ? courseMap.get(courseId) : undefined;
                    return {
                        ...item,
                        class_id: {
                            ...baseClass,
                            course_id: matchedCourse || baseClass.course_id,
                        }
                    };
                }
                return item;
            });

            // Enrich invoices
            const rawInvoices = invoicesRes ? toArray<IPortalInvoice>(invoicesRes) : [];
            const enrollmentMap = new Map(enrichedEnrollments.map(e => [e._id || '', e]));
            const enrichedInvoices = rawInvoices.map(inv => {
                const enrollmentId = typeof inv.enrollment_id === 'string' ? inv.enrollment_id : inv.enrollment_id?._id;
                const matchedEnrollment = enrollmentId ? enrollmentMap.get(enrollmentId) : undefined;
                return {
                    ...inv,
                    enrollment_id: matchedEnrollment || inv.enrollment_id
                };
            });

            // Enrich payments
            const rawPayments = paymentsRes ? toArray<IPortalPayment>(paymentsRes) : [];
            const invoiceMap = new Map(enrichedInvoices.map(i => [i._id || '', i]));
            const enrichedPayments = rawPayments.map(p => {
                const invoiceId = typeof p.invoice_id === 'string' ? p.invoice_id : p.invoice_id?._id;
                const matchedInvoice = invoiceId ? invoiceMap.get(invoiceId) : undefined;
                return {
                    ...p,
                    invoice_id: matchedInvoice || p.invoice_id
                };
            });

            setData(current => ({
                ...current,
                courses: rawCourses,
                classrooms: rawClassrooms,
                enrollments: enrollmentsRes ? enrichedEnrollments : scope === 'all' ? [] : current.enrollments,
                invoices: invoicesRes ? enrichedInvoices : scope === 'all' ? [] : current.invoices,
                payments: paymentsRes ? enrichedPayments : scope === 'all' ? [] : current.payments
            }));
        } catch {
            setError('Không thể tải dữ liệu. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    }, [scope]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return { ...data, loading, error, refresh };
};

export const enrollmentCourse = (item: IPortalEnrollment) => {
    if (typeof item.class_id?.course_id === 'object' && item.class_id?.course_id?.name) {
        return item.class_id.course_id.name;
    }
    return item.class_id?.class_name || 'Khóa học';
};

export const invoiceCourse = (item: IPortalInvoice) => {
    if (typeof item.enrollment_id?.class_id?.course_id === 'object' && item.enrollment_id?.class_id?.course_id?.name) {
        return item.enrollment_id.class_id.course_id.name;
    }
    return item.enrollment_id?.class_id?.class_name || 'Khóa học';
};

export const PaymentStatusIcon = ({ status }: { status?: string }) =>
    status?.toUpperCase() === 'PAID'
        ? <CheckCircleOutlined />
        : status?.toUpperCase() === 'CANCELLED'
            ? <CloseCircleOutlined />
            : <ClockCircleOutlined />;
