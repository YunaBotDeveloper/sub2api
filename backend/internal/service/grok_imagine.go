package service

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/Wei-Shaw/sub2api/internal/pkg/proxyurl"
	"github.com/Wei-Shaw/sub2api/internal/pkg/proxyutil"
	"github.com/coder/websocket"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/tidwall/gjson"
)

// Grok's web app generates images over a WebSocket rather than the CLI proxy
// REST API, and that is the only path that currently returns images for these
// accounts. Accounts carrying an sso_token use it; the rest keep the REST path
// in ForwardGrokMedia.
const (
	grokImagineWSURL      = "wss://grok.com/ws/imagine/listen"
	grokImagineOrigin     = "https://grok.com"
	grokImagineUserAgent  = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36"
	grokImagineMaxN       = 4
	grokImagineTimeout    = 3 * time.Minute
	grokImagineReadLimit  = 32 << 20
	grokImagineSSOCredKey = "sso_token"
)

// grokImagineFrame is the subset of the WebSocket message shape we consume.
// Upstream sends progress ("json") and payload ("image") frames per job.
type grokImagineFrame struct {
	Type               string  `json:"type"`
	CurrentStatus      string  `json:"current_status"`
	JobID              string  `json:"job_id"`
	ImageID            string  `json:"image_id"`
	ID                 string  `json:"id"`
	URL                string  `json:"url"`
	Blob               string  `json:"blob"`
	PercentageComplete float64 `json:"percentage_complete"`
	Order              int     `json:"order"`
	Width              int     `json:"width"`
	Height             int     `json:"height"`
	Moderated          *bool   `json:"moderated"`
	Error              string  `json:"error"`
}

type grokImagineImage struct {
	JobID    string
	URL      string
	Blob     string
	Order    int
	Width    int
	Height   int
	progress float64
}

func (i grokImagineImage) size() string {
	if i.Width <= 0 || i.Height <= 0 {
		return ""
	}
	return strconv.Itoa(i.Width) + "x" + strconv.Itoa(i.Height)
}

// grokImagineCollector assembles per-job images from the frame stream.
// Upstream sends a low-res preview (percentage_complete 50) before the final
// image (100), so a higher-progress frame replaces an earlier one.
type grokImagineCollector struct {
	want      int
	images    map[string]grokImagineImage
	completed map[string]bool
	moderated bool
}

func newGrokImagineCollector(want int) *grokImagineCollector {
	if want <= 0 {
		want = 1
	}
	return &grokImagineCollector{
		want:      want,
		images:    make(map[string]grokImagineImage, want),
		completed: make(map[string]bool, want),
	}
}

// accept folds one frame in and reports whether every requested job finished.
func (c *grokImagineCollector) accept(data []byte) (bool, error) {
	var frame grokImagineFrame
	if err := json.Unmarshal(data, &frame); err != nil {
		// Unknown frame shapes are not fatal: upstream also sends session and
		// telemetry frames we do not model.
		return c.done(), nil
	}
	if strings.TrimSpace(frame.Error) != "" {
		return false, fmt.Errorf("grok imagine upstream error: %s", frame.Error)
	}
	if frame.Moderated != nil && *frame.Moderated {
		c.moderated = true
	}

	jobID := firstNonEmpty(frame.JobID, frame.ImageID, frame.ID)
	if jobID == "" {
		return c.done(), nil
	}

	switch frame.Type {
	case "image":
		if prev, seen := c.images[jobID]; seen && frame.PercentageComplete < prev.progress {
			return c.done(), nil
		}
		c.images[jobID] = grokImagineImage{
			JobID:    jobID,
			URL:      strings.TrimSpace(frame.URL),
			Blob:     frame.Blob,
			Order:    frame.Order,
			Width:    frame.Width,
			Height:   frame.Height,
			progress: frame.PercentageComplete,
		}
	case "json":
		if frame.CurrentStatus == "completed" {
			c.completed[jobID] = true
			if img, ok := c.images[jobID]; ok {
				if img.Width == 0 {
					img.Width = frame.Width
				}
				if img.Height == 0 {
					img.Height = frame.Height
				}
				c.images[jobID] = img
			}
		}
	}
	return c.done(), nil
}

func (c *grokImagineCollector) done() bool {
	if len(c.completed) < c.want {
		return false
	}
	for jobID := range c.completed {
		img, ok := c.images[jobID]
		if !ok || (img.URL == "" && img.Blob == "") {
			return false
		}
	}
	return true
}

// results returns the collected images ordered by the upstream grid order.
func (c *grokImagineCollector) results() []grokImagineImage {
	out := make([]grokImagineImage, 0, len(c.images))
	for _, img := range c.images {
		if img.URL == "" && img.Blob == "" {
			continue
		}
		out = append(out, img)
	}
	sortGrokImagineImages(out)
	return out
}

func sortGrokImagineImages(images []grokImagineImage) {
	// ponytail: insertion sort, n <= grokImagineMaxN.
	for i := 1; i < len(images); i++ {
		for j := i; j > 0 && images[j].Order < images[j-1].Order; j-- {
			images[j], images[j-1] = images[j-1], images[j]
		}
	}
}

// buildGrokImagineRequestFrame mirrors the payload grok.com's web app sends.
func buildGrokImagineRequestFrame(prompt, requestID string, n int, pro bool) ([]byte, error) {
	return json.Marshal(map[string]any{
		"type":      "conversation.item.create",
		"timestamp": time.Now().UnixMilli(),
		"item": map[string]any{
			"type": "message",
			"content": []any{map[string]any{
				"requestId": requestID,
				"text":      prompt,
				"type":      "input_text",
				"properties": map[string]any{
					"section_count":       0,
					"is_kids_mode":        false,
					"enable_nsfw":         false,
					"skip_upsampler":      false,
					"enable_side_by_side": false,
					"is_initial":          false,
					"enable_pro":          pro,
					"num_generations":     n,
					"enable_watermark":    false,
				},
			}},
		},
	})
}

// buildGrokImagineImagesResponse renders collected images as an OpenAI
// images/generations response body.
func buildGrokImagineImagesResponse(images []grokImagineImage, responseFormat string) ([]byte, error) {
	data := make([]map[string]any, 0, len(images))
	for _, img := range images {
		entry := map[string]any{}
		if responseFormat == "b64_json" {
			if img.Blob == "" {
				return nil, fmt.Errorf("grok imagine returned no image bytes for b64_json")
			}
			entry["b64_json"] = img.Blob
		} else {
			if img.URL == "" {
				return nil, fmt.Errorf("grok imagine returned no image url")
			}
			entry["url"] = img.URL
		}
		data = append(data, entry)
	}
	if len(data) == 0 {
		return nil, fmt.Errorf("grok imagine returned no images")
	}
	return json.Marshal(map[string]any{
		"created": time.Now().Unix(),
		"data":    data,
	})
}

// grokImagineEnablePro reports whether the requested model maps to the
// higher-quality upstream mode.
func grokImagineEnablePro(model string) bool {
	return strings.Contains(strings.ToLower(model), "quality")
}

func grokImagineResponseFormat(body []byte) string {
	if !gjson.ValidBytes(body) {
		return ""
	}
	if format := strings.TrimSpace(gjson.GetBytes(body, "response_format").String()); format == "b64_json" {
		return "b64_json"
	}
	return ""
}

func grokImagineDialClient(proxyRawURL string) (*http.Client, error) {
	transport := &http.Transport{Proxy: http.ProxyFromEnvironment}
	if strings.TrimSpace(proxyRawURL) != "" {
		_, parsed, err := proxyurl.Parse(proxyRawURL)
		if err != nil {
			return nil, fmt.Errorf("parse grok imagine proxy: %w", err)
		}
		transport.Proxy = nil
		if err := proxyutil.ConfigureTransportProxy(transport, parsed); err != nil {
			return nil, fmt.Errorf("configure grok imagine proxy: %w", err)
		}
	}
	return &http.Client{Transport: transport}, nil
}

// forwardGrokImagineImages runs one images/generations request over the web
// WebSocket session and writes an OpenAI-shaped response.
func (s *OpenAIGatewayService) forwardGrokImagineImages(
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
	n := info.N
	if n > grokImagineMaxN {
		n = grokImagineMaxN
	}

	proxyRawURL := ""
	if account.ProxyID != nil && account.Proxy != nil {
		proxyRawURL = account.Proxy.URL()
	}
	httpClient, err := grokImagineDialClient(proxyRawURL)
	if err != nil {
		return nil, err
	}

	upstreamCtx, releaseUpstreamCtx := detachUpstreamContext(ctx)
	defer releaseUpstreamCtx()
	dialCtx, cancel := context.WithTimeout(upstreamCtx, grokImagineTimeout)
	defer cancel()

	upstreamStart := time.Now()
	conn, resp, err := websocket.Dial(dialCtx, grokImagineWSURL, &websocket.DialOptions{
		HTTPClient: httpClient,
		HTTPHeader: http.Header{
			"Cookie":     {"sso=" + ssoToken},
			"Origin":     {grokImagineOrigin},
			"User-Agent": {grokImagineUserAgent},
		},
	})
	if err != nil {
		status := http.StatusBadGateway
		if resp != nil {
			status = resp.StatusCode
		}
		// A rejected handshake means the sso cookie expired or Cloudflare
		// blocked us; both warrant failover to another account.
		setOpsUpstreamError(c, status, "grok imagine websocket handshake failed", truncateString(err.Error(), 512))
		return nil, &UpstreamFailoverError{
			StatusCode:   status,
			ResponseBody: []byte(fmt.Sprintf(`{"error":{"message":%q,"type":"grok_imagine_dial_failed"}}`, err.Error())),
		}
	}
	defer func() { _ = conn.CloseNow() }()
	conn.SetReadLimit(grokImagineReadLimit)

	frame, err := buildGrokImagineRequestFrame(prompt, uuid.NewString(), n, grokImagineEnablePro(info.Model))
	if err != nil {
		return nil, err
	}
	if err := conn.Write(dialCtx, websocket.MessageText, frame); err != nil {
		return nil, fmt.Errorf("send grok imagine request: %w", err)
	}

	collector := newGrokImagineCollector(n)
	for {
		_, data, readErr := conn.Read(dialCtx)
		if readErr != nil {
			// A close after at least one image still yields a usable response;
			// with nothing collected it is a hard failure.
			if len(collector.results()) > 0 {
				break
			}
			return nil, fmt.Errorf("read grok imagine response: %w", readErr)
		}
		complete, acceptErr := collector.accept(data)
		if acceptErr != nil {
			return nil, acceptErr
		}
		if complete {
			break
		}
	}
	SetOpsLatencyMs(c, OpsUpstreamLatencyMsKey, time.Since(upstreamStart).Milliseconds())

	if collector.moderated {
		return nil, fmt.Errorf("grok imagine rejected the prompt as moderated")
	}
	images := collector.results()
	respBody, err := buildGrokImagineImagesResponse(images, grokImagineResponseFormat(body))
	if err != nil {
		return nil, err
	}

	outputSizes := make([]string, 0, len(images))
	for _, img := range images {
		if size := img.size(); size != "" {
			outputSizes = append(outputSizes, size)
		}
	}
	c.Data(http.StatusOK, "application/json", respBody)

	return &OpenAIForwardResult{
		RequestID:        requestID,
		Model:            info.Model,
		BillingModel:     info.Model,
		UpstreamModel:    info.Model,
		Duration:         time.Since(startTime),
		ImageCount:       len(images),
		ImageSize:        info.SizeTier,
		ImageInputSize:   info.Size,
		ImageOutputSizes: outputSizes,
	}, nil
}
