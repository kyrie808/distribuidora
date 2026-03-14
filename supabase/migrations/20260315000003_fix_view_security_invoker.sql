-- ============================================================
-- Migration 3: Trocar SECURITY DEFINER por INVOKER em 9 views
-- Risco: Médio | Impacto catalogo-mont: Médio
-- Requer PG 15+ (Supabase já é PG 15)
-- ============================================================

ALTER VIEW public.view_lucro_liquido_mensal SET (security_invoker = true);
ALTER VIEW public.view_home_financeiro SET (security_invoker = true);
ALTER VIEW public.view_extrato_mensal SET (security_invoker = true);
ALTER VIEW public.view_extrato_saldo SET (security_invoker = true);
ALTER VIEW public.vw_marketing_pedidos SET (security_invoker = true);
ALTER VIEW public.view_fluxo_resumo SET (security_invoker = true);
ALTER VIEW public.vw_catalogo_produtos SET (security_invoker = true);
ALTER VIEW public.view_liquidado_mensal SET (security_invoker = true);
ALTER VIEW public.vw_admin_dashboard SET (security_invoker = true);
