package service

import (
	"strings"
	"testing"

	"github.com/tidwall/gjson"
)

// Lines trimmed from a captured grok.com imagine-image-edit stream: a 50%
// preview, then the final image.
const grokImagineEditStreamFixture = `{"result":{"conversation":{"conversationId":"c1"}}}
{"result":{"response":{"progressReport":{"state":"PROGRESS_REPORT_STATUS_PENDING"}}}}
{"result":{"response":{"imageDimensions":{"width":832,"height":1248}}}}
{"result":{"response":{"streamingImageGenerationResponse":{"imageId":"img1","imageUrl":"users/u/generated/img1-part-0/image.jpg","progress":50,"imageIndex":0}}}}
{"result":{"response":{"streamingImageGenerationResponse":{"imageId":"img1","imageUrl":"users/u/generated/img1/image.jpg","progress":100,"moderated":false,"imageIndex":0}}}}
{"result":{"response":{"token":"I edited the image","isSoftStop":true}}}
`

func TestParseGrokImagineEditStreamKeepsFinalImage(t *testing.T) {
	images, moderated, err := parseGrokImagineEditStream(strings.NewReader(grokImagineEditStreamFixture))
	if err != nil || moderated {
		t.Fatalf("err=%v moderated=%v", err, moderated)
	}
	if len(images) != 1 {
		t.Fatalf("want 1 final image, got %d", len(images))
	}
	if images[0].URL != "https://assets.grok.com/users/u/generated/img1/image.jpg" {
		t.Fatalf("final image url wrong: %q", images[0].URL)
	}
	if images[0].size() != "832x1248" {
		t.Fatalf("want 832x1248, got %q", images[0].size())
	}
}

func TestParseGrokImagineEditStreamSurfacesErrors(t *testing.T) {
	if _, _, err := parseGrokImagineEditStream(strings.NewReader(`{"error":{"code":8,"message":"quota"}}`)); err == nil {
		t.Fatal("upstream error line must fail the request")
	}
	_, moderated, _ := parseGrokImagineEditStream(strings.NewReader(
		`{"result":{"response":{"streamingImageGenerationResponse":{"imageId":"x","imageUrl":"a","progress":100,"moderated":true}}}}`))
	if !moderated {
		t.Fatal("moderated flag must be reported")
	}
}

func TestGrokImagineEditInputs(t *testing.T) {
	inputs, err := grokImagineEditInputs(GrokMediaRequestInfo{InputImageURLs: []string{"data:image/png;base64,aGk="}})
	if err != nil || len(inputs) != 1 || string(inputs[0].Data) != "hi" || inputs[0].MimeType != "image/png" {
		t.Fatalf("data url input: %+v err=%v", inputs, err)
	}
	for _, bad := range []GrokMediaRequestInfo{
		{},
		{InputImageURLs: []string{"https://example.com/a.png"}},
		{InputImageURLs: []string{"data:text/plain;base64,aGk="}},
		{InputImageURLs: []string{"data:image/png;base64,aGk="}, MaskImageURL: "data:image/png;base64,aGk="},
	} {
		if _, err := grokImagineEditInputs(bad); err == nil {
			t.Fatalf("expected error for %+v", bad)
		}
	}
}

func TestBuildGrokImagineEditBody(t *testing.T) {
	body, err := buildGrokImagineEditBody("make it night", []string{"a1"})
	if err != nil {
		t.Fatal(err)
	}
	if gjson.GetBytes(body, "modelName").String() != "imagine-image-edit" ||
		gjson.GetBytes(body, "mediaGenInput.imageToImage.inputAssets.0").String() != "a1" ||
		gjson.GetBytes(body, "mediaGenInput.imageToImage.prompt").String() != "make it night" {
		t.Fatalf("unexpected body: %s", body)
	}
}
