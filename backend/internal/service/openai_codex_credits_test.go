package service

import (
	"net/http"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

func TestOpenAICodexCreditsBypassQuotaPause(t *testing.T) {
	headers := http.Header{}
	headers.Set("x-codex-primary-used-percent", "100")
	headers.Set("x-codex-primary-window-minutes", "10080")
	headers.Set("x-codex-primary-reset-after-seconds", "3600")
	headers.Set("x-codex-credits-has-credits", "true")
	headers.Set("x-codex-credits-unlimited", "false")
	headers.Set("x-codex-credits-balance", "9750.0000000000")

	extra := buildCodexUsageExtraUpdates(ParseCodexRateLimitHeaders(headers), time.Now())
	require.Equal(t, true, extra["codex_credits_has_credits"])
	require.Equal(t, "9750.0000000000", extra["codex_credits_balance"])
	require.Equal(t, "", extra["codex_rate_limit_reached_type"])

	account := &Account{ID: 1, Platform: PlatformOpenAI, Type: AccountTypeOAuth, Extra: extra}
	thresholds := map[string]int{PlatformOpenAI: 90}
	now := time.Now().UTC()

	// Not opted in: threshold pauses the exhausted account.
	require.True(t, EvaluateAccountSchedulingThreshold(account, thresholds, now).ShouldPause)

	account.Extra[openAICodexCreditsEnabledExtraKey] = true
	require.True(t, openAICodexCreditsCoverQuota(account))
	require.False(t, EvaluateAccountSchedulingThreshold(account, thresholds, now).ShouldPause)

	// Balance drained or workspace hard stop: pause again.
	account.Extra["codex_credits_balance"] = "0"
	require.False(t, openAICodexCreditsCoverQuota(account))
	account.Extra["codex_credits_balance"] = "5"
	account.Extra["codex_rate_limit_reached_type"] = "workspace_owner_credits_depleted"
	require.False(t, openAICodexCreditsCoverQuota(account))

	// Paused account without header state falls back to the /wham/usage snapshot.
	snapshotOnly := &Account{ID: 2, Platform: PlatformOpenAI, Type: AccountTypeOAuth, Extra: map[string]any{
		openAICodexCreditsEnabledExtraKey: true,
		openaiQuotaCreditsKey: map[string]any{
			"credits":    map[string]any{"has_credits": true, "unlimited": false, "balance": "9750.0000000000"},
			"fetched_at": float64(1),
		},
	}}
	require.True(t, openAICodexCreditsCoverQuota(snapshotOnly))
	snapshotOnly.Extra[openaiQuotaCreditsKey].(map[string]any)["credits"].(map[string]any)["balance"] = "0"
	require.False(t, openAICodexCreditsCoverQuota(snapshotOnly))
}
