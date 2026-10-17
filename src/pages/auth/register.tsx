import { useState } from 'react';
import { Button, Checkbox, Form, Input, Select, message, notification } from 'antd';
import {
    ArrowLeftOutlined,
    CheckCircleFilled,
    EnvironmentOutlined,
    GiftOutlined,
    LockOutlined,
    MailOutlined,
    RocketOutlined,
    SafetyCertificateOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { callRegister } from '@/config/api';
import type { IUser } from '@/types/backend';
import styles from '@/styles/auth.module.scss';

const { Option } = Select;

const RegisterPage = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [isSubmit, setIsSubmit] = useState(false);

    const onFinish = async (values: any) => {
        const { name, email, password, age, gender, address } = values;
        setIsSubmit(true);
        try {
            const res = await callRegister(name.trim(), email.trim(), password, +age, gender, address.trim());
            if (res?.data?._id || res?.data) {
                message.success('Đăng ký tài khoản học viên thành công! Vui lòng đăng nhập.');
                navigate('/login');
            } else {
                notification.error({
                    message: 'Đăng ký không thành công',
                    description: res.message && Array.isArray(res.message) ? res.message[0] : res.message || 'Email này đã tồn tại hoặc thông tin chưa hợp lệ.',
                    duration: 5,
                });
            }
        } catch {
            notification.error({
                message: 'Lỗi kết nối',
                description: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau hoặc liên hệ hotline 1900 6600.',
                duration: 5,
            });
        } finally {
            setIsSubmit(false);
        }
    };

    return (
        <div className={styles['auth-container']}>
            <div className={`${styles['auth-card']} ${styles['register-mode']}`}>
                {/* Left Side: Brand & Benefits */}
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
                            <GiftOutlined /> ƯU ĐÃI THÀNH VIÊN MỚI
                        </span>
                        <h2>
                            Khởi Đầu Hành Trình, <br />
                            <span className={styles['highlight']}>Làm Chủ Ngôn Ngữ Cùng FPT</span>
                        </h2>
                        <p>
                            Đăng ký tài khoản để truy cập toàn diện nền tảng học vụ, nhận lộ trình cá nhân hóa và học bổng lên tới 30%.
                        </p>

                        <div className={styles['feature-list']}>
                            <div className={styles['feature-item']}>
                                <CheckCircleFilled />
                                <span>Tặng ngay Voucher học bổng 30% khi đăng ký thành công</span>
                            </div>
                            <div className={styles['feature-item']}>
                                <CheckCircleFilled />
                                <span>Suất kiểm tra năng lực 4 kỹ năng 1-1 miễn phí cùng chuyên gia</span>
                            </div>
                            <div className={styles['feature-item']}>
                                <CheckCircleFilled />
                                <span>Trải nghiệm phòng luyện đề thi thật IELTS/TOEIC/JLPT AI</span>
                            </div>
                            <div className={styles['feature-item']}>
                                <CheckCircleFilled />
                                <span>Cơ hội xét tuyển thực tập tại FPT Software & đối tác quốc tế</span>
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

                {/* Right Side: Register Form */}
                <div className={styles['auth-form-wrapper']}>
                    <div className={styles['form-header']}>
                        <h2>Đăng Ký Tài Khoản Học Viên</h2>
                        <p>Điền đầy đủ thông tin để tạo tài khoản thành viên hệ thống FPT</p>
                    </div>

                    <Form
                        form={form}
                        name="registerForm"
                        layout="vertical"
                        onFinish={onFinish}
                        autoComplete="off"
                        className={styles['form-content']}
                        initialValues={{
                            gender: 'male',
                            terms: true,
                        }}
                    >
                        <div className={styles['register-form-grid']}>
                            {/* Họ tên */}
                            <Form.Item
                                label="Họ và tên"
                                name="name"
                                rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}
                            >
                                <Input
                                    prefix={<UserOutlined />}
                                    placeholder="Ví dụ: Nguyễn Văn An"
                                />
                            </Form.Item>

                            {/* Email */}
                            <Form.Item
                                label="Địa chỉ Email"
                                name="email"
                                rules={[
                                    { required: true, message: 'Vui lòng nhập email!' },
                                    { type: 'email', message: 'Địa chỉ email không đúng định dạng!' },
                                ]}
                            >
                                <Input
                                    prefix={<MailOutlined />}
                                    placeholder="an.nguyen@gmail.com"
                                />
                            </Form.Item>

                            {/* Mật khẩu */}
                            <Form.Item
                                label="Mật khẩu"
                                name="password"
                                rules={[
                                    { required: true, message: 'Vui lòng nhập mật khẩu!' },
                                    { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' },
                                ]}
                            >
                                <Input.Password
                                    prefix={<LockOutlined />}
                                    placeholder="Tối thiểu 6 ký tự"
                                />
                            </Form.Item>

                            {/* Xác nhận mật khẩu */}
                            <Form.Item
                                label="Xác nhận mật khẩu"
                                name="confirmPassword"
                                dependencies={['password']}
                                rules={[
                                    { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (!value || getFieldValue('password') === value) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                                        },
                                    }),
                                ]}
                            >
                                <Input.Password
                                    prefix={<LockOutlined />}
                                    placeholder="Nhập lại mật khẩu"
                                />
                            </Form.Item>

                            {/* Tuổi */}
                            <Form.Item
                                label="Độ tuổi"
                                name="age"
                                rules={[
                                    { required: true, message: 'Vui lòng nhập tuổi!' },
                                ]}
                            >
                                <Input
                                    type="number"
                                    min={10}
                                    max={90}
                                    placeholder="Ví dụ: 20"
                                />
                            </Form.Item>

                            {/* Giới tính */}
                            <Form.Item
                                label="Giới tính"
                                name="gender"
                                rules={[{ required: true, message: 'Vui lòng chọn giới tính!' }]}
                            >
                                <Select>
                                    <Option value="male">Nam</Option>
                                    <Option value="female">Nữ</Option>
                                    <Option value="other">Khác</Option>
                                </Select>
                            </Form.Item>

                            {/* Địa chỉ */}
                            <Form.Item
                                label="Địa chỉ cư trú"
                                name="address"
                                className={styles['full-width']}
                                rules={[{ required: true, message: 'Vui lòng nhập địa chỉ!' }]}
                            >
                                <Input
                                    prefix={<EnvironmentOutlined />}
                                    placeholder="Ví dụ: Cầu Giấy, Hà Nội hoặc Quận 1, TP.HCM"
                                />
                            </Form.Item>
                        </div>

                        {/* Điều khoản & Quy chế */}
                        <Form.Item
                            name="terms"
                            valuePropName="checked"
                            rules={[
                                {
                                    validator: (_, value) =>
                                        value ? Promise.resolve() : Promise.reject(new Error('Bạn cần đồng ý với điều khoản sử dụng!')),
                                },
                            ]}
                        >
                            <Checkbox style={{ fontSize: 13, color: '#475569' }}>
                                Tôi đồng ý với <strong>Quy chế đào tạo</strong> và <strong>Chính sách bảo mật</strong> của FPT Language Center.
                            </Checkbox>
                        </Form.Item>

                        <button
                            type="submit"
                            className={styles['auth-submit-btn']}
                            disabled={isSubmit}
                        >
                            {isSubmit ? (
                                'Đang khởi tạo tài khoản...'
                            ) : (
                                <>
                                    <RocketOutlined /> HOÀN TẤT ĐĂNG KÝ HỌC VIÊN
                                </>
                            )}
                        </button>
                    </Form>

                    <div className={styles['form-footer']}>
                        Đã có tài khoản thành viên?
                        <Link to="/login">Đăng nhập ngay</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;