import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BookOutlined,
    CheckCircleFilled,
    ClockCircleOutlined,
    CustomerServiceOutlined,
    DollarOutlined,
    FireOutlined,
    GiftOutlined,
    GlobalOutlined,
    PhoneOutlined,
    RightOutlined,
    RocketOutlined,
    SafetyCertificateOutlined,
    SearchOutlined,
    StarFilled,
    TeamOutlined,
    TrophyOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { Collapse, Empty, Modal, Spin, message } from 'antd';
import { callCreateLead, callFetchCourse } from '@/config/api';
import type { ICourse } from '@/types/backend';
import styles from '@/styles/client.module.scss';

// Fallback high-impact curated courses for immediate display
const FEATURED_COURSES: ICourse[] = [
    {
        _id: 'sample-ielts-master',
        name: 'IELTS Intensive Breakthrough (Cam Kết 7.0+)',
        description: 'Luyện thi cấp tốc 4 kỹ năng chuẩn đề thi thật Cambridge 2026. Chấm chữa Speaking & Writing 1-1 không giới hạn cùng cựu giám khảo khảo thí.',
        level: 'Band 5.5 - 7.5+',
        duration: '16 tuần (48 buổi)',
        price: 8500000,
        status: 'Đang tuyển sinh',
    },
    {
        _id: 'sample-toeic-pro',
        name: 'TOEIC 4 Kỹ Năng Đột Phá (Mục Tiêu 850+)',
        description: 'Chiến thuật giải đề nghe - đọc siêu tốc kết hợp thực hành giao tiếp phỏng vấn văn phòng chuẩn quốc tế, phù hợp sinh viên và người đi làm.',
        level: 'Mọi trình độ',
        duration: '10 tuần (30 buổi)',
        price: 4900000,
        status: 'Sắp khai giảng',
    },
    {
        _id: 'sample-business-english',
        name: 'Tiếng Anh Giao Tiếp Phản Xạ & Thương Mại Quốc Tế',
        description: 'Tự tin thuyết trình, đàm phán, viết email chuyên nghiệp với 100% Giảng viên bản xứ Mỹ/Anh. Môi trường thực hành chuẩn doanh nghiệp toàn cầu.',
        level: 'Cơ bản - Nâng cao',
        duration: '12 tuần (36 buổi)',
        price: 5600000,
        status: 'Đang tuyển sinh',
    },
    {
        _id: 'sample-japanese-it',
        name: 'Tiếng Nhật IT & Luyện Thi JLPT N3 - N2 Cấp Tốc',
        description: 'Chương trình độc quyền FPT: Luyện thi chứng chỉ JLPT kết hợp thuật ngữ IT thực chiến, mở lối trở thành Kỹ sư Cầu nối BrSE thu nhập ngàn đô.',
        level: 'N4 lên N2',
        duration: '24 tuần (72 buổi)',
        price: 9200000,
        status: 'Đang tuyển sinh',
    },
    {
        _id: 'sample-korean-topik',
        name: 'Tiếng Hàn Du Học & Chinh Phục TOPIK II (Level 3-4)',
        description: 'Phát âm chuẩn Seoul, rèn phản xạ giao tiếp đời sống và luyện đề thi TOPIK trọng điểm phục vụ du học, làm việc tại tập đoàn Hàn Quốc.',
        level: 'Sơ cấp - Trung cấp',
        duration: '14 tuần (42 buổi)',
        price: 5200000,
        status: 'Sắp khai giảng',
    },
    {
        _id: 'sample-cambridge-teen',
        name: 'Tiếng Anh Học Thuật Cambridge (FCE / CAE)',
        description: 'Xây dựng tư duy phản biện bằng tiếng Anh, phát triển toàn diện 4 kỹ năng học thuật chuẩn bị hành trang săn học bổng du học quốc tế.',
        level: 'B1 - C1',
        duration: '18 tuần (54 buổi)',
        price: 7800000,
        status: 'Đang tuyển sinh',
    },
];

const CourseCard = () => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState<ICourse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('ALL');

    // Lead Form State
    const [leadForm, setLeadForm] = useState({
        full_name: '',
        phone: '',
        email: '',
        course_name: 'IELTS Intensive Breakthrough (Cam Kết 7.0+)',
        note: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await callFetchCourse('pageSize=50');
                const responseData = response.data as unknown as {
                    result?: ICourse[];
                    data?: { result?: ICourse[] };
                };
                const result = responseData?.result ?? responseData?.data?.result;

                if (Array.isArray(result) && result.length > 0) {
                    setCourses(result);
                } else {
                    setCourses(FEATURED_COURSES);
                }
            } catch {
                setCourses(FEATURED_COURSES);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCourses();
    }, []);

    // Filter courses by category and search keyword
    const filteredCourses = useMemo(() => {
        let list = courses.length > 0 ? courses : FEATURED_COURSES;

        if (activeCategory === 'IELTS') {
            list = list.filter(c => c.name.toLowerCase().includes('ielts') || c.description?.toLowerCase().includes('ielts'));
        } else if (activeCategory === 'TOEIC') {
            list = list.filter(c => c.name.toLowerCase().includes('toeic') || c.description?.toLowerCase().includes('toeic'));
        } else if (activeCategory === 'COMMUNICATION') {
            list = list.filter(c => c.name.toLowerCase().includes('giao tiếp') || c.name.toLowerCase().includes('thương mại') || c.description?.toLowerCase().includes('giao tiếp'));
        } else if (activeCategory === 'JAPANESE') {
            list = list.filter(c => c.name.toLowerCase().includes('nhật') || c.name.toLowerCase().includes('jlpt') || c.description?.toLowerCase().includes('nhật'));
        } else if (activeCategory === 'KOREAN') {
            list = list.filter(c => c.name.toLowerCase().includes('hàn') || c.name.toLowerCase().includes('topik') || c.description?.toLowerCase().includes('hàn'));
        }

        const keyword = searchTerm.trim().toLowerCase();
        if (!keyword) return list;

        return list.filter(course =>
            [course.name, course.description, course.level, course.status]
                .some(value => value?.toLowerCase().includes(keyword))
        );
    }, [courses, activeCategory, searchTerm]);

    const formatPrice = (price?: string | number) => {
        if (price === undefined || price === '') return 'Liên hệ tư vấn';
        const numericPrice = Number(price);
        return Number.isNaN(numericPrice)
            ? String(price)
            : `${numericPrice.toLocaleString('vi-VN')} đ`;
    };

    const getOriginalPrice = (price?: string | number) => {
        const num = Number(price);
        if (Number.isNaN(num) || !num) return '';
        const original = Math.round(num * 1.3);
        return `${original.toLocaleString('vi-VN')} đ`;
    };

    const handleSelectCourseForLead = (courseName: string) => {
        setLeadForm(prev => ({ ...prev, course_name: courseName }));
        const el = document.getElementById('lead-form');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSubmitLead = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!leadForm.full_name.trim()) {
            message.warning('Vui lòng nhập họ và tên của bạn.');
            return;
        }
        if (!leadForm.phone.trim()) {
            message.warning('Vui lòng nhập số điện thoại để chuyên viên tư vấn liên hệ.');
            return;
        }

        setIsSubmitting(true);
        try {
            await callCreateLead({
                full_name: leadForm.full_name.trim(),
                phone: leadForm.phone.trim(),
                email: leadForm.email.trim() || 'hocvien@fpt.edu.vn',
                course_name: leadForm.course_name,
                note: leadForm.note.trim() || 'Đăng ký tư vấn lộ trình & nhận học bổng 30% tại trang chủ',
            });
            setIsSuccessModalOpen(true);
            setLeadForm({
                full_name: '',
                phone: '',
                email: '',
                course_name: 'IELTS Intensive Breakthrough (Cam Kết 7.0+)',
                note: '',
            });
        } catch {
            message.error('Hệ thống đang bảo trì gửi thông tin. Vui lòng gọi trực tiếp hotline 1900 6600 để được hỗ trợ ngay!');
        } finally {
            setIsSubmitting(false);
        }
    };

    const scrollTo = (id: string) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className={styles['landing-wrapper']}>
            {/* 1. HERO SECTION */}
            <section className={styles['landing-hero']} id="hero">
                <div className={styles.container}>
                    <div className={styles['hero-grid']}>
                        {/* Hero Left Content */}
                        <div className={styles['hero-content']}>
                            <div className={styles['hero-badge']}>
                                <TrophyOutlined /> HỆ THỐNG ĐÀO TẠO NGOẠI NGỮ CHUẨN QUỐC TẾ - FPT EDUCATION
                            </div>
                            <h1 className={styles['hero-title']}>
                                Chinh Phục Ngoại Ngữ Chuẩn Quốc Tế <br />
                                <span className={styles['highlight-gradient']}>Bứt Phá Tương Lai Cùng FPT</span>
                            </h1>
                            <p className={styles['hero-desc']}>
                                Đào tạo thực chiến 4 kỹ năng cùng 100% Giảng viên bản xứ & Chuyên gia khảo thí IELTS 8.5+,
                                TOEIC 950+, JLPT N1. Cam kết đầu ra bằng hợp đồng pháp lý, học lại MIỄN PHÍ nếu không đạt chuẩn.
                            </p>

                            <div className={styles['hero-highlights']}>
                                <div className={styles['highlight-item']}>
                                    <CheckCircleFilled />
                                    <span>Cam kết chuẩn đầu ra bằng hợp đồng</span>
                                </div>
                                <div className={styles['highlight-item']}>
                                    <CheckCircleFilled />
                                    <span>Lộ trình cá nhân hóa 1-1 theo năng lực</span>
                                </div>
                                <div className={styles['highlight-item']}>
                                    <CheckCircleFilled />
                                    <span>Trợ lý AI luyện phát âm & chấm bài 24/7</span>
                                </div>
                                <div className={styles['highlight-item']}>
                                    <CheckCircleFilled />
                                    <span>Cơ hội việc làm tại FPT & đối tác toàn cầu</span>
                                </div>
                            </div>

                            <div className={styles['hero-stats']}>
                                <div className={styles['stat-item']}>
                                    <div className={styles['stat-num']}>18.500+</div>
                                    <div className={styles['stat-label']}>Học viên tốt nghiệp</div>
                                </div>
                                <div className={styles['stat-item']}>
                                    <div className={styles['stat-num']}>98.8%</div>
                                    <div className={styles['stat-label']}>Đạt chuẩn đầu ra</div>
                                </div>
                                <div className={styles['stat-item']}>
                                    <div className={styles['stat-num']}>150+</div>
                                    <div className={styles['stat-label']}>Giảng viên chuyên gia</div>
                                </div>
                                <div className={styles['stat-item']}>
                                    <div className={styles['stat-num']}>16 Năm</div>
                                    <div className={styles['stat-label']}>Uy tín giáo dục FPT</div>
                                </div>
                            </div>

                            <div className={styles['hero-actions']}>
                                <button
                                    type="button"
                                    className={styles['btn-primary-hero']}
                                    onClick={() => scrollTo('lead-form')}
                                >
                                    <GiftOutlined /> Đăng Ký Tư Vấn & Nhận Học Bổng 30%
                                </button>
                                <button
                                    type="button"
                                    className={styles['btn-secondary-hero']}
                                    onClick={() => scrollTo('courses')}
                                >
                                    <BookOutlined /> Khám Phá Khóa Học
                                </button>
                            </div>
                        </div>

                        {/* Hero Right: Lead Capture Form Card */}
                        <div className={styles['lead-form-card']} id="lead-form">
                            <div className={styles['form-header']}>
                                <span className={styles['form-badge']}>
                                    <FireOutlined /> Ưu Đãi Giới Hạn Tháng Này
                                </span>
                                <h3>ĐĂNG KÝ TƯ VẤN & NHẬN HỌC BỔNG</h3>
                                <p>Kiểm tra năng lực 4 kỹ năng 1-1 MIỄN PHÍ cùng chuyên gia học thuật</p>
                            </div>

                            <form className={styles['form-body']} onSubmit={handleSubmitLead}>
                                <div className={styles['input-group']}>
                                    <label>Họ và tên học viên *</label>
                                    <input
                                        type="text"
                                        placeholder="Ví dụ: Nguyễn Văn An"
                                        value={leadForm.full_name}
                                        onChange={e => setLeadForm({ ...leadForm, full_name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className={styles['input-group']}>
                                    <label>Số điện thoại liên hệ *</label>
                                    <input
                                        type="tel"
                                        placeholder="Ví dụ: 0912 345 678"
                                        value={leadForm.phone}
                                        onChange={e => setLeadForm({ ...leadForm, phone: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className={styles['input-group']}>
                                    <label>Địa chỉ Email</label>
                                    <input
                                        type="email"
                                        placeholder="Ví dụ: an.nguyen@gmail.com"
                                        value={leadForm.email}
                                        onChange={e => setLeadForm({ ...leadForm, email: e.target.value })}
                                    />
                                </div>

                                <div className={styles['input-group']}>
                                    <label>Chương trình quan tâm</label>
                                    <select
                                        value={leadForm.course_name}
                                        onChange={e => setLeadForm({ ...leadForm, course_name: e.target.value })}
                                    >
                                        <option value="IELTS Intensive Breakthrough (Cam Kết 7.0+)">Luyện thi IELTS Quốc Tế (Cam kết 7.0+)</option>
                                        <option value="TOEIC 4 Kỹ Năng Đột Phá (Mục Tiêu 850+)">Luyện thi TOEIC 4 Kỹ Năng Cấp Tốc (850+)</option>
                                        <option value="Tiếng Anh Giao Tiếp Phản Xạ & Thương Mại Quốc Tế">Tiếng Anh Giao Tiếp Quốc Tế & Phản Xạ</option>
                                        <option value="Tiếng Nhật IT & Luyện Thi JLPT N3 - N2 Cấp Tốc">Tiếng Nhật IT & Luyện thi JLPT N3 - N2</option>
                                        <option value="Tiếng Hàn Du Học & Chinh Phục TOPIK II (Level 3-4)">Tiếng Hàn Du Học & Luyện thi TOPIK II</option>
                                        <option value="Tiếng Anh Học Thuật Cambridge (FCE / CAE)">Tiếng Anh Thiếu Niên Cambridge Học Thuật</option>
                                    </select>
                                </div>

                                <div className={styles['input-group']}>
                                    <label>Mục tiêu điểm số / Thời gian mong muốn</label>
                                    <textarea
                                        rows={2}
                                        placeholder="Ví dụ: Muốn đạt IELTS 6.5 trong 4 tháng để đi du học..."
                                        value={leadForm.note}
                                        onChange={e => setLeadForm({ ...leadForm, note: e.target.value })}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className={styles['submit-btn']}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>Đang gửi thông tin...</>
                                    ) : (
                                        <>
                                            <RocketOutlined /> GỬI YÊU CẦU & NHẬN HỌC BỔNG NGAY
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className={styles['form-guarantee']}>
                                <SafetyCertificateOutlined style={{ color: '#10b981' }} />
                                <span>FPT cam kết bảo mật 100% thông tin. Tư vấn viên liên hệ trong 15 phút.</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. ADVANTAGES SECTION */}
            <section className={`${styles['landing-section']} ${styles['bg-white']}`} id="advantages">
                <div className={styles.container}>
                    <div className={styles['section-header']}>
                        <span className={styles['section-tag']}>VÌ SAO CHỌN FPT LANGUAGE CENTER?</span>
                        <h2>6 Lợi Thế Vượt Trội Độc Quyền Dành Cho Học Viên</h2>
                        <p>
                            Tiên phong kiến tạo môi trường học tập đẳng cấp quốc tế, kết hợp phương pháp phản xạ hiện đại
                            và công nghệ giáo dục 4.0 để tối ưu hóa hiệu quả học tập.
                        </p>
                    </div>

                    <div className={styles['advantages-grid']}>
                        <div className={styles['advantage-card']}>
                            <div className={styles['card-icon-box']}>
                                <SafetyCertificateOutlined />
                            </div>
                            <h3>Cam Kết Đầu Ra Bằng Hợp Đồng</h3>
                            <p>
                                Minh bạch hóa chất lượng đào tạo bằng văn bản pháp lý. Học viên được học lại hoàn toàn
                                MIỄN PHÍ 100% nếu thực hiện đúng lộ trình nhưng chưa đạt điểm số cam kết.
                            </p>
                            <span className={styles['card-tag']}>Bảo chứng pháp lý</span>
                        </div>

                        <div className={styles['advantage-card']}>
                            <div className={styles['card-icon-box']}>
                                <TeamOutlined />
                            </div>
                            <h3>100% Giảng Viên Tinh Hoa & Bản Xứ</h3>
                            <p>
                                Đội ngũ giảng viên sở hữu chứng chỉ giảng dạy quốc tế TESOL/CELTA, cựu giám khảo khảo thí
                                IELTS 8.5+, TOEIC 950+, JLPT N1 giàu nhiệt huyết và phương pháp truyền cảm hứng.
                            </p>
                            <span className={styles['card-tag']}>TESOL & CELTA Certified</span>
                        </div>

                        <div className={styles['advantage-card']}>
                            <div className={styles['card-icon-box']}>
                                <RocketOutlined />
                            </div>
                            <h3>Lộ Trình Cá Nhân Hóa 1-1</h3>
                            <p>
                                Đánh giá chuyên sâu 4 kỹ năng đầu vào, thiết kế giáo trình riêng biệt phù hợp với năng lực
                                và mục tiêu nghề nghiệp, giúp rút ngắn tới 50% thời gian ôn luyện.
                            </p>
                            <span className={styles['card-tag']}>Tiết kiệm 50% thời gian</span>
                        </div>

                        <div className={styles['advantage-card']}>
                            <div className={styles['card-icon-box']}>
                                <GlobalOutlined />
                            </div>
                            <h3>Hệ Sinh Thái EdTech 4.0 Thông Minh</h3>
                            <p>
                                Nền tảng portal học tập trực tuyến 24/7, ứng dụng AI luyện phát âm chuẩn ngữ điệu bản ngữ
                                và kho ngân hàng đề thi thật cập nhật liên tục bám sát xu hướng đề mới.
                            </p>
                            <span className={styles['card-tag']}>AI Luyện Nói & Sửa Bài</span>
                        </div>

                        <div className={styles['advantage-card']}>
                            <div className={styles['card-icon-box']}>
                                <BookOutlined />
                            </div>
                            <h3>Môi Trường 100% Ngoại Ngữ Thực Chiến</h3>
                            <p>
                                Không gian English-Only Zone, câu lạc bộ hùng biện, tọa đàm văn hóa quốc tế và workshop
                                kỹ năng mềm giúp học viên xóa tan rào cản sợ nói và tự tin giao tiếp tự nhiên.
                            </p>
                            <span className={styles['card-tag']}>English-Only Zone</span>
                        </div>

                        <div className={styles['advantage-card']}>
                            <div className={styles['card-icon-box']}>
                                <TrophyOutlined />
                            </div>
                            <h3>Đặc Quyền Việc Làm Toàn Cầu</h3>
                            <p>
                                Kết nối trực tiếp cơ hội tuyển dụng và thực tập tại Tập đoàn FPT (FPT Software, FPT Telecom,
                                FPT IS) và mạng lưới hơn 500+ doanh nghiệp đa quốc gia tại Việt Nam & quốc tế.
                            </p>
                            <span className={styles['card-tag']}>Ưu tiên FPT Software</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. COURSES CATALOG SHOWCASE */}
            <section className={`${styles['landing-section']} ${styles['bg-light']}`} id="courses">
                <div className={styles.container}>
                    <div className={styles['section-header']}>
                        <span className={styles['section-tag']}>CHƯƠNG TRÌNH ĐÀO TẠO TRỌNG ĐIỂM</span>
                        <h2>Các Khóa Học Nổi Bật Dành Cho Bạn</h2>
                        <p>
                            Lựa chọn chương trình đào tạo phù hợp nhất với mục tiêu học tập, thi chứng chỉ quốc tế
                            hoặc thăng tiến sự nghiệp toàn cầu.
                        </p>
                    </div>

                    {/* Filter and Search Bar */}
                    <div className={styles['courses-filter-bar']}>
                        <div className={styles['category-tabs']}>
                            <button
                                type="button"
                                className={activeCategory === 'ALL' ? styles.active : ''}
                                onClick={() => setActiveCategory('ALL')}
                            >
                                Tất cả chương trình
                            </button>
                            <button
                                type="button"
                                className={activeCategory === 'IELTS' ? styles.active : ''}
                                onClick={() => setActiveCategory('IELTS')}
                            >
                                IELTS Quốc Tế
                            </button>
                            <button
                                type="button"
                                className={activeCategory === 'TOEIC' ? styles.active : ''}
                                onClick={() => setActiveCategory('TOEIC')}
                            >
                                TOEIC 4 Kỹ Năng
                            </button>
                            <button
                                type="button"
                                className={activeCategory === 'COMMUNICATION' ? styles.active : ''}
                                onClick={() => setActiveCategory('COMMUNICATION')}
                            >
                                Tiếng Anh Giao Tiếp
                            </button>
                            <button
                                type="button"
                                className={activeCategory === 'JAPANESE' ? styles.active : ''}
                                onClick={() => setActiveCategory('JAPANESE')}
                            >
                                Tiếng Nhật IT / JLPT
                            </button>
                            <button
                                type="button"
                                className={activeCategory === 'KOREAN' ? styles.active : ''}
                                onClick={() => setActiveCategory('KOREAN')}
                            >
                                Tiếng Hàn Du Học
                            </button>
                        </div>

                        <div className={styles['search-box']}>
                            <SearchOutlined />
                            <input
                                type="text"
                                placeholder="Tìm kiếm khóa học..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Courses Grid */}
                    <Spin spinning={isLoading}>
                        {filteredCourses.length > 0 ? (
                            <div className={styles['courses-grid-enhanced']}>
                                {filteredCourses.map(course => (
                                    <article className={styles['course-card-enhanced']} key={course._id ?? course.name}>
                                        <div className={styles['card-top-banner']}>
                                            <span className={styles['badge-level']}>
                                                <TeamOutlined /> {course.level || 'Chuẩn Quốc Tế'}
                                            </span>
                                            <span className={styles['badge-status']}>
                                                <CheckCircleFilled /> {course.status || 'Đang tuyển sinh'}
                                            </span>
                                        </div>

                                        <div className={styles['card-body']}>
                                            <h3>{course.name}</h3>
                                            <p>{course.description || 'Chương trình đào tạo thực tế, bám sát đề thi và cam kết đầu ra bằng văn bản pháp lý.'}</p>

                                            <div className={styles['course-info-row']}>
                                                <span>
                                                    <ClockCircleOutlined /> {course.duration || 'Linh hoạt'}
                                                </span>
                                                <span>
                                                    <TeamOutlined /> 10 - 14 HV/lớp
                                                </span>
                                                <span style={{ color: '#eab308' }}>
                                                    <StarFilled /> 5.0 (180+ đánh giá)
                                                </span>
                                            </div>
                                        </div>

                                        <div className={styles['card-footer']}>
                                            <div className={styles['price-box']}>
                                                <span className={styles['current-price']}>
                                                    <DollarOutlined /> {formatPrice(course.price)}
                                                </span>
                                                {getOriginalPrice(course.price) && (
                                                    <span className={styles['orig-price']}>
                                                        {getOriginalPrice(course.price)}
                                                    </span>
                                                )}
                                            </div>

                                            <div className={styles['btn-group']}>
                                                <button
                                                    type="button"
                                                    className={styles['btn-details']}
                                                    onClick={() => course._id && navigate(`/client/courses/${course._id}`)}
                                                >
                                                    Mua ngay
                                                </button>
                                                <button
                                                    type="button"
                                                    className={styles['btn-register-fast']}
                                                    onClick={() => handleSelectCourseForLead(course.name)}
                                                >
                                                    Tư vấn ngay
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <div style={{ padding: '60px 0', textAlign: 'center' }}>
                                <Empty description="Không tìm thấy khóa học phù hợp với từ khóa này" />
                            </div>
                        )}
                    </Spin>
                </div>
            </section>

            {/* 4. LEARNING ROADMAP SECTION */}
            <section className={`${styles['landing-section']} ${styles['bg-white']}`} id="roadmap">
                <div className={styles.container}>
                    <div className={styles['section-header']}>
                        <span className={styles['section-tag']}>LỘ TRÌNH ĐÀO TẠO KHOA HỌC</span>
                        <h2>4 Bước Chinh Phục Điểm Số Chuẩn Quốc Tế</h2>
                        <p>
                            Quy trình đào tạo khép kín, tối ưu hiệu quả và tiết kiệm tối đa thời gian cho học viên
                            từ lúc bắt đầu đến khi nhận chứng chỉ quốc tế.
                        </p>
                    </div>

                    <div className={styles['roadmap-grid']}>
                        <div className={styles['roadmap-card']}>
                            <div className={styles['step-num']}>01</div>
                            <h3>Kiểm Tra Năng Lực 4 Kỹ Năng 1-1</h3>
                            <p>
                                Tham gia bài thi thử đánh giá chuẩn xác Nghe - Nói - Đọc - Viết theo tiêu chuẩn Cambridge
                                và khảo thí quốc tế cùng chuyên gia học thuật.
                            </p>
                            <span className={styles['step-duration']}>Miễn phí 100%</span>
                        </div>

                        <div className={styles['roadmap-card']}>
                            <div className={styles['step-num']}>02</div>
                            <h3>Hoạch Định Lộ Trình Cá Nhân Hóa</h3>
                            <p>
                                Chuyên gia phân tích điểm mạnh - điểm yếu và thiết kế lộ trình riêng biệt, cam kết thời gian
                                và điểm số đầu ra bằng hợp đồng đào tạo.
                            </p>
                            <span className={styles['step-duration']}>Ký hợp đồng đào tạo</span>
                        </div>

                        <div className={styles['roadmap-card']}>
                            <div className={styles['step-num']}>03</div>
                            <h3>Đào Tạo Chuyên Sâu & Sửa Bài 1-1</h3>
                            <p>
                                Luyện thi bám sát ngân hàng đề thi thật, sửa bài Writing và Speaking chi tiết từng từ,
                                kết hợp trợ lý AI luyện phản xạ ngữ điệu mỗi ngày.
                            </p>
                            <span className={styles['step-duration']}>Theo sát hàng tuần</span>
                        </div>

                        <div className={styles['roadmap-card']}>
                            <div className={styles['step-num']}>04</div>
                            <h3>Thi Thử Áp Lực Thật & Nhận Bằng</h3>
                            <p>
                                Tham gia các kỳ thi thử mô phỏng 100% áp lực phòng thi thật, trang bị tâm lý phòng thi
                                vững vàng để tự tin bứt phá band điểm mục tiêu.
                            </p>
                            <span className={styles['step-duration']}>Đạt chuẩn 98.8%</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. FACULTY SHOWCASE */}
            <section className={`${styles['landing-section']} ${styles['bg-light']}`} id="faculty">
                <div className={styles.container}>
                    <div className={styles['section-header']}>
                        <span className={styles['section-tag']}>ĐỘI NGŨ GIẢNG VIÊN TINH HOA</span>
                        <h2>Học Cùng Chuyên Gia Khảo Thí & Thạc Sĩ Ngôn Ngữ</h2>
                        <p>
                            Đội ngũ giảng viên tâm huyết, giàu kinh nghiệm thực chiến và sở hữu bề dày thành tích xuất sắc
                            tại các trường đại học hàng đầu thế giới.
                        </p>
                    </div>

                    <div className={styles['faculty-grid']}>
                        <div className={styles['faculty-card']}>
                            <div className={styles['faculty-avatar']}>
                                <UserOutlined />
                            </div>
                            <span className={styles['faculty-badge']}>Academic Director</span>
                            <h3>Thầy David Miller</h3>
                            <p className={styles['faculty-role']}>Thạc sĩ TESOL - ĐH Cambridge (UK)</p>
                            <p>
                                14 năm kinh nghiệm khảo thí IELTS quốc tế, từng đào tạo hơn 4.000 học viên đạt band điểm 7.5 - 8.5+.
                            </p>
                        </div>

                        <div className={styles['faculty-card']}>
                            <div className={styles['faculty-avatar']}>
                                <UserOutlined />
                            </div>
                            <span className={styles['faculty-badge']}>IELTS 8.5 Overall</span>
                            <h3>Cô Đặng Minh Trang</h3>
                            <p className={styles['faculty-role']}>IELTS 8.5 (9.0 Speaking & Reading)</p>
                            <p>
                                Cựu sinh viên xuất sắc ĐH Ngoại Thương, 7 năm giảng dạy luyện thi IELTS chuyên sâu và bồi dưỡng học bổng du học.
                            </p>
                        </div>

                        <div className={styles['faculty-card']}>
                            <div className={styles['faculty-avatar']}>
                                <UserOutlined />
                            </div>
                            <span className={styles['faculty-badge']}>JLPT N1 Specialist</span>
                            <h3>Thầy Kenjiro Sato</h3>
                            <p className={styles['faculty-role']}>Chuyên gia Ngôn ngữ Nhật - FPT Japan</p>
                            <p>
                                10 năm kinh nghiệm giảng dạy tiếng Nhật IT, đào tạo hơn 800 kỹ sư cầu nối BrSE làm việc tại Tokyo và Osaka.
                            </p>
                        </div>

                        <div className={styles['faculty-card']}>
                            <div className={styles['faculty-avatar']}>
                                <UserOutlined />
                            </div>
                            <span className={styles['faculty-badge']}>TOEIC 990 / 990</span>
                            <h3>Cô Sarah Jenkins</h3>
                            <p className={styles['faculty-role']}>Thạc sĩ Ngôn ngữ - ĐH Sydney (Úc)</p>
                            <p>
                                Chuyên gia khảo thí TOEIC & Tiếng Anh Thương Mại, cố vấn đào tạo ngôn ngữ cho hơn 40 tập đoàn đa quốc gia.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. HALL OF FAME & TESTIMONIALS */}
            <section className={`${styles['landing-section']} ${styles['bg-white']}`} id="reviews">
                <div className={styles.container}>
                    <div className={styles['section-header']}>
                        <span className={styles['section-tag']}>BẢNG VÀNG THÀNH TÍCH</span>
                        <h2>Câu Chuyện Thành Công Của Học Viên FPT</h2>
                        <p>
                            Hàng chục nghìn học viên đã bứt phá ngoạn mục năng lực ngoại ngữ và hiện thực hóa giấc mơ
                            du học, định cư và làm việc toàn cầu.
                        </p>
                    </div>

                    <div className={styles['testimonials-grid']}>
                        <div className={styles['testimonial-card']}>
                            <div className={styles['testimonial-header']}>
                                <span className={styles['score-tag']}>IELTS 8.0 OVERALL</span>
                                <div className={styles.stars}>
                                    <StarFilled /><StarFilled /><StarFilled /><StarFilled /><StarFilled />
                                </div>
                            </div>
                            <p>
                                "Lộ trình tại FPT rất sát với năng lực của mình. Mình từng bị kẹt ở Speaking 6.0 suốt 1 năm,
                                nhưng nhờ phương pháp phản xạ và việc thầy cô sửa bài Writing chi tiết từng từ, mình đã bứt phá
                                đạt 8.0 Overall và giành học bổng Thạc sĩ tại Anh!"
                            </p>
                            <div className={styles['student-meta']}>
                                <div className={styles['student-avatar']}>MH</div>
                                <div className={styles['student-info']}>
                                    <span className={styles['student-name']}>Nguyễn Minh Hoàng</span>
                                    <span className={styles['student-title']}>Học bổng Thạc sĩ University of Bristol (UK)</span>
                                </div>
                            </div>
                        </div>

                        <div className={styles['testimonial-card']}>
                            <div className={styles['testimonial-header']}>
                                <span className={styles['score-tag']}>TOEIC 935 / 990</span>
                                <div className={styles.stars}>
                                    <StarFilled /><StarFilled /><StarFilled /><StarFilled /><StarFilled />
                                </div>
                            </div>
                            <p>
                                "Khóa TOEIC 4 kỹ năng tại FPT tập trung đúng vào những bẫy đề thi thật và kỹ năng giao tiếp công sở.
                                Giáo trình tinh gọn, không dàn trải giúp mình tăng từ 550 lên 935 chỉ sau 2 tháng rưỡi ôn luyện.
                                Mình đã tự tin pass vòng phỏng vấn tập đoàn Unilever!"
                            </p>
                            <div className={styles['student-meta']}>
                                <div className={styles['student-avatar']}>TL</div>
                                <div className={styles['student-info']}>
                                    <span className={styles['student-name']}>Trần Mai Linh</span>
                                    <span className={styles['student-title']}>Management Trainee tại Unilever Vietnam</span>
                                </div>
                            </div>
                        </div>

                        <div className={styles['testimonial-card']}>
                            <div className={styles['testimonial-header']}>
                                <span className={styles['score-tag']}>JLPT N2 (162/180)</span>
                                <div className={styles.stars}>
                                    <StarFilled /><StarFilled /><StarFilled /><StarFilled /><StarFilled />
                                </div>
                            </div>
                            <p>
                                "Mình xuất phát điểm là dân IT mất gốc ngoại ngữ. Khóa Tiếng Nhật IT của FPT cực kỳ thực chiến,
                                dạy từ vựng chuyên ngành lập trình và văn hóa làm việc với khách hàng Nhật. Nhờ đó mình vừa đỗ N2
                                vừa trở thành Kỹ sư Cầu nối BrSE tại Tokyo!"
                            </p>
                            <div className={styles['student-meta']}>
                                <div className={styles['student-avatar']}>QT</div>
                                <div className={styles['student-info']}>
                                    <span className={styles['student-name']}>Lê Quốc Tuấn</span>
                                    <span className={styles['student-title']}>Bridge Software Engineer (BrSE) - FPT Japan</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 7. FAQ SECTION */}
            <section className={`${styles['landing-section']} ${styles['bg-light']}`} id="faq">
                <div className={styles.container}>
                    <div className={styles['section-header']}>
                        <span className={styles['section-tag']}>GIẢI ĐÁP THẮC MẮC</span>
                        <h2>Những Câu Hỏi Thường Gặp Về Khóa Học (FAQ)</h2>
                        <p>
                            Tổng hợp những băn khoăn phổ biến nhất của học viên và phụ huynh khi tìm hiểu về chương trình
                            đào tạo tại FPT Language Center.
                        </p>
                    </div>

                    <div className={styles['faq-box']}>
                        <Collapse
                            defaultActiveKey={['1']}
                            expandIconPosition="end"
                            items={[
                                {
                                    key: '1',
                                    label: '1. Chính sách cam kết chuẩn đầu ra tại FPT Language Center được quy định như thế nào?',
                                    children: (
                                        <p>
                                            Chính sách cam kết đầu ra tại FPT được đảm bảo bằng <strong>Hợp đồng đào tạo pháp lý</strong> ngay khi nhập học.
                                            Học viên được kiểm tra đánh giá định kỳ sau mỗi học phần. Trong trường hợp học viên tuân thủ đầy đủ số buổi học (tối thiểu 90%)
                                            và hoàn thành bài tập nhưng chưa đạt band điểm mục tiêu trong kỳ thi thật, trung tâm sẽ <strong>đào tạo lại hoàn toàn MIỄN PHÍ 100%</strong> cho đến khi đạt chuẩn.
                                        </p>
                                    ),
                                },
                                {
                                    key: '2',
                                    label: '2. Tôi là người mất gốc ngoại ngữ hoặc bận rộn thì có theo học được không?',
                                    children: (
                                        <p>
                                            Hoàn toàn được! FPT có các lớp Foundation được thiết kế đặc biệt cho học viên mất gốc hoặc chưa từng học ngoại ngữ.
                                            Học viên sẽ được kiểm tra năng lực đầu vào 1-1 miễn phí để xếp đúng lớp, bổ trợ kèm riêng ngoài giờ cùng trợ giảng
                                            và ứng dụng nền tảng học trực tuyến 24/7 giúp bạn linh hoạt học mọi lúc mọi nơi.
                                        </p>
                                    ),
                                },
                                {
                                    key: '3',
                                    label: '3. Lịch học tại trung tâm có linh hoạt cho sinh viên và người đi làm không?',
                                    children: (
                                        <p>
                                            Trung tâm tổ chức đa dạng các ca học linh hoạt: Các ca tối trong tuần (18:00 - 19:30, 19:45 - 21:15) và cả ngày Thứ Bảy, Chủ Nhật.
                                            Đặc biệt, nếu bận công tác đột xuất, học viên có thể đăng ký học bù tại các lớp song song hoặc xem lại video bài giảng lưu trữ trên Portal.
                                        </p>
                                    ),
                                },
                                {
                                    key: '4',
                                    label: '4. Trung tâm có chính sách hỗ trợ học phí trả góp hoặc học bổng không?',
                                    children: (
                                        <p>
                                            FPT Language Center luôn đồng hành cùng học viên thông qua chính sách <strong>trả góp học phí lãi suất 0%</strong> liên kết với hơn 25 ngân hàng uy tín.
                                            Ngoài ra, trung tâm thường xuyên trao tặng các suất <strong>Học bổng khuyến học 20% - 30%</strong> cho học viên đăng ký sớm và học sinh, sinh viên các trường đại học.
                                        </p>
                                    ),
                                },
                                {
                                    key: '5',
                                    label: '5. Điểm khác biệt lớn nhất giữa FPT Language Center và các trung tâm ngoại ngữ khác là gì?',
                                    children: (
                                        <p>
                                            FPT là hệ thống đào tạo ngoại ngữ trực thuộc Tập đoàn Giáo dục FPT - hệ sinh thái công nghệ và giáo dục hàng đầu Việt Nam.
                                            Khác biệt cốt lõi của FPT nằm ở: <strong>Phương pháp thực chiến phản xạ chuẩn quốc tế</strong>, <strong>Ứng dụng AI cá nhân hóa việc học</strong>,
                                            và <strong>Đặc quyền kết nối tuyển dụng trực tiếp</strong> vào hệ sinh thái FPT Software, FPT Telecom cũng như hơn 500+ đối tác toàn cầu.
                                        </p>
                                    ),
                                },
                            ]}
                        />
                    </div>
                </div>
            </section>

            {/* 8. BOTTOM MEGA CTA BANNER */}
            <section className={styles['mega-cta-section']} id="cta-banner">
                <div className={styles.container}>
                    <div className={styles['cta-content']}>
                        <span className={styles['cta-tag']}>
                            <GiftOutlined /> CƠ HỘI BỨT PHÁ DUY NHẤT TRONG THÁNG NÀY
                        </span>
                        <h2>Sẵn Sàng Chinh Phục Ngoại Ngữ Cùng FPT Education?</h2>
                        <p>
                            Đăng ký ngay hôm nay để nhận <strong>Voucher học bổng lên tới 30%</strong> và Suất thi thử
                            4 kỹ năng chuẩn quốc tế kèm phân tích lộ trình 1-1 trị giá <strong>1.500.000 VNĐ</strong> hoàn toàn miễn phí.
                        </p>
                        <div className={styles['cta-btns']}>
                            <button
                                type="button"
                                className={styles['btn-cta-primary']}
                                onClick={() => scrollTo('lead-form')}
                            >
                                <RocketOutlined /> ĐĂNG KÝ NHẬN HỌC BỔNG NGAY
                            </button>
                            <a href="tel:19006600" className={styles['btn-cta-phone']}>
                                <PhoneOutlined /> HOTLINE 24/7: 1900 6600
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Success Modal Confirmation */}
            <Modal
                open={isSuccessModalOpen}
                onOk={() => setIsSuccessModalOpen(false)}
                onCancel={() => setIsSuccessModalOpen(false)}
                footer={null}
                centered
            >
                <div style={{ textAlign: 'center', padding: '24px 10px' }}>
                    <div
                        style={{
                            width: 68,
                            height: 68,
                            borderRadius: '50%',
                            background: '#ecfdf5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 16px',
                            color: '#10b981',
                            fontSize: 34,
                        }}
                    >
                        <CheckCircleFilled />
                    </div>
                    <h3 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '0 0 10px' }}>
                        ĐĂNG KÝ THÀNH CÔNG!
                    </h3>
                    <p style={{ fontSize: 14.5, color: '#475569', lineHeight: 1.6, margin: '0 0 20px' }}>
                        Cảm ơn bạn đã tin tưởng <strong>FPT Language Center</strong>. Thông tin của bạn đã được chuyển đến
                        Bộ phận Học vụ & Tuyển sinh. Chuyên viên sẽ liên hệ với bạn trong vòng <strong>15 phút</strong> để
                        xếp lịch thi thử 1-1 và gửi tặng voucher học bổng 30%.
                    </p>
                    <button
                        type="button"
                        style={{
                            padding: '10px 28px',
                            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                            border: 'none',
                            borderRadius: '999px',
                            color: '#ffffff',
                            fontWeight: 700,
                            cursor: 'pointer',
                        }}
                        onClick={() => setIsSuccessModalOpen(false)}
                    >
                        Xác Nhận & Đóng
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default CourseCard;
