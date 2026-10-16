# Frontend FPT Tech Development Rules

## 1. Project Overview & Tech Stack
* **Framework**: React 18 (SWC) with Vite 4
* **Language**: TypeScript 5.3
* **UI Components**: Ant Design 5 (`antd`), `@ant-design/icons`, `@ant-design/pro-components`
* **State Management**: Redux Toolkit (`@reduxjs/toolkit`, `react-redux`)
* **Styling**: SCSS Modules (`*.module.scss`), Ant Design design tokens
* **Routing**: `react-router-dom` v6
* **Date Management**: `dayjs` (do NOT use `moment`)
* **HTTP Client**: Axios with custom interceptors (`src/config/axios-customize.ts`)

---

## 2. Coding Standards & Guidelines

### File & Folder Conventions
* Component files: `PascalCase.tsx` or `name.domain.tsx` (e.g. `modal.user.tsx`, `view.user.tsx`).
* Redux slices: `src/redux/slice/<entity>Slide.ts`.
* Styles: `src/styles/*.module.scss` or `[component].module.scss`.
* API functions: Export typed functions in `src/config/api.ts`.
* Backend models: Add interfaces to `src/types/backend.d.ts`.

### Component & Hook Rules
* Always type component props with TypeScript interfaces.
* Always use typed Redux hooks: `useAppDispatch` and `useAppSelector` from `@/redux/hooks`.
* When fetching or mutating data in UI, follow standard response checking:
  - If `res && res.data`: show `message.success(...)`.
  - Otherwise: show `notification.error({ message: 'Có lỗi xảy ra', description: res.message })`.

### Permissions & Access Control
* Wrap any sensitive buttons or action triggers (Create, Edit, Delete, Admin-only view) with:
  ```tsx
  <Access permission={ALL_PERMISSIONS.RESOURCE.ACTION} hideChildren>
      {/* action element */}
  </Access>
  ```
* Reference permissions from `src/config/permissions.ts`.

### Import Aliases
* Prefer `@/` alias (e.g., `@/components/...`, `@/redux/...`, `@/config/...`, `@/types/...`).
* Do NOT use long relative paths like `../../../`.

### Quality & Type Checking
* Keep strict TypeScript compliance.
* Verify changes by executing `npx tsc --noEmit` from the `frontend_fpt_tech` folder.

