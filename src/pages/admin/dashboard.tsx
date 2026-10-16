import { useEffect, useMemo, useState } from 'react';
import { BellOutlined, MessageOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import { callFetchClassroom, callFetchCourse, callFetchRole, callFetchUser } from '@/config/api';
import type { IClassroom, ICourse, IRole, IUser } from '@/types/backend';
import styles from '@/styles/dashboard.module.scss';

const chartSets = [
    [42, 31, 72, 82, 24, 50, 59, 27, 42, 24],
    [28, 44, 38, 68, 48, 79, 35, 57, 49, 88],
];

const DashboardPage = () => {
    const navigate = useNavigate();
    const [chartMode, setChartMode] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    const [users, setUsers] = useState<IUser[]>([]);
    const [roles, setRoles] = useState<IRole[]>([]);
    const [courses, setCourses] = useState<ICourse[]>([]);
    const [classrooms, setClassrooms] = useState<IClassroom[]>([]);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const [usersRes, rolesRes, coursesRes, classroomsRes] = await Promise.all([
                callFetchUser('pageSize=1000&sort=-createdAt'),
                callFetchRole('pageSize=100'),
                callFetchCourse('pageSize=1000'),
                callFetchClassroom('pageSize=1000'),
            ]);

            setUsers(usersRes.data?.result ?? []);
            setRoles(rolesRes.data?.result ?? []);
            setCourses(coursesRes.data?.result ?? []);
            setClassrooms(classroomsRes.data?.result ?? []);
        } catch {
            // handle error silently
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboardData();
    }, []);

    const stats = useMemo(() => {
        const totalUsers = users.length;
        const totalCourses = courses.length;
        const totalClassrooms = classrooms.length;
        const totalRoles = roles.length;

        return [
            { value: String(totalUsers), label: 'Tổng số user' },
            { value: String(totalCourses), label: 'Khóa học đang có' },
            { value: String(totalClassrooms), label: 'Lớp học đã mở' },
            { value: String(totalRoles), label: 'Role trong hệ thống' },
        ];
    }, [users, courses, classrooms, roles]);

    const roleBreakdown = useMemo(() => {
        const roleMap: Record<string, number> = {};
        roles.forEach(r => { roleMap[r.name] = 0; });

        users.forEach(u => {
            const rName = typeof u.role === 'object' ? u.role?.name : undefined;
            if (rName) {
                roleMap[rName] = (roleMap[rName] || 0) + 1;
            } else {
                roleMap['Khác'] = (roleMap['Khác'] || 0) + 1;
            }
        });

        return Object.entries(roleMap).map(([name, count]) => [name, `${count} user`]);
    }, [users, roles]);

    const filteredUsers = useMemo(() => {
        const keyword = searchTerm.toLowerCase().trim();
        const displayList = users.slice(0, 15);
        if (!keyword) return displayList;
        return users.filter(user =>
            [user.name, user.email, typeof user.role === 'object' ? user.role?.name : '']
                .some(value => value?.toLowerCase().includes(keyword))
        );
    }, [users, searchTerm]);

    return (
        <main className={styles.dashboard}>
            <header className={styles.header}>
                <div className={styles.heading}>
                    <h1>Dashboard - Quản trị hệ thống</h1>
                    <p>Tổng quan toàn hệ thống học vụ và tài khoản FPT Tech</p>
                </div>
                <div className={styles.headerActions}>
                    <input
                        className={styles.search}
                        value={searchTerm}
                        onChange={event => setSearchTerm(event.target.value)}
                        placeholder="Tìm kiếm tài khoản..."
                        aria-label="Tìm kiếm tài khoản"
                    />
                    <button className={styles.iconButton} type="button" onClick={loadDashboardData} title="Làm mới">
                        <ReloadOutlined />
                    </button>
                    <button className={styles.iconButton} type="button" aria-label="Thông báo">
                        <BellOutlined />
                    </button>
                    <button className={styles.iconButton} type="button" aria-label="Tin nhắn">
                        <MessageOutlined />
                    </button>
                    <span className={styles.avatar} aria-label="Tài khoản admin">AD</span>
                </div>
            </header>

            <Spin spinning={loading}>
                <section className={styles.stats} aria-label="Tổng quan">
                    {stats.map(stat => (
                        <article className={styles.statCard} key={stat.label}>
                            <div className={styles.statValue}>{stat.value}</div>
                            <div className={styles.statLabel}>{stat.label}</div>
                        </article>
                    ))}
                </section>

                <section className={styles.mainGrid}>
                    <article className={styles.panel}>
                        <div className={styles.panelHeader}>
                            <h2 className={styles.panelTitle}>Lượt đăng ký / hoạt động gần đây</h2>
                            <button
                                className={styles.detailButton}
                                type="button"
                                onClick={() => setChartMode(current => current === 0 ? 1 : 0)}
                            >
                                {chartMode === 0 ? 'Xem chi tiết' : 'Tuần trước'}
                            </button>
                        </div>
                        <div className={styles.chartArea} aria-label="Biểu đồ lượt đăng nhập">
                            {chartSets[chartMode].map((height, index) => (
                                <div className={styles.barWrap} key={`${chartMode}-${index}`}>
                                    <div className={styles.bar} style={{ height: `${height}%` }} />
                                </div>
                            ))}
                        </div>
                    </article>

                    <article className={styles.panel}>
                        <div className={styles.panelHeader}>
                            <h2 className={styles.panelTitle}>Số user theo role</h2>
                        </div>
                        <div className={styles.roleList}>
                            {roleBreakdown.length ? roleBreakdown.map(([name, count]) => (
                                <div className={styles.roleRow} key={name}>
                                    <span>{name}</span>
                                    <span className={styles.roleCount}>{count}</span>
                                </div>
                            )) : (
                                <div className={styles.empty}>Chưa có thông tin vai trò.</div>
                            )}
                        </div>
                    </article>
                </section>

                <section className={`${styles.panel} ${styles.recentPanel}`}>
                    <div className={styles.panelHeader}>
                        <h2 className={styles.panelTitle}>Danh sách tài khoản hệ thống</h2>
                        <button className={styles.addButton} type="button" onClick={() => navigate('/admin/users')}>
                            <PlusOutlined /> Quản lý tài khoản
                        </button>
                    </div>
                    {filteredUsers.length ? (
                        <div className={styles.tableWrap}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Họ tên</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Địa chỉ</th>
                                        <th>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map(user => (
                                        <tr key={user._id || user.email}>
                                            <td>
                                                <div className={styles.person}>
                                                    <span className={styles.personAvatar}>
                                                        {(user.name || 'U').charAt(0).toUpperCase()}
                                                    </span>
                                                    {user.name || 'Chưa đặt tên'}
                                                </div>
                                            </td>
                                            <td>{user.email}</td>
                                            <td>{typeof user.role === 'object' ? user.role?.name : 'User'}</td>
                                            <td>{user.address || 'Việt Nam'}</td>
                                            <td>
                                                <div className={styles.actions}>
                                                    <button
                                                        className={styles.actionButton}
                                                        type="button"
                                                        onClick={() => navigate('/admin/users')}
                                                    >
                                                        Xem
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className={styles.empty}>Không tìm thấy tài khoản phù hợp.</div>
                    )}
                </section>
            </Spin>
        </main>
    );
};

export default DashboardPage;