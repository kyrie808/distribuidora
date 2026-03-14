# Technical Debt Backlog - Gilmar Distribuidor Massas

## Priority 0 (Critical - Security & Integrity)
| ID | Title | Component | Impact | Estimated Effort |
|----|-------|-----------|--------|------------------|
| TD-001 | Enable RLS on core tables | Database | High - Security Risk | 4h |
| TD-002 | Index Foreign Keys | Database | Medium - Performance | 2h |
| TD-003 | Fix Placeholder Logic in Services | Backend | Low - Data Integrity | 3h |

## Priority 1 (High - Implementation Quality)
| ID | Title | Component | Impact | Estimated Effort |
|----|-------|-----------|--------|------------------|
| TD-004 | Standardize Service Pattern | Frontend | Medium - Maintainability | 6h |
| TD-005 | Move Client-side KPI math to DB | Database | High - Performance | 4h |
| TD-006 | Centralize Type Mappings | Frontend | Low - Developer Experience | 2h |

## Priority 2 (Medium - Technical Excellence)
| ID | Title | Component | Impact | Estimated Effort |
|----|-------|-----------|--------|------------------|
| TD-007 | Consolidate Timestamp Columns | Database | Low - Auditability | 2h |
| TD-008 | Improve NovaVenda UX on Mobile | Frontend | Medium - UX | 8h |
| TD-009 | Standardize Auth Guards usage | Frontend | Low - Security | 1h |

## Detailed Descriptions

### TD-001: RLS Enablement
Current core tables (`vendas`, `contatos`, etc.) have RLS disabled. This allows unauthorized access if the anon key is compromised.
**Action**: Enable RLS and define per-role policies.

### TD-004: Service Inconsistency
Some pages call Supabase directly, others use `vendaService`.
**Action**: Ensure all database interactions go through a dedicated service layer within `src/services/`.

### TD-005: Client-side Calculations
Metrics are currently calculated in the frontend after fetching raw data. This will not scale.
**Action**: Replace with queries to the identified database views or create new ones.
