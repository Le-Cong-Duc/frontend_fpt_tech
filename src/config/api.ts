import axios from 'config/axios-customize';
import type {
    IAccount,
    IBackendRes,
    IClassroom,
    IConversation,
    ICourse,
    IEnrollment,
    IInvoice,
    IGetAccount,
    ILead,
    IMessage,
    IModelPaginate,
    INotification,
    IPayment,
    IPermission,
    IRole,
    IUser,
} from '@/types/backend';

const API_PREFIX = '/api/v1';

type Resource = IClassroom | IConversation | ICourse | IEnrollment | IInvoice | ILead | IMessage | INotification | IPayment | IPermission | IRole | IUser;

const list = <T>(resource: string, query = '') => axios.get<IBackendRes<IModelPaginate<T>>>(`${API_PREFIX}/${resource}${query ? `?${query}` : ''}`);
const findById = <T>(resource: string, id: string) => axios.get<IBackendRes<T>>(`${API_PREFIX}/${resource}/${id}`);
const create = <T extends Resource>(resource: string, payload: Omit<T, '_id'>) => axios.post<IBackendRes<T>>(`${API_PREFIX}/${resource}`, payload);
const update = <T extends Resource>(resource: string, id: string, payload: Partial<T>) => axios.patch<IBackendRes<T>>(`${API_PREFIX}/${resource}/${id}`, payload);
const remove = <T extends Resource>(resource: string, id: string) => axios.delete<IBackendRes<T>>(`${API_PREFIX}/${resource}/${id}`);

export const callRegister = (name: string, email: string, password: string, age: number, gender: string, address: string) => axios.post<IBackendRes<IUser>>(`${API_PREFIX}/auth/register`, { name, email, password, age, gender, address });
export const callLogin = (username: string, password: string) => axios.post<IBackendRes<IAccount>>(`${API_PREFIX}/auth/login`, { username, password });
export const callFetchAccount = () => axios.get<IBackendRes<IGetAccount>>(`${API_PREFIX}/auth/account`);
export const callRefreshToken = () => axios.get<IBackendRes<IAccount>>(`${API_PREFIX}/auth/refresh`);
export const callLogout = () => axios.post<IBackendRes<string>>(`${API_PREFIX}/auth/logout`);

export const callCreateCourse = (value: Omit<ICourse, '_id'>) => create<ICourse>('courses', value);
export const callUpdateCourse = (value: Partial<ICourse>, id: string) => update<ICourse>('courses', id, value);
export const callDeleteCourse = (id: string) => remove<ICourse>('courses', id);
export const callFetchCourse = (query = '') => list<ICourse>('courses', query);
export const callFetchCourseById = (id: string) => findById<ICourse>('courses', id);

export const callCreateClassroom = (value: Omit<IClassroom, '_id'>) => create<IClassroom>('classrooms', value);
export const callUpdateClassroom = (value: Partial<IClassroom>, id: string) => update<IClassroom>('classrooms', id, value);
export const callDeleteClassroom = (id: string) => remove<IClassroom>('classrooms', id);
export const callFetchClassroom = (query = '') => list<IClassroom>('classrooms', query);
export const callFetchClassroomById = (id: string) => findById<IClassroom>('classrooms', id);

export const callCreateEnrollment = (value: Omit<IEnrollment, '_id'>) => create<IEnrollment>('enrollments', value);
export const callUpdateEnrollment = (value: Partial<IEnrollment>, id: string) => update<IEnrollment>('enrollments', id, value);
export const callDeleteEnrollment = (id: string) => remove<IEnrollment>('enrollments', id);
export const callFetchEnrollment = (query = '') => list<IEnrollment>('enrollments', query);
export const callFetchEnrollmentById = (id: string) => findById<IEnrollment>('enrollments', id);

export const callCreateInvoice = (value: Omit<IInvoice, '_id'>) => create<IInvoice>('invoices', value);
export const callUpdateInvoice = (value: Partial<IInvoice>, id: string) => update<IInvoice>('invoices', id, value);
export const callDeleteInvoice = (id: string) => remove<IInvoice>('invoices', id);
export const callFetchInvoice = (query = '') => list<IInvoice>('invoices', query);
export const callFetchInvoiceById = (id: string) => findById<IInvoice>('invoices', id);

export const callCreatePayment = (value: Omit<IPayment, '_id'>) => create<IPayment>('payments', value);
export const callUpdatePayment = (value: Partial<IPayment>, id: string) => update<IPayment>('payments', id, value);
export const callDeletePayment = (id: string) => remove<IPayment>('payments', id);
export const callFetchPayment = (query = '') => list<IPayment>('payments', query);
export const callFetchPaymentById = (id: string) => findById<IPayment>('payments', id);

export const callCreateLead = (value: Omit<ILead, '_id'>) => create<ILead>('leads', value);
export const callUpdateLead = (value: Partial<ILead>, id: string) => update<ILead>('leads', id, value);
export const callDeleteLead = (id: string) => remove<ILead>('leads', id);
export const callFetchLead = (query = '') => list<ILead>('leads', query);
export const callFetchLeadById = (id: string) => findById<ILead>('leads', id);

export const callCreateUser = (value: Omit<IUser, '_id'>) => create<IUser>('users', value);
export const callUpdateUser = (value: Partial<IUser>, id: string) => update<IUser>('users', id, value);
export const callDeleteUser = (id: string) => remove<IUser>('users', id);
export const callFetchUser = (query = '') => list<IUser>('users', query);
export const callFetchUserById = (id: string) => findById<IUser>('users', id);

export const callCreateRole = (value: Omit<IRole, '_id'>) => create<IRole>('roles', value);
export const callUpdateRole = (value: Partial<IRole>, id: string) => update<IRole>('roles', id, value);
export const callDeleteRole = (id: string) => remove<IRole>('roles', id);
export const callFetchRole = (query = '') => list<IRole>('roles', query);
export const callFetchRoleById = (id: string) => findById<IRole>('roles', id);

export const callCreatePermission = (value: Omit<IPermission, '_id'>) => create<IPermission>('permissions', value);
export const callUpdatePermission = (value: Partial<IPermission>, id: string) => update<IPermission>('permissions', id, value);
export const callDeletePermission = (id: string) => remove<IPermission>('permissions', id);
export const callFetchPermission = (query = '') => list<IPermission>('permissions', query);
export const callFetchPermissionById = (id: string) => findById<IPermission>('permissions', id);

export const callCreateConversation = (value: Omit<IConversation, '_id'>) => create<IConversation>('conversations', value);
export const callUpdateConversation = (value: Partial<IConversation>, id: string) => update<IConversation>('conversations', id, value);
export const callDeleteConversation = (id: string) => remove<IConversation>('conversations', id);
export const callFetchConversation = (query = '') => list<IConversation>('conversations', query);
export const callFetchConversationById = (id: string) => findById<IConversation>('conversations', id);

export const callCreateMessage = (value: Omit<IMessage, '_id'>) => create<IMessage>('messages', value);
export const callUpdateMessage = (value: Partial<IMessage>, id: string) => update<IMessage>('messages', id, value);
export const callDeleteMessage = (id: string) => remove<IMessage>('messages', id);
export const callFetchMessage = (query = '') => list<IMessage>('messages', query);
export const callFetchMessageById = (id: string) => findById<IMessage>('messages', id);

export const callCreateNotification = (value: Omit<INotification, '_id'>) => create<INotification>('notifications', value);
export const callUpdateNotification = (value: Partial<INotification>, id: string) => update<INotification>('notifications', id, value);
export const callDeleteNotification = (id: string) => remove<INotification>('notifications', id);
export const callFetchNotification = (query = '') => list<INotification>('notifications', query);
export const callFetchNotificationById = (id: string) => findById<INotification>('notifications', id);

export const callUploadSingleFile = async (_file: File, _folderType: string): Promise<IBackendRes<{ fileName: string }>> => {
    throw new Error('File upload is not supported by the current backend contract.');
};
