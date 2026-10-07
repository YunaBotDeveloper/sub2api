# Client setup

> **Fastest way:** on the [API Keys](/keys) page, click **Use** next to a key. It generates the right configuration for the key's group (Claude Code, Codex CLI, Gemini CLI, OpenCode) for each operating system, with your key already filled in. This page explains the details so you can configure things yourself or use other tools.

## Base URL per tool

| Tool / library | Base URL value |
| --- | --- |
| Claude Code, Anthropic SDK | `{{BASE_URL}}` |
| OpenAI SDK, Codex CLI, "OpenAI compatible" apps | `{{BASE_URL}}/v1` |
| Gemini CLI, `google-genai` SDK | `{{BASE_URL}}` |
| Antigravity group keys (Claude Code / Gemini CLI) | `{{BASE_URL}}/antigravity` |

The most common mistake is a missing or doubled `/v1`, which produces `/v1/v1/...` or drops `/v1`, and the server answers `404`.

## Claude Code

Use a key in a Claude group. Keys in OpenAI, Gemini, Grok, DeepSeek… groups also work because the gateway converts the format.

**Option 1: environment variables** (only for the current terminal window)

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

**Option 2: settings file** (persistent; also used by the VS Code extension)

Edit `~/.claude/settings.json` (Windows: `%USERPROFILE%\.claude\settings.json`):

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "{{BASE_URL}}",
    "ANTHROPIC_AUTH_TOKEN": "YOUR_API_KEY",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
  }
}
```

> If an `ANTHROPIC_API_KEY` variable is already set on your machine, remove it so it does not conflict with `ANTHROPIC_AUTH_TOKEN`.

## Codex CLI

Use a key in an OpenAI group. Create two files in `~/.codex/` (Windows: `%USERPROFILE%\.codex\`).

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

Then run `codex` as usual. The **Use** button on the API Keys page also offers advanced options such as WebSocket transport and remote model-list sync.

## Gemini CLI

Use a key in a Gemini group (for an Antigravity group, change the Base URL to `{{BASE_URL}}/antigravity`).

```bash
export GOOGLE_GEMINI_BASE_URL="{{BASE_URL}}"
export GEMINI_API_KEY="YOUR_API_KEY"
export GEMINI_MODEL="gemini-2.5-flash"
gemini
```

## Chat apps (Cherry Studio, Chatbox, LobeChat, NextChat, Open WebUI, …)

Most chat apps let you add a custom provider:

1. Choose the provider type **OpenAI** or **OpenAI Compatible**.
2. **API Host / Base URL**: `{{BASE_URL}}`. Some apps append `/v1` themselves and some do not. If you get `404`, retry with `{{BASE_URL}}/v1`.
3. **API Key**: your key.
4. **Model**: click the fetch-models button, or type the exact `id` returned by `GET /v1/models`.

If the app has a built-in **Anthropic** provider type and your key is in a Claude group, you can use that type with Base URL `{{BASE_URL}}`.

## Python SDKs

OpenAI (`pip install openai`):

```python
from openai import OpenAI

client = OpenAI(base_url="{{BASE_URL}}/v1", api_key="YOUR_API_KEY")

resp = client.chat.completions.create(
    model="gpt-5.5",
    messages=[{"role": "user", "content": "Hello!"}],
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
    messages=[{"role": "user", "content": "Hello!"}],
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

resp = client.models.generate_content(model="gemini-2.5-flash", contents="Hello!")
print(resp.text)
```

## Node.js SDKs

OpenAI (`npm install openai`):

```javascript
import OpenAI from 'openai'

const client = new OpenAI({ baseURL: '{{BASE_URL}}/v1', apiKey: 'YOUR_API_KEY' })

const resp = await client.chat.completions.create({
  model: 'gpt-5.5',
  messages: [{ role: 'user', content: 'Hello!' }],
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
  messages: [{ role: 'user', content: 'Hello!' }],
})
console.log(msg.content[0].text)
```

> Never ship your API key in browser or mobile app code. Call the API from your own server and read the key from an environment variable.
