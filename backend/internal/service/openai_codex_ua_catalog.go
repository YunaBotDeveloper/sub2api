package service

import (
	"hash/fnv"
	"strings"

	"github.com/Wei-Shaw/sub2api/internal/pkg/openai"
)

// Codex 客户端形态目录。
//
// 真实 Codex 客户端的 User-Agent 形状是
//
//	{originator}/{CLI版本} ({OS} {OS版本}; {架构}) {终端}
//
// 网关此前对所有 OAuth 出站只发一种形态（codexCLIUserAgentSuffix，恒为
// Ubuntu 22.4.0; x86_64 加 xterm-256color）。于是「同一网关的全部账号、全部请求共享
// 一个 OS/架构/终端三元组」本身成为一个稳定特征：上游按该三元组分组即可把整个部署
// 切出来，且账号越多越显眼。本目录按真实流量占比给出候选，并按账号确定性抽取，
// 使不同账号呈现不同但各自恒定的形态。
//
// 只收录 codex-tui 与 codex_exec 两种形态，这是刻意的：
// 桌面端与 VS Code 插件的 UA 末尾带独立构建号，与 CLI 版本成对出现
// （例如 Codex Desktop/0.153.4 ... 末尾 (Codex Desktop; 26.901.51231)）。而本网关的出站
// 版本单一来源于规范身份（面板版本号、自动同步、内置常量，见 resolveCodexOutboundIdentity），
// 出站前必定用生效版本重建版本段。若收录这两种形态，就会拼出「CLI 版本与构建号错配」
// 的组合——真实流量里从未出现过，比统一形态更容易识别。要支持它们，需要先让目录同时
// 成为版本的来源，那会绕过版本自动同步，与「绝不带陈旧版本出站」的既有约束冲突。
//
// codex-tui 与 codex_exec 的末尾标记复用前缀与 CLI 版本，没有独立构建号，因此
// 与版本重建策略天然相容。
//
// 权重取自 codex2api 于 2026-09 对约 6.5 万条去重下游请求的 UA 统计（按百分比取整）。

// codexUAPlatform 是一组 OS 名、OS 版本、架构及其观测占比。
type codexUAPlatform struct {
	OSName    string
	OSVersion string
	Arch      string
	Weight    int
}

// codexUAWeighted 是一个带权候选值（终端标识）。
type codexUAWeighted struct {
	Value  string
	Weight int
}

// codexUAKindSpec 描述一种可模拟的客户端形态。
type codexUAKindSpec struct {
	ClientName string // UA 前缀，同时是 originator
	Terminals  []codexUAWeighted
	Platforms  []codexUAPlatform
}

var codexUACatalog = []codexUAKindSpec{
	{
		ClientName: openai.CodexDefaultOriginator, // codex-tui
		Terminals: []codexUAWeighted{
			{"unknown", 30}, {"WindowsTerminal", 21}, {"kitty", 7}, {"xterm-256color", 7},
			{"vscode/1.135.0", 3}, {"vscode/1.126.0", 3}, {"Apple_Terminal/470.2", 3}, {"Apple_Terminal/455.1", 2},
			{"gnome-terminal", 3}, {"iTerm.app/3.6.11", 2}, {"vscode/1.101.2", 2}, {"xterm", 2}, {"ghostty/1.3.1", 1},
		},
		Platforms: []codexUAPlatform{
			{"Windows", "10.0.26200", "x86_64", 47}, {"NixOS", "26.5.0", "x86_64", 8}, {"Ubuntu", "22.4.0", "x86_64", 7},
			{"Windows", "10.0.19045", "x86_64", 6}, {"Ubuntu", "24.4.0", "x86_64", 4}, {"Ubuntu", "20.4.0", "aarch64", 3},
			{"Mac OS", "14.6.1", "x86_64", 3}, {"Mac OS", "26.6.2", "arm64", 2}, {"Windows", "10.0.22631", "x86_64", 2},
			{"CentOS", "7.0.0", "x86_64", 1}, {"Windows", "10.0.26100", "x86_64", 1}, {"Mac OS", "15.7.7", "x86_64", 1},
			{"Mac OS", "15.7.3", "arm64", 1}, {"Mac OS", "15.5.0", "arm64", 1},
		},
	},
	{
		ClientName: "codex_exec",
		Terminals:  []codexUAWeighted{{"unknown", 56}, {"dumb", 43}, {"kitty", 1}},
		Platforms: []codexUAPlatform{
			{"Windows", "10.0.19045", "x86_64", 52}, {"Ubuntu", "24.4.0", "x86_64", 40}, {"Ubuntu", "22.4.0", "x86_64", 3},
			{"Windows", "10.0.26100", "x86_64", 2}, {"Windows", "10.0.26200", "x86_64", 1}, {"Mac OS", "26.6.2", "arm64", 1},
			{"NixOS", "26.5.0", "x86_64", 1},
		},
	},
}

// codexUAKindWeights 是形态之间的配比：交互式 TUI 远多于非交互 exec。
var codexUAKindWeights = []int{95, 5}

// codexUACatalogExtraKey 允许把某个账号钉死在一种形态上（取值 codex-tui 或 codex_exec）。
// 留空时按种子抽取。
const codexUACatalogExtraKey = "codex_client_kind"

// pickWeighted 按权重确定性地选出一个下标。seed 为账号派生的稳定散列，
// salt 让同一账号在不同维度（形态、平台、终端）上的取值互不相关。
func pickWeighted(weights []int, seed uint64, salt string) int {
	total := 0
	for _, w := range weights {
		if w > 0 {
			total += w
		}
	}
	if total <= 0 {
		return 0
	}
	h := fnv.New64a()
	var seedBytes [8]byte
	for i := 0; i < 8; i++ {
		seedBytes[i] = byte(seed >> (8 * i))
	}
	_, _ = h.Write(seedBytes[:])
	_, _ = h.Write([]byte(salt))
	target := int(h.Sum64() % uint64(total))
	for i, w := range weights {
		if w <= 0 {
			continue
		}
		if target < w {
			return i
		}
		target -= w
	}
	return 0
}

func codexUASeed(account *Account) (uint64, bool) {
	seed, ok := codexFingerprintSeed(account.Extra)
	if !ok || strings.TrimSpace(seed) == "" {
		return 0, false
	}
	h := fnv.New64a()
	_, _ = h.Write([]byte("sub2api:codex-ua-catalog:v1:" + seed))
	return h.Sum64(), true
}

// codexCatalogUserAgent 按账号确定性拼出一条目录内的 User-Agent。
// 账号没有指纹种子时返回空串，由调用方回退到规范 UA——没有种子就没有稳定的账号身份，
// 每请求重抽会让同一账号在上游看来不断换机器，比统一形态更可疑。
//
// 返回的 UA 只贡献客户端名与 OS、架构、终端指纹；版本段随后由
// resolveCodexOutboundIdentity 用生效版本重建，因此这里填当前常量即可。
func codexCatalogUserAgent(account *Account) string {
	if account == nil || !account.UsesOpenAICodexProtocol() {
		return ""
	}
	seed, ok := codexUASeed(account)
	if !ok {
		return ""
	}

	spec := codexUACatalog[pickWeighted(codexUAKindWeights, seed, "kind")]
	if pinned := strings.TrimSpace(account.GetExtraString(codexUACatalogExtraKey)); pinned != "" {
		for i := range codexUACatalog {
			if codexUACatalog[i].ClientName == pinned {
				spec = codexUACatalog[i]
				break
			}
		}
	}

	platformWeights := make([]int, len(spec.Platforms))
	for i, p := range spec.Platforms {
		platformWeights[i] = p.Weight
	}
	platform := spec.Platforms[pickWeighted(platformWeights, seed, "platform")]

	terminalWeights := make([]int, len(spec.Terminals))
	for i, term := range spec.Terminals {
		terminalWeights[i] = term.Weight
	}
	terminal := spec.Terminals[pickWeighted(terminalWeights, seed, "terminal")].Value

	return spec.ClientName + "/" + codexCLIVersion +
		" (" + platform.OSName + " " + platform.OSVersion + "; " + platform.Arch + ") " + terminal
}

// codexAccountCandidateUA 返回送入 resolveCodexOutboundIdentity 的候选 UA：
// 管理员显式配置的账号 UA 优先，其次是目录抽取值，都没有时返回空串走规范 UA。
func codexAccountCandidateUA(account *Account) string {
	if explicit := strings.TrimSpace(account.GetOpenAIUserAgent()); explicit != "" {
		return explicit
	}
	return codexCatalogUserAgent(account)
}
