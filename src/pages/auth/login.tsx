import { useEffect, useState } from 'react';
import { Button, Checkbox, Form, Input, message, notification } from 'antd';
import {
    ArrowLeftOutlined,
    CheckCircleFilled,
    LockOutlined,
    MailOutlined,
    RocketOutlined,
    SafetyCertificateOutlined,
} from '@ant-design/icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { callLogin } from '@/config/api';
import { setUserLoginInfo } from '@/redux/slice/accountSlide';
import { useAppSelector } from '@/redux/hooks';
import { resolveTargetRoute } from '@/config/portal';
import styles from '@/styles/auth.module.scss';

const LoginPage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [isSubmit, setIsSubmit] = useState(false);
    const { isAuthenticated, user } = useAppSelector(state => state.account);

    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const callback = params?.get('callback');

    useEffect(() => {
        // Nếu đã đăng nhập thì tự động chuyển hướng về đúng dashboard theo role
        if (isAuthenticated) {
            window.location.href = resolveTargetRoute(user.role?.name, callback);
        }
    }, [isAuthenticated, user, callback]);

    const onFinish = async (values: any) => {
        const { username, password } = values;
        setIsSubmit(true);
        try {
            const res = await callLogin(username, password);
            if (res?.data) {
                localStorage.setItem('access_token', res.data.access_token);
                if (res.data.user?._id) {
                    localStorage.setItem('user_id', res.data.user._id);
                }
                dispatch(setUserLoginInfo(res.data.user));
                message.success('Đăng nhập tài khoản thành công!');
                window.location.href = resolveTargetRoute(res.data.user?.role?.name, callback);
            } else {
                notification.error({
                    message: 'Đăng nhập không thành công',
                    description: res.message && Array.isArray(res.message) ? res.message[0] : res.message || 'Email hoặc mật khẩu không chính xác',
                    duration: 5,
                });
            }
        } catch {
            notification.error({
                message: 'Lỗi kết nối',
                description: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng hoặc thử lại sau.',
                duration: 5,
            });
        } finally {
            setIsSubmit(false);
        }
    };

    return (
        <div className={styles['auth-container']}>
            <div className={styles['auth-card']}>
                {/* Left Side: Brand & Showcase */}
                <div className={styles['auth-banner']}>
                    <div>
                        <Link to="/" className={styles['back-home-link']}>
                            <ArrowLeftOutlined /> Quay lại Trang Chủ
                        </Link>
                    </div>

                    <div className={styles['banner-brand']}>
                        <div className={styles['brand-badge']}>
                            <RocketOutlined />
                        </div>
                        <div className={styles['brand-text']}>
                            <span className={styles['brand-name']}>FPT LANGUAGE CENTER</span>
                            <span className={styles['brand-sub']}>Hệ Thống Đào Tạo Ngoại Ngữ Chuẩn Quốc Tế</span>
                        </div>
                    </div>

                    <div className={styles['banner-main']}>
                        <span className={styles['badge-tag']}>
                            <SafetyCertificateOutlined /> CỔNG HỌC VỤ & ĐÀO TẠO
                        </span>
                        <h2>
                            Làm Chủ Ngoại Ngữ, <br />
                            <span className={styles['highlight']}>Bứt Phá Tương Lai Toàn Cầu</span>
                        </h2>
                        <p>
                            Nền tảng quản lý đào tạo thông minh kết nối học viên, giảng viên và đội ngũ hỗ trợ học vụ 24/7.
                        </p>

                        <div className={styles['feature-list']}>
                            <div className={styles['feature-item']}>
                                <CheckCircleFilled />
                                <span>Quản lý lịch học, lớp học & điểm danh minh bạch</span>
                            </div>
                            <div className={styles['feature-item']}>
                                <CheckCircleFilled />
                                <span>Trao đổi tin nhắn trực tiếp realtime với giảng viên</span>
                            </div>
                            <div className={styles['feature-item']}>
                                <CheckCircleFilled />
                                <span>Luyện phát âm AI & làm bài kiểm tra chuẩn khảo thí</span>
                            </div>
                            <div className={styles['feature-item']}>
                                <CheckCircleFilled />
                                <span>Theo dõi hóa đơn, học phí và nhận học bổng ưu đãi</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles['banner-footer']}>
                        <span>
                            <SafetyCertificateOutlined /> Bảo mật SSL 256-bit
                        </span>
                        <span>FPT Education Group © 2026</span>
                    </div>
                </div>

                {/* Right Side: Login Form */}
                <div className={styles['auth-form-wrapper']}>
                    <div className={styles['form-header']}>
                        <h2>Đăng Nhập Tài Khoản</h2>
                        <p>Vui lòng nhập thông tin để truy cập cổng thông tin học vụ FPT</p>
                    </div>

                    <Form
                        name="loginForm"
                        layout="vertical"
                        onFinish={onFinish}
                        autoComplete="off"
                        className={styles['form-content']}
                        initialValues={{ remember: true }}
                    >
                        <Form.Item
                            label="Email tài khoản"
                            name="username"
                            rules={[
                                { required: true, message: 'Vui lòng nhập địa chỉ email!' },
                                { type: 'email', message: 'Địa chỉ email không đúng định dạng!' },
                            ]}
                        >
                            <Input
                                prefix={<MailOutlined />}
                                placeholder="name@gmail.com"
                                size="large"
                            />
                        </Form.Item>

                        <Form.Item
                            label="Mật khẩu"
                            name="password"
                            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                        >
                            <Input.Password
                                prefix={<LockOutlined />}
                                placeholder="••••••••"
                                size="large"
                            />
                        </Form.Item>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <Form.Item name="remember" valuePropName="checked" noStyle>
                                <Checkbox style={{ fontSize: 13, color: '#475569' }}>Ghi nhớ đăng nhập</Checkbox>
                            </Form.Item>
                            <a
                                href="tel:19006600"
                                style={{ fontSize: 13, color: '#f97316', textDecoration: 'none', fontWeight: 600 }}
                                title="Gọi hotline để được cấp lại mật khẩu"
                            >
                                Quên mật khẩu?
                            </a>
                        </div>

                        <button
                            type="submit"
                            className={styles['auth-submit-btn']}
                            disabled={isSubmit}
                        >
                            {isSubmit ? (
                                'Đang xác thực tài khoản...'
                            ) : (
                                <>
                                    <RocketOutlined /> ĐĂNG NHẬP HỆ THỐNG
                                </>
                            )}
                        </button>
                    </Form>

                    <div className={styles['form-footer']}>
                        Chưa có tài khoản học viên?
                        <Link to="/register">Đăng ký ngay</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;