# Thiết kế: xây lại design system frontend

## 1. Vì sao đổi token trước, không đổi màn hình trước

Ba trong bốn nguyên nhân của "AI-Slop" là thuộc tính toàn cục: thang chữ, tập màu, bộ hiệu ứng. Chúng sống trong `tailwind.config.js` và `style.css`, và mọi file trong số 299 file `.vue` đều đọc từ đó.

Nếu bắt đầu bằng redesign từng màn, mỗi màn phải tự phát minh lại thang chữ và bảng màu của nó. Đó chính là cách repo đi tới 22 họ màu. Redesign 5 màn theo cách đó tạo ra màn hình thứ 23 tới 27 có gu riêng, và 294 màn còn lại vẫn nguyên. Đổi token trước thì 299 file cùng thay đổi trong một commit hai file, và các phase sau chỉ còn là dọn phần dư.

## 2. Giá trị token

Bản chạy được nằm trong khối `:root` của `design-demo.html`. Phần dưới là giá trị chuẩn để port sang `tailwind.config.js`.

### 2.1 Thang chữ — 7 bậc

| Bậc | Cỡ | Line-height | Dùng cho |
| --- | --- | --- | --- |
| `display` | 30px | 1.15 | Số liệu lớn, hero của trang public |
| `h1` | 24px | 1.25 | Tiêu đề trang |
| `h2` | 18px | 1.3 | Tiêu đề section |
| `h3` | 15px | 1.4 | Tiêu đề card |
| `body` | 14px | 1.55 | Nội dung mặc định |
| `label` | 13px | 1.4 | Nhãn form, nút |
| `meta` | 12px | 1.4 | **Chỉ** metadata: timestamp, id, đơn vị, phần trăm phụ |

Ràng buộc quan trọng nằm ở hàng cuối. `text-xs` hiện được dùng 2.140 lần cho cả nội dung lẫn metadata; nếu không giới hạn ngữ nghĩa của bậc 12px thì thang mới sẽ sụp về đúng chỗ cũ trong vài sprint. Ràng buộc này thực thi bằng review, không bằng lint — không có cách nào tĩnh để biết một chuỗi là metadata hay nội dung.

Riêng số liệu dùng `font-mono` kèm `font-variant-numeric: tabular-nums` và canh phải. Lý do không phải thẩm mỹ: cột số bằng font tỉ lệ sẽ nhảy ngang mỗi lần auto-refresh đổi chữ số.

### 2.2 Màu — 6 token ngữ nghĩa

| Token | Light | Dark |
| --- | --- | --- |
| `surface` | `#ffffff` | `#0f1319` |
| `surface-sunken` | `#f6f7f9` | `#0a0d12` |
| `surface-raised` | `#ffffff` | `#161b22` |
| `border` | `#e3e6ea` | `#262d36` |
| `border-strong` | `#c9cfd6` | `#39424e` |
| `text` | `#12161c` | `#e6eaef` |
| `text-muted` | `#5b6673` | `#9aa6b2` |
| `text-subtle` | `#6e7885` | `#6b7787` |
| `accent` | `#0d9488` | `#2dd4bf` |
| `success` | `#157f4b` | `#34d399` |
| `warning` | `#a85a00` | `#fbbf24` |
| `danger` | `#c0392f` | `#f87171` |

`text-subtle` ở light mode là `#6e7885` chứ không phải một xám nhạt hơn: mọi giá trị nhạt hơn đều rơi xuống dưới 4.5:1 trên nền trắng. Bậc "xám thứ ba" phải là bậc còn đọc được, nếu không nó sẽ bị dùng cho nhãn thật rồi trượt xuống dưới ngưỡng.

Bốn màu semantic (`accent`, `success`, `warning`, `danger`) thay thế 20 họ màu thô. Ánh xạ khi codemod: `emerald` và `green` gộp vào `success`; `amber`, `yellow`, `orange` gộp vào `warning`; `red` và `rose` gộp vào `danger`; `blue`, `sky`, `indigo`, `violet`, `purple`, `fuchsia`, `pink`, `cyan`, `lime`, `teal` — kiểm tra từng chỗ: hoặc chuyển thành `accent`, hoặc thành `text-muted` nếu chỉ dùng để phân biệt hạng mục (trường hợp badge platform trong bảng). `zinc` và `slate` gộp vào `gray`.

Trạng thái không được phân biệt chỉ bằng màu. `StatusBadge` phải mang màu, một chấm hình, và chữ.

### 2.3 Hình học và bóng

Bo góc còn 3 bậc: `4px` (badge, ô nhỏ), `6px` (nút, input), `8px` (card, panel), cộng `9999px` cho pill. Bỏ `rounded-2xl` và `rounded-3xl`.

Bóng chỉ còn một giá trị, dành cho overlay và dropdown. Card dùng viền 1px. Xóa `shadow-glow`, `shadow-glow-lg`, `shadow-glass`, `shadow-card-hover`, `bg-mesh-gradient`, `bg-gradient-glass`, `bg-gradient-primary`, `bg-gradient-dark`, và mọi colored shadow trên nút (`shadow-primary-500/25` cùng các biến thể).

Giữ lại keyframe `glow`? Không. Nó là animation duy nhất dùng `boxShadow`, bỏ token bóng thì animation cũng vô nghĩa. Xóa cùng lúc.

## 3. ESLint: rule nào chặn được, rule nào không

ESLint trong repo này **không quét file `.vue`** — cấu hình hiện tại bỏ qua SFC, nên "eslint 0 lỗi" đang bao phủ đúng 0 SFC. Đây là điều kiện tiên quyết phải sửa trước khi bất kỳ rule nào bên dưới có tác dụng, và nó cũng giải thích vì sao 22 họ màu tích tụ được mà không ai chặn.

Sau khi bật `.vue`:

- **Chặn được bằng regex trên class string**: họ màu ngoài danh sách token (`no-restricted-syntax` khớp `\b(text|bg|border)-(blue|sky|indigo|violet|purple|fuchsia|pink|cyan|lime|zinc|slate|emerald|orange|yellow|rose)-\d+`), hex thô trong `class` (`\[#[0-9a-f]{3,8}\]`), và `bg-gradient-to-`.
- **Chặn được**: `rounded-2xl`, `rounded-3xl`, `shadow-glow`, `backdrop-blur`.
- **Không chặn được bằng lint**: dùng bậc `meta` cho nội dung thay vì metadata; màu semantic dùng sai nghĩa (`success` cho một badge không mang nghĩa thành công). Hai thứ này chỉ review bắt được.

Rule phải ban hành cùng lúc với codemod trong Phase 2, không sớm hơn: bật rule khi token chưa tồn tại thì mọi file đều đỏ và cả đội sẽ tắt rule.

## 4. Tách monolith

### 4.1 SettingsView.vue

13.221 dòng, 130 `v-if`, 17 nhánh `activeTab`. Tách theo `activeTab`: mỗi tab thành một SFC dưới `views/admin/settings/`; `SettingsView.vue` còn lại chỉ giữ thanh tab, state `activeTab`, và `<component :is>`.

Ràng buộc: state dùng chung giữa các tab đi qua `provide`/`inject` hoặc một composable, **không** truyền qua chuỗi props nhiều tầng. Đây là hình dạng đã dùng cho `GroupsView` trước đây và nó hoạt động.

Bẫy: `vue-tsc` chỉ type-check file **đi tới được từ import**. Một SFC tách ra nhưng chưa được import ở đâu sẽ không được kiểm tra và `typecheck` vẫn xanh. Vì vậy mỗi commit tách file phải kèm luôn chỗ import nó; không commit file tách rời "để sau nối".

### 4.2 CreateAccountModal và EditAccountModal

6.978 dòng cộng khoảng 5.800 dòng, phần lớn trùng nhau. Gộp thành một `AccountFormModal.vue` nhận prop `mode: 'create' | 'edit'`.

Bẫy: các spec hiện có pin **API action** của modal chứ không pin sự tương đương giữa create và edit. Nghĩa là gộp hai file mà làm lệch hành vi một chiều thì test vẫn xanh. Phải đọc chéo hai file trước khi gộp, liệt kê từng điểm khác nhau, và ghi rõ điểm nào là cố ý.

### 4.3 Quy tắc chung cho mọi lần tách

Một commit chỉ di chuyển code. Không đổi tên biến, không sửa logic, không dọn dẹp kèm theo. Commit sau mới đổi. Nếu trộn lẫn, hồi quy xuất hiện sẽ không truy được nguyên nhân trong một diff 7.000 dòng.

## 5. Kiểm chứng — bẫy riêng của repo này

- **`pnpm` và `make` không có trên máy dev hiện tại.** Gọi trực tiếp `frontend/node_modules/.bin/vue-tsc`, `.../vitest`, `.../eslint`.
- **Không dùng `2>&1` khi chạy vitest trong PowerShell.** Nó luôn báo thất bại bất kể exit code thật, nên mọi phép đo cổng chất lượng đều sai.
- **`vue-tsc` bỏ qua file spec** và bỏ qua component chưa được import. Nó là cổng thật cho SFC, nhưng không phải cổng đầy đủ.
- **`make test-frontend` chỉ chạy danh sách `FRONTEND_CRITICAL_VITEST`**, không chạy toàn bộ suite. Phase 3 phải chạy `vitest run` đầy đủ, không dựa vào cổng CI.
- **Function coverage sẽ giảm sau mỗi lần tách SFC** do boilerplate mỗi file làm phình mẫu số của v8. Không phải hồi quy; đừng đuổi theo con số.
- **Kiểm tra thị giác**: mở `design-demo.html`, bật cả light và dark. Sau Phase 1, chụp lại 5 màn trọng điểm ở 375px, 768px, 1024px, 1440px và so với ảnh chụp trước khi đổi.

## 6. Phương án đã cân nhắc và bác bỏ

**Viết lại frontend từ đầu.** Bác bỏ: 63 route, 204 component, và toàn bộ logic nghiệp vụ gateway/billing/quota nằm trong đó. Chi phí là viết lại cả sản phẩm, trong khi ba trong bốn nguyên nhân sửa được bằng hai file.

**Chuyển sang một component library có sẵn (shadcn-vue, Naive UI, PrimeVue).** Bác bỏ ở phạm vi thay đổi này: nó thêm một lớp phụ thuộc mới vào giữa 204 component đang chạy, và không giải quyết thang chữ hay tập màu — thư viện nào cũng để hai thứ đó cho người dùng quyết. Có thể xét lại sau Phase 3, khi các monolith đã tách và bề mặt thay thế đủ nhỏ để đo.

**Bật rule lint trước, sửa dần theo cảnh báo.** Bác bỏ: 22 họ màu nghĩa là gần như mọi file đều vi phạm ngay ngày đầu. Rule bị tắt trong tuần đầu tiên là kết cục quen thuộc.
