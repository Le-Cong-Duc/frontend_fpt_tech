import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Alert, Card, Empty, Spin, Tag } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import {
    callFetchClassroom,
    callFetchCourse,
    callFetchMyEnrollments,
    callFetchMyInvoices,
    callFetchMyPayments,
    callCreateInvoice,
} from '@/config/api';
import type {
    IClassroomWithDetails,
    ICourse,
    IPortalEnrollment,
    IPortalInvoice,
    IPortalPayment,
} from '@/types/backend';
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
    classrooms: [],
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

export const money = (value?: number | string) =>
    value === undefined || value === '' ? '0 đ' : `${Number(value || 0).toLocaleString('vi-VN')} đ`;

export const dateText = (value?: string) => (value ? new Date(value).toLocaleDateString('vi-VN') : 'Chưa cập nhật');

export const statusText = (value?: string) =>
    ({
        STUDYING: 'Đang học',
        ACTIVE: 'Đang học',
        COMPLETED: 'Hoàn thành',
        CANCELLED: 'Đã hủy',
        WAITING_PAYMENT: 'Chờ thanh toán',
        FULL: 'Đã đầy',
        WAITING_CONFIRMATION: 'Chờ xác nhận',
        PAID: 'Đã thanh toán',
        UNPAID: 'Chưa thanh toán',
        PARTIAL: 'Thanh toán một phần',
        OVERDUE: 'Quá hạn',
    }[value?.toUpperCase() || ''] ||
    value ||
    'Chưa cập nhật');

export const statusColor = (value?: string) =>
    ['STUDYING', 'ACTIVE', 'PAID'].includes(value?.toUpperCase() || '')
        ? 'green'
        : ['CANCELLED', 'OVERDUE'].includes(value?.toUpperCase() || '')
          ? 'red'
          : ['WAITING_PAYMENT', 'WAITING_CONFIRMATION', 'UNPAID'].includes(value?.toUpperCase() || '')
            ? 'gold'
            : 'blue';

export const statusTag = (value?: string) => <Tag color={statusColor(value)}>{statusText(value)}</Tag>;

export const StudentState = ({
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

export const StudentEmpty = ({ description }: { description: string }) => (
    <Card className={styles['portal-card']}>
        <Empty description={description} />
    </Card>
);

// Helpers quản lý Local Storage Cache cho dữ liệu Student
const getStorageKey = (prefix: string, userId?: string) => `${prefix}_${userId || 'default'}`;

export const getLocalEnrollments = (userId?: string): IPortalEnrollment[] => {
    try {
        const raw = localStorage.getItem(getStorageKey('student_enrollments', userId));
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

export const saveLocalEnrollment = (userId: string | undefined, enrollment: IPortalEnrollment) => {
    try {
        const list = getLocalEnrollments(userId);
        const exists = list.some(item => item._id === enrollment._id);
        const updated = exists ? list.map(item => (item._id === enrollment._id ? enrollment : item)) : [enrollment, ...list];
        localStorage.setItem(getStorageKey('student_enrollments', userId), JSON.stringify(updated));
    } catch {
        // ignore
    }
};

export const getLocalInvoices = (userId?: string): IPortalInvoice[] => {
    try {
        const raw = localStorage.getItem(getStorageKey('student_invoices', userId));
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

export const saveLocalInvoice = (userId: string | undefined, invoice: IPortalInvoice) => {
    try {
        const list = getLocalInvoices(userId);
        const exists = list.some(item => item._id === invoice._id);
        const updated = exists ? list.map(item => (item._id === invoice._id ? invoice : item)) : [invoice, ...list];
        localStorage.setItem(getStorageKey('student_invoices', userId), JSON.stringify(updated));
    } catch {
        // ignore
    }
};

export const updateLocalInvoice = (userId: string | undefined, invoiceId: string, patch: Partial<IPortalInvoice>) => {
    try {
        const list = getLocalInvoices(userId);
        const updated = list.map(item => (item._id === invoiceId ? { ...item, ...patch } : item));
        localStorage.setItem(getStorageKey('student_invoices', userId), JSON.stringify(updated));
    } catch {
        // ignore
    }
};

export const getLocalPayments = (userId?: string): IPortalPayment[] => {
    try {
        const raw = localStorage.getItem(getStorageKey('student_payments', userId));
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

export const saveLocalPayment = (userId: string | undefined, payment: IPortalPayment) => {
    try {
        const list = getLocalPayments(userId);
        const exists = list.some(item => item._id === payment._id);
        const updated = exists ? list.map(item => (item._id === payment._id ? payment : item)) : [payment, ...list];
        localStorage.setItem(getStorageKey('student_payments', userId), JSON.stringify(updated));
    } catch {
        // ignore
    }
};

export const useStudentData = (providedUserId?: string) => {
    const [data, setData] = useState<StudentData>(emptyData);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const effectiveUserId = providedUserId || (typeof window !== 'undefined' ? localStorage.getItem('user_id') || '' : '');

    const refresh = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [enrollmentsRes, invoicesRes, paymentsRes, coursesRes, classroomsRes] = await Promise.all([
                callFetchMyEnrollments(effectiveUserId).catch(() => ({ data: [] })),
                callFetchMyInvoices().catch(() => ({ data: [] })),
                callFetchMyPayments().catch(() => ({ data: [] })),
                callFetchCourse('pageSize=1000').catch(() => ({ data: [] })),
                callFetchClassroom('pageSize=1000&populate=course_id,teacher_id').catch(() => ({ data: [] })),
            ]);

            const rawCourses = toArray<ICourse>(coursesRes);
            const rawClassrooms = toArray<IClassroomWithDetails>(classroomsRes);
            const courseMap = new Map<string, ICourse>(rawCourses.map(c => [c._id || '', c]));
            const classMap = new Map<string, IClassroomWithDetails>(rawClassrooms.map(c => [c._id || '', c]));

            // 1. Tải và đồng bộ Enrollments (Server + Local Cache)
            const serverEnrollments = toArray<IPortalEnrollment>(enrollmentsRes);
            const localEnrollments = getLocalEnrollments(effectiveUserId);
            
            // Gộp enrollments: ưu tiên server, bổ sung local chưa có
            const enrollmentIdSet = new Set<string>();
            const mergedEnrollmentsRaw: IPortalEnrollment[] = [];
            
            for (const item of serverEnrollments) {
                if (item._id) enrollmentIdSet.add(item._id);
                mergedEnrollmentsRaw.push(item);
            }
            for (const item of localEnrollments) {
                if (item._id && !enrollmentIdSet.has(item._id)) {
                    enrollmentIdSet.add(item._id);
                    mergedEnrollmentsRaw.push(item);
                }
            }

            // Lọc enrollments thuộc về học viên hiện tại nếu có thông tin user
            const myEnrollmentsRaw = effectiveUserId
                ? mergedEnrollmentsRaw.filter(item => {
                      const studentId = typeof item.student_id === 'string' ? item.student_id : item.student_id?._id;
                      const creatorId = typeof item.createdBy === 'object' ? item.createdBy?._id : item.createdBy;
                      return !studentId || studentId === effectiveUserId || creatorId === effectiveUserId;
                  })
                : mergedEnrollmentsRaw;

            // Enrich enrollments với Classroom và Course chi tiết
            const enrichedEnrollments: IPortalEnrollment[] = myEnrollmentsRaw.map(item => {
                const classId = typeof item.class_id === 'string' ? item.class_id : item.class_id?._id;
                const matchedClass = classId ? classMap.get(classId) : undefined;
                const baseClass = matchedClass || (typeof item.class_id === 'object' ? item.class_id : undefined);

                if (baseClass) {
                    const courseId =
                        typeof baseClass.course_id === 'string' ? baseClass.course_id : baseClass.course_id?._id;
                    const matchedCourse = courseId ? courseMap.get(courseId) : undefined;
                    return {
                        ...item,
                        class_id: {
                            ...baseClass,
                            course_id: matchedCourse || baseClass.course_id,
                        },
                    };
                }
                return item;
            });

            const enrollmentMap = new Map(enrichedEnrollments.map(e => [e._id || '', e]));
            const enrolledClassIdSet = new Set(
                enrichedEnrollments
                    .map(e => (typeof e.class_id === 'object' ? e.class_id?._id : e.class_id))
                    .filter(Boolean)
            );

            // 2. Tải và đồng bộ Invoices (Server + Local Cache)
            const serverInvoices = toArray<IPortalInvoice>(invoicesRes);
            const localInvoices = getLocalInvoices(effectiveUserId);

            const invoiceIdSet = new Set<string>();
            const mergedInvoicesRaw: IPortalInvoice[] = [];

            for (const item of serverInvoices) {
                if (item._id) invoiceIdSet.add(item._id);
                mergedInvoicesRaw.push(item);
            }
            for (const item of localInvoices) {
                if (item._id && !invoiceIdSet.has(item._id)) {
                    invoiceIdSet.add(item._id);
                    mergedInvoicesRaw.push(item);
                }
            }

            // Enrich và lọc invoices thuộc các enrollment của học viên
            let enrichedInvoices: IPortalInvoice[] = mergedInvoicesRaw
                .map(inv => {
                    const enrollmentId =
                        typeof inv.enrollment_id === 'string' ? inv.enrollment_id : inv.enrollment_id?._id;
                    const matchedEnrollment = enrollmentId ? enrollmentMap.get(enrollmentId) : undefined;
                    const baseEnrollment = matchedEnrollment || (typeof inv.enrollment_id === 'object' ? inv.enrollment_id : undefined);

                    let resolvedEnrollment = baseEnrollment;
                    if (baseEnrollment) {
                        const classId =
                            typeof baseEnrollment.class_id === 'string'
                                ? baseEnrollment.class_id
                                : baseEnrollment.class_id?._id;
                        const matchedClass = classId ? classMap.get(classId) : undefined;
                        const baseClass = matchedClass || (typeof baseEnrollment.class_id === 'object' ? baseEnrollment.class_id : undefined);
                        if (baseClass) {
                            const courseId =
                                typeof baseClass.course_id === 'string' ? baseClass.course_id : baseClass.course_id?._id;
                            const matchedCourse = courseId ? courseMap.get(courseId) : undefined;
                            resolvedEnrollment = {
                                ...baseEnrollment,
                                class_id: {
                                    ...baseClass,
                                    course_id: matchedCourse || baseClass.course_id,
                                },
                            };
                        }
                    }

                    return {
                        ...inv,
                        enrollment_id: resolvedEnrollment || inv.enrollment_id,
                    };
                })
                .filter(inv => {
                    const enrollmentId =
                        typeof inv.enrollment_id === 'string' ? inv.enrollment_id : inv.enrollment_id?._id;
                    return enrollmentId ? enrollmentMap.has(enrollmentId) : false;
                });

            // Tự động bảo đảm mỗi enrollment của học viên đều có một Invoice học phí tương ứng
            // Nếu học viên đã đăng ký lớp mà chưa có hóa đơn, tự động tạo hóa đơn chờ thanh toán
            const existingInvoiceEnrollmentIds = new Set(
                enrichedInvoices
                    .map(inv => (typeof inv.enrollment_id === 'object' ? inv.enrollment_id?._id : inv.enrollment_id))
                    .filter(Boolean)
            );

            for (const enrollment of enrichedEnrollments) {
                if (enrollment._id && !existingInvoiceEnrollmentIds.has(enrollment._id)) {
                    const targetClass = typeof enrollment.class_id === 'object' ? enrollment.class_id : classMap.get(enrollment.class_id || '');
                    const courseObj = targetClass && typeof targetClass.course_id === 'object' ? targetClass.course_id : undefined;
                    const price = Number(courseObj?.price || 0);

                    const autoInvoiceId = `inv_${enrollment._id}`;
                    const autoInvoice: IPortalInvoice = {
                        _id: autoInvoiceId,
                        enrollment_id: enrollment,
                        amount: price,
                        discount_amount: 0,
                        final_amount: price,
                        status: 'UNPAID',
                        createdAt: enrollment.createdAt || new Date().toISOString(),
                    };

                    enrichedInvoices.push(autoInvoice);
                    saveLocalInvoice(effectiveUserId, autoInvoice);

                    // Thử tạo lên backend nếu có thể
                    callCreateInvoice({
                        enrollment_id: enrollment._id as any,
                        amount: price,
                        discount_amount: 0,
                        final_amount: price,
                        status: 'UNPAID',
                    }).catch(() => {
                        // ignore nếu backend từ chối hoặc đã tồn tại
                    });
                }
            }

            // 3. Tải và đồng bộ Payments (Server + Local Cache)
            const serverPayments = toArray<IPortalPayment>(paymentsRes);
            const localPayments = getLocalPayments(effectiveUserId);

            const paymentIdSet = new Set<string>();
            const mergedPaymentsRaw: IPortalPayment[] = [];

            for (const item of serverPayments) {
                if (item._id) paymentIdSet.add(item._id);
                mergedPaymentsRaw.push(item);
            }
            for (const item of localPayments) {
                if (item._id && !paymentIdSet.has(item._id)) {
                    paymentIdSet.add(item._id);
                    mergedPaymentsRaw.push(item);
                }
            }

            const invoiceMap = new Map(enrichedInvoices.map(i => [i._id || '', i]));
            const enrichedPayments: IPortalPayment[] = mergedPaymentsRaw
                .map(p => {
                    const invoiceId = typeof p.invoice_id === 'string' ? p.invoice_id : p.invoice_id?._id;
                    const matchedInvoice = invoiceId ? invoiceMap.get(invoiceId) : undefined;
                    return {
                        ...p,
                        invoice_id: matchedInvoice || p.invoice_id,
                    };
                })
                .filter(p => {
                    const invoiceId = typeof p.invoice_id === 'string' ? p.invoice_id : p.invoice_id?._id;
                    return invoiceId ? invoiceMap.has(invoiceId) : false;
                });

            setData({
                courses: rawCourses,
                classrooms: rawClassrooms,
                enrollments: enrichedEnrollments,
                invoices: enrichedInvoices,
                payments: enrichedPayments,
            });
        } catch {
            setError('Không thể tải dữ liệu học tập. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    }, [effectiveUserId]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return { ...data, loading, error, refresh, effectiveUserId };
};

export const enrollmentCourse = (item: IPortalEnrollment) => {
    if (typeof item.class_id?.course_id === 'object' && item.class_id?.course_id?.name) {
        return item.class_id.course_id.name;
    }
    return item.class_id?.class_name || 'Khóa học';
};

export const invoiceCourse = (item: IPortalInvoice) => {
    if (
        typeof item.enrollment_id?.class_id?.course_id === 'object' &&
        item.enrollment_id?.class_id?.course_id?.name
    ) {
        return item.enrollment_id.class_id.course_id.name;
    }
    return item.enrollment_id?.class_id?.class_name || 'Khóa học';
};

export const PaymentStatusIcon = ({ status }: { status?: string }) =>
    status?.toUpperCase() === 'PAID' ? (
        <CheckCircleOutlined />
    ) : status?.toUpperCase() === 'CANCELLED' ? (
        <CloseCircleOutlined />
    ) : (
        <ClockCircleOutlined />
    );
