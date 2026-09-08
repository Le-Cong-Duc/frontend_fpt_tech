import { useMemo, useState } from 'react';
import { BellOutlined, MessageOutlined, PlusOutlined } from '@ant-design/icons';
import styles from '@/styles/dashboard.module.scss';

const stats = [
    { value: '1.248', label: 'Tổng số user' },
    { value: '1.190', label: 'User đang hoạt động' },
    { value: '342', label: 'Lượt đăng nhập hôm nay' },
    { value: '6', label: 'Role trong hệ thống' },
];

const roles = [
    ['Admin', '3 user'],
    ['Manager', '5 user'],
    ['Teacher', '24 user'],
    ['Student', '312 user'],
    ['Consultant', '8 user'],
    ['Accountant', '4 user'],
];

const recentUsers = [
    { name: 'Nguyễn Mỹ Duyên', email: 'ha.nguyen@ttnn.vn', role: 'Teacher', status: 'Hoạt động' },
    { name: 'Phan Khánh Ly', email: 'khoi.tran@ttnn.vn', role: 'Student', status: 'Hoạt động' },
    { name: 'Lê Công Đức', email: 'anh.le@ttnn.vn', role: 'Consultant', status: 'Đã khóa' },
];

const chartSets = [
    [42, 31, 72, 82, 24, 50, 59, 27, 42, 24],
    [28, 44, 38, 68, 48, 79, 35, 57, 49, 88],
];

const DashboardPage = () => {
    const [chartMode, setChartMode] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const filteredUsers = useMemo(() => {
        const keyword = searchTerm.toLowerCase().trim();
        return recentUsers.filter(user =>
            [user.name, user.email, user.role].some(value => value.toLowerCase().includes(keyword))
        );
    }, [searchTerm]);

    return (
        <main className={styles.dashboard}>
            <header className={styles.header}>
                <div className={styles.heading}>
                    <h1>Dashboard - Quản trị hệ thống</h1>
                    <p>Tổng quan toàn hệ thống</p>
                </div>
                <div className={styles.headerActions}>
                    <input
                        className={styles.search}
                        value={searchTerm}
                        onChange={event => setSearchTerm(event.target.value)}
                        placeholder="Tìm kiếm..."
                        aria-label="Tìm kiếm tài khoản"
                    />
                    <button className={styles.iconButton} type="button" aria-label="Thông báo">
                        <BellOutlined />
                    </button>
                    <button className={styles.iconButton} type="button" aria-label="Tin nhắn">
                        <MessageOutlined />
                    </button>
                    <span className={styles.avatar} aria-label="Tài khoản admin">AD</span>
                </div>
            </header>

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
                        <h2 className={styles.panelTitle}>Lượt đăng nhập theo ngày</h2>
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
                        {roles.map(([name, count]) => (
                            <div className={styles.roleRow} key={name}>
                                <span>{name}</span>
                                <span className={styles.roleCount}>{count}</span>
                            </div>
                        ))}
                    </div>
                </article>
            </section>

            <section className={`${styles.panel} ${styles.recentPanel}`}>
                <div className={styles.panelHeader}>
                    <h2 className={styles.panelTitle}>Danh sách tài khoản gần đây</h2>
                    <button className={styles.addButton} type="button">
                        <PlusOutlined /> Tạo tài khoản
                    </button>
                </div>
                {filteredUsers.length ? (
                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead>
                                <tr><th>Họ tên</th><th>Email</th><th>Role</th><th>Trạng thái</th><th>Thao tác</th></tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map(user => (
                                    <tr key={user.email}>
                                        <td><div className={styles.person}><span className={styles.personAvatar}>{user.name.charAt(0)}</span>{user.name}</div></td>
                                        <td>{user.email}</td>
                                        <td>{user.role}</td>
                                        <td><span className={`${styles.status} ${user.status === 'Đã khóa' ? styles.statusLocked : ''}`}>{user.status}</span></td>
                                        <td><div className={styles.actions}><button className={styles.actionButton} type="button">Sửa</button><button className={`${styles.actionButton} ${user.status === 'Đã khóa' ? styles.primary : ''}`} type="button">{user.status === 'Đã khóa' ? 'Mở' : 'Khóa'}</button></div></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : <div className={styles.empty}>Không tìm thấy tài khoản phù hợp.</div>}
            </section>
        </main>
    )
}

export default DashboardPage;