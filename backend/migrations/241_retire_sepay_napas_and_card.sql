-- SePay 只保留 VietQR 银行转账，停售 Napas 与银行卡。
--
-- 后端的 SupportedTypes() 已经不再返回这两个方式，留在配置里会让管理端和充值页
-- 继续把它们列出来，用户选中后建单直接失败。

-- 清理前先快照，便于回滚以及事后核对当时的配置。
-- CREATE TABLE IF NOT EXISTS ... AS SELECT 在重跑时是空操作，保持幂等。
CREATE TABLE IF NOT EXISTS payment_provider_instances_backup_241 AS
SELECT id,
       provider_key,
       name,
       supported_types,
       now() AS backed_up_at
FROM payment_provider_instances
WHERE supported_types LIKE '%sepay_napas%'
   OR supported_types LIKE '%sepay_card%';

COMMENT ON TABLE payment_provider_instances_backup_241 IS
    '迁移 241 停售 SePay Napas / 银行卡前的 supported_types 快照。确认无需回滚后可安全 DROP；回滚方式：UPDATE payment_provider_instances p SET supported_types = b.supported_types FROM payment_provider_instances_backup_241 b WHERE p.id = b.id';

CREATE TABLE IF NOT EXISTS settings_payment_backup_241 AS
SELECT key,
       value,
       now() AS backed_up_at
FROM settings
WHERE key = 'ENABLED_PAYMENT_TYPES';

COMMENT ON TABLE settings_payment_backup_241 IS
    '迁移 241 清理 ENABLED_PAYMENT_TYPES 前的快照。确认无需回滚后可安全 DROP；回滚方式：UPDATE settings s SET value = b.value FROM settings_payment_backup_241 b WHERE s.key = b.key';

-- 逐项过滤而不是整串置空：这两列还装着 sepay_bank_transfer 和别的网关的方式，
-- 清空会把还在售的支付方式一起关掉。
UPDATE payment_provider_instances
SET supported_types = (
        SELECT COALESCE(string_agg(t, ','), '')
        FROM unnest(string_to_array(supported_types, ',')) AS t
        WHERE btrim(t) NOT IN ('sepay_napas', 'sepay_card')
          AND btrim(t) <> ''
    )
WHERE supported_types LIKE '%sepay_napas%'
   OR supported_types LIKE '%sepay_card%';

UPDATE settings
SET value = (
        SELECT COALESCE(string_agg(t, ','), '')
        FROM unnest(string_to_array(value, ',')) AS t
        WHERE btrim(t) NOT IN ('sepay_napas', 'sepay_card')
          AND btrim(t) <> ''
    )
WHERE key = 'ENABLED_PAYMENT_TYPES'
  AND (value LIKE '%sepay_napas%' OR value LIKE '%sepay_card%');

-- 已经建出来的挂起订单不动：它们的 payment_type 仍然是 sepay_napas / sepay_card，
-- 后端保留了对应的收银台映射，用户可以照常付掉或等它过期。
