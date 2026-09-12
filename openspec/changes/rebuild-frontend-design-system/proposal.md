## Why

Frontend hiện tại bị đánh giá là "AI-Slop". Khảo sát `frontend/src` (299 file `.vue`, 204 component, 81 view, 63 route, 11MB) cho thấy đó không phải cảm tính — có bốn nguyên nhân đo được, và ba trong số đó nằm ở tầng token chứ không nằm ở từng màn hình.

**1. Thang chữ sụp đổ — nguyên nhân số một.**

```
text-xs  2140   text-sm  1982   text-lg  130
text-2xl   53   text-xl    49   text-3xl  18
```

94% số lần khai cỡ chữ trong toàn app là 12px hoặc 14px. Không có bậc phân cấp nên không có gì dẫn mắt. Đây là lý do giao diện đọc như một bảng tính dày đặc, và không màn hình đơn lẻ nào tự sửa được vì vấn đề nằm ở scale.

**2. Màu không mang nghĩa — 22 họ màu song song.**

`gray` 9920 · `dark` 2902 · `primary` 1482 · `red` 932 · `amber` 718 · `blue` 704 · `emerald` 398 · `green` 380 · `purple` 312 · `orange` 172 · `yellow` 146 · `sky` 127 · `rose` 89 · `indigo` 80 · `violet` 57 · `teal` 50 · `pink` 46 · `zinc` 38 · `slate` 37 · `cyan` 35 · `fuchsia` 10 · `lime` 8.

`green` và `emerald` cùng nghĩa nhưng là hai màu. `amber`/`yellow`/`orange` ba màu một nghĩa. `blue`/`sky`/`indigo` ba màu một nghĩa. Chỉ `primary` là token ngữ nghĩa; phần còn lại là palette thô rải thẳng trong template. Hệ quả thấy rõ nhất ở `views/admin/DashboardView.vue:12-90`: bốn stat card, bốn icon tile màu blue/purple/green/emerald hoàn toàn tùy hứng, màu không encode thông tin gì.

**3. Bộ hiệu ứng theme bán sẵn.**

`tailwind.config.js` khai `shadow-glow`, `shadow-glow-lg`, `bg-mesh-gradient`, `bg-gradient-glass`; `style.css` đặt mọi biến thể nút là `bg-gradient-to-r` kèm colored shadow; `AppLayout.vue:4` phủ `bg-mesh-gradient` toàn màn hình. Trong view: 74 lần `bg-gradient-to-*`, 33 lần `backdrop-blur`, `rounded-2xl` 82 lần và `rounded-3xl` 36 lần trên tổng 12 biến thể bo góc. Gradient button + glow + glass + mesh background là đúng bộ tứ nhận diện của template mua sẵn.

**4. Design system tồn tại nhưng không được dùng.**

| Component | Trạng thái |
| --- | --- |
| `common/StatCard.vue` | 0 import — code chết |
| `common/DataTable.vue` | 27 nơi dùng, nhưng 15 view tự viết `<table>` |
| `common/BaseDialog.vue` | 72 nơi dùng, nhưng 19 file tự dựng `fixed inset-0` |

`.card` và `.btn` trong `style.css` viết đúng, nhưng view vẫn xả raw Tailwind — tồn tại class string dài trên 160 ký tự lặp lại nhiều nơi.

**Nợ cấu trúc chặn mọi việc phía sau.** `SettingsView.vue` 13.221 dòng (547KB, 130 nhánh `v-if`, 17 nhánh `activeTab`), `GroupsView.vue` 7.223 dòng, `CreateAccountModal.vue` 6.978 dòng, `EditAccountModal.vue` 236KB. Không tách những file này thì không sửa được UI của chúng — mọi chỉnh sửa đều là mù.

**Accessibility.** 1.270 `<button>` nhưng chỉ 138 `aria-label` (11%); 48 `aria-hidden`; 33 `focus-visible`; 2 chỗ `prefers-reduced-motion` trên 8 keyframe animation; 6.686 `<div>` so với 7 `<main>` và 3 `<aside>`; 19 `<h1>` trên 63 route.

## What Changes

Không viết lại 299 file. Đổi tầng token trước — nó chi phối toàn bộ 299 file mà chỉ đụng hai file.

- **Phase 1 — Token layer.** Thay `tailwind.config.js` và `style.css`: thang chữ 7 bậc, 6 token màu ngữ nghĩa, 3 bậc bo góc, xóa gradient/glow/glass/mesh, số liệu chuyển sang mono kèm `tabular-nums`. Không đụng file view nào.
- **Phase 2 — Ép dùng component.** ESLint rule chặn màu thô và hex thô. Thay 15 `<table>` thô bằng `DataTable`, 19 `fixed inset-0` bằng `BaseDialog`. Viết lại `StatCard.vue` rồi áp cho cả hai Dashboard, hoặc xóa hẳn.
- **Phase 3 — Tách monolith.** `SettingsView` tách theo `activeTab`, mỗi tab một SFC. `GroupsView` tách theo section. `CreateAccountModal` và `EditAccountModal` gộp thành một form dùng chung theo prop `mode`.
- **Phase 4 — Accessibility và 5 màn hình trọng điểm.** Bù `aria-label`, `aria-hidden`, landmark, `prefers-reduced-motion` global. Redesign thật chỉ 5 màn: Login, User Dashboard, Keys, Admin Dashboard, Settings.

Bản tham chiếu trực quan: `design-demo.html` ở gốc repo — so sánh trước/sau trên cùng màn Admin Dashboard, có cả light và dark mode, kèm bảng ánh xạ từng hạng mục về file cần sửa. Khối `:root` trong file đó chính là nội dung Phase 1.

## Capabilities

### New Capabilities

- `frontend-design-tokens`: định nghĩa thang chữ, tập token màu ngữ nghĩa, bậc bo góc và quy tắc dùng bóng; ràng buộc rằng màu chỉ được dùng khi mang nghĩa, và trạng thái không được phân biệt chỉ bằng màu.
- `frontend-component-adoption`: định nghĩa các primitive bắt buộc (`DataTable`, `BaseDialog`, `StatCard`) và điều kiện được phép bỏ qua chúng.

### Modified Capabilities

Không. Repo chưa publish capability OpenSpec nào cho frontend.

## Decisions

**Accent giữ teal `#0d9488`, không đổi sang xanh lá.** Skill `ui-ux-pro-max` gợi ý accent `#22C55E` cho hồ sơ developer-tool. Bác bỏ: teal là màu brand đang có (`primary` xuất hiện 1.482 lần), đổi accent biến một thay đổi tầng token thành một cuộc đổi thương hiệu, và không giải quyết bất kỳ nguyên nhân nào trong bốn nguyên nhân trên. Vấn đề chưa bao giờ là accent sai màu — vấn đề là có 22 màu. Dark mode dùng `#2dd4bf`.

**Body 14px, không phải 16px.** Đây là admin dày đặc; 16px làm mọi bảng dài thêm khoảng 15%. Bù lại: `input`, `select`, `textarea` nhảy lên 16px dưới breakpoint 768px để iOS không auto-zoom, và bậc `text-meta` 12px bị giới hạn chỉ dùng cho metadata, không dùng cho nội dung — chính chỗ này là nguồn gốc 2.140 lần `text-xs` hiện tại.

**Cả hai quyết định trên cần chủ dự án xác nhận trước khi bắt đầu Phase 1**, vì đổi sau khi 299 file đã bám token sẽ đắt hơn nhiều lần.

**Phase 3 đứng trước Phase 4 đối với Settings.** Không thể redesign một file 13.221 dòng. Thứ tự ngược lại buộc phải sửa mù trong một file mà không công cụ nào của repo soi được.

**Phase 2 đứng sau Phase 1.** ESLint rule chặn màu thô cần một tập token đã tồn tại để trỏ tới; ban hành rule trước khi có token sẽ chặn cả những chỗ chưa có đường thay thế hợp lệ.

**Tách monolith không được đổi hành vi trong cùng commit.** Mỗi commit tách file chỉ được di chuyển code. Đổi logic đi commit riêng — nếu không, khi hồi quy xuất hiện sẽ không phân biệt được do tách hay do sửa.

## Impact

- **Phase 1** — `frontend/tailwind.config.js`, `frontend/src/style.css`. Hai file. Revert bằng một commit. Không đụng view, không đụng test.
- **Phase 2** — cấu hình ESLint, khoảng 34 view và component (15 bảng, 19 modal), `admin/DashboardView.vue`, `user/DashboardView.vue`, `common/StatCard.vue`. Diff cơ học, review bằng mắt được.
- **Phase 3** — rủi ro cao nhất. `SettingsView.vue` (13.221 dòng), `GroupsView.vue` (7.223), `CreateAccountModal.vue` và `EditAccountModal.vue` (gộp). Tách file làm giảm function coverage của v8 do boilerplate mỗi file làm phình mẫu số — hiện tượng đã biết, không phải hồi quy.
- **Phase 4** — khoảng 1.132 icon button thiếu `aria-label`, một block `prefers-reduced-motion` global trong `style.css`, và 5 view redesign.
- **Backend**: không đụng. `internal/web/dist` chỉ là output của `pnpm build`; `internal/server/api_contract_test.go` pin JSON response shape của backend nên frontend không ảnh hưởng.
- **i18n**: Phase 4 thêm `aria-label` sẽ phát sinh key mới — phải thêm vào cả `en` và `zh`.
- **Rollback**: Phase 1 và 2 revert sạch. Phase 3 revert được nhưng tốn công vì đụng file lớn; làm từng file một, mỗi file một PR.

## Execution References

- `tasks.md`: checklist theo phase, có gate giữa các phase.
- `design.md`: giá trị token cụ thể, chiến lược ESLint rule, cách tách monolith, và các bẫy kiểm chứng riêng của repo này.
- `design-demo.html` (gốc repo): bản tham chiếu trực quan trước/sau.
