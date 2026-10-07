# 快速开始

{{SITE_NAME}} 是一个统一的 AI API 网关：用**一个 API Key** 即可通过你熟悉的 SDK 和工具调用 Claude、GPT、Gemini 等模型。只需要修改两项配置：**Base URL** 和 **API Key**。

## 连接信息

| 项目 | 值 |
| --- | --- |
| Base URL | `{{BASE_URL}}` |
| OpenAI 风格 Base URL（带 `/v1`） | `{{BASE_URL}}/v1` |
| 认证方式 | 请求头 `Authorization: Bearer YOUR_API_KEY` |
| 其他可用请求头 | `x-api-key: YOUR_API_KEY`（Anthropic 风格）或 `x-goog-api-key: YOUR_API_KEY`（Gemini 风格） |

> **要不要带 `/v1`？** OpenAI SDK 通常要求 Base URL **带** `/v1`；Claude Code 和 Anthropic SDK 会自己拼接 `/v1/messages`，所以 Base URL **不带** `/v1`。完整对照表见[客户端配置](/docs/clients)。

## 第 1 步：注册并充值

1. [注册](/register)或[登录](/login)。
2. 在[充值](/purchase)页面充值，在[兑换](/redeem)页面使用兑换码，或在站点提供时购买订阅套餐。

## 第 2 步：创建 API Key

1. 打开 [API 密钥](/keys) 页面，点击**创建 API Key**。
2. 选择**分组**。分组决定该 Key 能调用哪些模型（Claude、GPT、Gemini 等）以及计费倍率。**未分配分组的 Key 无法使用。**
3. 可选：设置额度上限、过期时间、速率限制或 IP 白名单。
4. 点击 Key 旁边的**使用**按钮，系统会生成已填好 Key 的 Claude Code、Codex CLI、Gemini CLI、OpenCode 配置，复制即可。

> **请妥善保管 API Key。** 任何拿到 Key 的人都可以消耗你的余额。如有泄露，请立即删除并重新创建。

## 第 3 步：发送第一个请求

把 `YOUR_API_KEY` 替换成你的 Key。下面的模型名只是示例，真实列表见第 4 步。

### Claude 分组的 Key

```bash
curl {{BASE_URL}}/v1/messages \
  -H "x-api-key: YOUR_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-sonnet-4-6",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "你好！"}]
  }'
```

### OpenAI / GPT 分组（及其他 OpenAI 兼容分组）的 Key

```bash
curl {{BASE_URL}}/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "content-type: application/json" \
  -d '{
    "model": "gpt-5.5",
    "messages": [{"role": "user", "content": "你好！"}]
  }'
```

### Gemini 分组的 Key

```bash
curl "{{BASE_URL}}/v1beta/models/gemini-2.5-flash:generateContent" \
  -H "x-goog-api-key: YOUR_API_KEY" \
  -H "content-type: application/json" \
  -d '{"contents": [{"parts": [{"text": "你好！"}]}]}'
```

收到回复即表示连接成功。如果报错，请查看[常见错误](/docs/errors)。

## 第 4 步：查看可用模型与余额

列出当前 Key 可调用的模型：

```bash
curl {{BASE_URL}}/v1/models -H "Authorization: Bearer YOUR_API_KEY"
```

查看 Key 的余额、额度和用量：

```bash
curl {{BASE_URL}}/v1/usage -H "Authorization: Bearer YOUR_API_KEY"
```

不想用命令行的话，也可以打开 [Key 查询](/key-usage) 页面粘贴 Key 查看，无需登录。每次请求的明细见[使用记录](/usage)页面。

## 下一步

- [接口列表](/docs/endpoints)：各类分组应调用哪些接口。
- [客户端配置](/docs/clients)：Claude Code、Codex CLI、Gemini CLI、聊天客户端以及 Python / Node.js SDK。
- [常见错误与 FAQ](/docs/errors)：各错误码的含义与处理方法。
