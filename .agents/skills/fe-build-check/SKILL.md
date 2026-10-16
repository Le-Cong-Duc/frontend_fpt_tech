---
name: fe-build-check
description: >-
  Use this skill when validating TypeScript code, fixing build or lint errors, running Vite
  production builds, or troubleshooting frontend issues in frontend_fpt_tech.
---

# Frontend Build & Quality Check Skill

This skill guides running type checking, diagnosing compile issues, and ensuring production readiness in `frontend_fpt_tech`.

---

## 1. Execution Commands

Always run these commands from the `frontend_fpt_tech` directory:

```powershell
# 1. Type checking only (fastest way to verify TS correctness without bundling)
npx tsc --noEmit

# 2. Full production build (runs tsc and vite build)
npm run build

# 3. Preview built artifacts
npm run preview
```

---

## 2. Common TypeScript & React 18 Pitfalls in this Project

### A. Date handling with Day.js & Ant Design
* **Problem**: Ant Design `DatePicker` supplies and expects a `dayjs.Dayjs` object, while backend APIs store ISO 8601 strings (e.g. `"2026-10-16T14:30:00.000Z"`).
* **Fix when populating Form (`dataInit`)**:
  ```typescript
  import dayjs from 'dayjs';

  form.setFieldsValue({
      ...dataInit,
      startDate: dataInit.startDate ? dayjs(dataInit.startDate) : undefined,
  });
  ```
* **Fix before submitting to API**:
  ```typescript
  const payload = {
      ...values,
      startDate: values.startDate ? values.startDate.toISOString() : undefined,
  };
  ```

### B. ProColumns & DataTable Typing
* **Problem**: `render: (text, record, index, action)` typing errors when returning JSX.
* **Fix**: Ensure column definition uses `ProColumns<YourInterface>[]`:
  ```typescript
  import { ProColumns } from '@ant-design/pro-components';

  const columns: ProColumns<ICourse>[] = [
      {
          title: 'Tên khóa học',
          dataIndex: 'name',
          render: (_dom, entity) => <span>{entity.name}</span>,
      },
  ];
  ```

### C. Redux Store Typing
* **Problem**: State property not found on `state.yourEntity`.
* **Fix**: Verify that:
  1. The reducer is registered in `src/redux/store.ts`.
  2. You import typed hooks `useAppSelector` and `useAppDispatch` from `@/redux/hooks` (never import raw `useSelector`/`useDispatch` from `react-redux`).

### D. Environment Variables in Vite
* **Problem**: `process.env` is not defined in browser code in Vite.
* **Fix**: Use `import.meta.env.VITE_BACKEND_URL` or `import.meta.env.VITE_PORT`. All client variables must be prefixed with `VITE_`.

### E. Path Aliases
* Supported aliases in `vite.config.ts`:
  - `@/` -> `src/`
  - `components/` -> `src/components/`
  - `styles/` -> `src/styles/`
  - `config/` -> `src/config/`
  - `pages/` -> `src/pages/`
* Prefer using `@/...` for uniform, unambiguous paths.

---

## 3. Verification Protocol

Before completing any frontend feature or refactoring:
1. Run `npx tsc --noEmit` from `frontend_fpt_tech` to ensure zero type errors.
2. Verify that no console errors appear from missing keys in loops or invalid DOM attributes.
3. Verify that all newly created buttons that perform state mutations (create, edit, delete) are properly guarded by `<Access />`.

