# Danh sách endpoint

Mọi endpoint đều xác thực bằng API key, gửi theo một trong các cách sau:

- `Authorization: Bearer YOUR_API_KEY`
- `x-api-key: YOUR_API_KEY`
- `x-goog-api-key: YOUR_API_KEY` (kiểu Gemini)

Không gửi key qua query string kiểu `?key=` hay `?api_key=`: các endpoint `/v1` sẽ từ chối với lỗi `400`.

## Chọn endpoint theo nhóm của key

**Nhóm** gán cho key quyết định request được chuyển tới nhà cung cấp nào. Nên dùng endpoint "gốc" của nhóm đó. Hệ thống tự chuyển đổi một số định dạng khác, nhưng endpoint gốc là ổn định nhất.

| Nhóm | Endpoint nên dùng | Cũng dùng được |
| --- | --- | --- |
| Claude (Anthropic) | `POST /v1/messages` | `/v1/chat/completions`, `/v1/responses` |
| OpenAI / GPT | `POST /v1/responses`, `POST /v1/chat/completions` | `/v1/messages` (để chạy Claude Code), `/v1/embeddings`, `/v1/images/*` |
| Gemini | `POST /v1beta/models/{model}:generateContent` | `/v1/messages` |
| Antigravity | `POST /antigravity/v1/messages`, `/antigravity/v1beta/...` | |
| Grok (xAI) | `POST /v1/chat/completions`, `POST /v1/responses` | `/v1/messages`, `/v1/images/*`, `/v1/videos`, `/v1/tts`, `/v1/stt` |
| DeepSeek, Kimi, Zhipu, MiniMax, … | `POST /v1/chat/completions` | `/v1/messages`, `/v1/responses` |

> Gọi endpoint mà nhóm không hỗ trợ sẽ nhận lỗi `404` với thông báo dạng `... is not supported for this platform`.

Hầu hết endpoint kiểu OpenAI cũng chạy được khi bỏ tiền tố `/v1`, ví dụ `{{BASE_URL}}/chat/completions` hay `{{BASE_URL}}/responses`. Điều này hữu ích với các client tự ghép đường dẫn.

## Anthropic Messages

`POST {{BASE_URL}}/v1/messages`

Tương thích hoàn toàn với [Messages API của Anthropic](https://docs.anthropic.com/en/api/messages). Thêm `"stream": true` để nhận kết quả dạng SSE.

```bash
curl {{BASE_URL}}/v1/messages \
  -H "x-api-key: YOUR_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-sonnet-4-6",
    "max_tokens": 1024,
    "stream": true,
    "system": "Bạn là trợ lý hữu ích.",
    "messages": [{"role": "user", "content": "Giải thích HTTP 429 là gì"}]
  }'
```

Đếm token trước khi gửi: `POST {{BASE_URL}}/v1/messages/count_tokens`, body giống hệt request ở trên.

## OpenAI Chat Completions

`POST {{BASE_URL}}/v1/chat/completions`

Tương thích với [Chat Completions API của OpenAI](https://platform.openai.com/docs/api-reference/chat). Đa số ứng dụng và thư viện bên thứ ba dùng endpoint này.

```bash
curl {{BASE_URL}}/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "content-type: application/json" \
  -d '{
    "model": "gpt-5.5",
    "stream": true,
    "messages": [
      {"role": "system", "content": "Bạn là trợ lý hữu ích."},
      {"role": "user", "content": "Viết hàm đảo ngược chuỗi bằng Python"}
    ]
  }'
```

## OpenAI Responses

`POST {{BASE_URL}}/v1/responses`

Đây là API mới của OpenAI, được Codex CLI sử dụng. Ngoài HTTP còn hỗ trợ WebSocket ở `GET /v1/responses`.

```bash
curl {{BASE_URL}}/v1/responses \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "content-type: application/json" \
  -d '{
    "model": "gpt-5.5",
    "input": "Tóm tắt lợi ích của unit test trong 3 ý"
  }'
```

## Gemini (API gốc)

Tương thích với [Gemini API](https://ai.google.dev/api) nên dùng được với Gemini CLI và SDK `google-genai`.

| Mục đích | Endpoint |
| --- | --- |
| Sinh nội dung | `POST {{BASE_URL}}/v1beta/models/{model}:generateContent` |
| Sinh nội dung dạng stream | `POST {{BASE_URL}}/v1beta/models/{model}:streamGenerateContent?alt=sse` |
| Đếm token | `POST {{BASE_URL}}/v1beta/models/{model}:countTokens` |
| Danh sách model | `GET {{BASE_URL}}/v1beta/models` |

```bash
curl "{{BASE_URL}}/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse" \
  -H "x-goog-api-key: YOUR_API_KEY" \
  -H "content-type: application/json" \
  -d '{"contents": [{"role": "user", "parts": [{"text": "Kể một câu chuyện ngắn"}]}]}'
```

## Antigravity

Key thuộc nhóm Antigravity dùng các đường dẫn riêng có tiền tố `/antigravity`:

| Định dạng | Base URL |
| --- | --- |
| Kiểu Claude (Claude Code, SDK Anthropic) | `{{BASE_URL}}/antigravity` (gọi `/antigravity/v1/messages`) |
| Kiểu Gemini (Gemini CLI) | `{{BASE_URL}}/antigravity` (gọi `/antigravity/v1beta/models/...`) |
| Danh sách model | `GET {{BASE_URL}}/antigravity/v1/models` |

## Danh sách model

`GET {{BASE_URL}}/v1/models`

Trả về các model mà key của bạn được phép gọi, theo định dạng danh sách của OpenAI. Hãy copy đúng giá trị `id` của model vào trường `model` khi gọi API.

```bash
curl {{BASE_URL}}/v1/models -H "Authorization: Bearer YOUR_API_KEY"
```

## Embeddings

`POST {{BASE_URL}}/v1/embeddings` (chỉ nhóm OpenAI)

```bash
curl {{BASE_URL}}/v1/embeddings \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "content-type: application/json" \
  -d '{"model": "text-embedding-3-small", "input": "Xin chào thế giới"}'
```

## Tạo ảnh

Dùng được với nhóm OpenAI và Grok.

| Mục đích | Endpoint |
| --- | --- |
| Tạo ảnh | `POST {{BASE_URL}}/v1/images/generations` |
| Sửa ảnh | `POST {{BASE_URL}}/v1/images/edits` |
| Tạo ảnh bất đồng bộ | `POST {{BASE_URL}}/v1/images/generations/async`, sau đó hỏi kết quả tại `GET {{BASE_URL}}/v1/images/tasks/{task_id}` |

Bản bất đồng bộ phù hợp với ảnh lớn hoặc chất lượng cao. Request trả về `task_id` ngay, bạn hỏi lại kết quả định kỳ thay vì giữ kết nối chờ lâu, nên tránh bị timeout.

```bash
curl {{BASE_URL}}/v1/images/generations \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "content-type: application/json" \
  -d '{"model": "gpt-image-1", "prompt": "Một chú mèo phi hành gia, tranh màu nước", "size": "1024x1024"}'
```

## Video, giọng nói và tìm kiếm (chỉ nhóm Grok)

| Mục đích | Endpoint |
| --- | --- |
| Tạo video | `POST {{BASE_URL}}/v1/videos`, xem trạng thái ở `GET {{BASE_URL}}/v1/videos/{request_id}` |
| Chuyển văn bản thành giọng nói | `POST {{BASE_URL}}/v1/tts` |
| Chuyển giọng nói thành văn bản | `POST {{BASE_URL}}/v1/stt` |
| Tìm kiếm web / X | `POST {{BASE_URL}}/v1/web_search`, `POST {{BASE_URL}}/v1/x_search` |

## Số dư và lượng dùng

`GET {{BASE_URL}}/v1/usage`

Trả về trạng thái key, số dư hoặc hạn mức còn lại, lượng dùng hôm nay và tổng cộng. Tham số tuỳ chọn `days` (1–90) dùng để lấy thống kê theo ngày.

```bash
curl "{{BASE_URL}}/v1/usage?days=7" -H "Authorization: Bearer YOUR_API_KEY"
```
