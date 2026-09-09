ALTER TABLE groups
    ADD COLUMN IF NOT EXISTS force_openai_ultrafast BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN groups.force_openai_ultrafast IS
    'Force service_tier=ultrafast on OpenAI gateway requests in this group; takes precedence over force_openai_fast and is itself overridden by disable_openai_fast';
