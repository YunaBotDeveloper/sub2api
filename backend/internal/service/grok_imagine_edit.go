package service

import (
	"bufio"
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"mime"
	"net/http"
	"strings"
	"time"

	"github.com/Wei-Shaw/sub2api/internal/pkg/logger"
	"github.com/gin-gonic/gin"
	"github.com/tidwall/gjson"
	"go.uber.org/zap"
)

// grok.com edits images over REST, not the imagine WebSocket: upload each
// source image as an asset, then open an imagine-image-edit conversation that
// streams NDJSON progress lines. Payload shapes mirror a captured grok.com session.
const (
	grokWebUploadURL       = "https://grok.com/rest/app-chat/upload-file"
	grokWebConversationURL = "https://grok.com/rest/app-chat/conversations/new"
	grokWebAssetsBaseURL   = "https://assets.grok.com/"
	grokWebReferer         = "https://grok.com/imagine"
	grokImagineEditModel   = "imagine-image-edit"
	grokImagineEditMaxBody = 32 << 20
)

// grok.com accepts its own client-side error fallback in place of a solved
// statsig challenge. ponytail: static value, generate a real challenge token if
// upstream starts rejecting it.
var grokWebStatsigID = base64.StdEncoding.EncodeToString(
	[]byte("e:TypeError: Cannot read properties of null (reading 'children')"))

type grokImagineInput struct {
	Name     string
	MimeType string
	Data     []byte
}

// grokImagineEditInputs collects source images from multipart uploads and
// data URLs. Remote URLs are rejected rather than fetched server-side.
func grokImagineEditInputs(info GrokMediaRequestInfo) ([]grokImagineInput, error) {
	if info.MaskUpload != nil || strings.TrimSpace(info.MaskImageURL) != "" {
		return nil, fmt.Errorf("grok image edit does not support masks")
	}
	inputs := make([]grokImagineInput, 0, len(info.Uploads)+len(info.InputImageURLs))
	for _, upload := range info.Uploads {
		mimeType := strings.TrimSpace(upload.ContentType)
		if mimeType == "" || mimeType == "application/octet-stream" {
			mimeType = http.DetectContentType(upload.Data)
		}
		inputs = append(inputs, grokImagineInput{Name: upload.FileName, MimeType: mimeType, Data: upload.Data})
	}
	for _, raw := range info.InputImageURLs {
		data, mimeType, err := decodeGrokImageDataURL(raw)
		if err != nil {
			return nil, err
		}
		inputs = append(inputs, grokImagineInput{Name: "image" + grokImageExt(mimeType), MimeType: mimeType, Data: data})
	}
	if len(inputs) == 0 {
		return nil, fmt.Errorf("image is required for image edits")
	}
	return inputs, nil
}

func decodeGrokImageDataURL(raw string) ([]byte, string, error) {
	raw = strings.TrimSpace(raw)
	if !strings.HasPrefix(raw, "data:") {
		return nil, "", fmt.Errorf("grok image edit accepts uploaded files or base64 data URLs, not remote image URLs")
	}
	header, payload, ok := strings.Cut(raw[len("data:"):], ",")
	if !ok || !strings.HasSuffix(strings.ToLower(header), ";base64") {
		return nil, "", fmt.Errorf("image data URL must be base64 encoded")
	}
	mimeType, _, err := mime.ParseMediaType(header[:len(header)-len(";base64")])
	if err != nil || !strings.HasPrefix(mimeType, "image/") {
		return nil, "", fmt.Errorf("image data URL must carry an image media type")
	}
	data, err := base64.StdEncoding.DecodeString(payload)
	if err != nil {
		return nil, "", fmt.Errorf("decode image data URL: %w", err)
	}
	return data, mimeType, nil
}

func grokImageExt(mimeType string) string {
	if exts, _ := mime.ExtensionsByType(mimeType); len(exts) > 0 {
		return exts[0]
	}
	return ".jpg"
}

// parseGrokImagineEditStream reads the conversation NDJSON stream and returns
// the finished (progress 100) images, ignoring the 50% previews.
func parseGrokImagineEditStream(r io.Reader) ([]grokImagineImage, bool, error) {
	scanner := bufio.NewScanner(r)
	scanner.Buffer(make([]byte, 0, 64<<10), grokImagineEditMaxBody)
	var (
		width, height int
		moderated     bool
		images        []grokImagineImage
	)
	for scanner.Scan() {
		line := bytes.TrimSpace(scanner.Bytes())
		if len(line) == 0 || !gjson.ValidBytes(line) {
			continue
		}
		if msg := gjson.GetBytes(line, "error.message"); msg.Exists() {
			return nil, false, fmt.Errorf("grok image edit upstream error: %s", msg.String())
		}
		resp := gjson.GetBytes(line, "result.response")
		if dims := resp.Get("imageDimensions"); dims.Exists() {
			width, height = int(dims.Get("width").Int()), int(dims.Get("height").Int())
		}
		gen := resp.Get("streamingImageGenerationResponse")
		if !gen.Exists() {
			continue
		}
		if gen.Get("moderated").Bool() {
			moderated = true
		}
		imageURL := strings.TrimSpace(gen.Get("imageUrl").String())
		if gen.Get("progress").Float() < 100 || imageURL == "" {
			continue
		}
		if !strings.HasPrefix(imageURL, "http") {
			imageURL = grokWebAssetsBaseURL + strings.TrimPrefix(imageURL, "/")
		}
		images = append(images, grokImagineImage{
			JobID:  gen.Get("imageId").String(),
			URL:    imageURL,
			Order:  int(gen.Get("imageIndex").Int()),
			Width:  width,
			Height: height,
		})
	}
	if err := scanner.Err(); err != nil {
		return nil, moderated, fmt.Errorf("read grok image edit stream: %w", err)
	}
	sortGrokImagineImages(images)
	return images, moderated, nil
}

func buildGrokImagineEditBody(prompt string, assetIDs []string) ([]byte, error) {
	return json.Marshal(map[string]any{
		"modelName":            grokImagineEditModel,
		"message":              prompt,
		"enableImageStreaming": true,
		"enableSideBySide":     false,
		"sendFinalMetadata":    true,
		"responseMetadata": map[string]any{
			"modelConfigOverride": map[string]any{
				"modelMap": map[string]any{"imageEditModel": "imagine"},
			},
		},
		"mediaGenInput": map[string]any{
			"imageToImage": map[string]any{"prompt": prompt, "inputAssets": assetIDs},
		},
		"kind": "CONVERSATION_KIND_IMAGINE",
	})
}

// grokWebStatusError turns a non-2xx grok.com response into an error; auth,
// Cloudflare and rate-limit rejections fail over like a failed WS handshake.
func grokWebStatusError(c *gin.Context, resp *http.Response, stage string) error {
	message := "grok image edit " + stage + " failed"
	if isCloudflareChallenge(resp) {
		message += ": blocked by Cloudflare challenge (set gateway.grok.flaresolverr_url)"
	}
	body, _ := io.ReadAll(io.LimitReader(resp.Body, 4<<10))
	setOpsUpstreamError(c, resp.StatusCode, message, truncateString(string(body), 512))
	logger.L().Warn("grok_imagine_edit.upstream_rejected",
		zap.String("stage", stage),
		zap.Int("status", resp.StatusCode),
		zap.String("cf_mitigated", resp.Header.Get("cf-mitigated")),
		zap.String("content_type", resp.Header.Get("Content-Type")),
		zap.String("body", truncateString(string(body), 512)))
	if resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden || resp.StatusCode == http.StatusTooManyRequests {
		return &UpstreamFailoverError{
			StatusCode:   resp.StatusCode,
			ResponseBody: []byte(fmt.Sprintf(`{"error":{"message":%q,"type":"grok_imagine_edit_failed"}}`, "grok image edit "+stage+" rejected")),
		}
	}
	return fmt.Errorf("grok image edit %s failed: status %d: %s", stage, resp.StatusCode, truncateString(string(body), 256))
}

// forwardGrokImagineEdit runs one images/edits request through grok.com's web
// image-edit flow and writes an OpenAI-shaped response.
func (s *OpenAIGatewayService) forwardGrokImagineEdit(
	ctx context.Context,
	c *gin.Context,
	account *Account,
	requestID string,
	body []byte,
	contentType string,
	startTime time.Time,
) (*OpenAIForwardResult, error) {
	ssoToken := strings.TrimSpace(account.GetCredential(grokImagineSSOCredKey))
	if ssoToken == "" {
		return nil, fmt.Errorf("grok account has no sso_token for imagine")
	}
	info := ParseGrokMediaRequest(contentType, body)
	prompt := strings.TrimSpace(info.Prompt)
	if prompt == "" {
		return nil, fmt.Errorf("prompt is required")
	}
	inputs, err := grokImagineEditInputs(info)
	if err != nil {
		return nil, err
	}

	proxyRawURL := ""
	if account.ProxyID != nil && account.Proxy != nil {
		proxyRawURL = account.Proxy.URL()
	}
	client, err := grokImagineDialClient(proxyRawURL)
	if err != nil {
		return nil, err
	}
	web := &grokWebSession{client: client, ssoToken: ssoToken, proxyURL: proxyRawURL}
	if s.cfg != nil {
		web.solverURL = strings.TrimSpace(s.cfg.Gateway.Grok.FlareSolverrURL)
	}
	upstreamCtx, releaseUpstreamCtx := detachUpstreamContext(ctx)
	defer releaseUpstreamCtx()
	reqCtx, cancel := context.WithTimeout(upstreamCtx, grokImagineTimeout)
	defer cancel()
	upstreamStart := time.Now()

	assetIDs := make([]string, 0, len(inputs))
	for _, input := range inputs {
		payload, err := json.Marshal(map[string]string{
			"fileName":     input.Name,
			"fileMimeType": input.MimeType,
			"content":      base64.StdEncoding.EncodeToString(input.Data),
		})
		if err != nil {
			return nil, err
		}
		resp, err := web.do(reqCtx, http.MethodPost, grokWebUploadURL, payload)
		if err != nil {
			return nil, fmt.Errorf("upload grok edit image: %w", err)
		}
		if resp.StatusCode >= 300 {
			err = grokWebStatusError(c, resp, "upload")
			_ = resp.Body.Close()
			return nil, err
		}
		respBody, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
		_ = resp.Body.Close()
		if err != nil {
			return nil, fmt.Errorf("read grok upload response: %w", err)
		}
		assetID := strings.TrimSpace(gjson.GetBytes(respBody, "fileMetadataId").String())
		if assetID == "" {
			return nil, fmt.Errorf("grok upload returned no fileMetadataId: %s", truncateString(string(respBody), 256))
		}
		assetIDs = append(assetIDs, assetID)
	}

	editBody, err := buildGrokImagineEditBody(prompt, assetIDs)
	if err != nil {
		return nil, err
	}
	resp, err := web.do(reqCtx, http.MethodPost, grokWebConversationURL, editBody)
	if err != nil {
		return nil, fmt.Errorf("send grok image edit: %w", err)
	}
	defer func() { _ = resp.Body.Close() }()
	if resp.StatusCode >= 300 {
		return nil, grokWebStatusError(c, resp, "conversation")
	}
	images, moderated, err := parseGrokImagineEditStream(resp.Body)
	if err != nil {
		return nil, err
	}
	if moderated {
		return nil, fmt.Errorf("grok imagine rejected the edit as moderated")
	}
	if len(images) == 0 {
		return nil, fmt.Errorf("grok image edit returned no finished image")
	}

	// Generated assets are only readable with the account cookie, so b64_json
	// callers (like Image Studio) get the bytes fetched here.
	if grokImagineResponseFormat(body) == "b64_json" {
		for i := range images {
			blob, err := fetchGrokWebAsset(reqCtx, web, images[i].URL)
			if err != nil {
				return nil, err
			}
			images[i].Blob = blob
		}
	}
	SetOpsLatencyMs(c, OpsUpstreamLatencyMsKey, time.Since(upstreamStart).Milliseconds())
	return writeGrokImagineResult(c, requestID, info, images, body, startTime)
}

func fetchGrokWebAsset(ctx context.Context, web *grokWebSession, url string) (string, error) {
	resp, err := web.do(ctx, http.MethodGet, url, nil)
	if err != nil {
		return "", fmt.Errorf("download grok edited image: %w", err)
	}
	defer func() { _ = resp.Body.Close() }()
	if resp.StatusCode >= 300 {
		return "", fmt.Errorf("download grok edited image: status %d", resp.StatusCode)
	}
	data, err := io.ReadAll(io.LimitReader(resp.Body, grokImagineEditMaxBody))
	if err != nil {
		return "", fmt.Errorf("download grok edited image: %w", err)
	}
	return base64.StdEncoding.EncodeToString(data), nil
}
