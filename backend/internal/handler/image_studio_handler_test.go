//go:build unit

package handler

import (
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
)

func TestImageStudioExecutorReplaysThroughGatewayWithClientIdentity(t *testing.T) {
	gin.SetMode(gin.TestMode)
	var got *http.Request
	var gotBody string
	h := NewImageStudioHandler(nil)
	h.SetGateway(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		got = r
		body, _ := io.ReadAll(r.Body)
		gotBody = string(body)
		w.WriteHeader(http.StatusCreated)
		_, _ = w.Write([]byte(`{"data":[]}`))
	}))

	recorder := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(recorder)
	c.Request = httptest.NewRequest(http.MethodPost, "/api/v1/image-studio/jobs", nil)
	c.Request.RemoteAddr = "203.0.113.9:4321"
	c.Request.Header.Set("X-Forwarded-For", "198.51.100.7")
	c.Request.Header.Set("Authorization", "Bearer user-jwt")

	status, body := h.executor(c)(context.Background(), "/v1/images/generations", "sk-own", []byte(`{"prompt":"x"}`))

	require.Equal(t, http.StatusCreated, status)
	require.JSONEq(t, `{"data":[]}`, string(body))
	require.Equal(t, "/v1/images/generations", got.URL.Path)
	require.Equal(t, "Bearer sk-own", got.Header.Get("Authorization"), "the session JWT must never reach the gateway")
	require.Equal(t, "203.0.113.9:4321", got.RemoteAddr)
	require.Equal(t, "198.51.100.7", got.Header.Get("X-Forwarded-For"))
	require.JSONEq(t, `{"prompt":"x"}`, gotBody)
}

func TestImageStudioExecutorWithoutGateway(t *testing.T) {
	recorder := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(recorder)
	c.Request = httptest.NewRequest(http.MethodPost, "/", nil)
	status, _ := NewImageStudioHandler(nil).executor(c)(context.Background(), "/v1/images/generations", "sk", nil)
	require.Equal(t, http.StatusServiceUnavailable, status)
}
