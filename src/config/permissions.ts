const resourcePermissions = (resource: string, module: string) => ({
    GET_PAGINATE: { method: 'GET', path: `/api/v1/${resource}`, module },
    GET_BY_ID: { method: 'GET', path: `/api/v1/${resource}/:id`, module },
    CREATE: { method: 'POST', path: `/api/v1/${resource}`, module },
    UPDATE: { method: 'PATCH', path: `/api/v1/${resource}/:id`, module },
    DELETE: { method: 'DELETE', path: `/api/v1/${resource}/:id`, module },
});

export const ALL_PERMISSIONS = {
    USERS: resourcePermissions('users', 'USERS'),
    ROLES: resourcePermissions('roles', 'ROLES'),
    PERMISSIONS: resourcePermissions('permissions', 'PERMISSIONS'),
    COURSES: resourcePermissions('courses', 'COURSES'),
    CLASSROOMS: resourcePermissions('classrooms', 'CLASSROOMS'),
    ENROLLMENTS: resourcePermissions('enrollments', 'ENROLLMENTS'),
    INVOICES: resourcePermissions('invoices', 'INVOICES'),
    PAYMENTS: resourcePermissions('payments', 'PAYMENTS'),
    LEADS: resourcePermissions('leads', 'LEADS'),
    CONVERSATIONS: resourcePermissions('conversations', 'CONVERSATIONS'),
    MESSAGES: resourcePermissions('messages', 'MESSAGES'),
    NOTIFICATIONS: resourcePermissions('notifications', 'NOTIFICATIONS'),
};

export const ALL_MODULES = {
    AUTH: 'AUTH',
    USERS: 'USERS',
    ROLES: 'ROLES',
    PERMISSIONS: 'PERMISSIONS',
    COURSES: 'COURSES',
    CLASSROOMS: 'CLASSROOMS',
    ENROLLMENTS: 'ENROLLMENTS',
    INVOICES: 'INVOICES',
    PAYMENTS: 'PAYMENTS',
    LEADS: 'LEADS',
    CONVERSATIONS: 'CONVERSATIONS',
    MESSAGES: 'MESSAGES',
    NOTIFICATIONS: 'NOTIFICATIONS',
};
