# Story 01: Implement RLS Policies for Sales/CRM

## Description
As a security-conscious developer, I want to enable Row Level Security (RLS) on the `vendas`, `contatos`, and `itens_venda` tables so that only authenticated users can access and modify business data.

## Tasks
- [ ] Enable RLS on `public.vendas`, `public.contatos`, `public.itens_venda`.
- [ ] Create `SELECT`/`INSERT`/`UPDATE` policies for the `authenticated` role.
- [ ] Create a `restricted` policy for sensitive fields if necessary.
- [ ] Verify that existing frontend services work with the new policies.

## Acceptance Criteria
- [ ] Direct API calls without a JWT return 0 results.
- [ ] The web app functions normally for logged-in users.
- [ ] No data is lost during the RLS migration.
