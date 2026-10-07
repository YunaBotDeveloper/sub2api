# Errors & FAQ

## Reading error responses

A failed request returns an HTTP status plus a JSON body. Errors raised by {{SITE_NAME}} itself (key, balance, permissions) look like this:

```json
{ "code": "INSUFFICIENT_BALANCE", "message": "Insufficient account balance" }
```

Errors that happen while calling the model follow the format of the endpoint you called, for example `{"error": {"type": "...", "message": "..."}}` for OpenAI and Anthropic style endpoints. Read the `code` or `message` field to find the cause.

## Error codes

| HTTP | Code / message | Cause | Fix |
| --- | --- | --- | --- |
| 400 | `api_key_in_query_deprecated` | Key sent as `?key=` or `?api_key=` | Send the key in the `Authorization: Bearer ...` header |
| 400 | `invalid_request_error` | Malformed body, missing `model`, invalid JSON | Check the body against [Endpoints](/docs/endpoints) |
| 401 | `API_KEY_REQUIRED` | No key sent | Add the `Authorization: Bearer YOUR_API_KEY` header |
| 401 | `INVALID_API_KEY` | Wrong key, truncated copy, or the key was deleted | Copy the key again from [API Keys](/keys) |
| 401 | `API_KEY_DISABLED` | The key is switched off | Re-enable it on the API Keys page |
| 401 | `USER_INACTIVE` | The account is suspended | Contact the administrator |
| 403 | `INSUFFICIENT_BALANCE` | Out of balance | [Top up](/purchase) or [redeem a code](/redeem) |
| 403 | `API_KEY_EXPIRED` | The key is past its expiry date | Extend it or create a new key |
| 403 | `SUBSCRIPTION_NOT_FOUND` | The key's group requires a subscription you do not have or that has expired | Buy or renew on the [Subscriptions](/subscriptions) page |
| 403 | `not assigned to any group` | The key has no group | Edit the key and pick a group |
| 403 | `GROUP_DISABLED` / `GROUP_NOT_ALLOWED` | The group was disabled or you lost access to it | Move the key to another group |
| 403 | `ACCESS_DENIED` | Your IP is not in the key's IP allowlist | Update the key's IP allowlist |
| 404 | `... is not supported for this platform` | The endpoint is not available for the key's group (e.g. `/v1/embeddings` with a Claude group key) | See the table in [Endpoints](/docs/endpoints) |
| 404 | `Model "..." is not available for this group` | The group does not offer that model | Take the exact model name from `GET /v1/models` |
| 404 | `Not Found` (no JSON body) | Wrong path, usually a missing or doubled `/v1` | See the Base URL table in [Client setup](/docs/clients) |
| 413 | `Request body is too large` | The request is too big (images, attachments) | Reduce the payload size |
| 429 | `API_KEY_QUOTA_EXHAUSTED` | The key used up its own spending quota | Raise the key's quota |
| 429 | `API_KEY_RATE_5H_EXCEEDED` / `_1D_` / `_7D_` | The key hit its 5-hour / 1-day / 7-day spending limit | Wait for the window to reset or raise the key's limits |
| 429 | `rate_limit_error` | Too many concurrent requests, or the provider is rate limiting | Wait and retry, send fewer parallel requests |
| 500 / 502 / 503 / 529 | Server error or provider overloaded | The upstream provider is temporarily failing | Retry after a few seconds with exponential backoff |

## Frequently asked questions

### Which model name should I use?

Call `GET {{BASE_URL}}/v1/models` with your key and use the `id` values exactly as returned. Each group offers different models, so the name must match your key's group.

### Why does Claude Code still ask me to log in?

Claude Code is not seeing your environment variables. Make sure `ANTHROPIC_BASE_URL` and `ANTHROPIC_AUTH_TOKEN` are set in **the same terminal window** that runs `claude`, or put them in `~/.claude/settings.json`. Open a new terminal and try again.

### Long requests get cut off or time out

Set `"stream": true` so the response arrives incrementally instead of all at once, and raise your client's timeout. For large images, use the async endpoint `/v1/images/generations/async`.

### How am I billed?

Cost is input and output tokens (including cache tokens) multiplied by the model's price and the group's rate multiplier. Per-request details are on the [Usage](/usage) page.

### How do I check my balance without signing in?

Open the [Key lookup](/key-usage) page and paste your key, or call `GET {{BASE_URL}}/v1/usage`.

### Can I use one key on several machines or apps?

Yes. Still, a separate key per app makes costs easier to track and lets you revoke one without affecting the others.
