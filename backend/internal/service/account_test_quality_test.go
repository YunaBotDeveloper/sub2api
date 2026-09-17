//go:build unit

package service

import (
	"io"
	"net/http"
	"strings"
	"testing"

	"github.com/Wei-Shaw/sub2api/internal/config"
	"github.com/Wei-Shaw/sub2api/internal/pkg/openai_compat"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
	"github.com/tidwall/gjson"
)

func TestNewQualityTestSpec(t *testing.T) {
	openaiAccount := &Account{Platform: PlatformOpenAI}
	claudeAccount := &Account{Platform: PlatformAnthropic}

	spec, err := newQualityTestSpec(openaiAccount, "draw", " HIGH ")
	require.NoError(t, err)
	require.Equal(t, "high", spec.ReasoningEffort)

	_, err = newQualityTestSpec(claudeAccount, "draw", "xhigh")
	require.Error(t, err, "xhigh is OpenAI-only")
	_, err = newQualityTestSpec(claudeAccount, "draw", "max")
	require.NoError(t, err)

	_, err = newQualityTestSpec(openaiAccount, "   ", "")
	require.Error(t, err)
	_, err = newQualityTestSpec(openaiAccount, strings.Repeat("a", qualityTestPromptLimit+1), "")
	require.Error(t, err)
	_, err = newQualityTestSpec(&Account{Platform: PlatformGemini}, "draw", "")
	require.Error(t, err)
}

func TestApplyClaudeQualityTestPayload(t *testing.T) {
	payload, err := createTestPayload("claude-test")
	require.NoError(t, err)

	applyClaudeQualityTestPayload(t.Context(), payload)
	require.Equal(t, 1024, payload["max_tokens"], "no spec in context leaves payload unchanged")

	ctx := withQualityTestSpec(t.Context(), qualityTestSpec{Prompt: "draw a pelican", ReasoningEffort: "high"})
	applyClaudeQualityTestPayload(ctx, payload)
	require.Equal(t, qualityTestClaudeMaxToken, payload["max_tokens"])
	require.NotNil(t, payload["system"], "Claude Code system prompt must be kept")
	require.Equal(t, map[string]any{"effort": "high"}, payload["output_config"])
	messages := payload["messages"].([]map[string]any)
	require.Equal(t, "draw a pelican", messages[0]["content"].([]map[string]any)[0]["text"])
}

func TestAccountTestService_QualityModeSendsPromptAndEffortToResponses(t *testing.T) {
	gin.SetMode(gin.TestMode)
	c, recorder := newTestContext()
	c.Request = c.Request.WithContext(withQualityTestSpec(c.Request.Context(), qualityTestSpec{Prompt: "draw a pelican", ReasoningEffort: "low"}))

	upstreamBody := strings.Join([]string{
		`data: {"type":"response.output_text.delta","delta":"pelican-svg"}`,
		"",
		`data: {"type":"response.completed","response":{}}`,
		"",
	}, "\n")
	upstream := &httpUpstreamRecorder{resp: &http.Response{
		StatusCode: http.StatusOK,
		Header:     http.Header{"Content-Type": []string{"text/event-stream"}},
		Body:       io.NopCloser(strings.NewReader(upstreamBody)),
	}}
	svc := &AccountTestService{
		httpUpstream: upstream,
		cfg:          &config.Config{Security: config.SecurityConfig{URLAllowlist: config.URLAllowlistConfig{Enabled: false}}},
	}
	account := &Account{
		ID:          93,
		Platform:    PlatformOpenAI,
		Type:        AccountTypeAPIKey,
		Concurrency: 1,
		Credentials: map[string]any{"api_key": "sk-test", "base_url": "https://compat-upstream.example/v1"},
		Extra:       map[string]any{openai_compat.ExtraKeyResponsesSupported: true},
	}

	require.NoError(t, svc.testOpenAIAccountConnection(c, account, "gpt-5.4", "draw a pelican", AccountTestModeDefault))
	require.Equal(t, "draw a pelican", gjson.GetBytes(upstream.lastBody, "input.0.content.0.text").String())
	require.Equal(t, "low", gjson.GetBytes(upstream.lastBody, "reasoning.effort").String())
	require.True(t, gjson.GetBytes(upstream.lastBody, "instructions").Exists())
	require.Contains(t, recorder.Body.String(), "pelican-svg")
}
