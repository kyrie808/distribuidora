-- ============================================================
-- Migration 1.5: Seed do admin user (roda como superuser, bypassa RLS)
-- ============================================================
INSERT INTO public.admin_users (user_id, role)
VALUES ('e9cbd39c-90ab-48c1-9a43-ed23eb64af4f', 'admin')
ON CONFLICT (user_id) DO NOTHING;
