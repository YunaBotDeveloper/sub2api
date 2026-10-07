# 接口列表

所有接口都使用 API Key 认证，可通过以下任一方式传递：

- `Authorization: Bearer YOUR_API_KEY`
- `x-api-key: YOUR_API_KEY`
- `x-goog-api-key: YOUR_API_KEY`（Gemini 风格）

不要把 Key 放在查询参数里（`?key=` 或 `?api_key=`），`/v1` 接口会直接返回 `400` 拒绝。

## 按分组选择接口

Key 所属的**分组**决定请求由哪个上游平台处理。建议优先使用该分组的原生接口；其他格式多数会被自动转换，但原生接口最稳定。

| 分组 | 推荐接口 | 也可使用 |
| --- | --- | --- |
| Claude（Anthropic） | `POST /v1/messages` | `/v1/chat/completions`、`/v1/responses` |
| OpenAI / GPT | `POST /v1/responses`、`POST /v1/chat/completions` | `/v1/messages`（用于 Claude Code）、`/v1/embeddings`、`/v1/images/*` |
| Gemini | `POST /v1beta/models/{model}:generateContent` | `/v1/messages` |
| Antigravity | `POST /antigravity/v1/messages`、`/antigravity/v1beta/...` | |
| Grok（xAI） | `POST /v1/chat/completions`、`POST /v1/responses` | `/v1/messages`、`/v1/images/*`、`/v1/videos`、`/v1/tts`、`/v1/stt` |
| DeepSeek、Kimi、智谱、MiniMax 等 | `POST /v1/chat/completions` | `/v1/messages`、`/v1/responses` |

> 调用分组不支持的接口会返回 `404`，提示类似 `... is not supported for this platform`。

大多数 OpenAI 风格接口也可以省略 `/v1` 前缀，例如 `{{BASE_URL}}/chat/completions`、`{{BASE_URL}}/responses`，方便那些自行拼接路径的客户端。

## Anthropic Messages

`POST {{BASE_URL}}/v1/messages`

完全兼容 [Anthropic Messages API](https://docs.anthropic.com/en/api/messages)。加上 `"stream": true` 即可获得 SSE 流式输出。

```bash
curl {{BASE_URL}}/v1/messages \
  -H "x-api-key: YOUR_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-sonnet-4-6",
    "max_tokens": 1024,
    "stream": true,
    "system": "你是一个乐于助人的助手。",
    "messages": [{"role": "user", "content": "解释一下 HTTP 429"}]
  }'
```

发送前统计 Token：`POST {{BASE_URL}}/v1/messages/count_tokens`，请求体与上面相同。

## OpenAI Chat Completions

`POST {{BASE_URL}}/v1/chat/completions`

兼容 [OpenAI Chat Completions API](https://platform.openai.com/docs/api-reference/chat)，大多数第三方应用和库都使用这个接口。

```bash
curl {{BASE_URL}}/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "content-type: application/json" \
  -d '{
    "model": "gpt-5.5",
    "stream": true,
    "messages": [
      {"role": "system", "content": "你是一个乐于助人的助手。"},
      {"role": "user", "content": "用 Python 写一个反转字符串的函数"}
    ]
  }'
```

## OpenAI Responses

`POST {{BASE_URL}}/v1/responses`

OpenAI 的新一代接口，Codex CLI 使用的就是它。另外支持 WebSocket：`GET /v1/responses`。

```bash
curl {{BASE_URL}}/v1/responses \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "content-type: application/json" \
  -d '{
    "model": "gpt-5.5",
    "input": "用 3 点总结单元测试的好处"
  }'
```

## Gemini（原生接口）

兼容 [Gemini API](https://ai.google.dev/api)，Gemini CLI 和 `google-genai` SDK 可直接使用。

| 用途 | 接口 |
| --- | --- |
| 生成内容 | `POST {{BASE_URL}}/v1beta/models/{model}:generateContent` |
| 流式生成 | `POST {{BASE_URL}}/v1beta/models/{model}:streamGenerateContent?alt=sse` |
| 统计 Token | `POST {{BASE_URL}}/v1beta/models/{model}:countTokens` |
| 模型列表 | `GET {{BASE_URL}}/v1beta/models` |

```bash
curl "{{BASE_URL}}/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse" \
  -H "x-goog-api-key: YOUR_API_KEY" \
  -H "content-type: application/json" \
  -d '{"contents": [{"role": "user", "parts": [{"text": "讲一个小故事"}]}]}'
```

## Antigravity

Antigravity 分组的 Key 使用带 `/antigravity` 前缀的专用路径：

| 格式 | Base URL |
| --- | --- |
| Claude 风格（Claude Code、Anthropic SDK） | `{{BASE_URL}}/antigravity`（调用 `/antigravity/v1/messages`） |
| Gemini 风格（Gemini CLI） | `{{BASE_URL}}/antigravity`（调用 `/antigravity/v1beta/models/...`） |
| 模型列表 | `GET {{BASE_URL}}/antigravity/v1/models` |

## 模型列表

`GET {{BASE_URL}}/v1/models`

以 OpenAI 列表格式返回当前 Key 可调用的模型。请求时把模型的 `id` 原样填入 `model` 字段。

```bash
curl {{BASE_URL}}/v1/models -H "Authorization: Bearer YOUR_API_KEY"
```

## Embeddings

`POST {{BASE_URL}}/v1/embeddings`（仅 OpenAI 分组）

```bash
curl {{BASE_URL}}/v1/embeddings \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "content-type: application/json" \
  -d '{"model": "text-embedding-3-small", "input": "你好，世界"}'
```

## 图片生成

OpenAI 与 Grok 分组可用。

| 用途 | 接口 |
| --- | --- |
| 生成图片 | `POST {{BASE_URL}}/v1/images/generations` |
| 编辑图片 | `POST {{BASE_URL}}/v1/images/edits` |
| 异步生成 | `POST {{BASE_URL}}/v1/images/generations/async`，再轮询 `GET {{BASE_URL}}/v1/images/tasks/{task_id}` |

异步接口适合大尺寸或高质量图片：请求会立即返回 `task_id`，之后轮询结果即可，不必长时间保持连接，从而避免超时。

```bash
curl {{BASE_URL}}/v1/images/generations \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "content-type: application/json" \
  -d '{"model": "gpt-image-1", "prompt": "一只宇航员猫，水彩风格", "size": "1024x1024"}'
```

## 视频、语音与搜索（仅 Grok 分组）

| 用途 | 接口 |
| --- | --- |
| 生成视频 | `POST {{BASE_URL}}/v1/videos`，状态查询 `GET {{BASE_URL}}/v1/videos/{request_id}` |
| 文字转语音 | `POST {{BASE_URL}}/v1/tts` |
| 语音转文字 | `POST {{BASE_URL}}/v1/stt` |
| 网页 / X 搜索 | `POST {{BASE_URL}}/v1/web_search`、`POST {{BASE_URL}}/v1/x_search` |

## 余额与用量

`GET {{BASE_URL}}/v1/usage`

返回 Key 的状态、剩余余额或额度，以及今日和累计用量。可选参数 `days`（1–90）用于返回按天统计。

```bash
curl "{{BASE_URL}}/v1/usage?days=7" -H "Authorization: Bearer YOUR_API_KEY"
```
