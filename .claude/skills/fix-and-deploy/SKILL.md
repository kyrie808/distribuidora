---
name: fix-and-deploy
description: Fix a bug or error and verify the build passes. Use when user says "fix", "bug", "erro", "corrigir", "deploy", or "build quebrado".
allowed-tools: Read, Write, Bash, Grep
---

# Fix & Deploy

You are fixing a bug in MassasCRM (React 19 + TypeScript + Vite + Supabase).

## Process

1. **Identify** — Read the error message or file mentioned. Use Grep if needed.
2. **Diagnose** — Find the root cause. Check types in `src/types/domain.ts` and `src/types/database.ts` if type errors.
3. **Fix** — Apply the minimal change. Do NOT refactor unrelated code.
4. **Verify** — Run `npm run build`. If it passes, done. If not, fix the new error.
5. **Report** — Show what changed in 3 lines max.

## Rules

- Mapper changes go in `src/services/mappers.ts`
- Type changes go in `src/types/domain.ts` (app) or `src/types/database.ts` (DB)
- Never touch Supabase triggers without reading them first via MCP
- Run `npm run build` as the final step, always
