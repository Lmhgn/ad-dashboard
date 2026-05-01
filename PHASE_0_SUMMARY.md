# PHASE 0: System Design - COMPLETE ✅

## What We Built

### 1. **Complete Architecture Design**

**3-Tier Architecture:**
```
┌─────────────────────────────────────────┐
│  FRONTEND: Next.js React App            │ TypeScript, TailwindCSS, Recharts
├─────────────────────────────────────────┤
│  API: Express.js Node.js Server         │ REST endpoints, validation, auth
├─────────────────────────────────────────┤
│  DATABASE: PostgreSQL                   │ ACID, normalized schema, analytics views
├─────────────────────────────────────────┤
│  BATCH PROCESSING: Node.js Workers      │ Categorization, normalization, insights
└─────────────────────────────────────────┘
```

### 2. **Production-Grade Database Schema**

**12 Core Tables:**

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `users` | Dashboard users | Subscription tier, timezone, currency |
| `transactions` | Immutable transaction log | Status tracking, external_id for idempotency |
| `merchants` | Normalized merchants | Fuzzy matching support, logo URLs |
| `categories` | Spend categories | Parent-child hierarchy, color-coded |
| `transaction_categories` | Multi-category mapping | Confidence scoring, manual overrides |
| `subscriptions` | Detected recurring payments | Frequency, next_occurrence tracking |
| `budgets` | User spending limits | Month-based, per-category |
| `insights` | Pre-computed metrics | Daily generation, trend analysis |
| `audit_logs` | Change tracking | Immutable audit trail |

**Plus 2 Views:**
- `daily_spend_by_category` - Quick daily breakdowns
- `monthly_spend_summary` - Aggregated monthly data

**Comprehensive Indexing:**
- User + date range queries (primary access pattern)
- Merchant/category lookups
- Audit trail timestamp queries
- All critical foreign keys indexed

### 3. **Tech Stack with Justification**

**Why each choice:**

| Component | Choice | Why |
|-----------|--------|-----|
| Frontend | Next.js + React | SSR for dashboards, unified TS stack, excellent DevX |
| Styling | TailwindCSS | Utility-first, rapid iteration, fintech-ready |
| Charts | Recharts | React-native, composable, financial data focus |
| Backend | Express + TypeScript | Node.js async I/O, type safety, same language |
| Database | PostgreSQL | ACID compliance (critical for finance), JSON support, analytics ready |
| ORM | Knex.js | Balance of control + convenience for complex queries |
| Validation | Zod | TypeScript-native, runtime safety |
| Batch Jobs | Node.js | Single language, no complexity of multi-language setup |
| Deployment | Docker | Containerized, AWS/Heroku ready, reproducible |

### 4. **Key Design Decisions**

#### **Idempotent Ingestion**
```
Transaction uniqueness key: (user_id, external_id)
- External ID from data source (e.g., Plaid transaction_id)
- Duplicate inserts silently skipped
- Critical for reliability with third-party APIs
```

#### **Immutable Transaction Log**
```
All transactions append-only:
- Never UPDATE a transaction
- Corrections: reversal + new transaction
- Automatic audit trail
- Simplifies reconciliation
```

#### **Normalized Schema with Denormalization**
```
Normalized: transactions, merchants, categories
  ↓ (batch processing)
Denormalized: insights table (daily)
  ↓ (API queries)
  Fast responses (<200ms)
```

#### **Multi-Category Support**
```
- One transaction can belong to multiple categories
- Confidence scoring for ML/rule-based assignment
- Manual override capability
- Flexible for edge cases (e.g., grocery + household)
```

### 5. **Project Structure**

```
ad-dashboard/                          Root directory

DOCUMENTATION:
├── PHASE_0_DESIGN.md                Full architecture details
├── PHASE_0_SUMMARY.md               This file
├── README.md                         Getting started guide

DATABASE:
├── schema.sql                        Complete PostgreSQL schema (450+ lines)
│   - 12 tables with constraints
│   - 15 indexes optimized for access patterns
│   - 2 analytical views
│   - 15 default categories seeded

BACKEND (Node.js Express):
├── backend/
│   ├── package.json                 31 dependencies configured
│   └── tsconfig.json                TypeScript strict mode
│   
│   (To be created in Phase 1)
│   ├── src/
│   │   ├── server.ts                Express app entry
│   │   ├── db/                      Database setup
│   │   ├── api/routes/              REST endpoints
│   │   ├── services/                Business logic
│   │   ├── workers/                 Batch jobs
│   │   ├── types/                   TypeScript types
│   │   └── utils/                   Helpers

FRONTEND (Next.js React):
├── frontend/
│   ├── package.json                 25 dependencies configured
│   ├── tsconfig.json                TypeScript paths
│   ├── tailwind.config.ts           Custom fintech theme
│   └── next.config.js               Optimizations
│   
│   (To be created in Phase 5)
│   ├── src/
│   │   ├── app/                     Next.js pages
│   │   ├── components/              React components
│   │   ├── lib/                     Utilities & hooks
│   │   └── styles/                  Global styles

CONFIGURATION:
├── .env.example                     All environment variables
├── docker-compose.yml               PostgreSQL + pgAdmin (dev setup)

DATA:
└── data/
    ├── mock-transactions.csv        (Phase 1)
    └── sample-data.json             (Phase 1)
```

### 6. **Data Flow Architecture**

```
INGESTION PHASE (Phase 1):
  External CSV/API
       ↓
  Import Service (idempotent check)
       ↓
  Raw transactions table (status='raw')

PROCESSING PHASE (Phase 2-3, Nightly Batch):
  Raw transactions (status='raw')
       ↓
  Merchant Normalization (fuzzy matching)
       ↓
  Categorization (rule-based engine)
       ↓
  Subscription Detection (recurring patterns)
       ↓
  Update status to 'processed'

ANALYTICS PHASE (Phase 3, Post-processing):
  Processed transactions
       ↓
  Compute Metrics:
     • Spend by category (daily, monthly)
     • Trends (rolling averages)
     • Top merchants
     • Budget vs actual
     • Subscription costs
       ↓
  Denormalize to insights table

API SERVING (Phase 4):
  Client Request
       ↓
  Express Router (validation, auth)
       ↓
  Query insights/transactions tables
       ↓
  JSON Response (<200ms target)

FRONTEND RENDERING (Phase 5):
  Next.js Dashboard
       ↓
  Fetch API endpoints (parallel queries)
       ↓
  Render with Recharts (interactive)
       ↓
  Display KPIs, trends, filters
```

### 7. **Success Criteria Defined**

- [ ] **Performance**: Dashboard <1s load, API <200ms
- [ ] **Scale**: 100K+ transactions, multiple users
- [ ] **Accuracy**: Categorization >95%, zero duplicates
- [ ] **Quality**: >80% test coverage, mobile responsive
- [ ] **Reliability**: Daily batch jobs, no data loss

### 8. **Estimated Effort & Timeline**

| Phase | Estimate | Focus |
|-------|----------|-------|
| 0 | 1 day | ✅ DONE: Architecture, schema, setup |
| 1 | 2 days | Mock data, ingestion API, idempotency |
| 2 | 2 days | Categorization engine, merchant matching |
| 3 | 2 days | Analytics queries, subscription detection |
| 4 | 1 day | REST endpoints, pagination, validation |
| 5 | 3 days | React components, charts, dashboard UX |
| 6 | 1 day | Insights generation, trend analysis |
| 7 | 2+ days | Production hardening, deployment |

**Total MVP: ~14 days**

## What's Ready for Phase 1

✅ Database schema (complete with indexes)
✅ Environment configuration template
✅ Backend package structure
✅ Frontend structure (Next.js, TailwindCSS)
✅ Docker setup for local development
✅ Project documentation & README

## What's Next: PHASE 1 (Data Ingestion)

**Tasks:**
1. Create mock transaction dataset (CSV)
2. Build transactionService (insert, idempotent check)
3. Create /api/import endpoint (CSV upload)
4. Implement duplicate detection logic
5. Add transaction validation (Zod schemas)
6. Write integration tests

**Deliverables:**
- Mock CSV with 1000+ realistic transactions
- Idempotent import API
- Error handling for invalid data
- Database populated with test data

---

**PHASE 0 is complete.** Ready to move to PHASE 1: Data Ingestion.
