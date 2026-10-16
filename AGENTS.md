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
* Verify changes by executing `node ./node_modules/typescript/bin/tsc --noEmit` and `npm run build` from the `frontend_fpt_tech` folder.

---

## 3. Quy tắc tự động quản lý Git và GitHub
1. Trước khi thay đổi code, kiểm tra `git status`, branch hiện tại và cấu hình remote. Không ghi đè hoặc xóa các thay đổi có sẵn của người dùng.
2. Chủ động triển khai nhiệm vụ, chạy các bài kiểm tra phù hợp (`tsc --noEmit`, `npm run build`, v.v.) và xem lại những thay đổi đã thực hiện.
3. Khi hoàn thành một nhiệm vụ có ý nghĩa và các kiểm tra cần thiết đều đạt, tự động tạo Git commit với thông điệp ngắn gọn, rõ ràng theo Conventional Commits (ví dụ: `feat: ...`, `fix: ...`).
4. Chỉ đưa những tệp liên quan đến nhiệm vụ vào commit. Không commit `.env`, secrets, mật khẩu, token, thông tin xác thực hoặc các tệp nhạy cảm.
5. Nếu dự án đã có Git remote GitHub và xác thực hoạt động, tự động push commit lên đúng branch hiện tại sau khi commit thành công.
6. Tuyệt đối không tự ý force push (`--force`), xóa branch, sửa lịch sử commit đã chia sẻ hoặc ghi đè thay đổi của người khác.
7. Nếu kiểm thử thất bại, không được tuyên bố thành công. Hãy sửa lỗi nếu có thể; nếu chưa khắc phục được thì báo cáo và không tạo commit thành công giả.
8. Nếu Git chưa được khởi tạo, chưa có remote hoặc chưa đăng nhập GitHub, hãy thông báo tình trạng và hướng dẫn cấu hình. Không tự ý tạo repository trên GitHub hoặc thay đổi remote.
9. Không dừng lại chỉ để hỏi người dùng có muốn commit hay push hay không nếu các điều kiện trên đều đã đáp ứng và quyền thực thi cho phép.
10. Cuối nhiệm vụ, báo cáo chi tiết các thay đổi, kết quả kiểm thử, commit hash và trạng thái push GitHub. Chỉ báo đã push thành công khi đã xác minh được kết quả thực tế.

