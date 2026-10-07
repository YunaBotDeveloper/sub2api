# 客户端配置

> **最快的方法：** 在 [API 密钥](/keys) 页面点击 Key 旁边的**使用**按钮，系统会按该 Key 的分组、针对不同操作系统生成已填好 Key 的配置（Claude Code、Codex CLI、Gemini CLI、OpenCode）。本页详细说明各项配置，方便你手动设置或接入其他工具。

## 各工具的 Base URL

| 工具 / 库 | Base URL |
| --- | --- |
| Claude Code、Anthropic SDK | `{{BASE_URL}}` |
| OpenAI SDK、Codex CLI、“OpenAI 兼容”应用 | `{{BASE_URL}}/v1` |
| Gemini CLI、`google-genai` SDK | `{{BASE_URL}}` |
| Antigravity 分组的 Key（Claude Code / Gemini CLI） | `{{BASE_URL}}/antigravity` |

最常见的错误是 `/v1` 多写或漏写，导致路径变成 `/v1/v1/...` 或缺少 `/v1`，服务器返回 `404`。

## Claude Code

使用 Claude 分组的 Key。OpenAI、Gemini、Grok、DeepSeek 等分组的 Key 也可以使用，网关会自动转换格式。

**方式一：环境变量**（仅对当前终端窗口生效）

macOS / Linux：

```bash
export ANTHROPIC_BASE_URL="{{BASE_URL}}"
export ANTHROPIC_AUTH_TOKEN="YOUR_API_KEY"
export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
claude
```

Windows PowerShell：

```powershell
$env:ANTHROPIC_BASE_URL="{{BASE_URL}}"
$env:ANTHROPIC_AUTH_TOKEN="YOUR_API_KEY"
$env:CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
claude
```

**方式二：配置文件**（永久生效，VS Code 插件同样读取）

编辑 `~/.claude/settings.json`（Windows：`%USERPROFILE%\.claude\settings.json`）：

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "{{BASE_URL}}",
    "ANTHROPIC_AUTH_TOKEN": "YOUR_API_KEY",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
  }
}
```

> 如果系统里已经设置了 `ANTHROPIC_API_KEY`，请删除它，以免与 `ANTHROPIC_AUTH_TOKEN` 冲突。

## Codex CLI

使用 OpenAI 分组的 Key。在 `~/.codex/`（Windows：`%USERPROFILE%\.codex\`）下创建两个文件。

`config.toml`：

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

`auth.json`：

```json
{
  "OPENAI_API_KEY": "YOUR_API_KEY"
}
```

然后照常运行 `codex`。API 密钥页面的**使用**按钮还提供 WebSocket、远程模型列表同步等进阶选项。

## Gemini CLI

使用 Gemini 分组的 Key（Antigravity 分组请把 Base URL 改为 `{{BASE_URL}}/antigravity`）。

```bash
export GOOGLE_GEMINI_BASE_URL="{{BASE_URL}}"
export GEMINI_API_KEY="YOUR_API_KEY"
export GEMINI_MODEL="gemini-2.5-flash"
gemini
```

## 聊天客户端（Cherry Studio、Chatbox、LobeChat、NextChat、Open WebUI 等）

大多数聊天客户端都支持添加自定义服务商：

1. 服务商类型选择 **OpenAI** 或 **OpenAI Compatible**。
2. **API 地址 / Base URL**：`{{BASE_URL}}`。有的客户端会自动补 `/v1`，有的不会；如果报 `404`，改用 `{{BASE_URL}}/v1` 再试。
3. **API Key**：填写你的 Key。
4. **模型**：点击获取模型列表，或手动填写 `GET /v1/models` 返回的 `id`。

如果客户端内置 **Anthropic** 服务商类型，且你的 Key 属于 Claude 分组，也可以选择该类型，Base URL 填 `{{BASE_URL}}`。

## Python SDK

OpenAI（`pip install openai`）：

```python
from openai import OpenAI

client = OpenAI(base_url="{{BASE_URL}}/v1", api_key="YOUR_API_KEY")

resp = client.chat.completions.create(
    model="gpt-5.5",
    messages=[{"role": "user", "content": "你好！"}],
)
print(resp.choices[0].message.content)
```

Anthropic（`pip install anthropic`）：

```python
from anthropic import Anthropic

client = Anthropic(base_url="{{BASE_URL}}", api_key="YOUR_API_KEY")

msg = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    messages=[{"role": "user", "content": "你好！"}],
)
print(msg.content[0].text)
```

Gemini（`pip install google-genai`）：

```python
from google import genai

client = genai.Client(
    api_key="YOUR_API_KEY",
    http_options={"base_url": "{{BASE_URL}}"},
)

resp = client.models.generate_content(model="gemini-2.5-flash", contents="你好！")
print(resp.text)
```

## Node.js SDK

OpenAI（`npm install openai`）：

```javascript
import OpenAI from 'openai'

const client = new OpenAI({ baseURL: '{{BASE_URL}}/v1', apiKey: 'YOUR_API_KEY' })

const resp = await client.chat.completions.create({
  model: 'gpt-5.5',
  messages: [{ role: 'user', content: '你好！' }],
})
console.log(resp.choices[0].message.content)
```

Anthropic（`npm install @anthropic-ai/sdk`）：

```javascript
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ baseURL: '{{BASE_URL}}', apiKey: 'YOUR_API_KEY' })

const msg = await client.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 1024,
  messages: [{ role: 'user', content: '你好！' }],
})
console.log(msg.content[0].text)
```

> 不要把 API Key 写进浏览器或移动端代码里。请在你自己的服务器上调用 API，并从环境变量读取 Key。
