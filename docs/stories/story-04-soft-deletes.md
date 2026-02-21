# Story 04: Implement Soft Deletes

## Description
As an administrator, I want to use "soft deletes" instead of permanent deletions for contacts and sales, so that I can audit historical data and recover items deleted by mistake.

## Tasks
- [ ] Add `deleted_at` (timestamptz, nullable) to `public.contatos` and `public.vendas`.
- [ ] Update frontend services to use `.update({ deleted_at: new Date() })` instead of `.delete()`.
- [ ] Update views and RLS policies to filter out deleted records by default.

## Acceptance Criteria
- [ ] Records "deleted" in the app remain in the database with a `deleted_at` timestamp.
- [ ] The web app correctly hides these records in all list views.
- [ ] Total revenue and historical stats remain accurate.
