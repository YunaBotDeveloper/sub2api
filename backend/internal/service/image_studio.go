package service

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strings"
	"time"
	"unicode/utf8"

	infraerrors "github.com/Wei-Shaw/sub2api/internal/pkg/errors"
	"github.com/Wei-Shaw/sub2api/internal/pkg/logger"
	"github.com/tidwall/gjson"
	"go.uber.org/zap"
)

// Image Studio：登录用户的交互式生图（参考 codex2api Image Studio，见 docs/IMAGE_STUDIO_SPEC.md）。
// 任务经网关用所选 API Key 回放 /v1/images/*，因此分组权限、余额/订阅、审核与计费全部沿用网关逻辑。

const (
	ImageStudioStatusQueued    = "queued"
	ImageStudioStatusRunning   = "running"
	ImageStudioStatusSucceeded = "succeeded"
	ImageStudioStatusFailed    = "failed"

	ImageStudioKindGenerate = "generate"
	ImageStudioKindEdit     = "edit"

	imageStudioMaxUnfinishedPerUser = 2
	imageStudioMaxN                 = 4
	imageStudioMaxInputImages       = 4
	imageStudioMaxInputImageB64     = 28 << 20 // ≈20 MiB decoded
	imageStudioPromptRuneLimit      = 8000
	imageStudioMessageRuneLimit     = 2000
	imageStudioTimeoutPerImage      = 12 * time.Minute
	// 超过最长执行时间仍未结束的任务视为实例重启遗留，按用户惰性标记失败（多副本安全）。
	imageStudioStaleAfter = imageStudioTimeoutPerImage*imageStudioMaxN + 5*time.Minute
)

var (
	ErrImageStudioUnavailable = infraerrors.New(http.StatusNotFound, "IMAGE_STUDIO_UNAVAILABLE", "image studio requires image object storage to be enabled")
	ErrImageStudioNotFound    = infraerrors.NotFound("IMAGE_STUDIO_NOT_FOUND", "image studio job or asset not found")
	ErrImageStudioBusy        = infraerrors.TooManyRequests("IMAGE_STUDIO_BUSY", "too many unfinished image studio jobs")
	ErrImageStudioJobRunning  = infraerrors.Conflict("IMAGE_STUDIO_JOB_RUNNING", "image studio job is still running")

	imageStudioInputImagePattern = regexp.MustCompile(`^data:image/(png|jpeg|webp);base64,`)
)

type ImageStudioJob struct {
	ID           int64              `json:"id"`
	UserID       int64              `json:"-"`
	APIKeyID     int64              `json:"api_key_id"`
	Status       string             `json:"status"`
	Kind         string             `json:"kind"`
	Model        string             `json:"model"`
	Prompt       string             `json:"prompt"`
	Params       json.RawMessage    `json:"params"`
	ErrorMessage string             `json:"error_message,omitempty"`
	Warning      string             `json:"warning,omitempty"`
	ImageCount   int                `json:"image_count"`
	DurationMs   *int64             `json:"duration_ms,omitempty"`
	CreatedAt    time.Time          `json:"created_at"`
	StartedAt    *time.Time         `json:"started_at,omitempty"`
	CompletedAt  *time.Time         `json:"completed_at,omitempty"`
	Assets       []ImageStudioAsset `json:"assets,omitempty"`
}

type ImageStudioAsset struct {
	ID            int64     `json:"id"`
	JobID         int64     `json:"job_id"`
	UserID        int64     `json:"-"`
	StorageKey    string    `json:"-"`
	MimeType      string    `json:"mime_type"`
	Bytes         int64     `json:"bytes"`
	RevisedPrompt string    `json:"revised_prompt,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
}

type ImageStudioRepository interface {
	CreateJob(ctx context.Context, job *ImageStudioJob) error
	FailStaleJobs(ctx context.Context, userID int64, before time.Time, message string) error
	CountUnfinishedJobs(ctx context.Context, userID int64) (int, error)
	MarkJobRunning(ctx context.Context, id int64) error
	FinishJob(ctx context.Context, job *ImageStudioJob, assets []ImageStudioAsset) error
	GetJob(ctx context.Context, userID, id int64) (*ImageStudioJob, error)
	ListJobs(ctx context.Context, userID int64, page, pageSize int) ([]ImageStudioJob, int64, error)
	// DeleteJob 只删除已结束的任务（进行中返回 ErrImageStudioJobRunning），返回其资产的存储 key。
	DeleteJob(ctx context.Context, userID, id int64) ([]string, error)
	ListAssets(ctx context.Context, userID int64, page, pageSize int) ([]ImageStudioAsset, int64, error)
	GetAsset(ctx context.Context, userID, id int64) (*ImageStudioAsset, error)
	DeleteAsset(ctx context.Context, userID, id int64) (string, error)
}

type ImageStudioCreateInput struct {
	APIKeyID     int64    `json:"api_key_id"`
	Model        string   `json:"model"`
	Prompt       string   `json:"prompt"`
	Size         string   `json:"size"`
	Quality      string   `json:"quality"`
	OutputFormat string   `json:"output_format"`
	Background   string   `json:"background"`
	N            int      `json:"n"`
	InputImages  []string `json:"input_images"`
}

// ImageStudioSubmission 是已落库、待执行的任务；APIKey 仅在进程内用于回放，绝不序列化。
type ImageStudioSubmission struct {
	Job    *ImageStudioJob
	APIKey string
	Path   string
	Body   []byte
}

// ImageStudioExecutor 经网关执行一次生图请求，返回 HTTP 状态与响应体。
type ImageStudioExecutor func(ctx context.Context, path, apiKey string, body []byte) (int, []byte)

type imageStudioKeyLookup interface {
	GetByID(ctx context.Context, id int64) (*APIKey, error)
}

type ImageStudioService struct {
	repo    ImageStudioRepository
	apiKeys imageStudioKeyLookup
	resolve ImageStorageResolver
}

func NewImageStudioService(repo ImageStudioRepository, apiKeys *APIKeyService, settings *ImageStorageSettingService) *ImageStudioService {
	return &ImageStudioService{repo: repo, apiKeys: apiKeys, resolve: settings.Resolver()}
}

func (s *ImageStudioService) store() (*ImageResultUploader, ImageObjectStore, bool) {
	if s == nil || s.resolve == nil {
		return nil, nil, false
	}
	uploader, enabled := s.resolve()
	if !enabled || uploader == nil {
		return nil, nil, false
	}
	objects, ok := uploader.Storage().(ImageObjectStore)
	return uploader, objects, ok
}

// Enabled 表示对象存储已启用且支持读取/删除。
func (s *ImageStudioService) Enabled() bool {
	_, _, ok := s.store()
	return ok
}

// Submit 校验输入与 Key 归属、执行每用户并发限制并落库一个 queued 任务。
func (s *ImageStudioService) Submit(ctx context.Context, userID int64, in ImageStudioCreateInput) (*ImageStudioSubmission, error) {
	if !s.Enabled() {
		return nil, ErrImageStudioUnavailable
	}
	if err := normalizeImageStudioInput(&in); err != nil {
		return nil, err
	}
	apiKey, err := s.apiKeys.GetByID(ctx, in.APIKeyID)
	if err != nil || apiKey == nil || apiKey.UserID != userID {
		return nil, infraerrors.NotFound("API_KEY_NOT_FOUND", "API key not found")
	}
	if platform := imageStudioKeyPlatform(apiKey); platform != PlatformOpenAI && platform != PlatformGrok {
		return nil, infraerrors.BadRequest("IMAGE_STUDIO_PLATFORM_UNSUPPORTED", "image studio supports OpenAI and Grok groups only")
	}

	if err := s.repo.FailStaleJobs(ctx, userID, time.Now().Add(-imageStudioStaleAfter), "interrupted: the job did not finish (server restart)"); err != nil {
		return nil, err
	}
	unfinished, err := s.repo.CountUnfinishedJobs(ctx, userID)
	if err != nil {
		return nil, err
	}
	if unfinished >= imageStudioMaxUnfinishedPerUser {
		return nil, ErrImageStudioBusy
	}

	kind, path := ImageStudioKindGenerate, "/v1/images/generations"
	payload := map[string]any{"model": in.Model, "prompt": in.Prompt, "n": in.N, "response_format": "b64_json"}
	params := map[string]any{"n": in.N}
	for field, value := range map[string]string{"size": in.Size, "quality": in.Quality, "output_format": in.OutputFormat, "background": in.Background} {
		if value != "" {
			payload[field], params[field] = value, value
		}
	}
	if len(in.InputImages) > 0 {
		kind, path = ImageStudioKindEdit, "/v1/images/edits"
		images := make([]map[string]string, 0, len(in.InputImages))
		for _, image := range in.InputImages {
			images = append(images, map[string]string{"image_url": image})
		}
		payload["images"] = images
		params["input_image_count"] = len(in.InputImages)
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}
	paramsJSON, _ := json.Marshal(params)

	job := &ImageStudioJob{UserID: userID, APIKeyID: apiKey.ID, Status: ImageStudioStatusQueued, Kind: kind, Model: in.Model, Prompt: in.Prompt, Params: paramsJSON}
	if err := s.repo.CreateJob(ctx, job); err != nil {
		return nil, err
	}
	return &ImageStudioSubmission{Job: job, APIKey: apiKey.Key, Path: path, Body: body}, nil
}

// Run 执行任务并把结果写回；调用方应在独立 goroutine 中调用。
func (s *ImageStudioService) Run(sub *ImageStudioSubmission, execute ImageStudioExecutor) {
	job := sub.Job
	started := time.Now()
	n := int(gjson.GetBytes(job.Params, "n").Int())
	if n <= 0 {
		n = 1
	}
	ctx, cancel := context.WithTimeout(context.Background(), imageStudioTimeoutPerImage*time.Duration(n))
	defer cancel()

	if err := s.repo.MarkJobRunning(ctx, job.ID); err != nil {
		logger.L().Warn("image_studio.mark_running_failed", zap.Int64("job_id", job.ID), zap.Error(err))
	}

	var assets []ImageStudioAsset
	status, respBody := execute(ctx, sub.Path, sub.APIKey, sub.Body)
	switch {
	case ctx.Err() != nil && len(respBody) == 0:
		job.Status, job.ErrorMessage = ImageStudioStatusFailed, "image generation timed out"
	case status < http.StatusOK || status >= http.StatusMultipleChoices:
		job.Status, job.ErrorMessage = ImageStudioStatusFailed, imageStudioErrorMessage(status, respBody)
	default:
		assets = s.saveAssets(ctx, job, respBody)
	}
	job.ImageCount = len(assets)
	job.ErrorMessage = truncateRunes(job.ErrorMessage, imageStudioMessageRuneLimit)
	job.Warning = truncateRunes(job.Warning, imageStudioMessageRuneLimit)
	duration := time.Since(started).Milliseconds()
	job.DurationMs = &duration

	// 用独立上下文落库，避免任务超时后状态卡在 running。
	finishCtx, finishCancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer finishCancel()
	if err := s.repo.FinishJob(finishCtx, job, assets); err != nil {
		logger.L().Error("image_studio.finish_job_failed", zap.Int64("job_id", job.ID), zap.Error(err))
	}
}

// saveAssets 转存图片并设置任务状态；部分成功保留已存图片并记录警告。
// 计费语义沿用网关：上游成功即计费，即使转存失败（见规格第 5 节）。
func (s *ImageStudioService) saveAssets(ctx context.Context, job *ImageStudioJob, respBody []byte) []ImageStudioAsset {
	uploader, _, ok := s.store()
	if !ok {
		job.Status, job.ErrorMessage = ImageStudioStatusFailed, "storage_failed: image storage is no longer available"
		return nil
	}
	stored, err := uploader.SaveImages(ctx, fmt.Sprintf("studio/%d/%d", job.UserID, job.ID), respBody)
	assets := make([]ImageStudioAsset, 0, len(stored))
	for _, image := range stored {
		assets = append(assets, ImageStudioAsset{JobID: job.ID, UserID: job.UserID, StorageKey: image.Key, MimeType: image.ContentType, Bytes: image.Bytes, RevisedPrompt: image.RevisedPrompt})
	}
	switch {
	case err != nil && len(assets) == 0:
		job.Status, job.ErrorMessage = ImageStudioStatusFailed, "storage_failed: "+err.Error()
	case err != nil:
		job.Status, job.Warning = ImageStudioStatusSucceeded, "storage_failed: "+err.Error()
	case len(assets) == 0:
		job.Status, job.ErrorMessage = ImageStudioStatusFailed, "upstream returned no images"
	default:
		job.Status = ImageStudioStatusSucceeded
	}
	return assets
}

func (s *ImageStudioService) ListJobs(ctx context.Context, userID int64, page, pageSize int) ([]ImageStudioJob, int64, error) {
	return s.repo.ListJobs(ctx, userID, page, pageSize)
}

func (s *ImageStudioService) GetJob(ctx context.Context, userID, id int64) (*ImageStudioJob, error) {
	return s.repo.GetJob(ctx, userID, id)
}

func (s *ImageStudioService) ListAssets(ctx context.Context, userID int64, page, pageSize int) ([]ImageStudioAsset, int64, error) {
	return s.repo.ListAssets(ctx, userID, page, pageSize)
}

func (s *ImageStudioService) DeleteJob(ctx context.Context, userID, id int64) error {
	keys, err := s.repo.DeleteJob(ctx, userID, id)
	if err != nil {
		return err
	}
	s.deleteObjects(ctx, keys...)
	return nil
}

func (s *ImageStudioService) DeleteAsset(ctx context.Context, userID, id int64) error {
	key, err := s.repo.DeleteAsset(ctx, userID, id)
	if err != nil {
		return err
	}
	s.deleteObjects(ctx, key)
	return nil
}

// OpenAsset 校验归属后打开对象；调用方负责关闭 body。
func (s *ImageStudioService) OpenAsset(ctx context.Context, userID, id int64) (*ImageStudioAsset, io.ReadCloser, error) {
	asset, err := s.repo.GetAsset(ctx, userID, id)
	if err != nil {
		return nil, nil, err
	}
	_, objects, ok := s.store()
	if !ok {
		return nil, nil, ErrImageStudioUnavailable
	}
	body, _, err := objects.Open(ctx, asset.StorageKey)
	if err != nil {
		return nil, nil, err
	}
	return asset, body, nil
}

// deleteObjects 在数据库行删除后尽力清理对象；失败只记日志（对象存储生命周期规则兜底）。
func (s *ImageStudioService) deleteObjects(ctx context.Context, keys ...string) {
	_, objects, ok := s.store()
	if !ok {
		return
	}
	for _, key := range keys {
		if err := objects.Delete(ctx, key); err != nil {
			logger.L().Warn("image_studio.delete_object_failed", zap.String("key", key), zap.Error(err))
		}
	}
}

func normalizeImageStudioInput(in *ImageStudioCreateInput) error {
	in.Model = strings.TrimSpace(in.Model)
	in.Prompt = strings.TrimSpace(in.Prompt)
	in.Size = strings.TrimSpace(in.Size)
	in.Quality = strings.TrimSpace(in.Quality)
	in.OutputFormat = strings.TrimSpace(in.OutputFormat)
	in.Background = strings.TrimSpace(in.Background)
	if in.N == 0 {
		in.N = 1
	}
	switch {
	case in.APIKeyID <= 0:
		return infraerrors.BadRequest("IMAGE_STUDIO_INVALID", "api_key_id is required")
	case in.Model == "" || len(in.Model) > 128:
		return infraerrors.BadRequest("IMAGE_STUDIO_INVALID", "model is required")
	case in.Prompt == "" || utf8.RuneCountInString(in.Prompt) > imageStudioPromptRuneLimit:
		return infraerrors.BadRequest("IMAGE_STUDIO_INVALID", "prompt must be non-empty and at most 8000 characters")
	case in.N < 1 || in.N > imageStudioMaxN:
		return infraerrors.BadRequest("IMAGE_STUDIO_INVALID", "n must be between 1 and 4")
	case len(in.InputImages) > imageStudioMaxInputImages:
		return infraerrors.BadRequest("IMAGE_STUDIO_INVALID", "at most 4 input images are allowed")
	}
	for _, field := range []string{in.Size, in.Quality, in.OutputFormat, in.Background} {
		if len(field) > 32 {
			return infraerrors.BadRequest("IMAGE_STUDIO_INVALID", "invalid image option")
		}
	}
	for _, image := range in.InputImages {
		if !imageStudioInputImagePattern.MatchString(image) || len(image) > imageStudioMaxInputImageB64 {
			return infraerrors.BadRequest("IMAGE_STUDIO_INVALID", "input images must be png/jpeg/webp data URLs of at most 20 MB")
		}
	}
	return nil
}

func imageStudioKeyPlatform(apiKey *APIKey) string {
	if apiKey == nil || apiKey.Group == nil {
		return ""
	}
	return apiKey.Group.Platform
}

func imageStudioErrorMessage(status int, body []byte) string {
	if message := strings.TrimSpace(gjson.GetBytes(body, "error.message").String()); message != "" {
		return message
	}
	if message := strings.TrimSpace(gjson.GetBytes(body, "message").String()); message != "" {
		return message
	}
	return fmt.Sprintf("image generation failed (HTTP %d)", status)
}

func truncateRunes(value string, limit int) string {
	if utf8.RuneCountInString(value) <= limit {
		return value
	}
	return string([]rune(value)[:limit])
}
