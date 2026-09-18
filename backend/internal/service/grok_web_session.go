package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/tidwall/gjson"
)

// grok.com puts its /rest/* API behind a Cloudflare managed challenge that no
// TLS impersonation passes, so a FlareSolverr instance (real Chrome, same egress
// IP) solves it and we replay its cf_clearance cookie with its exact User-Agent.
const (
	grokClearanceTTL        = 25 * time.Minute
	grokClearanceSolveURL   = "https://grok.com/imagine"
	grokClearanceSolveLimit = 60 * time.Second
)

type grokClearance struct {
	Cookies   string
	UserAgent string
	expires   time.Time
}

// ponytail: one global lock also serializes solves, which stops a stampede of
// concurrent FlareSolverr calls; per-proxy locks if solve latency ever matters.
var grokClearanceCache = struct {
	sync.Mutex
	byProxy map[string]grokClearance
}{byProxy: map[string]grokClearance{}}

// grokWebSession sends cookie-authenticated requests to grok.com the way its
// web client does, carrying Cloudflare clearance when a solver is configured.
type grokWebSession struct {
	client    *http.Client
	ssoToken  string
	proxyURL  string
	solverURL string
	clearance grokClearance
}

func (w *grokWebSession) do(ctx context.Context, method, url string, body []byte) (*http.Response, error) {
	if w.solverURL != "" && w.clearance.Cookies == "" {
		clearance, err := grokWebClearance(ctx, w.solverURL, w.proxyURL, false)
		if err != nil {
			return nil, err
		}
		w.clearance = clearance
	}
	resp, err := w.send(ctx, method, url, body)
	if err != nil || w.solverURL == "" || !isCloudflareChallenge(resp) {
		return resp, err
	}
	// Clearance expired or was never accepted: solve again once and retry.
	_ = resp.Body.Close()
	clearance, err := grokWebClearance(ctx, w.solverURL, w.proxyURL, true)
	if err != nil {
		return nil, err
	}
	w.clearance = clearance
	return w.send(ctx, method, url, body)
}

func (w *grokWebSession) send(ctx context.Context, method, url string, body []byte) (*http.Response, error) {
	var reader io.Reader
	if body != nil {
		reader = bytes.NewReader(body)
	}
	req, err := http.NewRequestWithContext(ctx, method, url, reader)
	if err != nil {
		return nil, err
	}
	cookie, userAgent := "sso="+w.ssoToken, grokImagineUserAgent
	if w.clearance.Cookies != "" {
		cookie += "; " + w.clearance.Cookies
		userAgent = w.clearance.UserAgent
	}
	req.Header.Set("Cookie", cookie)
	req.Header.Set("User-Agent", userAgent)
	req.Header.Set("Origin", grokImagineOrigin)
	req.Header.Set("Referer", grokWebReferer)
	req.Header.Set("Accept", "*/*")
	req.Header.Set("x-statsig-id", grokWebStatsigID)
	req.Header.Set("x-xai-request-id", uuid.NewString())
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	return w.client.Do(req)
}

func isCloudflareChallenge(resp *http.Response) bool {
	if resp.StatusCode != http.StatusForbidden {
		return false
	}
	return resp.Header.Get("cf-mitigated") == "challenge" ||
		strings.Contains(resp.Header.Get("Content-Type"), "text/html")
}

// grokWebClearance returns cached clearance for the egress proxy, solving via
// FlareSolverr when missing, expired, or force is set.
func grokWebClearance(ctx context.Context, solverURL, proxyURL string, force bool) (grokClearance, error) {
	grokClearanceCache.Lock()
	defer grokClearanceCache.Unlock()
	if cached, ok := grokClearanceCache.byProxy[proxyURL]; ok && !force && time.Now().Before(cached.expires) {
		return cached, nil
	}
	clearance, err := solveGrokClearance(ctx, solverURL, proxyURL)
	if err != nil {
		delete(grokClearanceCache.byProxy, proxyURL)
		return grokClearance{}, err
	}
	grokClearanceCache.byProxy[proxyURL] = clearance
	return clearance, nil
}

func solveGrokClearance(ctx context.Context, solverURL, proxyURL string) (grokClearance, error) {
	payload := map[string]any{
		"cmd":        "request.get",
		"url":        grokClearanceSolveURL,
		"maxTimeout": grokClearanceSolveLimit.Milliseconds(),
	}
	// cf_clearance is bound to the egress IP, so the solver must use the
	// account's proxy too.
	if proxyURL != "" {
		payload["proxy"] = map[string]string{"url": proxyURL}
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return grokClearance{}, err
	}
	ctx, cancel := context.WithTimeout(ctx, grokClearanceSolveLimit+15*time.Second)
	defer cancel()
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, solverURL, bytes.NewReader(body))
	if err != nil {
		return grokClearance{}, err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return grokClearance{}, fmt.Errorf("flaresolverr request: %w", err)
	}
	defer func() { _ = resp.Body.Close() }()
	respBody, err := io.ReadAll(io.LimitReader(resp.Body, 8<<20))
	if err != nil {
		return grokClearance{}, fmt.Errorf("read flaresolverr response: %w", err)
	}
	if status := gjson.GetBytes(respBody, "status").String(); status != "ok" {
		return grokClearance{}, fmt.Errorf("flaresolverr failed: %s", truncateString(gjson.GetBytes(respBody, "message").String(), 256))
	}

	solution := gjson.GetBytes(respBody, "solution")
	cookies := make([]string, 0, 8)
	hasClearance := false
	for _, cookie := range solution.Get("cookies").Array() {
		name := cookie.Get("name").String()
		if name == "" || name == "sso" || name == "sso-rw" {
			continue
		}
		hasClearance = hasClearance || name == "cf_clearance"
		cookies = append(cookies, name+"="+cookie.Get("value").String())
	}
	userAgent := strings.TrimSpace(solution.Get("userAgent").String())
	if !hasClearance || userAgent == "" {
		return grokClearance{}, fmt.Errorf("flaresolverr returned no cf_clearance for grok.com")
	}
	return grokClearance{
		Cookies:   strings.Join(cookies, "; "),
		UserAgent: userAgent,
		expires:   time.Now().Add(grokClearanceTTL),
	}, nil
}
