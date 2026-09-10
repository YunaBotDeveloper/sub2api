//go:build unit

package service

import (
	"testing"

	"github.com/stretchr/testify/require"
	"github.com/tidwall/gjson"
)

const codexIncompleteEvent = `{"type":"response.incomplete","response":{"id":"resp_1","model":"gpt-5.5","status":"incomplete","output":[],"incomplete_details":{"reason":"max_output_tokens"},"usage":{"input_tokens":12,"output_tokens":0}}}`

func codexEmptyIncompleteOAuthAccount() *Account {
	return &Account{Platform: PlatformOpenAI, Type: AccountTypeOAuth}
}

func TestRewriteCodexEmptyIncompleteTerminal(t *testing.T) {
	account := codexEmptyIncompleteOAuthAccount()

	t.Run("zero output incomplete becomes response.failed", func(t *testing.T) {
		gotType, got := rewriteCodexEmptyIncompleteTerminal(&codexEmptyIncompleteTracker{}, account, "response.incomplete", []byte(codexIncompleteEvent))

		require.Equal(t, "response.failed", gotType)
		require.Equal(t, "response.failed", gjson.GetBytes(got, "type").String())
		require.Equal(t, "failed", gjson.GetBytes(got, "response.status").String())
		require.Equal(t, codexEmptyIncompleteErrorCode, gjson.GetBytes(got, "response.error.code").String())
		require.Equal(t, int64(502), gjson.GetBytes(got, "response.error.status_code").Int())
		require.False(t, gjson.GetBytes(got, "response.incomplete_details").Exists(), "改写后不得残留截断原因")
		// 日志与计费仍要读到原始字段。
		require.Equal(t, "resp_1", gjson.GetBytes(got, "response.id").String())
		require.Equal(t, int64(12), gjson.GetBytes(got, "response.usage.input_tokens").Int())
	})

	t.Run("real truncation is left alone", func(t *testing.T) {
		// 有输出 token 的 incomplete 是正常截断，绝不能被改写成失败。
		truncated := `{"type":"response.incomplete","response":{"status":"incomplete","output":[],"usage":{"output_tokens":128}}}`
		gotType, got := rewriteCodexEmptyIncompleteTerminal(&codexEmptyIncompleteTracker{}, account, "response.incomplete", []byte(truncated))
		require.Equal(t, "response.incomplete", gotType)
		require.Equal(t, truncated, string(got))
	})

	t.Run("prior output disqualifies the rewrite", func(t *testing.T) {
		for _, prior := range []struct {
			name      string
			eventType string
			data      string
		}{
			{"text delta", "response.output_text.delta", `{"type":"response.output_text.delta","delta":"hi"}`},
			{"reasoning delta", "response.reasoning_text.delta", `{"type":"response.reasoning_text.delta","delta":"think"}`},
			{"output item done", "response.output_item.done", `{"type":"response.output_item.done","item":{"id":"msg_1"}}`},
		} {
			t.Run(prior.name, func(t *testing.T) {
				tracker := &codexEmptyIncompleteTracker{}
				rewriteCodexEmptyIncompleteTerminal(tracker, account, prior.eventType, []byte(prior.data))

				gotType, _ := rewriteCodexEmptyIncompleteTerminal(tracker, account, "response.incomplete", []byte(codexIncompleteEvent))
				require.Equal(t, "response.incomplete", gotType, "本次流内已有真实输出，不得判为断流")
			})
		}
	})

	t.Run("empty delta does not count as output", func(t *testing.T) {
		tracker := &codexEmptyIncompleteTracker{}
		rewriteCodexEmptyIncompleteTerminal(tracker, account, "response.output_text.delta", []byte(`{"type":"response.output_text.delta","delta":"   "}`))

		gotType, _ := rewriteCodexEmptyIncompleteTerminal(tracker, account, "response.incomplete", []byte(codexIncompleteEvent))
		require.Equal(t, "response.failed", gotType)
	})

	t.Run("non codex accounts are untouched", func(t *testing.T) {
		apiKey := &Account{Platform: PlatformOpenAI, Type: AccountTypeAPIKey}
		gotType, got := rewriteCodexEmptyIncompleteTerminal(&codexEmptyIncompleteTracker{}, apiKey, "response.incomplete", []byte(codexIncompleteEvent))
		require.Equal(t, "response.incomplete", gotType)
		require.Equal(t, codexIncompleteEvent, string(got))
	})

	t.Run("nil tracker is a no-op", func(t *testing.T) {
		gotType, got := rewriteCodexEmptyIncompleteTerminal(nil, account, "response.incomplete", []byte(codexIncompleteEvent))
		require.Equal(t, "response.incomplete", gotType)
		require.Equal(t, codexIncompleteEvent, string(got))
	})
}
