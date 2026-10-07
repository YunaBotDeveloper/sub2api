# Bắt đầu nhanh

{{SITE_NAME}} là cổng API AI hợp nhất. Bạn chỉ cần **một API key** để gọi Claude, GPT, Gemini và nhiều model khác bằng đúng SDK và công cụ quen thuộc. Thứ duy nhất phải đổi là **Base URL** (địa chỉ máy chủ) và **API key**.

## Thông tin kết nối

| Mục | Giá trị |
| --- | --- |
| Base URL | `{{BASE_URL}}` |
| Base URL kiểu OpenAI (có `/v1`) | `{{BASE_URL}}/v1` |
| Xác thực | Header `Authorization: Bearer YOUR_API_KEY` |
| Header thay thế | `x-api-key: YOUR_API_KEY` (kiểu Anthropic) hoặc `x-goog-api-key: YOUR_API_KEY` (kiểu Gemini) |

> **Có `/v1` hay không?** SDK của OpenAI thường cần Base URL **có** `/v1`. Claude Code và SDK của Anthropic tự thêm `/v1/messages`, nên Base URL **không** có `/v1`. Xem bảng chi tiết tại [Cấu hình client](/docs/clients).

## Bước 1: Tạo tài khoản và nạp số dư

1. [Đăng ký](/register) hoặc [đăng nhập](/login).
2. Nạp số dư ở trang [Nạp tiền](/purchase), đổi mã nạp ở trang [Đổi mã](/redeem), hoặc mua gói thuê bao nếu trang có bán.

## Bước 2: Tạo API key

1. Mở trang [API Keys](/keys) và bấm **Tạo API Key**.
2. Chọn **nhóm (group)**. Nhóm quyết định key gọi được model nào (Claude, GPT, Gemini, …) và tính giá ra sao. **Key chưa gán nhóm thì không dùng được.**
3. Tuỳ chọn: đặt hạn mức chi tiêu, ngày hết hạn, giới hạn tốc độ hoặc danh sách IP được phép.
4. Bấm **Sử dụng** cạnh key vừa tạo. Hệ thống sẽ sinh sẵn cấu hình cho Claude Code, Codex CLI, Gemini CLI và OpenCode, đã điền key của bạn, chỉ việc copy.

> **Giữ bí mật API key.** Ai có key đều tiêu được số dư của bạn. Nếu nghi bị lộ, hãy xoá key và tạo key mới.

## Bước 3: Gửi request đầu tiên

Thay `YOUR_API_KEY` bằng key của bạn. Tên model chỉ là ví dụ, danh sách thật xem ở bước 4.

### Key thuộc nhóm Claude

```bash
curl {{BASE_URL}}/v1/messages \
  -H "x-api-key: YOUR_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-sonnet-4-6",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Xin chào!"}]
  }'
```

### Key thuộc nhóm OpenAI / GPT (và các nhóm tương thích OpenAI)

```bash
curl {{BASE_URL}}/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "content-type: application/json" \
  -d '{
    "model": "gpt-5.5",
    "messages": [{"role": "user", "content": "Xin chào!"}]
  }'
```

### Key thuộc nhóm Gemini

```bash
curl "{{BASE_URL}}/v1beta/models/gemini-2.5-flash:generateContent" \
  -H "x-goog-api-key: YOUR_API_KEY" \
  -H "content-type: application/json" \
  -d '{"contents": [{"parts": [{"text": "Xin chào!"}]}]}'
```

Nếu nhận được câu trả lời thì bạn đã kết nối thành công. Nếu gặp lỗi, xem [Lỗi thường gặp](/docs/errors).

## Bước 4: Xem model khả dụng và kiểm tra số dư

Lấy danh sách model mà key của bạn được phép gọi:

```bash
curl {{BASE_URL}}/v1/models -H "Authorization: Bearer YOUR_API_KEY"
```

Xem số dư, hạn mức và lượng dùng của key:

```bash
curl {{BASE_URL}}/v1/usage -H "Authorization: Bearer YOUR_API_KEY"
```

Nếu không muốn dùng lệnh, mở trang [Tra cứu key](/key-usage) và dán key vào; trang này không cần đăng nhập. Lịch sử chi tiết từng request có ở trang [Lịch sử sử dụng](/usage).

## Tiếp theo

- [Danh sách endpoint](/docs/endpoints): nên gọi endpoint nào cho từng loại nhóm.
- [Cấu hình client](/docs/clients): Claude Code, Codex CLI, Gemini CLI, ứng dụng chat và SDK Python/Node.js.
- [Lỗi thường gặp & FAQ](/docs/errors): ý nghĩa mã lỗi và cách xử lý.
