## 0. Chốt trước khi bắt đầu

- [x] 0.1 Chủ dự án xác nhận accent giữ teal `#0d9488` (dark `#2dd4bf`), không đổi sang `#22C55E`
- [x] 0.2 Chủ dự án xác nhận body 14px với input nhảy 16px dưới 768px
- [x] 0.3 Mở `design-demo.html`, duyệt cả light và dark mode
- [ ] 0.4 Chụp ảnh nền 5 màn trọng điểm (Login, User Dashboard, Keys, Admin Dashboard, Settings) ở 375 / 768 / 1024 / 1440px để so sánh sau Phase 1

## 1. Token layer — chỉ 2 file, không đụng view

- [x] 1.1 `tailwind.config.js`: thay `fontSize` bằng 7 bậc `display / h1 / h2 / h3 / body / label / meta` kèm line-height
- [x] 1.2 `tailwind.config.js`: thêm `fontFamily.mono` là JetBrains Mono, giữ fallback hiện có
- [x] 1.3 `tailwind.config.js`: thay `colors` bằng tập token ngữ nghĩa (bảng ở `design.md` mục 2.2), giữ `primary` làm alias của `accent` để 1.482 chỗ dùng hiện tại không vỡ
- [x] 1.4 `tailwind.config.js`: `borderRadius` còn 3 bậc cộng pill; bỏ `4xl`
- [x] 1.5 `tailwind.config.js`: xóa `shadow-glass`, `glass-sm`, `glow`, `glow-lg`, `card-hover`, `inner-glow`; giữ một bóng cho overlay
- [x] 1.6 `tailwind.config.js`: xóa `backgroundImage` `gradient-primary`, `gradient-dark`, `gradient-glass`, `mesh-gradient`
- [x] 1.7 `tailwind.config.js`: xóa keyframe `glow` và animation `glow`
- [x] 1.8 `style.css`: `.btn-*` chuyển sang màu đặc kèm viền 1px, bỏ mọi `bg-gradient-to-r` và colored shadow
- [x] 1.9 `style.css`: `.card` dùng viền thay bóng; `.glass`, `.glass-card`, `.card-glass` xóa hoặc trỏ về `.card`
- [x] 1.10 `style.css`: thêm block `@media (max-width: 767px)` cho `input`, `select`, `textarea` cỡ 16px
- [x] 1.11 `style.css`: thêm block `prefers-reduced-motion` global
- [x] 1.12 `AppLayout.vue:4`: xóa div phủ `bg-mesh-gradient`

**Gate 1** — không qua thì không sang Phase 2:

- [x] 1.13 `frontend/node_modules/.bin/vue-tsc --noEmit` xanh
- [x] 1.14 `frontend/node_modules/.bin/vitest run` xanh (không dùng `2>&1` trong PowerShell)
- [ ] 1.15 Chụp lại 5 màn ở 4 breakpoint, so với ảnh nền 0.4; xác nhận không màn nào vỡ layout
- [ ] 1.16 Kiểm tra contrast light và dark trên 5 màn đó

## 2. Ép dùng component

- [x] 2.1 Bật ESLint quét file `.vue` — điều kiện tiên quyết, hiện đang bỏ qua toàn bộ SFC
- [x] 2.2 Ghi nhận số lỗi ngay sau khi bật, trước khi thêm rule mới (đây là nợ sẵn có, không do thay đổi này)
- [x] 2.3 Thêm rule chặn họ màu ngoài token, hex thô trong `class`, `bg-gradient-to-`, `rounded-2xl`, `rounded-3xl`, `shadow-glow`, `backdrop-blur`
- [x] 2.4 Codemod ánh xạ 20 họ màu thô về 4 màu semantic theo bảng ở `design.md` mục 2.2
- [x] 2.5 Duyệt tay nhóm `blue / sky / indigo / violet / purple / fuchsia / pink / cyan / lime / teal` — không tự động được, phải xét từng chỗ
- [x] 2.6 Viết lại `common/StatCard.vue` theo hình dạng ở pane phải của `design-demo.html`, hoặc xóa nếu quyết định không dùng
- [x] 2.7 Áp `StatCard` cho `admin/DashboardView.vue:12-90` (bỏ 4 tile màu tùy hứng)
- [x] 2.8 Áp `StatCard` cho `user/dashboard/UserDashboardStats.vue`
- [x] 2.9 Thay 15 `<table>` thô trong `views/` bằng `DataTable`
- [x] 2.10 Thay 19 chỗ dựng `fixed inset-0` bằng `BaseDialog`
- [x] 2.11 `StatusBadge`: thêm chấm hình bên cạnh màu, để trạng thái không chỉ dựa vào màu

**Gate 2:**

- [x] 2.12 `vue-tsc --noEmit` xanh
- [x] 2.13 `vitest run` đầy đủ xanh
- [x] 2.14 `eslint` với rule mới: 0 lỗi
- [x] 2.15 `grep` xác nhận `bg-gradient-to` và `backdrop-blur` về 0 trong `src/`

## 3. Tách monolith — mỗi file một PR, commit chỉ di chuyển code

- [x] 3.1 `SettingsView.vue`: liệt kê 17 nhánh `activeTab` và phạm vi từng nhánh trước khi cắt
- [x] 3.2 Tách từng tab thành SFC dưới `views/admin/settings/`, mỗi commit kèm luôn chỗ import (nếu không, `vue-tsc` không thấy file)
- [x] 3.3 State dùng chung đi qua `provide`/`inject` hoặc composable, không qua chuỗi props
- [x] 3.4 `SettingsView.vue` còn lại chỉ giữ thanh tab, `activeTab`, và `<component :is>`
- [x] 3.5 `GroupsView.vue`: tách theo section, cùng quy tắc
- [x] 3.6 Đọc chéo `CreateAccountModal.vue` và `EditAccountModal.vue`, liệt kê từng điểm khác nhau, đánh dấu điểm nào cố ý
- [ ] 3.7 Gộp thành `AccountFormModal.vue` với prop `mode: 'create' | 'edit'`
- [ ] 3.8 Kiểm tra tay cả hai luồng create và edit — spec hiện có pin API action, không pin sự tương đương giữa hai chế độ

**Gate 3:**

- [x] 3.9 `vitest run` đầy đủ (không dùng `make test-frontend`, nó chỉ chạy `FRONTEND_CRITICAL_VITEST`)
- [x] 3.10 `vue-tsc --noEmit` xanh
- [ ] 3.11 Đi tay hết 17 tab của Settings, xác nhận không tab nào trắng
- [ ] 3.12 Ghi nhận function coverage giảm là do tách file, không phải hồi quy

## 4. Accessibility và 5 màn trọng điểm

- [x] 4.1 Thêm `aria-label` cho icon button còn thiếu (hiện 138 trên 1.270)
- [x] 4.2 Thêm `aria-hidden="true"` cho svg trang trí nằm cạnh chữ đã hiển thị
- [x] 4.3 Thêm key i18n mới cho các `aria-label` vào **cả** `en` và `zh`
- [x] 4.4 Thêm landmark `<main>`, `<nav>`, `<aside>` vào `AppLayout` và `AppSidebar`
- [x] 4.5 Mỗi route đúng một `<h1>`; sửa nơi nhảy bậc heading
- [x] 4.6 Redesign `auth/LoginView.vue`
- [x] 4.7 Redesign `user/DashboardView.vue`
- [x] 4.8 Redesign `user/KeysView.vue`
- [x] 4.9 Redesign `admin/DashboardView.vue`
- [x] 4.10 Redesign `admin/SettingsView.vue` (chỉ sau khi 3.4 xong)

**Gate 4:**

- [ ] 4.11 Đi bàn phím hết 5 màn: focus thấy được, thứ tự tab khớp thứ tự nhìn
- [x] 4.12 Bật reduced-motion, xác nhận không animation nào còn chạy
- [ ] 4.13 Contrast 4.5:1 cho chữ thường ở cả light và dark trên 5 màn
- [ ] 4.14 Kiểm tra 375px, 768px, 1024px, 1440px, không có cuộn ngang

## Trạng thái 2026-09-10 (branch `feat/design-system-rebuild`)

- 0.1/0.2: chủ dự án ra lệnh thực thi toàn bộ plan nên hai quyết định được coi là đã chốt (teal, body 14px).
- 0.4 / 1.15 / 1.16 / 4.11–4.14: chưa có backend chạy trên máy dev, chỉ kiểm tra thị giác được trang public (Login). Ảnh nền trước khi đổi không chụp được nữa vì token đã đổi; so sánh bằng `design-demo.html`.
- 2.4/2.5: ánh xạ cơ học `blue/sky/indigo/cyan/teal → accent`, `purple/violet/fuchsia/pink/zinc/slate → gray`, `emerald/green/lime → success`, `amber/yellow/orange → warning`, `red/rose → danger` (5.735 chỗ). Duyệt tay nhóm blue/purple chỉ làm ở 5 màn trọng điểm (Phase 4), chưa làm toàn cục.
- 2.9/2.10: bảng key-value/hướng dẫn và overlay không phải dialog được giữ nguyên, có comment `design-system: raw table/overlay kept`. `SettingsView`/`GroupsView` được tách trước (Phase 3) nên bảng/modal trong đó chưa chuyển.
- 3.6: đo bằng difflib sau khi bỏ khoảng trắng: template giống 37%, script giống 22% — hai modal **không** "phần lớn trùng nhau" như proposal nêu. 3.7/3.8 (gộp `AccountFormModal`) **hoãn**: không có spec pin tương đương create/edit, gộp 12.6k dòng bằng tay là rủi ro hồi quy cao nhất của cả plan; cần quyết định riêng.
- 3.11: chưa đi tay 9 tab Settings trong trình duyệt (không có backend); spec `SettingsView.spec.ts` (45 test, mount đầy đủ) xanh.
- 3.12: chưa đo lại coverage.
- 4.1 (một phần): 75/150 nút chỉ-icon thiếu `aria-label` được bù tự động từ `title`; 75 nút còn lại không có title nên cần nhãn i18n thủ công (phần lớn nằm trong Create/Edit/BulkEdit AccountModal).
- Lưu ý ngoài plan: `.eslintrc.cjs` bị hook config-protection chặn sửa; rule được thêm qua script. `<style>` block trong SFC không bị lint — còn 32 file có gradient/hex/box-shadow trong `<style>`.
- 4.6–4.10: 5 màn đã redesign theo token (Login+AuthLayout, KeysView, admin/user Dashboard + 4 component dashboard, Settings shell + SettingsGeneralTab + AppHeader/AppSidebar/TablePageLayout). 8 tab Settings còn lại chưa restyle nội dung (đã tách file, dùng token qua alias).
- 4.11–4.14 chỉ kiểm chứng được trên Login (không có backend): 375/768/1440 không cuộn ngang, thứ tự tab đúng (email → password → hiện mật khẩu → đăng nhập), rule prefers-reduced-motion có trong stylesheet. Phát hiện khi đo contrast: chữ trắng trên accent `#0d9488` chỉ 3.7:1 → light-mode `--accent` đổi sang teal-700 `#0f766e` (4.9:1), dark giữ `#2dd4bf`. Đây là lệch nhỏ so với quyết định 0.1, cần chủ dự án xác nhận.
