//go:build unit

package service

import (
	"fmt"
	"strings"
	"testing"

	"github.com/Wei-Shaw/sub2api/internal/pkg/openai"
	"github.com/stretchr/testify/require"
)

// codexUAAccount 构造一个带指纹种子的 OAuth 账号。种子必须是规范 UUID
// （canonicalCodexFingerprintSeed 会拒绝其他形态），故由标签派生一个稳定 UUID。
func codexUAAccount(label string) *Account {
	return &Account{
		Platform: PlatformOpenAI,
		Type:     AccountTypeOAuth,
		Extra:    map[string]any{codexFingerprintSeedExtraKey: deriveStableUUIDv4("codex-ua-test:" + label)},
	}
}

func TestCodexCatalogUserAgent(t *testing.T) {
	t.Run("stable per account", func(t *testing.T) {
		account := codexUAAccount("11111111-1111-4111-8111-111111111111")
		first := codexCatalogUserAgent(account)
		require.NotEmpty(t, first)
		for i := 0; i < 20; i++ {
			require.Equal(t, first, codexCatalogUserAgent(account), "同一账号必须恒定")
		}
	})

	t.Run("catalog UA pairs to a real originator and survives version rebuild", func(t *testing.T) {
		// 目录拼出的每种形态都必须能被 openai.PairCodexClientIdentity 认出，
		// 否则 resolveCodexOutboundIdentity 会整体回退，目录等于没生效。
		seen := map[string]bool{}
		for i := 0; i < 200; i++ {
			ua := codexCatalogUserAgent(codexUAAccount(fmt.Sprintf("seed-%d", i)))
			require.NotEmpty(t, ua)

			originator, paired, ok := openai.PairCodexClientIdentity(ua)
			require.True(t, ok, "UA 必须可配对: %s", ua)
			require.True(t, strings.HasPrefix(paired, originator+"/"), "UA 首段必须与 originator 配套: %s", paired)
			seen[originator] = true

			// 版本重建后 UA 仍自洽：没有独立构建号可被覆写。
			rebuilt := openai.SetCodexUserAgentVersion(ua, "0.199.0")
			require.NotEmpty(t, rebuilt)
			require.Equal(t, "0.199.0", openai.CodexUserAgentVersion(rebuilt))
		}
		require.True(t, seen[openai.CodexDefaultOriginator], "样本里应出现 codex-tui")
	})

	t.Run("distribution spans multiple platforms", func(t *testing.T) {
		// 目录存在的意义就是不再让所有账号共享一个 OS/终端三元组。
		suffixes := map[string]int{}
		for i := 0; i < 200; i++ {
			ua := codexCatalogUserAgent(codexUAAccount(fmt.Sprintf("dist-%d", i)))
			if open := strings.Index(ua, " ("); open >= 0 {
				suffixes[ua[open:]]++
			}
		}
		require.Greater(t, len(suffixes), 5, "抽样应覆盖多种 OS/终端组合，实际 %d 种", len(suffixes))
	})

	t.Run("pinned kind wins", func(t *testing.T) {
		account := codexUAAccount("pin-seed")
		account.Extra[codexUACatalogExtraKey] = "codex_exec"
		require.True(t, strings.HasPrefix(codexCatalogUserAgent(account), "codex_exec/"))
	})

	t.Run("no seed and non codex accounts fall back to canonical", func(t *testing.T) {
		require.Empty(t, codexCatalogUserAgent(&Account{Platform: PlatformOpenAI, Type: AccountTypeOAuth}))
		require.Empty(t, codexCatalogUserAgent(nil))
		apiKey := &Account{Platform: PlatformOpenAI, Type: AccountTypeAPIKey, Extra: map[string]any{codexFingerprintSeedExtraKey: deriveStableUUIDv4("k")}}
		require.Empty(t, codexCatalogUserAgent(apiKey))
	})
}

func TestCodexAccountCandidateUA(t *testing.T) {
	t.Run("explicit account user agent wins over catalog", func(t *testing.T) {
		account := codexUAAccount("explicit-seed")
		account.Credentials = map[string]any{"user_agent": "codex-tui/0.150.0 (Mac OS 15.0.0; arm64) iTerm.app/3.5.0"}
		require.Equal(t, "codex-tui/0.150.0 (Mac OS 15.0.0; arm64) iTerm.app/3.5.0", codexAccountCandidateUA(account))
	})

	t.Run("falls back to catalog then to empty", func(t *testing.T) {
		require.NotEmpty(t, codexAccountCandidateUA(codexUAAccount("fallback-seed")))
		require.Empty(t, codexAccountCandidateUA(&Account{Platform: PlatformOpenAI, Type: AccountTypeOAuth}))
	})
}

func TestPickWeightedRespectsWeights(t *testing.T) {
	// 权重为 0 的候选永远不被选中；全零时退回下标 0。
	for i := 0; i < 100; i++ {
		require.Equal(t, 1, pickWeighted([]int{0, 5, 0}, uint64(i), "salt"))
	}
	require.Equal(t, 0, pickWeighted([]int{0, 0}, 7, "salt"))
	require.Equal(t, 0, pickWeighted(nil, 7, "salt"))
}
