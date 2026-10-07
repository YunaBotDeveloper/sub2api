# Quick start

{{SITE_NAME}} is a unified AI API gateway. One **API key** lets you call Claude, GPT, Gemini and other models with the SDKs and tools you already use. You only change two things: the **Base URL** and the **API key**.

## Connection details

| Item | Value |
| --- | --- |
| Base URL | `{{BASE_URL}}` |
| OpenAI-style Base URL (with `/v1`) | `{{BASE_URL}}/v1` |
| Authentication | Header `Authorization: Bearer YOUR_API_KEY` |
| Alternative headers | `x-api-key: YOUR_API_KEY` (Anthropic style) or `x-goog-api-key: YOUR_API_KEY` (Gemini style) |

> **With or without `/v1`?** OpenAI SDKs usually expect the Base URL **with** `/v1`. Claude Code and the Anthropic SDK append `/v1/messages` themselves, so their Base URL has **no** `/v1`. See the full table in [Client setup](/docs/clients).

## Step 1: Create an account and add balance

1. [Sign up](/register) or [sign in](/login).
2. Top up on the [Purchase](/purchase) page, redeem a code on the [Redeem](/redeem) page, or buy a subscription plan if the site offers one.

## Step 2: Create an API key

1. Open [API Keys](/keys) and click **Create API Key**.
2. Pick a **group**. The group decides which models the key can call (Claude, GPT, Gemini, …) and how requests are priced. **A key without a group cannot be used.**
3. Optional: set a spending quota, an expiry date, rate limits or an IP allowlist.
4. Click **Use** next to the new key. It generates ready-to-paste configuration for Claude Code, Codex CLI, Gemini CLI and OpenCode with your key already filled in.

> **Keep your API key secret.** Anyone with the key can spend your balance. If it leaks, delete it and create a new one.

## Step 3: Send your first request

Replace `YOUR_API_KEY` with your key. Model names are examples; step 4 shows how to list the real ones.

### Key in a Claude group

```bash
curl {{BASE_URL}}/v1/messages \
  -H "x-api-key: YOUR_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-sonnet-4-6",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### Key in an OpenAI / GPT group (or another OpenAI-compatible group)

```bash
curl {{BASE_URL}}/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "content-type: application/json" \
  -d '{
    "model": "gpt-5.5",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### Key in a Gemini group

```bash
curl "{{BASE_URL}}/v1beta/models/gemini-2.5-flash:generateContent" \
  -H "x-goog-api-key: YOUR_API_KEY" \
  -H "content-type: application/json" \
  -d '{"contents": [{"parts": [{"text": "Hello!"}]}]}'
```

If you get a reply, you are connected. If you get an error, see [Errors & FAQ](/docs/errors).

## Step 4: List models and check your balance

List the models your key is allowed to call:

```bash
curl {{BASE_URL}}/v1/models -H "Authorization: Bearer YOUR_API_KEY"
```

Check the key's balance, quota and usage:

```bash
curl {{BASE_URL}}/v1/usage -H "Authorization: Bearer YOUR_API_KEY"
```

To skip the command line, open the [Key lookup](/key-usage) page and paste your key; no sign-in is needed. Per-request history is on the [Usage](/usage) page.

## Next steps

- [Endpoints](/docs/endpoints): which endpoint to call for each group type.
- [Client setup](/docs/clients): Claude Code, Codex CLI, Gemini CLI, chat apps and the Python/Node.js SDKs.
- [Errors & FAQ](/docs/errors): what each error code means and how to fix it.
