import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Alert, Card, Empty, Spin, Tag } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { callFetchClassroom, callFetchCourse, callFetchEnrollment, callFetchUser } from '@/config/api';
import type { IClassroomWithDetails, ICourse, IEnrollment, IUser, IUserSummary } from '@/types/backend';
import styles from '@/styles/client.module.scss';

export interface ManagerEnrollment extends Omit<IEnrollment, 'student_id' | 'class_id'> { student_id: string | IUserSummary; class_id: string | IClassroomWithDetails; }
export interface ManagerData { classrooms: IClassroomWithDetails[]; courses: ICourse[]; users: IUser[]; enrollments: ManagerEnrollment[]; }
const initialData: ManagerData = { classrooms: [], courses: [], users: [], enrollments: [] };
export const toArray = <T,>(response: unknown): T[] => { const data = (response as { data?: unknown })?.data; if (Array.isArray(data)) return data as T[]; if (data && typeof data === 'object' && Array.isArray((data as { result?: T[] }).result)) return (data as { result: T[] }).result; return []; };
export const idOf = (value?: string | { _id?: string }) => typeof value === 'string' ? value : value?._id || '';
export const money = (value?: string | number) => value === undefined || value === '' ? 'Chưa cập nhật' : `${Number(value).toLocaleString('vi-VN')} đ`;
export const dateText = (value?: string) => value ? new Date(value).toLocaleDateString('vi-VN') : 'Chưa cập nhật';
export const roleName = (user: IUser) => user.role?.name?.toUpperCase() || '';
export const statusText = (status?: string) => ({ OPEN: 'Đang mở', ACTIVE: 'Đang hoạt động', COMPLETED: 'Đã hoàn thành', CANCELLED: 'Đã hủy', CLOSED: 'Đã đóng', STUDYING: 'Đang học', WAITING_PAYMENT: 'Chờ thanh toán' }[status?.toUpperCase() || ''] || status || 'Chưa cập nhật');
export const statusColor = (status?: string) => ['OPEN', 'ACTIVE', 'STUDYING'].includes(status?.toUpperCase() || '') ? 'green' : ['CANCELLED', 'CLOSED'].includes(status?.toUpperCase() || '') ? 'red' : 'gold';
export const statusTag = (status?: string) => <Tag color={statusColor(status)}>{statusText(status)}</Tag>;
export const ManagerState = ({ loading, error, children }: { loading: boolean; error: string; children: ReactNode }) => loading ? <div className={styles['portal-loading']}><Spin size="large" /></div> : error ? <Alert type="error" showIcon message={error} /> : <>{children}</>;
export const ManagerEmpty = ({ description }: { description: string }) => <Card className={styles['portal-card']}><Empty description={description} /></Card>;
export const useManagerData = () => { const [data, setData] = useState<ManagerData>(initialData); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const refresh = useCallback(async () => { setLoading(true); setError(''); try { const [classroom, course, user, enrollment] = await Promise.all([callFetchClassroom('current=1&pageSize=1000&populate=course_id,teacher_id'), callFetchCourse('current=1&pageSize=1000'), callFetchUser('current=1&pageSize=1000'), callFetchEnrollment('current=1&pageSize=1000&populate=student_id,class_id')]); setData({ classrooms: toArray<IClassroomWithDetails>(classroom), courses: toArray<ICourse>(course), users: toArray<IUser>(user), enrollments: toArray<ManagerEnrollment>(enrollment) }); } catch { setError('Không thể tải dữ liệu quản lý.'); } finally { setLoading(false); } }, []); useEffect(() => { refresh(); }, [refresh]); return { ...data, loading, error, refresh }; };
export const teachersOf = (users: IUser[]) => users.filter(user => roleName(user).includes('TEACHER') || roleName(user).includes('GIANG VIEN'));
export const studentsOf = (users: IUser[]) => users.filter(user => roleName(user).includes('STUDENT') || roleName(user).includes('HOC VIEN'));
export const enrollmentsForClass = (classroomId: string, enrollments: ManagerEnrollment[]) => enrollments.filter(enrollment => idOf(enrollment.class_id) === classroomId);
export const classNameOf = (value: string | IClassroomWithDetails | undefined) => typeof value === 'string' ? value : value?.class_name || 'Chưa cập nhật';
export const StatusIcon = ({ status }: { status?: string }) => status?.toUpperCase() === 'OPEN' ? <CheckCircleOutlined /> : status?.toUpperCase() === 'CANCELLED' ? <CloseCircleOutlined /> : <ClockCircleOutlined />;
export const useFiltered = <T,>(values: T[], predicate: (value: T) => boolean) => useMemo(() => values.filter(predicate), [values, predicate]);
