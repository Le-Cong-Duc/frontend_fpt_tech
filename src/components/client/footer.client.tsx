
import {
    ClockCircleOutlined,
    EnvironmentOutlined,
    GlobalOutlined,
    MailOutlined,
    PhoneOutlined,
    RightOutlined,
    RocketOutlined,
    SafetyCertificateOutlined,
} from '@ant-design/icons';
import { FaFacebookF, FaLinkedinIn, FaTiktok, FaYoutube } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import styles from '@/styles/client.module.scss';

const Footer = () => {
    const scrollTo = (id: string) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <footer className={styles['footer-section']}>
            <div className={styles.container}>
                <div className={styles['footer-grid']}>
                    {/* Column 1: Brand & Slogan */}
                    <div className={styles['footer-col']}>
                        <div className={styles['footer-brand']}>
                            <div className={styles['brand-badge']}>
                                <RocketOutlined />
                            </div>
                            <span className={styles['brand-text']}>FPT LANGUAGE CENTER</span>
                        </div>
                        <p>
                            Hệ thống đào tạo ngoại ngữ tiêu chuẩn quốc tế trực thuộc Tập đoàn Giáo dục FPT. Tiên phong
                            đổi mới phương pháp giảng dạy, ứng dụng công nghệ EdTech 4.0 và cam kết chuẩn đầu ra bằng
                            hợp đồng pháp lý.
                        </p>
                        <div className={styles.accreditations}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#38bdf8' }}>
                                <SafetyCertificateOutlined />
                                <span>Đối tác khảo thí chính thức: IDP IELTS, ETS TOEIC & Japan Foundation</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8' }}>
                                <GlobalOutlined />
                                <span>Giấy phép hoạt động giáo dục số: 1886/QĐ-BGDĐT</span>
                            </div>
                        </div>
                    </div>

                    {/* Column 2: Programs */}
                    <div className={styles['footer-col']}>
                        <h4>CHƯƠNG TRÌNH ĐÀO TẠO</h4>
                        <ul className={styles['footer-links']}>
                            <li>
                                <a href="#courses" onClick={(e) => { e.preventDefault(); scrollTo('courses'); }}>
                                    <RightOutlined style={{ fontSize: 10 }} /> Luyện thi IELTS Quốc Tế (5.0 - 8.5+)
                                </a>
                            </li>
                            <li>
                                <a href="#courses" onClick={(e) => { e.preventDefault(); scrollTo('courses'); }}>
                                    <RightOutlined style={{ fontSize: 10 }} /> Luyện thi TOEIC 4 Kỹ Năng Cấp Tốc
                                </a>
                            </li>
                            <li>
                                <a href="#courses" onClick={(e) => { e.preventDefault(); scrollTo('courses'); }}>
                                    <RightOutlined style={{ fontSize: 10 }} /> Tiếng Anh Giao Tiếp Chuẩn Oxford
                                </a>
                            </li>
                            <li>
                                <a href="#courses" onClick={(e) => { e.preventDefault(); scrollTo('courses'); }}>
                                    <RightOutlined style={{ fontSize: 10 }} /> Tiếng Nhật IT & Luyện Thi JLPT
                                </a>
                            </li>
                            <li>
                                <a href="#courses" onClick={(e) => { e.preventDefault(); scrollTo('courses'); }}>
                                    <RightOutlined style={{ fontSize: 10 }} /> Tiếng Hàn Du Học & Luyện Thi TOPIK
                                </a>
                            </li>
                            <li>
                                <a href="#lead-form" onClick={(e) => { e.preventDefault(); scrollTo('lead-form'); }}>
                                    <RightOutlined style={{ fontSize: 10 }} /> Tiếng Anh Doanh Nghiệp Theo Yêu Cầu
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Column 3: Campuses */}
                    <div className={styles['footer-col']}>
                        <h4>HỆ THỐNG CƠ SỞ TOÀN QUỐC</h4>
                        <div className={styles['campus-list']}>
                            <div className={styles['campus-item']}>
                                <EnvironmentOutlined />
                                <div>
                                    <strong>Hà Nội</strong>
                                    <span>Tòa nhà FPT, Phố Duy Tân, Q. Cầu Giấy, Hà Nội</span>
                                </div>
                            </div>
                            <div className={styles['campus-item']}>
                                <EnvironmentOutlined />
                                <div>
                                    <strong>TP. Hồ Chí Minh</strong>
                                    <span>Lô E2a-7, Đường D1, Khu CNC, TP. Thủ Đức, TP.HCM</span>
                                </div>
                            </div>
                            <div className={styles['campus-item']}>
                                <EnvironmentOutlined />
                                <div>
                                    <strong>Đà Nẵng</strong>
                                    <span>Khu đô thị FPT City, P. Hòa Hải, Q. Ngũ Hành Sơn, Đà Nẵng</span>
                                </div>
                            </div>
                            <div className={styles['campus-item']}>
                                <EnvironmentOutlined />
                                <div>
                                    <strong>Cần Thơ</strong>
                                    <span>Số 600, Nguyễn Văn Cừ (nối dài), P. An Bình, Q. Ninh Kiều</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Column 4: Contact & Support */}
                    <div className={styles['footer-col']}>
                        <h4>KẾT NỐI & TƯ VẤN</h4>
                        <div className={styles['contact-info']}>
                            <div className={styles['contact-row']}>
                                <PhoneOutlined />
                                <span>
                                    Hotline Tuyển sinh: <strong>1900 6600</strong>
                                </span>
                            </div>
                            <div className={styles['contact-row']}>
                                <MailOutlined />
                                <span>Email: tuyensinh@fpt.edu.vn</span>
                            </div>
                            <div className={styles['contact-row']}>
                                <ClockCircleOutlined />
                                <span>Giờ làm việc: 08:00 - 21:30 (T2 - CN)</span>
                            </div>
                        </div>

                        <div style={{ marginTop: 10 }}>
                            <span style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 600, display: 'block', marginBottom: 8 }}>
                                THEO DÕI FPT TRÊN MẠNG XÃ HỘI
                            </span>
                            <div className={styles['social-row']}>
                                <a href="https://facebook.com" target="_blank" rel="noreferrer" title="Facebook">
                                    <FaFacebookF />
                                </a>
                                <a href="https://youtube.com" target="_blank" rel="noreferrer" title="YouTube">
                                    <FaYoutube />
                                </a>
                                <a href="https://tiktok.com" target="_blank" rel="noreferrer" title="TikTok">
                                    <FaTiktok />
                                </a>
                                <a href="https://linkedin.com" target="_blank" rel="noreferrer" title="LinkedIn">
                                    <FaLinkedinIn />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className={styles['footer-bottom']}>
                    <div>
                        Bản quyền © 2026 FPT Language Center - Thành viên Tập đoàn Giáo dục FPT. Tất cả quyền được bảo lưu.
                    </div>
                    <div className={styles['legal-links']}>
                        <a href="#advantages" onClick={(e) => { e.preventDefault(); scrollTo('advantages'); }}>
                            Cam kết chuẩn đầu ra
                        </a>
                        <a href="#faq" onClick={(e) => { e.preventDefault(); scrollTo('faq'); }}>
                            Chính sách bảo mật
                        </a>
                        <a href="#faq" onClick={(e) => { e.preventDefault(); scrollTo('faq'); }}>
                            Quy chế đào tạo
                        </a>
                        <Link to="/login">Cổng quản trị viên</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;