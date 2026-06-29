-- 035: Add storage quota and used bytes for org_departments

ALTER TABLE org_departments ADD COLUMN IF NOT EXISTS storage_quota BIGINT NOT NULL DEFAULT 0;
ALTER TABLE org_departments ADD COLUMN IF NOT EXISTS storage_used BIGINT NOT NULL DEFAULT 0;

-- Optionally, we can also ensure that plan_limits has storage_bytes for each plan
-- We can add 5GB for Basic, 20GB for Pro, -1 (unlimited) for Enterprise
-- Assuming plan slugs are 'basic', 'pro', 'enterprise'

DO $$ 
DECLARE 
    basic_plan UUID;
    pro_plan UUID;
    ent_plan UUID;
BEGIN
    SELECT id INTO basic_plan FROM subscription_plans WHERE slug = 'basic';
    SELECT id INTO pro_plan FROM subscription_plans WHERE slug = 'pro';
    SELECT id INTO ent_plan FROM subscription_plans WHERE slug = 'enterprise';

    IF basic_plan IS NOT NULL THEN
        INSERT INTO plan_limits (plan_id, resource, max_count) 
        VALUES (basic_plan, 'storage_bytes', 5368709120) -- 5GB
        ON CONFLICT (plan_id, resource) DO UPDATE SET max_count = 5368709120;
    END IF;

    IF pro_plan IS NOT NULL THEN
        INSERT INTO plan_limits (plan_id, resource, max_count) 
        VALUES (pro_plan, 'storage_bytes', 21474836480) -- 20GB
        ON CONFLICT (plan_id, resource) DO UPDATE SET max_count = 21474836480;
    END IF;

    IF ent_plan IS NOT NULL THEN
        INSERT INTO plan_limits (plan_id, resource, max_count) 
        VALUES (ent_plan, 'storage_bytes', -1) -- Unlimited
        ON CONFLICT (plan_id, resource) DO UPDATE SET max_count = -1;
    END IF;
END $$;
