-- Add per-group concurrency ceiling.
-- concurrency: 分组并发上限（0 = 不限制，回退到用户级 users.concurrency）。
--
-- 为什么放在分组而不是订阅套餐上：套餐本身只是"价格 + 时长 + 指向某个分组"，
-- 真正的额度（daily/weekly/monthly_limit_usd、rpm_limit）一直挂在分组上。
-- 并发跟着分组走，订阅到期后该用户访问该分组会在鉴权阶段被拒，
-- 并发上限随之自动失效，不需要额外的到期回滚任务。
ALTER TABLE groups ADD COLUMN IF NOT EXISTS concurrency integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN groups.concurrency IS '分组并发上限；0 表示不限制（回退到用户级 users.concurrency）；大于 0 时接管该分组用户的并发。';
