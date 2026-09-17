CREATE TABLE IF NOT EXISTS image_studio_jobs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    api_key_id BIGINT NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'queued',
    kind VARCHAR(16) NOT NULL,
    model VARCHAR(128) NOT NULL,
    prompt TEXT NOT NULL,
    params JSONB NOT NULL DEFAULT '{}'::jsonb,
    error_message TEXT,
    warning TEXT,
    image_count INTEGER NOT NULL DEFAULT 0,
    duration_ms BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS image_studio_jobs_user_created_idx ON image_studio_jobs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS image_studio_jobs_unfinished_idx ON image_studio_jobs (status) WHERE status IN ('queued', 'running');

CREATE TABLE IF NOT EXISTS image_studio_assets (
    id BIGSERIAL PRIMARY KEY,
    job_id BIGINT NOT NULL REFERENCES image_studio_jobs(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL,
    storage_key VARCHAR(1024) NOT NULL,
    mime_type VARCHAR(64) NOT NULL,
    bytes BIGINT NOT NULL,
    revised_prompt TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS image_studio_assets_user_created_idx ON image_studio_assets (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS image_studio_assets_job_idx ON image_studio_assets (job_id);

COMMENT ON TABLE image_studio_jobs IS 'Image Studio 交互式生图任务；经网关按所选 API Key 回放 /v1/images/* 计费';
COMMENT ON COLUMN image_studio_assets.storage_key IS '对象存储 key，仅服务端使用，不下发客户端';
