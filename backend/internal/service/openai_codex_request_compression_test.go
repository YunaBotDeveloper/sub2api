//go:build unit

package service

import (
	"bytes"
	"io"
	"net/http"
	"testing"

	"github.com/klauspost/compress/zstd"
	"github.com/stretchr/testify/require"
)

func newCompressionTestRequest(t *testing.T, body []byte) *http.Request {
	t.Helper()
	req, err := http.NewRequest(http.MethodPost, "https://chatgpt.com/backend-api/codex/responses", bytes.NewReader(body))
	require.NoError(t, err)
	return req
}

func decodeZstd(t *testing.T, r io.Reader) []byte {
	t.Helper()
	dec, err := zstd.NewReader(r)
	require.NoError(t, err)
	defer dec.Close()
	out, err := io.ReadAll(dec)
	require.NoError(t, err)
	return out
}

func TestApplyCodexRequestCompression(t *testing.T) {
	body := []byte(`{"model":"gpt-5.5","input":[{"role":"user","content":"hello"}]}`)

	t.Run("codex account compresses and stays replayable", func(t *testing.T) {
		req := newCompressionTestRequest(t, body)
		applyCodexRequestCompression(req, &Account{Type: AccountTypeOAuth}, body)

		require.Equal(t, "zstd", req.Header.Get("Content-Encoding"))

		sent, err := io.ReadAll(req.Body)
		require.NoError(t, err)
		require.NotEqual(t, body, sent, "body must not go out as plaintext")
		require.Equal(t, int64(len(sent)), req.ContentLength)
		require.Equal(t, body, decodeZstd(t, bytes.NewReader(sent)))

		// GetBody 必须重放同一帧：重定向与 transport 重试依赖它。
		require.NotNil(t, req.GetBody)
		replay, err := req.GetBody()
		require.NoError(t, err)
		defer replay.Close()
		require.Equal(t, body, decodeZstd(t, replay))
	})

	t.Run("non codex account stays plaintext", func(t *testing.T) {
		req := newCompressionTestRequest(t, body)
		applyCodexRequestCompression(req, &Account{Type: AccountTypeAPIKey}, body)

		require.Empty(t, req.Header.Get("Content-Encoding"))
		sent, err := io.ReadAll(req.Body)
		require.NoError(t, err)
		require.Equal(t, body, sent)
	})

	t.Run("switch off restores plaintext", func(t *testing.T) {
		SetCodexRequestCompressionEnabled(false)
		t.Cleanup(func() { SetCodexRequestCompressionEnabled(true) })

		req := newCompressionTestRequest(t, body)
		applyCodexRequestCompression(req, &Account{Type: AccountTypeOAuth}, body)

		require.Empty(t, req.Header.Get("Content-Encoding"))
		sent, err := io.ReadAll(req.Body)
		require.NoError(t, err)
		require.Equal(t, body, sent)
	})

	t.Run("empty body and nil inputs are no-ops", func(t *testing.T) {
		req := newCompressionTestRequest(t, nil)
		applyCodexRequestCompression(req, &Account{Type: AccountTypeOAuth}, nil)
		require.Empty(t, req.Header.Get("Content-Encoding"))

		require.NotPanics(t, func() {
			applyCodexRequestCompression(nil, &Account{Type: AccountTypeOAuth}, body)
			applyCodexRequestCompression(req, nil, body)
		})
	})
}
