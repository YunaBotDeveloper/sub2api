package service

import (
	"bytes"
	"io"
	"net/http"
	"sync/atomic"

	"github.com/klauspost/compress/zstd"
)

// Codex 请求体压缩保真。
//
// 真实 Codex CLI 对 ChatGPT 后端的 /responses 请求体默认做 zstd 压缩（codex-rs 的
// enable_request_compression 特性为默认开启，编码级别 3、Content-Encoding: zstd、
// 无最小长度阈值，Content-Type 仍是 application/json）。本网关此前一律发明文 JSON，
// 于是「originator 报 Codex 系客户端、User-Agent 带规范版本号，请求体却 100% 明文」
// 构成一个每请求都在的区分特征：上游按 content-encoding 分组即可整体切出代理流量。
//
// 只作用于 OAuth 直连 ChatGPT 后端的 HTTP 路径。API Key / 第三方中转不压缩：
// 那些上游不一定接受 zstd，且它们本来也不该模仿 Codex CLI。WS 路径正交
// （permessage-deflate 由拨号器协商），无需在此处理。
//
// 一处已知的不完全保真：真实客户端用 libzstd，这里用 klauspost/compress。两者产出
// 的都是合法 zstd 帧且上游解压结果一致，但帧头未必逐字节相同。这比根本不压缩接近
// 得多，但不足以对抗针对压缩器实现的字节级指纹。
//
// 取反义命名与 DisableCodexIdentityEnforcement 一致，让零值落在「压缩开启」一侧：
// 手工构造 Config 的测试与工具不会静默退回明文。
var codexRequestCompression = func() *atomic.Bool {
	v := &atomic.Bool{}
	v.Store(true)
	return v
}()

// SetCodexRequestCompressionEnabled 发布进程级开关快照，由服务构造时按
// gateway.disable_codex_request_compression 取反调用。
func SetCodexRequestCompressionEnabled(enabled bool) {
	codexRequestCompression.Store(enabled)
}

// codexZstdEncoder 复用单个编码器：EncodeAll 可并发调用。
var codexZstdEncoder = func() *zstd.Encoder {
	enc, err := zstd.NewWriter(nil, zstd.WithEncoderLevel(zstd.SpeedDefault))
	if err != nil {
		// 参数固定合法，构造失败即编译期配置错误。
		panic(err)
	}
	return enc
}()

// applyCodexRequestCompression 就地把已构造请求的明文 body 换成 zstd 帧。
// 非 Codex 协议账号、开关关闭、body 为空时原样返回。
//
// req 必须仍持有 body 的明文副本（调用方在构造后未改写过 body），本函数会同时重置
// Body / ContentLength / GetBody —— GetBody 不可省略：重定向与 transport 层重试会
// 用它重放请求体，遗漏会让重放发出空 body。
func applyCodexRequestCompression(req *http.Request, account *Account, body []byte) {
	if req == nil || account == nil || len(body) == 0 {
		return
	}
	if !account.UsesOpenAICodexProtocol() || !codexRequestCompression.Load() {
		return
	}
	compressed := codexZstdEncoder.EncodeAll(body, nil)
	req.Body = io.NopCloser(bytes.NewReader(compressed))
	req.ContentLength = int64(len(compressed))
	req.GetBody = func() (io.ReadCloser, error) {
		return io.NopCloser(bytes.NewReader(compressed)), nil
	}
	req.Header.Set("Content-Encoding", "zstd")
}
