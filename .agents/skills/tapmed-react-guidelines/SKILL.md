---
name: tapmed-react-guidelines
description: Core coding standards, UI styling principles, and architectural guidelines for the Tapmed React project. Use this when writing, refactoring, or reviewing components, styles, state management, routes, or network requests in this repository.
metadata:
  author: tapmed
  version: "1.0.0"
---

# Tapmed React Coding Guidelines

This guide establishes the official engineering and architectural guidelines for the Tapmed application. All future code modifications, additions, and refactoring by AI agents MUST strictly comply with these rules.

---

## 1. Technology Stack & Key Dependencies

Ensure you use ONLY the allowed libraries and tools that are already declared in the project's dependency tree:

- **UI Frameworks**:
  - **Ant Design (antd) v5**: Primary component library for general UI elements, tables, forms, modals, and notifications.
  - **PrimeReact v9**: Used for specific high-performance UI widgets.
  - **PrimeFlex v3**: Utility CSS library used for fast grid, layout, spacing, and styling without writing custom class names.
- **Styling**:
  - **Vanilla CSS / SCSS**: For custom styling. Store component-specific styles next to the component (e.g., `MyComponent.css`).
  - **Tailwind CSS**: Do **NOT** install or use Tailwind CSS unless explicitly requested by the user. Prefer `PrimeFlex` utilities for inline utility styles.
- **State Management**:
  - **Redux Toolkit**: Centrally configured at `src/store/index.js`.
  - Slice registrations reside in their corresponding feature folders (e.g., `src/pages/kho/store/kho.js`).
- **Routing**:
  - **react-router-dom v6**: Configured in `src/router/home.js` and `src/router/routes.js`.
- **API & Networking**:
  - **Axios**: Custom configured instance with rate limiting and automated JWT refresh interceptor at `src/utils/axiosInstance.js`.
- **Icon Packages**:
  - `lucide-react`, `@iconscout/react-unicons`, and `primeicons`.
- **Utilities**:
  - **Day.js**: Preferred date/time library over Moment.js for new utilities.
  - **Number Formatting**: Always use `formatCurrency`, `formatNumber`, or `formatData` from `src/pharmacy-utils/hook/dataFormatHelper.js` when displaying money or quantities.
  - **Read Vietnamese Numbers**: Use `read-vietnamese-number` or `vn-num2words`.
  - **Authentication**: Use the `jwt` object exported from `src/utils/jwt.js` to handle `access_token`, `refresh_token`, and JWT claims rather than manually reading `localStorage`.

---

## 2. Coding Standards & Conventions

### Component Structure
- Always export React components as `default`.
- Prefer functional components with hooks over class components.
- Group components inside their feature directories (e.g., `src/pages/kho/components/`).

### Routing & Code Splitting
- Always import page-level components dynamically in `src/router/home.js` using the **`lazyRetry`** utility (defined at `src/utils/lazyRetry.js`) to handle network hiccup recovery.
- **Example**:
  ```javascript
  import { lazyRetry } from "../utils/lazyRetry";
  const MyNewPage = lazyRetry(() => import("../pages/MyNewPage"));
  ```

### API & Services
- Never create raw Axios instances or fetch requests directly. Always import and use the custom axios instance from `src/utils/axiosInstance.js`.
- All requests should route to backend RPC / API endpoints defined in constant files.

### Styling & Utility Classes
- Keep inline styles to an absolute minimum.
- Combine **PrimeFlex v3** classes (like `flex`, `align-items-center`, `justify-content-between`, `gap-2`, `p-inputtext`) with custom CSS selectors for responsive and clean rendering.
- Follow the Ant Design v5 Design Token customization rules specified in `src/utils/theme.js` to ensure brand consistency.

### Notifications & Error Messages
- Use `notificationManager` (from `src/utils/notificationManager.js`) to display standard alert banners or single-instance alerts (e.g., preventing spamming the user with duplicate notifications).
  ```javascript
  import notificationManager from "src/utils/notificationManager";
  notificationManager.showMessageOnce(itemKey, `Message content`);
  ```

### Batch Upload & Concurrency
- For uploading multiple images or files concurrently, always compress the images using the `imageCompression.js` utility, and execute the uploads through the `runWithConcurrencyLimit.js` helper to avoid saturating HTTP sockets.

---

## 3. Anti-Patterns (What to Avoid)

1. **NO Next.js Features**: Never import Next.js modules (`next/router`, `next/dynamic`, `next/link`, etc.). The app is a standard React SPA.
2. **NO Arbitrary CSS Frameworks**: Do not introduce styling libraries like Tailwind CSS or styled-components.
3. **NO Duplicate Axios Configurations**: Do not write new Axios setups or custom headers in individual services. Everything must flow through `axiosInstance.js`.
4. **NO Raw Lazy Imports**: Do not use `React.lazy()` for route files; use `lazyRetry()` instead to avoid crash-looping when server files update.
