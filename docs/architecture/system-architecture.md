# Gilmar Distribuidor Massas - System Architecture Documentation

## Introduction

This document captures the **CURRENT STATE** of the Gilmar Distribuidor Massas codebase. It is designed to provide AI agents and developers with a clear understanding of the project's architecture, patterns, and technical debt.

### Document Scope
Comprehensive documentation of the entire system as part of the Brownfield Discovery workflow.

### Change Log
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-02-20 | 1.0 | Initial brownfield architecture analysis | Orion (Orchestrator) |

## Quick Reference - Key Files and Entry Points

### Critical Files
- **Main Entry**: `src/main.tsx`
- **Root Component**: `src/App.tsx` (contains all routes)
- **Supabase Client**: `src/lib/supabase.ts`
- **Global Styles**: `src/index.css`
- **Constants**: `src/constants/`
- **Types**: `src/types/database.ts` (DB schema), `src/types/domain.ts` (Domain models)

## High Level Architecture

### Technical Summary
The project is a modern web application built with **React 19** and **Vite**, using **Supabase** as the Backend-as-a-Service (BaaS). It is also configured for mobile deployment via **Capacitor**.

### Tech Stack
| Category | Technology | Version | Notes |
|----------|------------|---------|--------|
| Runtime | Node.js | >=18 | Managed via Vite |
| Frontend Framework | React | 19.2.0 | Latest stable |
| Build Tool | Vite | 7.2.4 | Fast ESM-based builder |
| Database/Backend | Supabase | ^2.95.3 | BaaS for Auth, DB, and Realtime |
| State Management | Zustand | ^5.0.9 | Lightweight global state |
| Data Fetching | React Query | ^5.90.20 | Server state management |
| Styling | Tailwind CSS | ^3.4.18 | Utility-first CSS |
| Animations | Framer Motion | ^12.23.26 | Premium UI animations |
| 3D Rendering | Three.js / R3F | ^0.182.0 | Used for advanced visuals |
| Mobile Bridge | Capacitor | ^8.0.0 | iOS/Android wrapper |

## Source Tree and Module Organization

### Project Structure (Actual)
```text
distribuidora/
├── .aios-core/          # AIOS framework configuration
├── .antigravity/        # Antigravity agent settings
├── android/             # Capacitor Android project
├── docs/                # Project documentation
├── public/              # Static assets
├── scripts/             # Utility scripts
├── src/
│   ├── assets/          # Images/Icons
│   ├── components/      # UI components (atoms, layout, domain-specific)
│   ├── constants/       # App-wide constants
│   ├── contexts/        # React Contexts
│   ├── hooks/           # Custom hooks (React Query wrappers)
│   ├── lib/             # External library initializers (Supabase, react-query)
│   ├── pages/           # Page/Route components
│   ├── schemas/         # Zod schemas for validation
│   ├── services/        # Direct Supabase API calls & Data mappers
│   ├── stores/          # Zustand stores
│   ├── types/           # TypeScript definitions
│   └── utils/           # Helper functions
└── supabase/            # Database migrations and configuration
```

### Architectural Patterns
1. **Layered Services**: Direct DB interactions are isolated in `src/services/`.
2. **Hook-Based State**: Pages interact with data through custom hooks in `src/hooks/` using `@tanstack/react-query`.
3. **Domain Mapping**: Raw database types are often mapped to domain models (`src/services/mappers.ts`).
4. **Auth Guards**: Routes are protected via `AuthGuard` in `App.tsx`.

## Technical Debt and Known Issues

### Identified Debt
1. **Inconsistent Data Mapping**: Some services use mappers heavily, while others return raw DB objects.
2. **Placeholder Logic**: `vendaService.ts` contains placeholders (e.g., `custo_unitario: 0` during insert).
3. **Client-side KPI Calculations**: Many business metrics are calculated in the frontend (`calculateKPIs`), which may impact performance as data grows.
4. **Status Hardcoding**: Page statuses and types are often hardcoded strings instead of strongly typed enums/constants.
5. **Partial Payment Limitations**: Logic for payment cancellation in `vendaService.ts` assumes total payment reversals.

## Integration Points
- **Supabase**: Primary data source and authentication.
- **Capacitor**: Bridge for native device features.
- **Vercel**: (Optional) Configuration present in `vercel.json` for web deployment.

## Development and Deployment
- **Dev**: `npm run dev`
- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **Capacitor Sync**: `npx cap sync`
