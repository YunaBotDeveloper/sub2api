//go:build unit

package service

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/tidwall/gjson"
)

// 客户端在 messages 上打 1h 断点、网关在 tools/system 上注入 5m 时，
// 上游会以 "a ttl='1h' cache_control block must not come after a ttl='5m'
// cache_control block" 400 拒绝整个请求。靠前的块必须被升到 1h。
func TestNormalizeCacheControlTTLOrderUpgradesEarlierBlocks(t *testing.T) {
	body := []byte(`{
		"tools":[{"name":"a","input_schema":{},"cache_control":{"type":"ephemeral","ttl":"5m"}}],
		"system":[{"type":"text","text":"sys","cache_control":{"type":"ephemeral","ttl":"5m"}}],
		"messages":[{"role":"user","content":[{"type":"text","text":"hi","cache_control":{"type":"ephemeral","ttl":"1h"}}]}]
	}`)

	out := normalizeCacheControlTTLOrder(body)

	assert.Equal(t, "1h", gjson.GetBytes(out, "tools.0.cache_control.ttl").String())
	assert.Equal(t, "1h", gjson.GetBytes(out, "system.0.cache_control.ttl").String())
	assert.Equal(t, "1h", gjson.GetBytes(out, "messages.0.content.0.cache_control.ttl").String())
}

// 没有 ttl 字段的块按上游默认等价于 5m，同样要被升上去。
func TestNormalizeCacheControlTTLOrderUpgradesMissingTTL(t *testing.T) {
	body := []byte(`{
		"tools":[{"name":"a","input_schema":{},"cache_control":{"type":"ephemeral"}}],
		"messages":[{"role":"user","content":[{"type":"text","text":"hi","cache_control":{"type":"ephemeral","ttl":"1h"}}]}]
	}`)

	out := normalizeCacheControlTTLOrder(body)

	assert.Equal(t, "1h", gjson.GetBytes(out, "tools.0.cache_control.ttl").String())
}

// 1h 之后的 5m 是合法排列，不能被改动（否则平白抬高缓存写入成本）。
func TestNormalizeCacheControlTTLOrderKeepsLaterShortTTL(t *testing.T) {
	body := []byte(`{
		"tools":[{"name":"a","input_schema":{},"cache_control":{"type":"ephemeral","ttl":"1h"}}],
		"messages":[{"role":"user","content":[{"type":"text","text":"hi","cache_control":{"type":"ephemeral","ttl":"5m"}}]}]
	}`)

	out := normalizeCacheControlTTLOrder(body)

	assert.Equal(t, "1h", gjson.GetBytes(out, "tools.0.cache_control.ttl").String())
	assert.Equal(t, "5m", gjson.GetBytes(out, "messages.0.content.0.cache_control.ttl").String())
}

// 全部是 5m 时不做任何事，请求体逐字节保持原样。
func TestNormalizeCacheControlTTLOrderNoopWithoutLongTTL(t *testing.T) {
	body := []byte(`{"system":[{"type":"text","text":"sys","cache_control":{"type":"ephemeral","ttl":"5m"}}],"messages":[{"role":"user","content":[{"type":"text","text":"hi","cache_control":{"type":"ephemeral"}}]}]}`)

	assert.Equal(t, string(body), string(normalizeCacheControlTTLOrder(body)))
}

// enforceCacheControlLimit 是 5 条转发链路共用的收口，顺序归一必须挂在它上面。
func TestEnforceCacheControlLimitNormalizesTTLOrder(t *testing.T) {
	body := []byte(`{
		"tools":[{"name":"a","input_schema":{},"cache_control":{"type":"ephemeral","ttl":"5m"}}],
		"messages":[{"role":"user","content":[{"type":"text","text":"hi","cache_control":{"type":"ephemeral","ttl":"1h"}}]}]
	}`)

	out := enforceCacheControlLimit(body)

	assert.Equal(t, "1h", gjson.GetBytes(out, "tools.0.cache_control.ttl").String())
}
