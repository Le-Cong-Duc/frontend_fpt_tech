import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Alert, Card, Empty, Spin, Tag } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
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

export type AccountantInvoice = Omit<IInvoice, 'enrollment_id'> & {
    createdAt?: string;
    updatedAt?: string;
    enrollment_id: string | {
        _id?: string;
        student_id?: IUser | string;
        class_id?: IClassroomWithDetails | string;
    };
};

export type AccountantPayment = Omit<IPayment, 'invoice_id'> & {
    createdAt?: string;
    invoice_id: string | AccountantInvoice;
};

export const toArray = <T,>(response: unknown): T[] => {
    const data = (response as { data?: unknown })?.data;
    if (Array.isArray(data)) return data as T[];
    if (data && typeof data === 'object' && Array.isArray((data as { result?: T[] }).result)) return (data as { result: T[] }).result;
    return [];
};

export const idOf = (value?: string | { _id?: string } | null) => {
    if (!value) return '';
    return typeof value === 'string' ? value : value._id || '';
};

export const money = (value?: number | null) => `${(Number(value) || 0).toLocaleString('vi-VN')} đ`;

export const dateText = (value?: string | Date | null) => {
    if (!value) return 'Chưa cập nhật';
    try {
        const d = new Date(value);
        if (isNaN(d.getTime())) return 'Chưa cập nhật';
        return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
        return 'Chưa cập nhật';
    }
};

export const dateTimeText = (value?: string | Date | null) => {
    if (!value) return 'Chưa cập nhật';
    try {
        const d = new Date(value);
        if (isNaN(d.getTime())) return 'Chưa cập nhật';
        return `${d.toLocaleDateString('vi-VN')} ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
        return 'Chưa cập nhật';
    }
};

export const numberToWordsVietnamese = (num: number): string => {
    if (!num || isNaN(num) || num === 0) return 'Không đồng chẵn';
    const units = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];
    const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

    const readTriple = (n: number, full: boolean) => {
        const h = Math.floor(n / 100);
        const t = Math.floor((n % 100) / 10);
        const u = n % 10;
        if (n === 0 && !full) return '';
        let res = '';
        if (h > 0 || full) {
            res += `${digits[h]} trăm `;
        }
        if (t > 1) {
            res += `${digits[t]} mươi `;
            if (u === 1) res += 'mốt ';
            else if (u === 5) res += 'lăm ';
            else if (u > 0) res += `${digits[u]} `;
        } else if (t === 1) {
            res += 'mười ';
            if (u === 5) res += 'lăm ';
            else if (u > 0) res += `${digits[u]} `;
        } else if (full && t === 0 && u > 0) {
            res += `lẻ ${digits[u]} `;
        } else if (u > 0) {
            res += `${digits[u]} `;
        }
        return res.trim();
    };

    let remaining = Math.floor(Math.abs(num));
    const groups: number[] = [];
    while (remaining > 0) {
        groups.push(remaining % 1000);
        remaining = Math.floor(remaining / 1000);
    }

    let result = '';
    for (let i = groups.length - 1; i >= 0; i--) {
        const val = groups[i];
        if (val === 0) continue;
        const text = readTriple(val, i < groups.length - 1);
        result += `${text} ${units[i]} `;
    }
    result = result.trim();
    if (!result) return 'Không đồng chẵn';
    result = result.charAt(0).toUpperCase() + result.slice(1) + ' đồng chẵn';
    return result.replace(/\s+/g, ' ');
};

export const invoiceStatusText = (status?: string) => {
    switch (status?.toUpperCase()) {
        case 'PAID': return 'Đã thanh toán';
        case 'PARTIAL': return 'Thanh toán một phần';
        case 'CANCELLED': return 'Đã hủy';
        case 'WAITING_CONFIRMATION': return 'Chờ xác nhận';
        default: return 'Chưa thanh toán';
    }
};

export const invoiceStatusColor = (status?: string) => {
    switch (status?.toUpperCase()) {
        case 'PAID': return 'green';
        case 'PARTIAL': return 'blue';
        case 'CANCELLED': return 'red';
        case 'WAITING_CONFIRMATION': return 'orange';
        default: return 'gold';
    }
};

export const paymentMethodText = (method?: string) => {
    switch (method?.toUpperCase()) {
        case 'BANK_TRANSFER': return 'Chuyển khoản ngân hàng';
        case 'CASH': return 'Tiền mặt tại quầy';
        case 'VNPAY': return 'Cổng VNPay';
        case 'CARD': return 'Quẹt thẻ POS';
        default: return method || 'Khác';
    }
};

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
    const [data, setData] = useState<AccountantData>({
        invoices: [],
        payments: [],
        enrollments: [],
        users: [],
        courses: [],
        classrooms: [],
    });
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
            setError('Không thể tải dữ liệu kế toán. Vui lòng kiểm tra kết nối mạng và thử lại sau.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { refresh(); }, [refresh]);
    return { ...data, loading, error, refresh };
};

export const AccountantState = ({ loading, error, children }: { loading: boolean; error: string; children: ReactNode }) => {
    if (loading) return <div className={styles['portal-loading']}><Spin size="large" /></div>;
    if (error) return <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />;
    return <>{children}</>;
};

export const AccountantEmpty = ({ description }: { description: string }) => <Card className={styles['portal-card']}><Empty description={description} /></Card>;

export interface StudentResolvedInfo {
    id: string;
    name: string;
    email: string;
    phone: string;
}

export const getStudentInfo = (invoice: AccountantInvoice, enrollments: AccountantEnrollment[], users: IUser[]): StudentResolvedInfo => {
    const populated = typeof invoice.enrollment_id === 'object' ? invoice.enrollment_id?.student_id : undefined;
    if (populated && typeof populated === 'object') {
        return {
            id: populated._id || '',
            name: populated.name || populated.email || 'Chưa cập nhật',
            email: populated.email || '',
            phone: populated.phone || '',
        };
    }
    const enrollment = enrollments.find(item => item._id === idOf(invoice.enrollment_id));
    if (enrollment) {
        if (typeof enrollment.student_id === 'object' && enrollment.student_id) {
            return {
                id: enrollment.student_id._id || '',
                name: enrollment.student_id.name || enrollment.student_id.email || 'Chưa cập nhật',
                email: enrollment.student_id.email || '',
                phone: (enrollment.student_id as any).phone || '',
            };
        }
        const studentUser = users.find(u => u._id === enrollment.student_id);
        if (studentUser) {
            return {
                id: studentUser._id || '',
                name: studentUser.name || studentUser.email || 'Chưa cập nhật',
                email: studentUser.email || '',
                phone: studentUser.phone || '',
            };
        }
    }
    return { id: '', name: 'Chưa cập nhật', email: '', phone: '' };
};

export const getStudentName = (invoice: AccountantInvoice, enrollments: AccountantEnrollment[], users: IUser[]) => {
    return getStudentInfo(invoice, enrollments, users).name;
};

export const getClassroomInfo = (invoice: AccountantInvoice, enrollments: AccountantEnrollment[], classrooms: IClassroomWithDetails[]) => {
    const populated = typeof invoice.enrollment_id === 'object' ? invoice.enrollment_id?.class_id : undefined;
    if (populated && typeof populated === 'object') {
        return populated;
    }
    const enrollment = enrollments.find(item => item._id === idOf(invoice.enrollment_id));
    const classId = typeof enrollment?.class_id === 'string' ? enrollment.class_id : (enrollment?.class_id as any)?._id;
    return classrooms.find(item => item._id === classId);
};

export const getClassName = (invoice: AccountantInvoice, enrollments: AccountantEnrollment[], classrooms: IClassroomWithDetails[]) => {
    const cls = getClassroomInfo(invoice, enrollments, classrooms);
    return cls?.class_name || 'Chưa cập nhật';
};

export const getCourseInfo = (invoice: AccountantInvoice, enrollments: AccountantEnrollment[], classrooms: IClassroomWithDetails[], courses: ICourse[]): ICourse | undefined => {
    const cls = getClassroomInfo(invoice, enrollments, classrooms);
    if (!cls) return undefined;
    if (typeof cls.course_id === 'object' && cls.course_id) {
        return cls.course_id as ICourse;
    }
    const courseId = typeof cls.course_id === 'string' ? cls.course_id : (cls.course_id as any)?._id;
    return courses.find(c => c._id === courseId);
};

export const getPaidAmount = (invoice: AccountantInvoice, payments: AccountantPayment[]) => {
    return payments
        .filter(payment => idOf(payment.invoice_id) === invoice._id)
        .reduce((total, _) => total + (Number(invoice.final_amount) || Number(invoice.amount) || 0), 0);
};

export interface InvoiceRow {
    invoice: AccountantInvoice;
    paid: number;
    remaining: number;
    student: StudentResolvedInfo;
    classroomName: string;
    courseName: string;
}

export const useInvoiceRows = (data: AccountantData): InvoiceRow[] => {
    return useMemo(() => {
        return data.invoices.map(invoice => {
            const final = Number(invoice.final_amount ?? invoice.amount ?? 0);
            const isPaid = invoice.status?.toUpperCase() === 'PAID';
            const paid = isPaid ? final : Math.min(getPaidAmount(invoice, data.payments), final);
            const remaining = Math.max(0, final - paid);
            const student = getStudentInfo(invoice, data.enrollments, data.users);
            const classroomName = getClassName(invoice, data.enrollments, data.classrooms);
            const course = getCourseInfo(invoice, data.enrollments, data.classrooms, data.courses);
            return {
                invoice,
                paid,
                remaining,
                student,
                classroomName,
                courseName: course?.name || (course as any)?.course_name || 'Khóa học tiêu chuẩn',
            };
        });
    }, [data]);
};

export const StatCard = ({
    title,
    value,
    subValue,
    icon,
    accent = 'teal',
}: {
    title: string;
    value: string | number;
    subValue?: string;
    icon: ReactNode;
    accent?: 'teal' | 'navy' | 'green' | 'coral' | string;
}) => (
    <Card className={`${styles['accountant-stat']} ${styles[`stat-${accent}`] || ''}`}>
        <div className={styles['accountant-stat-icon']}>{icon}</div>
        <div>
            <span>{title}</span>
            <strong>{value}</strong>
            {subValue && <small style={{ display: 'block', fontSize: 11, color: '#8c9ba5', marginTop: 3 }}>{subValue}</small>}
        </div>
    </Card>
);

export const StatusIcon = ({ status }: { status?: string }) => {
    switch (status?.toUpperCase()) {
        case 'PAID': return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
        case 'CANCELLED': return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
        default: return <ClockCircleOutlined style={{ color: '#faad14' }} />;
    }
};

export const exportToCsv = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const bom = '\uFEFF';
    const csvContent = [
        headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
        ...rows.map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')),
    ].join('\r\n');

    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
