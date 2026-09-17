-- Image Studio 保留期清理按 created_at 扫描已结束任务。
CREATE INDEX IF NOT EXISTS image_studio_jobs_created_idx ON image_studio_jobs (created_at);
