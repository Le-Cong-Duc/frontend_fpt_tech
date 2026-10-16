---
name: fe-component-style
description: >-
  Use this skill when creating React UI components, client portal screens, layout views,
  cards, or writing SCSS modules and Ant Design v5 styles in frontend_fpt_tech.
---

# Frontend Component & Styling Skill

This skill guides the construction of performant, responsive React 18 components using Ant Design v5 and SCSS Modules in `frontend_fpt_tech`.

---

## 1. Directory Structure Conventions

Organize files according to their domain:
```text
src/
├── components/
│   ├── admin/       # Backoffice administrative components (tables, drawers, modals)
│   ├── client/      # Portal & end-user components (cards, filters, portal header/footer)
│   └── share/       # Shared reusable primitives (access control, loading, error pages)
├── pages/
│   ├── admin/       # Admin views (/admin/...)
│   ├── auth/        # Login & Register views
│   └── client/      # Multi-role portals (student, teacher, manager, accountant, consultant)
└── styles/          # Global styles, variables, reset.scss, and shared module styles
```

---

## 2. Standard Component Template

All components must use TypeScript functional components with explicit prop types:

```tsx
import React, { FC } from 'react';
import { Card, Typography, Space, Tag } from 'antd';
import styles from 'styles/client.module.scss';

const { Title, Text } = Typography;

interface CourseCardProps {
    id: string;
    title: string;
    level?: string;
    price?: number | string;
    onSelect?: (id: string) => void;
}

export const CourseCard: FC<CourseCardProps> = ({
    id,
    title,
    level = 'BEGINNER',
    price,
    onSelect
}) => {
    return (
        <Card
            hoverable
            className={styles.cardContainer}
            onClick={() => onSelect?.(id)}
        >
            <div className={styles.cardHeader}>
                <Title level={4}>{title}</Title>
                <Tag color={level === 'ADVANCED' ? 'red' : 'blue'}>{level}</Tag>
            </div>
            <Space orientation="vertical">
                <Text orientation="secondary">Học phí:</Text>
                <Text strong>{price ? `${Number(price).toLocaleString('vi-VN')} đ` : 'Liên hệ'}</Text>
            </Space>
        </Card>
    );
};

export default CourseCard;
```

---

## 3. Styling Standards & SCSS Modules

### Rules:
1. **Never use inline styles** for layout or typography unless dynamic runtime values (e.g. calculation).
2. Use **SCSS Modules** (`[component].module.scss` or `src/styles/*.module.scss`):
   ```scss
   // styles/client.module.scss
   .cardContainer {
       border-radius: 8px;
       transition: all 0.3s ease;
       
       &:hover {
           transform: translateY(-4px);
           box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
       }
   }
   
   .cardHeader {
       display: flex;
       justify-content: space-between;
       align-items: center;
       margin-bottom: 12px;
   }
   ```
3. Use Ant Design Design Tokens (`theme.useToken()`) when matching dynamic palette:
   ```tsx
   import { theme } from 'antd';
   
   const { useToken } = theme;
   const { token } = useToken();
   // e.g. style={{ color: token.colorPrimary }}
   ```

---

## 4. Multi-Role Client Portals Pattern

The project features tailored portals for 5 user types:
- **Student**: `src/pages/client/student/` (courses, schedule, invoices, payments, profile)
- **Teacher**: `src/pages/client/teacher/` (assigned classes, students, teaching schedule, chat)
- **Manager**: `src/pages/client/manager/` (classes overview, teacher workload, student metrics)
- **Accountant**: `src/pages/client/accountant/` (tuition tracking, invoices, payments, revenue reports)
- **Consultant**: `src/pages/client/consultant/` (leads, customer inquiries, enrollment assistance, chat)

### Role Detection & Guarding:
Use helper functions from `src/config/portal.tsx`:
```tsx
import { getPortalRole, isBackofficeRole, isAccountantRole } from '@/config/portal';
import { useAppSelector } from '@/redux/hooks';

const userRole = useAppSelector(state => state.account.user.role.name);
const roleKey = getPortalRole(userRole);
```

Wrap portal content in `ClientLayout` with breadcrumbs, sidebar navigation, and header actions.

---

## 5. UI Feedback & Empty States

1. **Loading**: Use `<Loading />` from `components/share/loading` or Ant Design `Spin` / `Skeleton`.
2. **Empty Data**: Use `<Empty description="Không có dữ liệu" />`.
3. **Number Formatting**: For monetary values, use `.toLocaleString('vi-VN') + ' đ'`.
4. **Animated Counters**: Use `react-countup` for dashboard metric cards:
   ```tsx
   import CountUp from 'react-countup';
   
   <CountUp end={totalRevenue} duration={1.5} separator="," suffix=" đ" />
   ```

