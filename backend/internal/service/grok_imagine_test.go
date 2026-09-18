package service

import (
	"encoding/json"
	"testing"
)

// Frames below mirror a real grok.com imagine session: a preview image at 50%,
// the final image at 100%, then a completed status frame per job.
func imageFrame(jobID, url, blob string, order int, progress float64) []byte {
	return []byte(`{"type":"image","job_id":"` + jobID + `","url":"` + url + `","blob":"` + blob +
		`","order":` + itoa(order) + `,"percentage_complete":` + ftoa(progress) + `,"width":1024,"height":1152}`)
}

func completedFrame(jobID string, moderated bool) []byte {
	m := "false"
	if moderated {
		m = "true"
	}
	return []byte(`{"type":"json","current_status":"completed","job_id":"` + jobID +
		`","percentage_complete":100,"moderated":` + m + `,"width":1024,"height":1152}`)
}

func itoa(v int) string { b, _ := json.Marshal(v); return string(b) }

func ftoa(v float64) string { b, _ := json.Marshal(v); return string(b) }

func TestGrokImagineCollectorPrefersFinalImage(t *testing.T) {
	c := newGrokImagineCollector(1)

	if done, err := c.accept([]byte(`{"type":"session","conversation_id":"abc"}`)); err != nil || done {
		t.Fatalf("session frame: done=%v err=%v", done, err)
	}
	if done, _ := c.accept(imageFrame("job1", "https://x.ai/a.png", "preview", 0, 50)); done {
		t.Fatal("preview frame alone must not complete the request")
	}
	if done, _ := c.accept(imageFrame("job1", "https://x.ai/a.jpg", "final", 0, 100)); done {
		t.Fatal("image without a completed status frame must not complete")
	}
	done, err := c.accept(completedFrame("job1", false))
	if err != nil {
		t.Fatalf("completed frame: %v", err)
	}
	if !done {
		t.Fatal("completed frame should finish a single-image request")
	}

	got := c.results()
	if len(got) != 1 {
		t.Fatalf("want 1 image, got %d", len(got))
	}
	if got[0].URL != "https://x.ai/a.jpg" {
		t.Fatalf("final image should win, got %q", got[0].URL)
	}
	if got[0].size() != "1024x1152" {
		t.Fatalf("want size 1024x1152, got %q", got[0].size())
	}
}

// Out-of-order frames must not leave a late-arriving preview in place of the
// final image, and results must follow the upstream grid order.
func TestGrokImagineCollectorMultipleImagesOutOfOrder(t *testing.T) {
	c := newGrokImagineCollector(2)

	_, _ = c.accept(imageFrame("job2", "https://x.ai/b.jpg", "final-b", 1, 100))
	_, _ = c.accept(imageFrame("job1", "https://x.ai/a.jpg", "final-a", 0, 100))
	_, _ = c.accept(imageFrame("job1", "https://x.ai/a.png", "preview-a", 0, 50))
	if done, _ := c.accept(completedFrame("job1", false)); done {
		t.Fatal("one of two jobs completed must not finish the request")
	}
	done, _ := c.accept(completedFrame("job2", false))
	if !done {
		t.Fatal("both jobs completed should finish the request")
	}

	got := c.results()
	if len(got) != 2 {
		t.Fatalf("want 2 images, got %d", len(got))
	}
	if got[0].URL != "https://x.ai/a.jpg" || got[1].URL != "https://x.ai/b.jpg" {
		t.Fatalf("results out of grid order: %q, %q", got[0].URL, got[1].URL)
	}
}

func TestGrokImagineCollectorFlagsModeration(t *testing.T) {
	c := newGrokImagineCollector(1)
	_, _ = c.accept(imageFrame("job1", "https://x.ai/a.jpg", "final", 0, 100))
	if _, err := c.accept(completedFrame("job1", true)); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !c.moderated {
		t.Fatal("moderated flag on the completed frame must be recorded")
	}
}

func TestGrokImagineCollectorSurfacesUpstreamError(t *testing.T) {
	c := newGrokImagineCollector(1)
	if _, err := c.accept([]byte(`{"type":"json","error":"rate limited"}`)); err == nil {
		t.Fatal("upstream error frame should surface as an error")
	}
}

func TestBuildGrokImagineImagesResponse(t *testing.T) {
	images := []grokImagineImage{
		{URL: "https://x.ai/a.jpg", Blob: "AAAA"},
		{URL: "https://x.ai/b.jpg", Blob: "BBBB"},
	}

	body, err := buildGrokImagineImagesResponse(images, "")
	if err != nil {
		t.Fatalf("url response: %v", err)
	}
	var urlResp struct {
		Created int64 `json:"created"`
		Data    []struct {
			URL string `json:"url"`
			B64 string `json:"b64_json"`
		} `json:"data"`
	}
	if err := json.Unmarshal(body, &urlResp); err != nil {
		t.Fatalf("unmarshal url response: %v", err)
	}
	if len(urlResp.Data) != 2 || urlResp.Data[0].URL != "https://x.ai/a.jpg" {
		t.Fatalf("unexpected url response: %s", body)
	}
	if urlResp.Data[0].B64 != "" {
		t.Fatalf("url format must not carry base64 payloads: %s", body)
	}
	if urlResp.Created == 0 {
		t.Fatal("created timestamp missing")
	}

	body, err = buildGrokImagineImagesResponse(images, "b64_json")
	if err != nil {
		t.Fatalf("b64 response: %v", err)
	}
	var b64Resp struct {
		Data []struct {
			URL string `json:"url"`
			B64 string `json:"b64_json"`
		} `json:"data"`
	}
	if err := json.Unmarshal(body, &b64Resp); err != nil {
		t.Fatalf("unmarshal b64 response: %v", err)
	}
	if b64Resp.Data[0].B64 != "AAAA" || b64Resp.Data[0].URL != "" {
		t.Fatalf("unexpected b64 response: %s", body)
	}

	if _, err := buildGrokImagineImagesResponse(nil, ""); err == nil {
		t.Fatal("empty image set must be an error, not an empty success")
	}
}

func TestGrokImagineEnablePro(t *testing.T) {
	if grokImagineEnablePro("grok-imagine-image") {
		t.Fatal("fast model must not request pro mode")
	}
	if !grokImagineEnablePro("grok-imagine-image-quality") {
		t.Fatal("quality model must request pro mode")
	}
}

func TestBuildGrokImagineRequestFrame(t *testing.T) {
	frame, err := buildGrokImagineRequestFrame("a teapot", "req-1", 2, true)
	if err != nil {
		t.Fatalf("build frame: %v", err)
	}
	var parsed struct {
		Type string `json:"type"`
		Item struct {
			Content []struct {
				RequestID  string `json:"requestId"`
				Text       string `json:"text"`
				Properties struct {
					NumGenerations int  `json:"num_generations"`
					EnablePro      bool `json:"enable_pro"`
				} `json:"properties"`
			} `json:"content"`
		} `json:"item"`
	}
	if err := json.Unmarshal(frame, &parsed); err != nil {
		t.Fatalf("unmarshal frame: %v", err)
	}
	if parsed.Type != "conversation.item.create" {
		t.Fatalf("unexpected frame type %q", parsed.Type)
	}
	content := parsed.Item.Content[0]
	if content.Text != "a teapot" || content.RequestID != "req-1" {
		t.Fatalf("unexpected content: %s", frame)
	}
	if content.Properties.NumGenerations != 2 || !content.Properties.EnablePro {
		t.Fatalf("unexpected properties: %s", frame)
	}
}
