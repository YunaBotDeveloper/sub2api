# Endpoints

Every endpoint authenticates with your API key, sent in one of these ways:

- `Authorization: Bearer YOUR_API_KEY`
- `x-api-key: YOUR_API_KEY`
- `x-goog-api-key: YOUR_API_KEY` (Gemini style)

Do not put the key in the query string (`?key=` or `?api_key=`). The `/v1` endpoints reject that with a `400` error.

## Pick an endpoint for your key's group

The **group** assigned to your key decides which provider handles the request. Prefer the group's native endpoint. Several other formats are converted automatically, but the native endpoint is the most reliable.

| Group | Recommended endpoint | Also works |
| --- | --- | --- |
| Claude (Anthropic) | `POST /v1/messages` | `/v1/chat/completions`, `/v1/responses` |
| OpenAI / GPT | `POST /v1/responses`, `POST /v1/chat/completions` | `/v1/messages` (for Claude Code), `/v1/embeddings`, `/v1/images/*` |
| Gemini | `POST /v1beta/models/{model}:generateContent` | `/v1/messages` |
| Antigravity | `POST /antigravity/v1/messages`, `/antigravity/v1beta/...` | |
| Grok (xAI) | `POST /v1/chat/completions`, `POST /v1/responses` | `/v1/messages`, `/v1/images/*`, `/v1/videos`, `/v1/tts`, `/v1/stt` |
| DeepSeek, Kimi, Zhipu, MiniMax, … | `POST /v1/chat/completions` | `/v1/messages`, `/v1/responses` |

> Calling an endpoint your group does not support returns `404` with a message like `... is not supported for this platform`.

Most OpenAI-style endpoints also work without the `/v1` prefix, for example `{{BASE_URL}}/chat/completions` or `{{BASE_URL}}/responses`. That helps with clients that build paths their own way.

## Anthropic Messages

`POST {{BASE_URL}}/v1/messages`

Fully compatible with the [Anthropic Messages API](https://docs.anthropic.com/en/api/messages). Add `"stream": true` to get server-sent events.

```bash
curl {{BASE_URL}}/v1/messages \
  -H "x-api-key: YOUR_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-sonnet-4-6",
    "max_tokens": 1024,
    "stream": true,
    "system": "You are a helpful assistant.",
    "messages": [{"role": "user", "content": "Explain HTTP 429"}]
  }'
```

To count tokens before sending, call `POST {{BASE_URL}}/v1/messages/count_tokens` with the same body.

## OpenAI Chat Completions

`POST {{BASE_URL}}/v1/chat/completions`

Compatible with the [OpenAI Chat Completions API](https://platform.openai.com/docs/api-reference/chat). Most third-party apps and libraries use this endpoint.

```bash
curl {{BASE_URL}}/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "content-type: application/json" \
  -d '{
    "model": "gpt-5.5",
    "stream": true,
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Write a Python function that reverses a string"}
    ]
  }'
```

## OpenAI Responses

`POST {{BASE_URL}}/v1/responses`

OpenAI's newer API, used by Codex CLI. A WebSocket transport is also available at `GET /v1/responses`.

```bash
curl {{BASE_URL}}/v1/responses \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "content-type: application/json" \
  -d '{
    "model": "gpt-5.5",
    "input": "Summarize the benefits of unit tests in 3 bullet points"
  }'
```

## Gemini (native API)

Compatible with the [Gemini API](https://ai.google.dev/api), so Gemini CLI and the `google-genai` SDK work as-is.

| Purpose | Endpoint |
| --- | --- |
| Generate content | `POST {{BASE_URL}}/v1beta/models/{model}:generateContent` |
| Stream content | `POST {{BASE_URL}}/v1beta/models/{model}:streamGenerateContent?alt=sse` |
| Count tokens | `POST {{BASE_URL}}/v1beta/models/{model}:countTokens` |
| List models | `GET {{BASE_URL}}/v1beta/models` |

```bash
curl "{{BASE_URL}}/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse" \
  -H "x-goog-api-key: YOUR_API_KEY" \
  -H "content-type: application/json" \
  -d '{"contents": [{"role": "user", "parts": [{"text": "Tell me a short story"}]}]}'
```

## Antigravity

Keys in an Antigravity group use dedicated paths under the `/antigravity` prefix:

| Format | Base URL |
| --- | --- |
| Claude style (Claude Code, Anthropic SDK) | `{{BASE_URL}}/antigravity` (calls `/antigravity/v1/messages`) |
| Gemini style (Gemini CLI) | `{{BASE_URL}}/antigravity` (calls `/antigravity/v1beta/models/...`) |
| List models | `GET {{BASE_URL}}/antigravity/v1/models` |

## List models

`GET {{BASE_URL}}/v1/models`

Returns the models your key may call, in OpenAI list format. Copy a model's `id` exactly into the `model` field of your requests.

```bash
curl {{BASE_URL}}/v1/models -H "Authorization: Bearer YOUR_API_KEY"
```

## Embeddings

`POST {{BASE_URL}}/v1/embeddings` (OpenAI groups only)

```bash
curl {{BASE_URL}}/v1/embeddings \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "content-type: application/json" \
  -d '{"model": "text-embedding-3-small", "input": "Hello world"}'
```

## Images

Available for OpenAI and Grok groups.

| Purpose | Endpoint |
| --- | --- |
| Generate | `POST {{BASE_URL}}/v1/images/generations` |
| Edit | `POST {{BASE_URL}}/v1/images/edits` |
| Generate asynchronously | `POST {{BASE_URL}}/v1/images/generations/async`, then poll `GET {{BASE_URL}}/v1/images/tasks/{task_id}` |

The async variant suits large or high-quality images. The request returns a `task_id` right away and you poll for the result, so you never hold a long connection open and hit a timeout.

```bash
curl {{BASE_URL}}/v1/images/generations \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "content-type: application/json" \
  -d '{"model": "gpt-image-1", "prompt": "An astronaut cat, watercolor", "size": "1024x1024"}'
```

## Video, voice and search (Grok groups only)

| Purpose | Endpoint |
| --- | --- |
| Generate video | `POST {{BASE_URL}}/v1/videos`, check status at `GET {{BASE_URL}}/v1/videos/{request_id}` |
| Text to speech | `POST {{BASE_URL}}/v1/tts` |
| Speech to text | `POST {{BASE_URL}}/v1/stt` |
| Web / X search | `POST {{BASE_URL}}/v1/web_search`, `POST {{BASE_URL}}/v1/x_search` |

## Balance and usage

`GET {{BASE_URL}}/v1/usage`

Returns the key's status, remaining balance or quota, and today's and total usage. The optional `days` parameter (1–90) adds a per-day breakdown.

```bash
curl "{{BASE_URL}}/v1/usage?days=7" -H "Authorization: Bearer YOUR_API_KEY"
```
