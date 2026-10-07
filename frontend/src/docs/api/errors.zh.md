# 常见错误与 FAQ

## 如何阅读错误响应

请求失败时会返回 HTTP 状态码和 JSON 错误信息。由 {{SITE_NAME}} 自身产生的错误（Key、余额、权限）格式如下：

```json
{ "code": "INSUFFICIENT_BALANCE", "message": "Insufficient account balance" }
```

调用模型过程中产生的错误则遵循你所调用接口的格式，例如 OpenAI / Anthropic 风格接口返回 `{"error": {"type": "...", "message": "..."}}`。查看 `code` 或 `message` 字段即可定位原因。

## 错误码对照表

| HTTP | 错误码 / 提示 | 原因 | 处理方法 |
| --- | --- | --- | --- |
| 400 | `api_key_in_query_deprecated` | 通过 `?key=` 或 `?api_key=` 传递 Key | 改用请求头 `Authorization: Bearer ...` |
| 400 | `invalid_request_error` | 请求体格式错误、缺少 `model`、JSON 无效 | 对照[接口列表](/docs/endpoints)检查请求体 |
| 401 | `API_KEY_REQUIRED` | 没有传 Key | 添加请求头 `Authorization: Bearer YOUR_API_KEY` |
| 401 | `INVALID_API_KEY` | Key 错误、复制不完整或已被删除 | 到 [API 密钥](/keys) 页面重新复制 |
| 401 | `API_KEY_DISABLED` | Key 已被停用 | 在 API 密钥页面重新启用 |
| 401 | `USER_INACTIVE` | 账号已被禁用 | 联系管理员 |
| 403 | `INSUFFICIENT_BALANCE` | 余额不足 | [充值](/purchase)或[兑换](/redeem) |
| 403 | `API_KEY_EXPIRED` | Key 已过期 | 延长有效期或新建 Key |
| 403 | `SUBSCRIPTION_NOT_FOUND` | 该分组需要订阅，但你没有订阅或订阅已过期 | 在[我的订阅](/subscriptions)页面购买或续费 |
| 403 | `not assigned to any group` | Key 未分配分组 | 编辑 Key 并选择分组 |
| 403 | `GROUP_DISABLED` / `GROUP_NOT_ALLOWED` | 分组已停用或你已无权使用 | 把 Key 换到其他分组 |
| 403 | `ACCESS_DENIED` | 你的 IP 不在该 Key 的 IP 白名单中 | 修改 Key 的 IP 白名单 |
| 404 | `... is not supported for this platform` | 该分组不支持此接口（例如用 Claude 分组的 Key 调 `/v1/embeddings`） | 参考[接口列表](/docs/endpoints)中的表格 |
| 404 | `Model "..." is not available for this group` | 该分组没有这个模型 | 从 `GET /v1/models` 获取准确的模型名 |
| 404 | `Not Found`（无 JSON） | 路径错误，通常是 `/v1` 多写或漏写 | 参考[客户端配置](/docs/clients)中的 Base URL 表 |
| 413 | `Request body is too large` | 请求体过大（图片、附件等） | 减小请求内容 |
| 429 | `API_KEY_QUOTA_EXHAUSTED` | Key 自身的额度已用完 | 提高该 Key 的额度 |
| 429 | `API_KEY_RATE_5H_EXCEEDED` / `_1D_` / `_7D_` | Key 达到 5 小时 / 1 天 / 7 天的消费限额 | 等待窗口重置或调高 Key 的限额 |
| 429 | `rate_limit_error` | 并发请求过多，或上游正在限流 | 稍后重试，减少并发 |
| 500 / 502 / 503 / 529 | 服务器错误或上游过载 | 上游平台暂时异常 | 几秒后按指数退避重试 |

## 常见问题

### 模型名应该填什么？

用你的 Key 调用 `GET {{BASE_URL}}/v1/models`，并原样使用返回的 `id`。不同分组提供的模型不同，模型名必须与 Key 所属分组匹配。

### 为什么 Claude Code 还是要求登录？

说明 Claude Code 没有读到环境变量。请确认 `ANTHROPIC_BASE_URL` 和 `ANTHROPIC_AUTH_TOKEN` 设置在**运行 `claude` 的同一个终端窗口**中，或者写入 `~/.claude/settings.json`，然后打开新终端重试。

### 长请求中途断开或超时怎么办？

设置 `"stream": true`，让结果逐步返回而不是一次性等待，并调大客户端超时时间。大图请使用异步接口 `/v1/images/generations/async`。

### 如何计费？

按输入和输出 Token（含缓存 Token）乘以模型单价和分组倍率计费。每次请求的明细见[使用记录](/usage)页面。

### 不登录如何查询余额？

打开 [Key 查询](/key-usage) 页面粘贴 Key，或调用 `GET {{BASE_URL}}/v1/usage`。

### 一个 Key 可以在多台设备或多个应用中使用吗？

可以。不过建议为每个应用单独创建 Key，便于统计费用，也便于单独吊销。
