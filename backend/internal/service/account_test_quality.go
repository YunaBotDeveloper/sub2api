package service

import (
	"context"
	"errors"
	"slices"
	"strings"
)

// AccountTestModeQuality 让管理员用自定义提示词对比账号输出质量（参考 codex2api Quality Test）。
// 与连通性测试共用传输、账号头与 SSE 事件，仅替换提示词、放宽输出上限并可选思考强度。
const AccountTestModeQuality = "quality"

const (
	qualityTestPromptLimit    = 16000
	qualityTestClaudeMaxToken = 32000
)

var (
	qualityTestOpenAIEfforts    = []string{"", "none", "minimal", "low", "medium", "high", "xhigh"}
	qualityTestAnthropicEfforts = []string{"", "low", "medium", "high", "max"}
)

type qualityTestSpec struct {
	Prompt          string
	ReasoningEffort string
}

type qualityTestContextKey struct{}

func isQualityTestMode(mode string) bool {
	return strings.EqualFold(strings.TrimSpace(mode), AccountTestModeQuality)
}

// newQualityTestSpec 校验质量测试输入；仅支持 OpenAI 与 Anthropic 账号。
func newQualityTestSpec(account *Account, prompt, effort string) (qualityTestSpec, error) {
	var efforts []string
	switch {
	case account.IsOpenAI():
		efforts = qualityTestOpenAIEfforts
	case account.Platform == PlatformAnthropic:
		efforts = qualityTestAnthropicEfforts
	default:
		return qualityTestSpec{}, errors.New("quality test supports OpenAI and Anthropic accounts only")
	}
	if strings.TrimSpace(prompt) == "" || len(prompt) > qualityTestPromptLimit {
		return qualityTestSpec{}, errors.New("quality test prompt must be non-empty and at most 16000 bytes")
	}
	effort = strings.ToLower(strings.TrimSpace(effort))
	if !slices.Contains(efforts, effort) {
		return qualityTestSpec{}, errors.New("unsupported reasoning effort for this platform")
	}
	return qualityTestSpec{Prompt: prompt, ReasoningEffort: effort}, nil
}

func withQualityTestSpec(ctx context.Context, spec qualityTestSpec) context.Context {
	return context.WithValue(ctx, qualityTestContextKey{}, spec)
}

func qualityTestSpecFromContext(ctx context.Context) (qualityTestSpec, bool) {
	spec, ok := ctx.Value(qualityTestContextKey{}).(qualityTestSpec)
	return spec, ok
}

// applyOpenAIQualityTestPayload 保留 instructions/store 等上游必需字段，只替换输入与思考强度。
func applyOpenAIQualityTestPayload(ctx context.Context, payload map[string]any) {
	spec, ok := qualityTestSpecFromContext(ctx)
	if !ok {
		return
	}
	payload["input"] = []map[string]any{{
		"role":    "user",
		"content": []map[string]any{{"type": "input_text", "text": spec.Prompt}},
	}}
	if spec.ReasoningEffort != "" {
		payload["reasoning"] = map[string]any{"effort": spec.ReasoningEffort}
	}
}

// applyClaudeQualityTestPayload 保留 Claude Code system 与 metadata，只替换用户消息、输出上限与思考强度。
func applyClaudeQualityTestPayload(ctx context.Context, payload map[string]any) {
	spec, ok := qualityTestSpecFromContext(ctx)
	if !ok {
		return
	}
	payload["messages"] = []map[string]any{{
		"role": "user",
		"content": []map[string]any{{
			"type":          "text",
			"text":          spec.Prompt,
			"cache_control": map[string]string{"type": "ephemeral"},
		}},
	}}
	payload["max_tokens"] = qualityTestClaudeMaxToken
	if spec.ReasoningEffort != "" {
		payload["thinking"] = map[string]any{"type": "adaptive"}
		payload["output_config"] = map[string]any{"effort": spec.ReasoningEffort}
	}
}
