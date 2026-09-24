import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Alert, Card, Empty, Spin, Tag } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import {
    callFetchClassroom,
    callFetchCourse,
    callFetchEnrollment,
    callFetchInvoice,
    callFetchPayment,
    callFetchUser,
} from '@/config/api';
import type { IClassroomWithDetails, ICourse, IEnrollment, IInvoice, IPayment, IUser, IUserSummary } from '@/types/backend';
import styles from '@/styles/client.module.scss';

export type AccountantInvoice = Omit<IInvoice, 'enrollment_id'> & { createdAt?: string; updatedAt?: string; enrollment_id: string | { _id?: string; student_id?: IUser; class_id?: IClassroomWithDetails } };
export type AccountantPayment = Omit<IPayment, 'invoice_id'> & { invoice_id: string | AccountantInvoice };

export const toArray = <T,>(response: unknown): T[] => {
    const data = (response as { data?: unknown })?.data;
    if (Array.isArray(data)) return data as T[];
    if (data && typeof data === 'object' && Array.isArray((data as { result?: T[] }).result)) return (data as { result: T[] }).result;
    return [];
};

export const idOf = (value?: string | { _id?: string }) => typeof value === 'string' ? value : value?._id || '';
export const money = (value?: number) => `${(value || 0).toLocaleString('vi-VN')} đ`;
export const dateText = (value?: string) => value ? new Date(value).toLocaleDateString('vi-VN') : 'Chưa cập nhật';
export const invoiceStatusText = (status?: string) => {
    switch (status?.toUpperCase()) {
        case 'PAID': return 'Đã thanh toán';
        case 'PARTIAL': return 'Thanh toán một phần';
        case 'CANCELLED': return 'Đã hủy';
        default: return 'Chưa thanh toán';
    }
};
export const invoiceStatusColor = (status?: string) => status?.toUpperCase() === 'PAID' ? 'green' : status?.toUpperCase() === 'CANCELLED' ? 'red' : 'gold';
export const statusTag = (status?: string) => <Tag color={invoiceStatusColor(status)}>{invoiceStatusText(status)}</Tag>;

export interface AccountantData {
    invoices: AccountantInvoice[];
    payments: AccountantPayment[];
    enrollments: (Omit<IEnrollment, 'student_id'> & { student_id: string | IUserSummary })[];
    users: IUser[];
    courses: ICourse[];
    classrooms: IClassroomWithDetails[];
}
export type AccountantEnrollment = AccountantData['enrollments'][number];

export const useAccountantData = () => {
    const [data, setData] = useState<AccountantData>({ invoices: [], payments: [], enrollments: [], users: [], courses: [], classrooms: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const refresh = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [invoiceResponse, paymentResponse, enrollmentResponse, userResponse, courseResponse, classroomResponse] = await Promise.all([
                callFetchInvoice('current=1&pageSize=1000&populate=enrollment_id'),
                callFetchPayment('current=1&pageSize=1000&populate=invoice_id'),
                callFetchEnrollment('current=1&pageSize=1000&populate=student_id,class_id'),
                callFetchUser('current=1&pageSize=1000'),
                callFetchCourse('current=1&pageSize=1000'),
                callFetchClassroom('current=1&pageSize=1000&populate=course_id,teacher_id'),
            ]);
            setData({
                invoices: toArray<AccountantInvoice>(invoiceResponse),
                payments: toArray<AccountantPayment>(paymentResponse),
                enrollments: toArray<Omit<IEnrollment, 'student_id'> & { student_id: string | IUserSummary }>(enrollmentResponse),
                users: toArray<IUser>(userResponse),
                courses: toArray<ICourse>(courseResponse),
                classrooms: toArray<IClassroomWithDetails>(classroomResponse),
            });
        } catch {
            setError('Không thể tải dữ liệu kế toán. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { refresh(); }, [refresh]);
    return { ...data, loading, error, refresh };
};

export const AccountantState = ({ loading, error, children }: { loading: boolean; error: string; children: ReactNode }) => {
    if (loading) return <div className={styles['portal-loading']}><Spin size="large" /></div>;
    if (error) return <Alert type="error" showIcon message={error} />;
    return <>{children}</>;
};

export const AccountantEmpty = ({ description }: { description: string }) => <Card className={styles['portal-card']}><Empty description={description} /></Card>;

export const getStudentName = (invoice: AccountantInvoice, enrollments: AccountantEnrollment[], users: IUser[]) => {
    const populated = typeof invoice.enrollment_id === 'object' ? invoice.enrollment_id.student_id : undefined;
    if (populated && typeof populated !== 'string') return populated.name || populated.email || 'Chưa cập nhật';
    const enrollment = enrollments.find(item => item._id === idOf(invoice.enrollment_id));
    const studentId = enrollment && typeof enrollment.student_id === 'string' ? enrollment.student_id : '';
    return users.find(item => item._id === studentId)?.name || studentId || 'Chưa cập nhật';
};

export const getClassName = (invoice: AccountantInvoice, enrollments: AccountantEnrollment[], classrooms: IClassroomWithDetails[]) => {
    const populated = typeof invoice.enrollment_id === 'object' ? invoice.enrollment_id.class_id : undefined;
    if (populated && typeof populated !== 'string') return populated.class_name || populated._id || 'Chưa cập nhật';
    const enrollment = enrollments.find(item => item._id === idOf(invoice.enrollment_id));
    return classrooms.find(item => item._id === (typeof enrollment?.class_id === 'string' ? enrollment.class_id : ''))?.class_name || 'Chưa cập nhật';
};

export const getPaidAmount = (invoice: AccountantInvoice, payments: AccountantPayment[]) => payments.filter(payment => idOf(payment.invoice_id) === invoice._id).reduce((total, payment) => total + (invoice.final_amount || invoice.amount || 0), 0);
export const useInvoiceRows = (data: AccountantData) => useMemo(() => data.invoices.map(invoice => ({ invoice, paid: Math.min(getPaidAmount(invoice, data.payments), invoice.final_amount || invoice.amount || 0) })), [data]);

export const StatCard = ({ title, value, icon, accent = 'teal' }: { title: string; value: string | number; icon: ReactNode; accent?: string }) => <Card className={`${styles['accountant-stat']} ${styles[`stat-${accent}`]}`}><div className={styles['accountant-stat-icon']}>{icon}</div><div><span>{title}</span><strong>{value}</strong></div></Card>;

export const StatusIcon = ({ status }: { status?: string }) => status?.toUpperCase() === 'PAID' ? <CheckCircleOutlined /> : status?.toUpperCase() === 'CANCELLED' ? <ExclamationCircleOutlined /> : <ClockCircleOutlined />;
