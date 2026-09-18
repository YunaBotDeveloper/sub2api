package service

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"
)

// A fake grok.com that challenges until it sees the solver's cookie and UA,
// behind a fake FlareSolverr that hands out a new clearance per solve.
func TestGrokWebSessionSolvesAndRetriesChallenge(t *testing.T) {
	var solves atomic.Int32
	solver := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		n := solves.Add(1)
		_, _ = w.Write([]byte(`{"status":"ok","solution":{"userAgent":"SolverChrome/152","cookies":[` +
			`{"name":"cf_clearance","value":"v` + itoa(int(n)) + `"},{"name":"__cf_bm","value":"bm"}]}}`))
	}))
	defer solver.Close()

	accepted := "cf_clearance=v2"
	grok := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !strings.Contains(r.Header.Get("Cookie"), accepted) || r.Header.Get("User-Agent") != "SolverChrome/152" ||
			!strings.HasPrefix(r.Header.Get("Cookie"), "sso=tok;") {
			w.Header().Set("cf-mitigated", "challenge")
			w.Header().Set("Content-Type", "text/html")
			w.WriteHeader(http.StatusForbidden)
			return
		}
		_, _ = w.Write([]byte(`{"fileMetadataId":"a1"}`))
	}))
	defer grok.Close()

	grokClearanceCache.Lock()
	delete(grokClearanceCache.byProxy, "")
	grokClearanceCache.Unlock()

	// First solve yields v1, which grok rejects; the session must re-solve (v2) and retry.
	web := &grokWebSession{client: grok.Client(), ssoToken: "tok", solverURL: solver.URL}
	resp, err := web.do(context.Background(), http.MethodPost, grok.URL, []byte(`{}`))
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = resp.Body.Close() }()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("want 200 after re-solve, got %d", resp.StatusCode)
	}
	if solves.Load() != 2 {
		t.Fatalf("want 2 solves, got %d", solves.Load())
	}

	// A fresh session reuses the cached clearance without solving again.
	web2 := &grokWebSession{client: grok.Client(), ssoToken: "tok", solverURL: solver.URL}
	resp2, err := web2.do(context.Background(), http.MethodPost, grok.URL, []byte(`{}`))
	if err != nil || resp2.StatusCode != http.StatusOK {
		t.Fatalf("cached clearance: status=%v err=%v", resp2, err)
	}
	_ = resp2.Body.Close()
	if solves.Load() != 2 {
		t.Fatalf("cached clearance should not re-solve, got %d solves", solves.Load())
	}
}

func TestSolveGrokClearanceRequiresCfClearance(t *testing.T) {
	solver := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte(`{"status":"ok","solution":{"userAgent":"UA","cookies":[{"name":"__cf_bm","value":"x"}]}}`))
	}))
	defer solver.Close()
	if _, err := solveGrokClearance(context.Background(), solver.URL, ""); err == nil {
		t.Fatal("a solution without cf_clearance must be an error")
	}
}
