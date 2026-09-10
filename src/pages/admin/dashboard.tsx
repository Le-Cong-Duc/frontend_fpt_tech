import { useAppSelector } from '@/redux/hooks';
import { useLocation } from 'react-router-dom';
import styles from 'styles/dashboard.module.scss';

const adminBars = [38, 31, 65, 74, 26, 48, 56, 28, 39, 29];
const managerBars = [55, 60, 31, 84, 30, 76, 28, 67];

const StatCard = ({ value, label }: { value: string; label: string }) => (
    <div className={styles.statCard}>
        <strong>{value}</strong>
        <span>{label}</span>
    </div>
);

const BarChart = ({ values }: { values: number[] }) => (
    <div className={styles.chart} aria-label="Biểu đồ thống kê">
        {values.map((height, index) => (
            <span key={`${height}-${index}`} style={{ height: `${height}%` }} />
        ))}
    </div>
);

const AdminDashboard = () => (
    <DashboardShell
        title="Dashboard - Quản trị hệ thống"
        subtitle="Tổng quan tình hình hệ thống"
        stats={[
            ['1.248', 'Tổng số user'],
            ['1.190', 'User đang hoạt động'],
            ['342', 'Lượt đăng nhập hôm nay'],
            ['6', 'Role trong hệ thống'],
        ]}
    >
        <div className={styles.splitGrid}>
            <section className={styles.panel}>
                <div className={styles.panelHeading}>
                    <h2>Lượt đăng nhập theo ngày</h2>
                    <button>Xem chi tiết</button>
                </div>
                <BarChart values={adminBars} />
            </section>
            <section className={styles.panel}>
                <div className={styles.panelHeading}><h2>Số user theo role</h2></div>
                <RoleList items={[
                    ['Admin', '3 user'], ['Manager', '5 user'], ['Teacher', '24 user'],
                    ['Student', '312 user'], ['Consultant', '8 user'], ['Accountant', '4 user'],
                ]} />
            </section>
        </div>
        <section className={styles.panel}>
            <div className={styles.panelHeading}>
                <h2>Danh sách tài khoản gần đây</h2>
                <button className={styles.primaryButton}>+ Tạo tài khoản</button>
            </div>
            <div className={styles.table}>
                <div className={styles.tableRow + ' ' + styles.tableHeader}><span>HỌ TÊN</span><span>EMAIL</span><span>ROLE</span><span>TRẠNG THÁI</span><span>THAO TÁC</span></div>
                {[
                    ['Nguyễn Mỹ Duyên', 'ha.nguyen@ttnn.vn', 'Teacher', 'Hoạt động'],
                    ['Phan Khánh Ly', 'khoi.tran@ttnn.vn', 'Student', 'Hoạt động'],
                    ['Lê Công Đức', 'anh.le@ttnn.vn', 'Consultant', 'Đã khóa'],
                ].map(([name, email, role, status]) => (
                    <div className={styles.tableRow} key={email}><span><i />{name}</span><span>{email}</span><span>{role}</span><span><em className={status === 'Đã khóa' ? styles.locked : ''}>{status}</em></span><span>Sửa &nbsp;&nbsp; Khóa</span></div>
                ))}
            </div>
        </section>
    </DashboardShell>
);

const ManagerDashboard = () => (
    <DashboardShell
        title="Dashboard - Quản lý trung tâm"
        subtitle="Khóa học, lớp học, phòng học, học viên, giáo viên"
        stats={[
            ['46', 'Tổng số lớp'], ['812', 'Tổng số học viên'], ['24', 'Tổng số giáo viên'], ['7', 'Lớp sắp khai giảng'],
        ]}
    >
        <div className={styles.splitGrid}>
            <section className={styles.panel}>
                <div className={styles.panelHeading}><h2>Số lớp theo khóa học</h2><button>Xem tất cả</button></div>
                <BarChart values={managerBars} />
            </section>
            <section className={styles.panel}>
                <div className={styles.panelHeading}><h2>Lớp sắp khai giảng</h2></div>
                <RoleList items={[['Anh văn A1.1', '12/8/2026'], ['IELTS 6.5+', '15/8/2026'], ['Giao tiếp CB', '20/8/2026']]} />
            </section>
        </div>
        <section className={styles.panel}>
            <div className={styles.panelHeading}><h2>Danh sách lớp học</h2><button className={styles.primaryButton}>+ Tạo lớp học</button></div>
            <div className={styles.table}>
                <div className={styles.tableRow + ' ' + styles.tableHeader}><span>LỚP</span><span>KHÓA HỌC</span><span>GIÁO VIÊN</span><span>PHÒNG</span><span>SĨ SỐ</span><span>TRẠNG THÁI</span><span>THAO TÁC</span></div>
                {[['SC_1', 'Sơ cấp 1', 'Lê Đức', 'P.201', '18/20'], ['TOPIK I', 'Topik 2', 'Đức Lê', 'P.305', '10/15']].map(row => (
                    <div className={styles.tableRow} key={row[0]}>{row.map((cell, index) => <span key={`${row[0]}-${index}`}>{index === 5 ? <em>Đang học</em> : cell}</span>)}<span>Sửa &nbsp;&nbsp; Đóng lớp</span></div>
                ))}
            </div>
        </section>
    </DashboardShell>
);

const DashboardShell = ({ title, subtitle, stats, children }: { title: string; subtitle: string; stats: string[][]; children: React.ReactNode }) => (
    <main className={styles.dashboard}>
        <header className={styles.heading}><div><h1>{title}</h1><p>{subtitle}</p></div><div className={styles.tools}><input placeholder="Tìm kiếm..." /><button>🔔</button><button>◌</button><b /></div></header>
        <div className={styles.stats}>{stats.map(([value, label]) => <StatCard key={label} value={value} label={label} />)}</div>
        {children}
    </main>
);

const RoleList = ({ items }: { items: string[][] }) => <div className={styles.roleList}>{items.map(([name, value]) => <div key={name}><span>{name}</span><em>{value}</em></div>)}</div>;

const DashboardPage = () => {
    const role = useAppSelector(state => state.account.user.role.name?.toUpperCase());
    const location = useLocation();
    return role === 'MANAGER' || location.pathname.startsWith('/manager') ? <ManagerDashboard /> : <AdminDashboard />;
};

export default DashboardPage;