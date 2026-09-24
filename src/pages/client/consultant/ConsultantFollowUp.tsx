import { useMemo, useState } from 'react';
import { Card, Empty, Input, Select, Tag } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import { ConsultantEmpty, ConsultantState, statusTag, useConsultantData } from './consultant.shared';
import styles from '@/styles/client.module.scss';

const ConsultantFollowUp = () => {
    const data = useConsultantData(); const [search, setSearch] = useState(''); const [course, setCourse] = useState<string>();
    const groups = useMemo(() => ['NEW', 'CONSULTED', 'REGISTERED'].map(status => ({ status, items: data.leads.filter(lead => (lead.status?.toUpperCase() || 'NEW') === status && `${lead.full_name || lead.name} ${lead.course_name}`.toLowerCase().includes(search.toLowerCase()) && (!course || lead.course_name === course)) })), [course, data.leads, search]);
    return <main className={`${styles.container} ${styles['consultant-page']}`}><section className={styles['consultant-page-heading']}><div><span>CONSULTANT / PIPELINE</span><h1>Theo dõi khách hàng</h1><p>Pipeline tư vấn từ khách mới đến đăng ký học.</p></div></section><ConsultantState loading={data.loading} error={data.error}>{!data.leads.length ? <ConsultantEmpty description="Chưa có khách hàng" /> : <><div className={styles['consultant-filters']}><Input.Search placeholder="Tìm khách hàng" value={search} onChange={event => setSearch(event.target.value)} /><Select allowClear placeholder="Khóa học" value={course} onChange={setCourse} options={[...new Set(data.leads.map(lead => lead.course_name).filter(Boolean))].map(value => ({ label: value, value }))} /></div><div className={styles['consultant-kanban']}>{groups.map(group => <Card key={group.status} title={<span>{statusTag(group.status)} <b>{group.items.length}</b></span>} className={styles['consultant-column']}>{group.items.length ? group.items.map(lead => <div className={styles['consultant-lead-card']} key={lead._id}><strong>{lead.full_name || lead.name}</strong><span>{lead.course_name}</span><small>{lead.phone}</small></div>) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Trống" />}</Card>)}</div><div className={styles['consultant-pipeline-note']}><ArrowRightOutlined /> Ghi chú hiện tại được lưu tại Lead.note; backend chưa có lịch sử nhiều lần tư vấn.</div></>}</ConsultantState></main>;
};
export default ConsultantFollowUp;
