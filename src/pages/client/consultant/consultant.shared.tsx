import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Alert, Card, Empty, Spin, Tag, message } from 'antd';
import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    PhoneOutlined,
    UserAddOutlined,
    UserOutlined,
} from '@ant-design/icons';
import {
    callCreateEnrollment,
    callCreateInvoice,
    callCreateNotification,
    callCreateUser,
    callFetchClassroom,
    callFetchCourse,
    callFetchEnrollment,
    callFetchLeadsForConsultants,
    callFetchRole,
    callFetchUser,
    callUpdateLead,
} from '@/config/api';
import type { IClassroomWithDetails, ICourse, IEnrollment, ILead, IRole, IUser, IUserSummary } from '@/types/backend';
import styles from '@/styles/client.module.scss';

export const toArray = <T,>(response: unknown): T[] => {
    const data = (response as { data?: unknown })?.data;
    if (Array.isArray(data)) return data as T[];
    if (data && typeof data === 'object' && Array.isArray((data as { result?: T[] }).result)) return (data as { result: T[] }).result;
    return [];
};

export const money = (value?: string | number | null) => {
    if (value === undefined || value === null || value === '') return 'Liên hệ';
    const num = Number(value);
    if (isNaN(num)) return String(value);
    return `${num.toLocaleString('vi-VN')} đ`;
};

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

export const statusText = (status?: string) => {
    switch (status?.toUpperCase()) {
        case 'REGISTERED': return 'Đã đăng ký học';
        case 'CONSULTED': return 'Đang tư vấn';
        case 'CONTACTED': return 'Đã liên hệ';
        case 'CANCELLED': return 'Đã hủy / Không nhu cầu';
        case 'INVITED': return 'Khách mời hội thảo';
        case 'NEW':
        default: return 'Khách hàng mới';
    }
};

export const statusColor = (status?: string) => {
    switch (status?.toUpperCase()) {
        case 'REGISTERED': return 'green';
        case 'CONSULTED': return 'blue';
        case 'CONTACTED': return 'cyan';
        case 'CANCELLED': return 'red';
        case 'INVITED': return 'purple';
        case 'NEW':
        default: return 'orange';
    }
};

export const statusTag = (status?: string) => <Tag color={statusColor(status)}>{statusText(status)}</Tag>;

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

export interface ConsultantData {
    leads: ILead[];
    courses: ICourse[];
    classrooms: IClassroomWithDetails[];
    enrollments: (Omit<IEnrollment, 'student_id'> & { student_id: string | IUserSummary })[];
    users: IUser[];
    roles: IRole[];
}

export const useConsultantData = () => {
    const [data, setData] = useState<ConsultantData>({
        leads: [],
        courses: [],
        classrooms: [],
        enrollments: [],
        users: [],
        roles: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const refresh = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [
                leadResponse,
                courseResponse,
                classroomResponse,
                enrollmentResponse,
                userResponse,
                roleResponse,
            ] = await Promise.all([
                callFetchLeadsForConsultants(),
                callFetchCourse('current=1&pageSize=1000'),
                callFetchClassroom('current=1&pageSize=1000&populate=course_id,teacher_id'),
                callFetchEnrollment('current=1&pageSize=1000&populate=student_id,class_id'),
                callFetchUser('current=1&pageSize=1000'),
                callFetchRole('current=1&pageSize=100'),
            ]);

            setData({
                leads: toArray<ILead>(leadResponse),
                courses: toArray<ICourse>(courseResponse),
                classrooms: toArray<IClassroomWithDetails>(classroomResponse),
                enrollments: toArray<Omit<IEnrollment, 'student_id'> & { student_id: string | IUserSummary }>(enrollmentResponse),
                users: toArray<IUser>(userResponse),
                roles: toArray<IRole>(roleResponse),
            });
        } catch {
            setError('Không thể tải dữ liệu tư vấn tuyển sinh. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { refresh(); }, [refresh]);
    return { ...data, loading, error, refresh };
};

export const useLeadStats = (leads: ILead[]) => useMemo(() => {
    const total = leads.length;
    const newLeads = leads.filter(l => !l.status || ['NEW', 'INVITED'].includes(l.status.toUpperCase())).length;
    const contacted = leads.filter(l => l.status?.toUpperCase() === 'CONTACTED').length;
    const consulted = leads.filter(l => l.status?.toUpperCase() === 'CONSULTED').length;
    const registered = leads.filter(l => l.status?.toUpperCase() === 'REGISTERED').length;
    const conversionRate = total > 0 ? Math.round((registered / total) * 100) : 0;

    return {
        total,
        newLeads,
        contacted,
        consulted,
        registered,
        conversionRate,
    };
}, [leads]);

export const ConsultantState = ({ loading, error, children }: { loading: boolean; error: string; children: ReactNode }) => {
    if (loading) return <div className={styles['portal-loading']}><Spin size="large" /></div>;
    if (error) return <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />;
    return <>{children}</>;
};

export const ConsultantEmpty = ({ description }: { description: string }) => <Card className={styles['portal-card']}><Empty description={description} /></Card>;

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
    accent?: 'teal' | 'coral' | 'navy' | 'green' | string;
}) => (
    <Card className={`${styles['consultant-stat']} ${styles[`stat-${accent}`] || ''}`}>
        <div className={styles['consultant-stat-icon']}>{icon}</div>
        <div>
            <span>{title}</span>
            <strong>{value}</strong>
            {subValue && <small style={{ display: 'block', fontSize: 11, color: '#8c9ba5', marginTop: 3 }}>{subValue}</small>}
        </div>
    </Card>
);

export const LeadIcon = ({ status }: { status?: string }) => {
    switch (status?.toUpperCase()) {
        case 'REGISTERED': return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
        case 'CONSULTED': return <ClockCircleOutlined style={{ color: '#1890ff' }} />;
        case 'CONTACTED': return <PhoneOutlined style={{ color: '#13c2c2' }} />;
        case 'CANCELLED': return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
        default: return <UserAddOutlined style={{ color: '#fa8c16' }} />;
    }
};

/**
 * Helper toàn diện: Chuyển đổi Lead thành Student -> Ghi danh Enrollment -> Tạo Invoice -> Cập nhật Lead thành REGISTERED
 */
export const enrollLeadToClass = async ({
    lead,
    classroom,
    course,
    discountAmount = 0,
    users,
    roles,
    consultantUser,
}: {
    lead: ILead;
    classroom: IClassroomWithDetails;
    course?: ICourse;
    discountAmount?: number;
    users: IUser[];
    roles: IRole[];
    consultantUser: IUser;
}): Promise<{ success: boolean; message: string }> => {
    try {
        const leadEmail = (lead.email || '').trim().toLowerCase();
        let studentUser = users.find(u => (u.email || '').toLowerCase() === leadEmail);

        // 1. Nếu chưa có User học viên trong hệ thống, tự động tạo mới
        if (!studentUser) {
            const studentRole = roles.find(r => (r.name || '').toUpperCase().includes('STUDENT') || (r.name || '').toUpperCase().includes('HOC VIEN'));
            const roleId = studentRole?._id || roles[0]?._id;

            const resUser = await callCreateUser({
                name: lead.full_name || lead.name || 'Học viên mới',
                email: lead.email || `student_${Date.now()}@fpt.edu.vn`,
                password: 'User@123',
                phone: lead.phone || '',
                role: roleId as any,
                age: 20,
                gender: 'OTHER',
                address: 'Việt Nam',
            } as any);

            if (resUser?.data) {
                studentUser = resUser.data;
            } else {
                return { success: false, message: resUser?.message || 'Không thể tạo hồ sơ học viên từ khách hàng' };
            }
        }

        const studentId = studentUser._id;
        const classId = classroom._id;
        if (!studentId || !classId) {
            return { success: false, message: 'Dữ liệu học viên hoặc lớp học không hợp lệ' };
        }

        // 2. Tạo Enrollment
        const resEnroll = await callCreateEnrollment({
            student_id: studentId as any,
            class_id: classId as any,
            status: 'ENROLLED',
        } as any);

        if (!resEnroll?.data?._id) {
            return { success: false, message: resEnroll?.message || 'Không thể ghi danh vào lớp học' };
        }

        const enrollmentId = resEnroll.data._id;
        const tuitionFee = Number(course?.price) || (course as any)?.tuition_fee || 5000000;
        const finalAmount = Math.max(0, tuitionFee - discountAmount);

        // 3. Tự động sinh hóa đơn học phí
        await callCreateInvoice({
            enrollment_id: enrollmentId as any,
            amount: tuitionFee,
            discount_amount: discountAmount,
            final_amount: finalAmount,
            status: 'UNPAID',
        } as any);

        // 4. Cập nhật Lead thành REGISTERED
        if (lead._id) {
            await callUpdateLead(
                {
                    status: 'REGISTERED',
                    note: `${lead.note ? lead.note + ' | ' : ''}Đã ghi danh lớp ${classroom.class_name || classId}`,
                },
                lead._id
            );
        }

        // 5. Gửi Notification xác nhận tuyển sinh thành công
        try {
            await callCreateNotification({
                title: `[FPT Education] Chúc mừng bạn đã đăng ký thành công lớp ${classroom.class_name}`,
                content: `Chào ${lead.full_name || 'bạn'},\n\nBộ phận Tuyển sinh FPT Education xin chúc mừng bạn đã ghi danh thành công khóa học "${course?.name || classroom.class_name}".\n\n- Lớp học: ${classroom.class_name}\n- Phòng học: ${classroom.room || 'Phòng học FPT'}\n- Học phí: ${money(finalAmount)}\n\nVui lòng hoàn tất học phí với phòng Kế toán trước ngày khai giảng. Trân trọng cảm ơn!`,
                receiver_id: studentId as any,
                sender_id: consultantUser._id as any,
                type: 'EMAIL',
                status: 'SENT',
                isRead: false,
            } as any);
        } catch {
            // Không chặn nếu gửi thông báo lỗi
        }

        return {
            success: true,
            message: `Ghi danh thành công khách hàng ${lead.full_name} vào lớp ${classroom.class_name}! Hóa đơn học phí đã được phát hành.`,
        };
    } catch (err: any) {
        return { success: false, message: err?.message || 'Có lỗi xảy ra trong quá trình ghi danh' };
    }
};
