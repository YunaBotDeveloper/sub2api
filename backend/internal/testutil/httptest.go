//go:build unit

package testutil

import (
	"bytes"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/klauspost/compress/zstd"
)

// DecodeUpstreamRequestBody 把上游 mock 记录到的出站请求体还原成明文。
// Codex 出站体默认走 zstd（service/openai_codex_request_compression.go），而所有断言
// 都针对明文，故读取 req.Body 的 mock 应经由本函数。
//
// 非 zstd 编码原样返回；解码失败也原样返回，让随后的明文断言以真实差异失败，
// 而不是在 mock 里 panic 掩盖问题。
func DecodeUpstreamRequestBody(contentEncoding string, wire []byte) []byte {
	if !strings.EqualFold(strings.TrimSpace(contentEncoding), "zstd") || len(wire) == 0 {
		return wire
	}
	dec, err := zstd.NewReader(bytes.NewReader(wire))
	if err != nil {
		return wire
	}
	defer dec.Close()
	plain, err := io.ReadAll(dec)
	if err != nil {
		return wire
	}
	return plain
}

func init() {
	gin.SetMode(gin.TestMode)
}

// NewGinTestContext 创建一个 Gin 测试上下文和 ResponseRecorder。
// body 为空字符串时创建无 body 的请求。
func NewGinTestContext(method, path, body string) (*gin.Context, *httptest.ResponseRecorder) {
	rec := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(rec)

	var bodyReader io.Reader
	if body != "" {
		bodyReader = strings.NewReader(body)
	}

	c.Request = httptest.NewRequest(method, path, bodyReader)
	if method == http.MethodPost || method == http.MethodPut || method == http.MethodPatch {
		c.Request.Header.Set("Content-Type", "application/json")
	}

	return c, rec
}
