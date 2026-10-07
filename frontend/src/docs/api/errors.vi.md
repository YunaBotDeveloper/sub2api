# Lỗi thường gặp & FAQ

## Đọc thông báo lỗi

Khi request thất bại, server trả về mã HTTP kèm JSON mô tả lỗi. Lỗi do chính {{SITE_NAME}} sinh ra (key, số dư, quyền) có dạng:

```json
{ "code": "INSUFFICIENT_BALANCE", "message": "Insufficient account balance" }
```

Lỗi trong quá trình gọi model thì theo định dạng của endpoint bạn gọi, ví dụ `{"error": {"type": "...", "message": "..."}}` cho kiểu OpenAI/Anthropic. Đọc trường `code` hoặc `message` để biết nguyên nhân.

## Bảng mã lỗi

| HTTP | Mã / thông báo | Nguyên nhân | Cách xử lý |
| --- | --- | --- | --- |
| 400 | `api_key_in_query_deprecated` | Gửi key qua `?key=` hoặc `?api_key=` | Gửi key qua header `Authorization: Bearer ...` |
| 400 | `invalid_request_error` | Body sai định dạng, thiếu `model`, JSON lỗi | Kiểm tra lại body theo [Danh sách endpoint](/docs/endpoints) |
| 401 | `API_KEY_REQUIRED` | Không gửi key | Thêm header `Authorization: Bearer YOUR_API_KEY` |
| 401 | `INVALID_API_KEY` | Key sai, copy thiếu ký tự, hoặc key đã bị xoá | Copy lại key ở trang [API Keys](/keys) |
| 401 | `API_KEY_DISABLED` | Key đang bị tắt | Bật lại key ở trang API Keys |
| 401 | `USER_INACTIVE` | Tài khoản bị khoá | Liên hệ quản trị viên |
| 403 | `INSUFFICIENT_BALANCE` | Hết số dư | [Nạp tiền](/purchase) hoặc [đổi mã](/redeem) |
| 403 | `API_KEY_EXPIRED` | Key đã quá ngày hết hạn | Gia hạn hoặc tạo key mới |
| 403 | `SUBSCRIPTION_NOT_FOUND` | Nhóm của key yêu cầu gói thuê bao nhưng bạn chưa có hoặc gói đã hết hạn | Mua hoặc gia hạn gói ở trang [Gói thuê bao](/subscriptions) |
| 403 | `not assigned to any group` | Key chưa được gán nhóm | Sửa key và chọn nhóm |
| 403 | `GROUP_DISABLED` / `GROUP_NOT_ALLOWED` | Nhóm đã bị tắt hoặc bạn không còn quyền dùng | Đổi key sang nhóm khác |
| 403 | `ACCESS_DENIED` | IP của bạn không nằm trong danh sách IP được phép của key | Sửa danh sách IP của key |
| 404 | `... is not supported for this platform` | Gọi endpoint mà nhóm không hỗ trợ (ví dụ `/v1/embeddings` với key nhóm Claude) | Xem bảng ở [Danh sách endpoint](/docs/endpoints) |
| 404 | `Model "..." is not available for this group` | Nhóm không có model này | Lấy đúng tên model từ `GET /v1/models` |
| 404 | `Not Found` (không có JSON) | Đường dẫn sai, thường do thừa hoặc thiếu `/v1` | Xem bảng Base URL ở [Cấu hình client](/docs/clients) |
| 413 | `Request body is too large` | Request quá lớn (ảnh, file đính kèm) | Giảm kích thước nội dung |
| 429 | `API_KEY_QUOTA_EXHAUSTED` | Key đã dùng hết hạn mức đặt riêng cho nó | Tăng hạn mức của key |
| 429 | `API_KEY_RATE_5H_EXCEEDED` / `_1D_` / `_7D_` | Key đã tiêu hết hạn mức chi tiêu theo cửa sổ 5 giờ / 1 ngày / 7 ngày | Chờ cửa sổ thời gian reset hoặc nới giới hạn của key |
| 429 | `rate_limit_error` | Gửi quá nhiều request cùng lúc, hoặc nhà cung cấp đang giới hạn tốc độ | Chờ một lúc rồi thử lại, giảm số request song song |
| 500 / 502 / 503 / 529 | Lỗi máy chủ hoặc nhà cung cấp quá tải | Nhà cung cấp phía sau đang lỗi tạm thời | Thử lại sau vài giây theo kiểu backoff tăng dần |

## Câu hỏi thường gặp

### Tôi nên dùng tên model nào?

Gọi `GET {{BASE_URL}}/v1/models` bằng key của bạn và dùng đúng giá trị `id` trả về. Mỗi nhóm có danh sách model khác nhau, nên tên model phải khớp với nhóm của key.

### Vì sao Claude Code vẫn bắt đăng nhập?

Claude Code chưa đọc được biến môi trường. Kiểm tra rằng `ANTHROPIC_BASE_URL` và `ANTHROPIC_AUTH_TOKEN` đã được đặt trong **đúng cửa sổ terminal** đang chạy `claude`, hoặc ghi chúng vào `~/.claude/settings.json`. Mở terminal mới rồi thử lại.

### Request dài bị ngắt giữa chừng hoặc timeout?

Bật `"stream": true` để nhận kết quả dần dần thay vì chờ cả câu trả lời, và tăng timeout phía client. Với ảnh lớn, hãy dùng endpoint bất đồng bộ `/v1/images/generations/async`.

### Chi phí được tính thế nào?

Chi phí tính theo số token đầu vào và đầu ra (kể cả token cache) nhân với đơn giá của model và hệ số giá của nhóm. Xem chi tiết từng request ở trang [Lịch sử sử dụng](/usage).

### Làm sao kiểm tra số dư mà không cần đăng nhập?

Mở trang [Tra cứu key](/key-usage) và dán key, hoặc gọi `GET {{BASE_URL}}/v1/usage`.

### Một key dùng cho nhiều máy hay nhiều ứng dụng được không?

Được. Nhưng nên tạo key riêng cho từng ứng dụng để dễ theo dõi chi phí và thu hồi khi cần.
