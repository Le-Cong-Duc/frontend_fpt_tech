import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Alert, Card, Empty, Spin, Tag } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { callFetchMyEnrollments, callFetchMyInvoices, callFetchMyPayments } from '@/config/api';
import type { IPortalEnrollment, IPortalInvoice, IPortalPayment } from '@/types/backend';
import styles from '@/styles/client.module.scss';

export interface StudentData { enrollments: IPortalEnrollment[]; invoices: IPortalInvoice[]; payments: IPortalPayment[]; }
const emptyData: StudentData = { enrollments: [], invoices: [], payments: [] };
export const toArray = <T,>(response: unknown): T[] => { const data = (response as { data?: unknown })?.data; if (Array.isArray(data)) return data as T[]; if (data && typeof data === 'object' && Array.isArray((data as { result?: T[] }).result)) return (data as { result: T[] }).result; return []; };
export const money = (value?: number) => `${(value || 0).toLocaleString('vi-VN')} đ`;
export const dateText = (value?: string) => value ? new Date(value).toLocaleDateString('vi-VN') : 'Chưa cập nhật';
export const statusText = (value?: string) => ({ STUDYING: 'Đang học', ACTIVE: 'Đang học', COMPLETED: 'Hoàn thành', CANCELLED: 'Đã hủy', WAITING_PAYMENT: 'Chờ thanh toán', PAID: 'Đã thanh toán', UNPAID: 'Chưa thanh toán', PARTIAL: 'Thanh toán một phần', OVERDUE: 'Quá hạn' }[value?.toUpperCase() || ''] || value || 'Chưa cập nhật');
export const statusColor = (value?: string) => ['STUDYING', 'ACTIVE', 'PAID'].includes(value?.toUpperCase() || '') ? 'green' : ['CANCELLED', 'OVERDUE'].includes(value?.toUpperCase() || '') ? 'red' : 'gold';
export const statusTag = (value?: string) => <Tag color={statusColor(value)}>{statusText(value)}</Tag>;
export const StudentState = ({ loading, error, children }: { loading: boolean; error: string; children: ReactNode }) => loading ? <div className={styles['portal-loading']}><Spin size="large" /></div> : error ? <Alert type="error" showIcon message={error} /> : <>{children}</>;
export const StudentEmpty = ({ description }: { description: string }) => <Card className={styles['portal-card']}><Empty description={description} /></Card>;
export const useStudentData = (scope: 'all' | 'enrollments' | 'invoices' | 'payments' = 'all') => { const [data, setData] = useState<StudentData>(emptyData); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const refresh = useCallback(async () => { setLoading(true); setError(''); try { const [enrollments, invoices, payments] = await Promise.all([scope === 'invoices' || scope === 'payments' ? Promise.resolve(undefined) : callFetchMyEnrollments(), scope === 'enrollments' || scope === 'payments' ? Promise.resolve(undefined) : callFetchMyInvoices(), scope === 'enrollments' || scope === 'invoices' ? Promise.resolve(undefined) : callFetchMyPayments()]); setData(current => ({ ...current, enrollments: enrollments ? toArray<IPortalEnrollment>(enrollments) : scope === 'all' ? [] : current.enrollments, invoices: invoices ? toArray<IPortalInvoice>(invoices) : scope === 'all' ? [] : current.invoices, payments: payments ? toArray<IPortalPayment>(payments) : scope === 'all' ? [] : current.payments })); } catch { setError('Không thể tải dữ liệu. Vui lòng thử lại.'); } finally { setLoading(false); } }, [scope]); useEffect(() => { refresh(); }, [refresh]); return { ...data, loading, error, refresh }; };
export const enrollmentCourse = (item: IPortalEnrollment) => item.class_id?.course_id?.name || 'Khóa học chưa cập nhật';
export const invoiceCourse = (item: IPortalInvoice) => item.enrollment_id?.class_id?.course_id?.name || 'Khóa học chưa cập nhật';
export const PaymentStatusIcon = ({ status }: { status?: string }) => status?.toUpperCase() === 'PAID' ? <CheckCircleOutlined /> : status?.toUpperCase() === 'CANCELLED' ? <CloseCircleOutlined /> : <ClockCircleOutlined />;
