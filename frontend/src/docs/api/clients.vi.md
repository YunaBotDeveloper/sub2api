# Cấu hình client

> **Cách nhanh nhất:** vào trang [API Keys](/keys) và bấm **Sử dụng** cạnh key. Hệ thống sẽ sinh cấu hình đúng với nhóm của key (Claude Code, Codex CLI, Gemini CLI, OpenCode) cho từng hệ điều hành, đã điền sẵn key. Trang này giải thích chi tiết để bạn tự cấu hình hoặc dùng công cụ khác.

## Base URL cho từng loại công cụ

| Công cụ / thư viện | Giá trị Base URL |
| --- | --- |
| Claude Code, SDK Anthropic | `{{BASE_URL}}` |
| SDK OpenAI, Codex CLI, ứng dụng "OpenAI compatible" | `{{BASE_URL}}/v1` |
| Gemini CLI, SDK `google-genai` | `{{BASE_URL}}` |
| Key thuộc nhóm Antigravity (Claude Code / Gemini CLI) | `{{BASE_URL}}/antigravity` |

Lỗi hay gặp nhất là thừa hoặc thiếu `/v1`, khiến đường dẫn thành `/v1/v1/...` hoặc mất `/v1`, và server trả về `404`.

## Claude Code

Dùng với key thuộc nhóm Claude. Key nhóm OpenAI, Gemini, Grok, DeepSeek… cũng chạy được vì hệ thống tự chuyển đổi định dạng.

**Cách 1: biến môi trường** (chỉ có tác dụng trong cửa sổ terminal hiện tại)

macOS / Linux:

```bash
export ANTHROPIC_BASE_URL="{{BASE_URL}}"
export ANTHROPIC_AUTH_TOKEN="YOUR_API_KEY"
export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
claude
```

Windows PowerShell:

```powershell
$env:ANTHROPIC_BASE_URL="{{BASE_URL}}"
$env:ANTHROPIC_AUTH_TOKEN="YOUR_API_KEY"
$env:CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
claude
```

**Cách 2: file cấu hình** (cố định, dùng được cả cho extension VS Code)

Sửa file `~/.claude/settings.json` (Windows: `%USERPROFILE%\.claude\settings.json`):

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "{{BASE_URL}}",
    "ANTHROPIC_AUTH_TOKEN": "YOUR_API_KEY",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
  }
}
```

> Nếu máy bạn đã đặt sẵn biến `ANTHROPIC_API_KEY`, hãy xoá nó đi để tránh xung đột với `ANTHROPIC_AUTH_TOKEN`.

## Codex CLI

Dùng với key thuộc nhóm OpenAI. Tạo hai file trong thư mục `~/.codex/` (Windows: `%USERPROFILE%\.codex\`).

`config.toml`:

```toml
model_provider = "OpenAI"
model = "gpt-5.5"
disable_response_storage = true

[model_providers.OpenAI]
name = "OpenAI"
base_url = "{{BASE_URL}}/v1"
wire_api = "responses"
requires_openai_auth = true
```

`auth.json`:

```json
{
  "OPENAI_API_KEY": "YOUR_API_KEY"
}
```

Sau đó chạy `codex` như bình thường. Nút **Sử dụng** trên trang API Keys còn có thêm các tuỳ chọn nâng cao như WebSocket hay tự đồng bộ danh sách model.

## Gemini CLI

Dùng với key thuộc nhóm Gemini (nhóm Antigravity thì đổi Base URL thành `{{BASE_URL}}/antigravity`).

```bash
export GOOGLE_GEMINI_BASE_URL="{{BASE_URL}}"
export GEMINI_API_KEY="YOUR_API_KEY"
export GEMINI_MODEL="gemini-2.5-flash"
gemini
```

## Ứng dụng chat (Cherry Studio, Chatbox, LobeChat, NextChat, Open WebUI, …)

Hầu hết ứng dụng chat đều có mục thêm nhà cung cấp tuỳ chỉnh:

1. Chọn loại nhà cung cấp **OpenAI** hoặc **OpenAI Compatible**.
2. **API Host / Base URL**: `{{BASE_URL}}`. Có ứng dụng tự thêm `/v1`, có ứng dụng không. Nếu bị lỗi `404` thì thử lại với `{{BASE_URL}}/v1`.
3. **API Key**: key của bạn.
4. **Model**: bấm nút lấy danh sách model, hoặc nhập tay đúng `id` lấy từ `GET /v1/models`.

Nếu ứng dụng có sẵn loại nhà cung cấp **Anthropic** và key thuộc nhóm Claude, bạn có thể chọn loại này với Base URL `{{BASE_URL}}`.

## SDK Python

OpenAI (`pip install openai`):

```python
from openai import OpenAI

client = OpenAI(base_url="{{BASE_URL}}/v1", api_key="YOUR_API_KEY")

resp = client.chat.completions.create(
    model="gpt-5.5",
    messages=[{"role": "user", "content": "Xin chào!"}],
)
print(resp.choices[0].message.content)
```

Anthropic (`pip install anthropic`):

```python
from anthropic import Anthropic

client = Anthropic(base_url="{{BASE_URL}}", api_key="YOUR_API_KEY")

msg = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Xin chào!"}],
)
print(msg.content[0].text)
```

Gemini (`pip install google-genai`):

```python
from google import genai

client = genai.Client(
    api_key="YOUR_API_KEY",
    http_options={"base_url": "{{BASE_URL}}"},
)

resp = client.models.generate_content(model="gemini-2.5-flash", contents="Xin chào!")
print(resp.text)
```

## SDK Node.js

OpenAI (`npm install openai`):

```javascript
import OpenAI from 'openai'

const client = new OpenAI({ baseURL: '{{BASE_URL}}/v1', apiKey: 'YOUR_API_KEY' })

const resp = await client.chat.completions.create({
  model: 'gpt-5.5',
  messages: [{ role: 'user', content: 'Xin chào!' }],
})
console.log(resp.choices[0].message.content)
```

Anthropic (`npm install @anthropic-ai/sdk`):

```javascript
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ baseURL: '{{BASE_URL}}', apiKey: 'YOUR_API_KEY' })

const msg = await client.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Xin chào!' }],
})
console.log(msg.content[0].text)
```

> Đừng nhúng API key vào code chạy trên trình duyệt hoặc ứng dụng di động. Hãy gọi API từ server của bạn và đọc key từ biến môi trường.
