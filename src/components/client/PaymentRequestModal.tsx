import { useState } from 'react';
import { Alert, Button, Card, Descriptions, message, Modal, Radio, Space, Tag } from 'antd';
import { BankOutlined, CreditCardOutlined, DollarOutlined } from '@ant-design/icons';
import { callCreatePayment, callUpdateInvoice } from '@/config/api';
import type { IPortalInvoice } from '@/types/backend';
import { invoiceCourse, money } from '@/pages/client/student/student.shared';
import styles from '@/styles/client.module.scss';

interface PaymentRequestModalProps {
    invoice: IPortalInvoice | null;
    userName?: string;
    onClose: () => void;
    onRequested: () => void;
}

const PaymentRequestModal = ({ invoice, userName, onClose, onRequested }: PaymentRequestModalProps) => {
    const [paymentMethod, setPaymentMethod] = useState<'BANK_TRANSFER' | 'CASH'>('BANK_TRANSFER');
    const [submitting, setSubmitting] = useState(false);

    const handleRequest = async () => {
        if (!invoice?._id) {
            message.error('Không xác định được hóa đơn cần thanh toán.');
            return;
        }

        setSubmitting(true);
        let invoiceMarkedPending = false;
        try {
            await callUpdateInvoice({ status: 'WAITING_CONFIRMATION' }, invoice._id);
            invoiceMarkedPending = true;
            await callCreatePayment({
                invoice_id: invoice._id,
                payment_method: paymentMethod,
                payment_date: new Date().toISOString(),
            });
            message.success('Yêu cầu thanh toán đã được gửi và đang chờ xác nhận.');
            onRequested();
        } catch {
            if (invoiceMarkedPending) {
                try {
                    await callUpdateInvoice({ status: invoice.status || 'UNPAID' }, invoice._id);
                } catch {
                    message.error('Không thể hoàn tất yêu cầu và không khôi phục được trạng thái hóa đơn. Vui lòng liên hệ kế toán.');
                    setSubmitting(false);
                    return;
                }
            }
            message.error('Không thể gửi yêu cầu thanh toán. Vui lòng thử lại.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            title={<Space><CreditCardOutlined /><span>Thanh toán học phí</span></Space>}
            open={Boolean(invoice)}
            onCancel={onClose}
            footer={[
                <Button key="cancel" onClick={onClose}>Đóng</Button>,
                <Button key="submit" type="primary" loading={submitting} onClick={handleRequest}>
                    Gửi yêu cầu thanh toán
                </Button>,
            ]}
            width={640}
        >
            {invoice && (
                <>
                    <div className={styles['payment-request-summary']}>
                        <span>Số tiền cần thanh toán</span>
                        <strong>{money(invoice.final_amount || invoice.amount)}</strong>
                        <p>Khóa học: <b>{invoiceCourse(invoice)}</b></p>
                        <p>Lớp học: <b>{invoice.enrollment_id?.class_id?.class_name || 'Lớp học'}</b></p>
                    </div>

                    <Radio.Group
                        value={paymentMethod}
                        onChange={event => setPaymentMethod(event.target.value)}
                        className={styles['payment-request-methods']}
                    >
                        <Radio.Button value="BANK_TRANSFER">
                            <Space><BankOutlined />Chuyển khoản ngân hàng</Space>
                        </Radio.Button>
                        <Radio.Button value="CASH">
                            <Space><DollarOutlined />Tiền mặt tại trung tâm</Space>
                        </Radio.Button>
                    </Radio.Group>

                    {paymentMethod === 'BANK_TRANSFER' ? (
                        <Card size="small" className={styles['payment-request-bank-card']}>
                            <div className={styles['payment-request-qr-wrap']}>
                                <img src="/images/techcombank-payment-qr.png" alt="Mã QR thanh toán Techcombank" />
                            </div>
                            <Descriptions column={1} size="small" bordered>
                                <Descriptions.Item label="Số tiền">
                                    <b>{money(invoice.final_amount || invoice.amount)}</b>
                                </Descriptions.Item>
                                <Descriptions.Item label="Nội dung chuyển khoản">
                                    <Tag color="orange">
                                        HOCPHI {invoice._id?.slice(-8).toUpperCase() || ''} {userName || ''}
                                    </Tag>
                                </Descriptions.Item>
                            </Descriptions>
                            <Alert
                                type="info"
                                showIcon
                                message="Sau khi chuyển khoản, gửi yêu cầu để kế toán xác nhận."
                                description="Hóa đơn sẽ hiển thị trạng thái Chờ xác nhận. Trạng thái thanh toán chỉ được cập nhật sau khi kế toán đối soát."
                                style={{ marginTop: 12 }}
                            />
                        </Card>
                    ) : (
                        <Alert
                            type="info"
                            showIcon
                            message="Thanh toán tiền mặt"
                            description="Vui lòng nộp học phí tại trung tâm. Yêu cầu sẽ ở trạng thái chờ xác nhận cho đến khi kế toán ghi nhận."
                        />
                    )}
                </>
            )}
        </Modal>
    );
};

export default PaymentRequestModal;
