package service

import (
	"net/http"
	"strings"

	"github.com/tidwall/gjson"
	"github.com/tidwall/sjson"
)

// 上游偶发以 HTTP 200 加 response.incomplete 结束一次「什么都没生成」的响应：
// usage.output_tokens 精确为 0、response.output 为空、此前也没有任何非空 delta 或
// output_item.done。这不是 max_output_tokens 截断，而是上游静默中止（已知触发之一是
// 工具 schema 里的大 oneOf/const 联合）。原样转发会让下游拿到一个空回复且不会重试，
// 看起来像模型死了。
//
// 这里把它就地改写成 response.failed，复用既有的流内失败处理与换号路径
// （见 openai_gateway_response_handling.go 对 response.failed 的分支）。判定条件刻意
// 收紧：数值必须是字面量 0、无 output 项、此前无非空 delta，避免把正常截断误判成断流。
const (
	codexEmptyIncompleteErrorCode    = "empty_incomplete_response"
	codexEmptyIncompleteErrorMessage = "upstream terminated with an incomplete empty response (0 output tokens)"
)

// codexEmptyIncompleteTracker 记录一次上游尝试内是否出现过真实输出。每个 attempt 一份。
type codexEmptyIncompleteTracker struct {
	sawOutputDelta bool
	outputItems    int
}

// Observe 记录事件。只有非空的文本、思考、工具参数 delta 与 output_item.done 计入。
func (t *codexEmptyIncompleteTracker) Observe(eventType string, parsed gjson.Result) {
	if t == nil {
		return
	}
	switch eventType {
	case "response.output_text.delta",
		"response.reasoning_text.delta",
		"response.reasoning_summary_text.delta",
		"response.function_call_arguments.delta",
		"response.custom_tool_call_input.delta":
		if strings.TrimSpace(parsed.Get("delta").String()) != "" {
			t.sawOutputDelta = true
		}
	case "response.output_item.done":
		t.outputItems++
	}
}

// IsEmptyIncomplete 判断该终态事件是否为零输出的 response.incomplete。
func (t *codexEmptyIncompleteTracker) IsEmptyIncomplete(eventType string, parsed gjson.Result) bool {
	if eventType != "response.incomplete" {
		return false
	}
	if t != nil && (t.sawOutputDelta || t.outputItems > 0) {
		return false
	}
	return isCodexEmptyIncompleteResponse(parsed.Get("response"))
}

// isCodexEmptyIncompleteResponse 要求 output 为空且 usage.output_tokens 是字面量整数 0。
// 缺失、null、浮点、非数字一律不算：宁可漏判也不误判成断流。
func isCodexEmptyIncompleteResponse(response gjson.Result) bool {
	if !response.Exists() || !response.IsObject() {
		return false
	}
	if output := response.Get("output"); output.IsArray() && len(output.Array()) > 0 {
		return false
	}
	tokens := response.Get("usage.output_tokens")
	if !tokens.Exists() || tokens.Type != gjson.Number {
		return false
	}
	return strings.TrimSpace(tokens.Raw) == "0"
}

// synthesizeCodexEmptyIncompleteFailureEvent 把 response.incomplete 事件改写成
// response.failed，保留 response.id、model、usage 等字段供日志与计费使用。
func synthesizeCodexEmptyIncompleteFailureEvent(data []byte) []byte {
	out := append([]byte(nil), data...)
	out, _ = sjson.SetBytes(out, "type", "response.failed")
	out, _ = sjson.DeleteBytes(out, "response.incomplete_details")
	return setCodexEmptyIncompleteFailure(out, "response.")
}

// setCodexEmptyIncompleteFailure 只有流式事件一个调用方；非流式路径把 SSE 终态事件
// 交给同一个改写入口，无需再实现一份裸 Responses 对象的版本。
func setCodexEmptyIncompleteFailure(payload []byte, prefix string) []byte {
	payload, _ = sjson.SetBytes(payload, prefix+"status", "failed")
	payload, _ = sjson.SetBytes(payload, prefix+"error.type", "server_error")
	payload, _ = sjson.SetBytes(payload, prefix+"error.code", codexEmptyIncompleteErrorCode)
	payload, _ = sjson.SetBytes(payload, prefix+"error.status_code", http.StatusBadGateway)
	payload, _ = sjson.SetBytes(payload, prefix+"error.message", codexEmptyIncompleteErrorMessage)
	return payload
}

// rewriteCodexEmptyIncompleteTerminal 是各条 SSE 读取循环共用的入口：命中时返回改写后的
// 事件类型与载荷，未命中时原样返回。调用方把返回值赋回本地变量即可。
//
// account 非 Codex 协议时只观察不改写：本形态是 ChatGPT 后端特有的，别的上游把
// response.incomplete 当正常截断用。
func rewriteCodexEmptyIncompleteTerminal(
	tracker *codexEmptyIncompleteTracker,
	account *Account,
	eventType string,
	data []byte,
) (string, []byte) {
	if tracker == nil {
		return eventType, data
	}
	parsed := gjson.ParseBytes(data)
	tracker.Observe(eventType, parsed)
	if !account.UsesOpenAICodexProtocol() || !tracker.IsEmptyIncomplete(eventType, parsed) {
		return eventType, data
	}
	return "response.failed", synthesizeCodexEmptyIncompleteFailureEvent(data)
}
