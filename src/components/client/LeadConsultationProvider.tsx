import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Button, Form, Input, Modal, Select, message } from 'antd';
import { GiftOutlined } from '@ant-design/icons';
import { callCreateLead, callFetchCourse } from '@/config/api';
import type { ICourse } from '@/types/backend';

interface LeadFormValues {
    full_name: string;
    phone: string;
    email: string;
    course_name: string;
    note?: string;
}

interface LeadConsultationContextValue {
    openLeadForm: (courseName?: string) => void;
}

const LeadConsultationContext = createContext<LeadConsultationContextValue | null>(null);

export const useLeadConsultation = () => {
    const context = useContext(LeadConsultationContext);
    if (!context) {
        throw new Error('useLeadConsultation must be used within LeadConsultationProvider');
    }
    return context;
};

const LeadConsultationProvider = ({ children }: { children: ReactNode }) => {
    const [open, setOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [courses, setCourses] = useState<ICourse[]>([]);
    const [form] = Form.useForm<LeadFormValues>();
    const selectedCourseName = Form.useWatch('course_name', form);

    useEffect(() => {
        let active = true;
        callFetchCourse('current=1&pageSize=1000')
            .then(response => {
                const result = response.data?.data?.result;
                if (active && Array.isArray(result)) setCourses(result);
            })
            .catch(() => {
                if (active) message.error('Không thể tải danh sách khóa học cho biểu mẫu tư vấn.');
            });
        return () => { active = false; };
    }, []);

    const openLeadForm = useCallback((courseName?: string) => {
        form.resetFields();
        form.setFieldsValue({
            course_name: courseName || undefined,
        });
        setOpen(true);
    }, [form]);

    const submitLead = async (values: LeadFormValues) => {
        setSubmitting(true);
        try {
            const response = await callCreateLead({
                ...values,
                full_name: values.full_name.trim(),
                phone: values.phone.trim(),
                email: values.email.trim(),
                note: values.note?.trim() || 'Đăng ký tư vấn lộ trình và nhận học bổng',
            });
            if (!response?.data) {
                message.error(response?.message || 'Không thể gửi yêu cầu tư vấn.');
                return;
            }
            setOpen(false);
            form.resetFields();
            message.success('Đã gửi thông tin. Tư vấn viên sẽ liên hệ với bạn sớm.');
        } catch {
            message.error('Không thể gửi thông tin tư vấn. Vui lòng thử lại sau.');
        } finally {
            setSubmitting(false);
        }
    };

    const contextValue = useMemo(() => ({ openLeadForm }), [openLeadForm]);

    return (
        <LeadConsultationContext.Provider value={contextValue}>
            {children}
            <Modal
                title={<span><GiftOutlined style={{ color: '#f97316', marginRight: 8 }} />Đăng ký tư vấn & nhận học bổng</span>}
                open={open}
                onCancel={() => setOpen(false)}
                footer={null}
                destroyOnClose
                centered
            >
                <p>Để lại thông tin, tư vấn viên sẽ liên hệ để hỗ trợ lộ trình học phù hợp.</p>
                <Form form={form} layout="vertical" onFinish={submitLead}>
                    <Form.Item
                        name="full_name"
                        label="Họ và tên"
                        rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập họ và tên.' }]}
                    >
                        <Input placeholder="Nhập họ và tên" maxLength={120} />
                    </Form.Item>
                    <Form.Item
                        name="phone"
                        label="Số điện thoại"
                        rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập số điện thoại.' }]}
                    >
                        <Input placeholder="Nhập số điện thoại" maxLength={30} />
                    </Form.Item>
                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                            { required: true, message: 'Vui lòng nhập email.' },
                            { type: 'email', message: 'Email không đúng định dạng.' },
                        ]}
                    >
                        <Input placeholder="Nhập email liên hệ" maxLength={160} />
                    </Form.Item>
                    <Form.Item
                        name="course_name"
                        label="Chương trình quan tâm"
                        rules={[{ required: true, message: 'Vui lòng chọn khóa học quan tâm.' }]}
                    >
                        <Select
                            showSearch
                            placeholder="Chọn khóa học"
                            optionFilterProp="label"
                            options={[
                                ...courses.map(course => ({ value: course.name, label: course.name })),
                                ...(selectedCourseName && !courses.some(course => course.name === selectedCourseName)
                                    ? [{ value: selectedCourseName, label: selectedCourseName }]
                                    : []),
                            ]}
                            notFoundContent="Chưa có khóa học"
                        />
                    </Form.Item>
                    <Form.Item name="note" label="Mục tiêu học tập">
                        <Input.TextArea rows={3} placeholder="Chia sẻ mục tiêu hoặc thời gian mong muốn" maxLength={500} />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" icon={<GiftOutlined />} loading={submitting} block>
                        Gửi yêu cầu tư vấn
                    </Button>
                </Form>
            </Modal>
        </LeadConsultationContext.Provider>
    );
};

export default LeadConsultationProvider;
