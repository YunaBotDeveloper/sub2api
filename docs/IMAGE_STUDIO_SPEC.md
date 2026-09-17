# Image Studio: port spec

Status: draft, not implemented. Reference: codex2api Image Studio (`admin/image_studio*.go`, `internal/imagestore`, `frontend/src/pages/ImageStudio*.tsx`, about 10k LOC excluding tests).

## 1. Goal

Give signed-in users a web page to generate and edit images, with persistent history and gallery, billed exactly like the gateway `/v1/images/*` API.

Out of scope for v1:
- A public portal where users paste their API key. Users sign in with a session instead.
- Upscaling.
- Prompt templates.
- The external `/v1/images/jobs` API. The async image tasks in `docs/ASYNC_IMAGE_TASKS.md` already cover it.

## 2. What sub2api already has (reuse, do not rebuild)

| Capability | Where | Reuse |
|---|---|---|
| Sync `/v1/images/generations` and `/edits` for OpenAI (API key, or OAuth through the Codex `image_generation` tool) and Grok | `routes/gateway.go:257`, `service/openai_images.go`, `handler/grok_media.go` | Studio jobs replay these handlers in-process |
| In-process replay into an `httptest` recorder | `handler/image_task_handler.go:125,223` | Same pattern for the job runner |
| Group permission `allow_image_generation` | `service/image_generation_intent.go:35` | Enforced unchanged, because the replay goes through the gateway |
| Per-image billing: group `image_price_1k/2k/4k`, channel image mode, usage log `billing_mode=image` | `service/gateway_usage_billing.go:1015`, `service/group.go:179` | Unchanged |
| S3-compatible `ImageStorage` plus admin settings (Backup → image storage) | `service/image_storage.go`, `repository/image_storage_s3.go`, `service/image_storage_settings.go` | Storage backend; needs `Delete` added |
| Result rewriting from b64 or URL to an object | `ImageResultUploader.Rewrite` (`image_storage.go:63`) | Reuse for decode, download and upload |

## 3. Gap (what this spec adds)

1. Persistent jobs and assets per user. Today sync results are not stored, and async tasks are Redis-only with a 24h TTL and cannot be listed.
2. Session (JWT) endpoints. Every image call today needs a raw API key, and the batch page sends plaintext keys from the browser.
3. Object ownership and cleanup: an asset index, delete, and retention. `ImageStorage` has no `Delete` today.
4. UI: generate and edit form, history, gallery.

## 4. Design

### 4.1 Data model (migration `244_image_studio.sql` plus ent schemas)

`image_studio_jobs`
- `id`, `user_id` (FK, indexed), `api_key_id` (FK), `status` (`queued|running|succeeded|failed`), `kind` (`generate|edit`), `model`, `prompt` (≤8000 runes), `params` (JSONB: size, quality, format, background, n).
- `error_message` (≤2000 runes), `warning`, `image_count`, `duration_ms`.
- `created_at`, `started_at`, `completed_at`, `deleted_at`.
- Indexes: `(user_id, created_at DESC)`, `(status, created_at)`.

`image_studio_assets`
- `id`, `job_id` (FK, cascade), `user_id` (denormalized for ownership checks and the gallery query), `storage_key` (never serialized), `mime_type`, `bytes`, `width`, `height`, `revised_prompt`, `created_at`.
- Index: `(user_id, created_at DESC)`.

### 4.2 Endpoints (JWT user auth, under `/api/v1/image-studio`)

| Method | Path | Notes |
|---|---|---|
| POST | `/jobs` | Body: `api_key_id`, `model`, `prompt`, `size`, `quality`, `output_format`, `background`, `n` (1..4), optional `input_images` (data URLs, ≤4 and ≤20MB each; if present the job is an edit). Returns 202 with the job. |
| GET | `/jobs?page&page_size&status&q` | Own jobs only; `page_size` ≤100 |
| GET | `/jobs/:id` | Own job plus its assets |
| DELETE | `/jobs/:id` | Only when finished (running returns 409); deletes the assets too |
| GET | `/assets?page&page_size` | Gallery |
| GET | `/assets/:id/file[?download=1]` | Streams from storage; `Cache-Control: private, no-store` |
| DELETE | `/assets/:id` | |

Rules:
- Every read or delete checks `user_id = current user`. A mismatch returns **404** (not 403) so IDs cannot be enumerated.
- `api_key_id` must belong to the current user and be active. The job is billed through that key and its group, exactly like a gateway call. No new billing code.
- Admins use the same page with their own keys. v1 has no cross-user admin view.

### 4.3 Job runner

- Admission happens at POST:
  - Storage must be configured, otherwise 404, the same gate as async tasks.
  - The prompt passes existing prompt audit and moderation, because the replay goes through the gateway.
  - At most 2 unfinished jobs per user, otherwise 429.
- A goroutine replays `/v1/images/generations` or `/edits` with the key's context, `response_format=b64_json`, and n sequential calls. Partial success is kept with a warning.
- Results go through `ImageResultUploader`. Storage key: `studio/{user_id}/{job_id}-{i}-{rand}.{ext}`.
- Timeout: 12 min × n. Status writes use a fresh context so a job cannot stick in `running`.
- On startup, `queued` and `running` jobs are marked `failed` ("interrupted by restart"), because in-process goroutines do not survive a restart. This is a known ceiling; a Redis queue like batch image is the upgrade path.
- No cancel in v1.

### 4.4 Storage and retention

- Add `Delete(ctx, key)` to the `ImageStorage` interface and implement it for S3.
- Delete removes DB rows first, then the object on a best-effort basis, logging failures.
- Retention job, following the batch cleanup pattern (`service/batch_image_cleanup.go`): a new setting `image_studio.retention_days`, default 30, with 0 meaning keep forever. It soft-deletes expired jobs, deletes their objects, then hard-deletes the rows.
- File serving is proxied through the backend (ownership check, then stream). Presigned or public URLs are not used for the gallery, so links cannot leak.

### 4.5 Frontend

- Route `/image-studio` (user and admin), sidebar entry, visible when the user has at least one active key in a group with `allow_image_generation` and image storage is enabled.
- Views:
  - **Studio**: API key picker, model, size or aspect ratio, quality, format, n, prompt, reference-image dropzone.
  - **History**: jobs grouped by day, polled every 2.5s while any job is unfinished.
  - **Gallery**: grid with preview, download, delete, copy prompt, re-run.
- en, zh and vi locales, if vi has been merged by then.

## 5. Billing semantics (decision)

- v1 keeps the gateway behaviour: the upstream success is billed even if saving to storage fails afterwards. The job gets `warning=storage_failed`.
- codex2api defers billing until files are saved. Porting that means touching `gateway_usage_billing`, so it is deferred to a follow-up.

## 6. Security checklist

- JWT only; the browser never sends an API key.
- 404 on ownership mismatch for jobs, assets and files.
- `storage_key` is never serialized.
- Input limits:
  - request body ≤ 100MB (4 images × 20MB, plus base64 overhead);
  - `input_images` MIME must be `image/png|jpeg|webp`;
  - no remote URL fetch (no SSRF surface).
- File responses: `nosniff`, `private, no-store`, sanitized `Content-Disposition`.

## 7. Phases

| Phase | Scope | Estimate |
|---|---|---|
| P1 | Migration, ent, repository, `ImageStorage.Delete`, job runner, endpoints, tests | ~1.5k LOC backend |
| P2 | Studio, History and Gallery views, API client, i18n | ~1.2k LOC frontend |
| P3 | Retention job and settings, restart recovery | ~300 LOC |
| Later | Prompt templates and favorites; upscale (Catmull-Rom or external RealESRGAN); deferred billing; cancel; Redis queue | — |

## 8. Open questions

1. Is S3 mandatory, the same gate as async tasks, or should a local-disk backend be added for single-node deployments?
2. Default retention: 30 days?
3. Platforms: OpenAI and Grok (what `/v1/images` supports today)? Gemini image output is chat-based and would need a separate path.
4. Should the per-user concurrency (2) and n cap (4) be admin settings, or constants for v1?
