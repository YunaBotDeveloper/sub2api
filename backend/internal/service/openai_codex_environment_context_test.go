//go:build unit

package service

import (
	"fmt"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	"github.com/tidwall/gjson"
	"github.com/tidwall/sjson"
)

func codexTimezoneAccount(tz string) *Account {
	return &Account{Type: AccountTypeOAuth, Extra: map[string]any{codexTimezoneExtraKey: tz}}
}

// environmentContextBody 构造一个带 environment_context 的 Responses 请求体。
func environmentContextBody(t *testing.T, clientTZ, date string) []byte {
	t.Helper()
	text := fmt.Sprintf("<environment_context>\n<cwd>/repo</cwd>\n<timezone>%s</timezone>\n<current_date>%s</current_date>\n</environment_context>", clientTZ, date)
	body, err := sjson.SetBytes([]byte(`{"model":"gpt-5.5","input":[{"type":"message","role":"user","content":[{"type":"input_text","text":""}]}]}`), "input.0.content.0.text", text)
	require.NoError(t, err)
	return body
}

func TestApplyCodexEnvironmentContextTimezone(t *testing.T) {
	// 账号绑定 Asia/Shanghai (UTC+8)；参考时刻在上海是 2026-09-11，在 UTC 仍是 09-10。
	now := time.Date(2026, 9, 10, 17, 30, 0, 0, time.UTC)

	t.Run("rewrites timezone and shifts date by day delta", func(t *testing.T) {
		body := environmentContextBody(t, "UTC", "2026-09-10")
		out := applyCodexEnvironmentContextTimezone(codexTimezoneAccount("Asia/Shanghai"), body, now)

		text := gjson.GetBytes(out, "input.0.content.0.text").String()
		require.Contains(t, text, "<timezone>Asia/Shanghai</timezone>")
		// 客户端在 UTC 报的今天是 09-10，账号时区今天是 09-11，整体平移 +1 天。
		require.Contains(t, text, "<current_date>2026-09-11</current_date>")
	})

	t.Run("historical blocks keep their relative offset", func(t *testing.T) {
		// 同一请求里带一个历史轮次和一个当前轮次，平移后间隔必须不变。
		text := "<environment_context><timezone>UTC</timezone><current_date>2026-09-08</current_date></environment_context>" +
			"\n<environment_context><timezone>UTC</timezone><current_date>2026-09-10</current_date></environment_context>"
		body, err := sjson.SetBytes([]byte(`{"input":[{"content":[{"type":"input_text","text":""}]}]}`), "input.0.content.0.text", text)
		require.NoError(t, err)

		out := applyCodexEnvironmentContextTimezone(codexTimezoneAccount("Asia/Shanghai"), body, now)
		got := gjson.GetBytes(out, "input.0.content.0.text").String()
		require.Contains(t, got, "<current_date>2026-09-09</current_date>", "历史块整体平移，不得被改成今天")
		require.Contains(t, got, "<current_date>2026-09-11</current_date>")
	})

	t.Run("idempotent", func(t *testing.T) {
		account := codexTimezoneAccount("Asia/Shanghai")
		once := applyCodexEnvironmentContextTimezone(account, environmentContextBody(t, "UTC", "2026-09-10"), now)
		twice := applyCodexEnvironmentContextTimezone(account, once, now)
		require.Equal(t, gjson.GetBytes(once, "input.0.content.0.text").String(), gjson.GetBytes(twice, "input.0.content.0.text").String())
	})

	t.Run("string content is rewritten too", func(t *testing.T) {
		body, err := sjson.SetBytes([]byte(`{"input":[{"role":"user","content":""}]}`), "input.0.content",
			"<environment_context><timezone>UTC</timezone></environment_context>")
		require.NoError(t, err)

		out := applyCodexEnvironmentContextTimezone(codexTimezoneAccount("Asia/Shanghai"), body, now)
		require.Contains(t, gjson.GetBytes(out, "input.0.content").String(), "<timezone>Asia/Shanghai</timezone>")
	})

	t.Run("never injects tags that were absent", func(t *testing.T) {
		body := []byte(`{"input":[{"role":"user","content":[{"type":"input_text","text":"just a question"}]}]}`)
		out := applyCodexEnvironmentContextTimezone(codexTimezoneAccount("Asia/Shanghai"), body, now)
		require.Equal(t, string(body), string(out))
	})

	t.Run("unbound or invalid timezone is a no-op", func(t *testing.T) {
		body := environmentContextBody(t, "UTC", "2026-09-10")
		require.Equal(t, string(body), string(applyCodexEnvironmentContextTimezone(&Account{Type: AccountTypeOAuth}, body, now)))
		require.Equal(t, string(body), string(applyCodexEnvironmentContextTimezone(codexTimezoneAccount("Not/AZone"), body, now)))
		// 非 Codex 协议账号不绑定时区。
		apiKeyAccount := &Account{Type: AccountTypeAPIKey, Extra: map[string]any{codexTimezoneExtraKey: "Asia/Shanghai"}}
		require.Equal(t, string(body), string(applyCodexEnvironmentContextTimezone(apiKeyAccount, body, now)))
	})

	t.Run("unknown client timezone changes zone but not date", func(t *testing.T) {
		body := environmentContextBody(t, "Not/AZone", "2026-09-10")
		out := applyCodexEnvironmentContextTimezone(codexTimezoneAccount("Asia/Shanghai"), body, now)

		text := gjson.GetBytes(out, "input.0.content.0.text").String()
		require.Contains(t, text, "<timezone>Asia/Shanghai</timezone>")
		require.Contains(t, text, "<current_date>2026-09-10</current_date>", "客户端时区不可解析时不得平移日期")
	})
}

func TestNormalizeCodexTimezone(t *testing.T) {
	require.Equal(t, "Asia/Shanghai", NormalizeCodexTimezone("  Asia/Shanghai  "))
	require.Equal(t, "UTC", NormalizeCodexTimezone("UTC"))
	require.Empty(t, NormalizeCodexTimezone("Not/AZone"))
	require.Empty(t, NormalizeCodexTimezone(""))
}
