# PHASE 0: System Design - Spend Analytics Dashboard

## 1. ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                               │
│  Next.js Frontend App (React, TypeScript, TailwindCSS)         │
│  - Dashboard, KPI Cards, Charts, Filters                        │
└────────────────────────┬────────────────────────────────────────┘
                         │ REST API (TypeScript/Node.js)
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                    API LAYER                                     │
│  Express.js / Node.js Server                                    │
│  - /api/summary, /api/categories, /api/trends                  │
│  - /api/subscriptions, /api/insights                           │
│  - Auth, Rate Limiting, Validation                             │
└────────────────────────┬────────────────────────────────────────┘
                         │ SQL Queries
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                  DATABASE LAYER                                  │
│  PostgreSQL (OLTP for transactional data)                      │
│  - transactions, users, merchants, categories                  │
│  - subscriptions, budgets, transaction_categories              │
└────────────────────────┬────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                BATCH PROCESSING LAYER                           │
│  Data Pipeline (Node.js/Python scripts)                        │
│  - Categorization Engine                                        │
│  - Merchant Normalization                                       │
│  - Subscription Detection                                       │
│  - Insight Generation                                           │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│              DATA INGESTION LAYER                               │
│  Mock Plaid/Open Banking Integration                           │
│  - CSV Import, API Ingestion                                   │
│  - Idempotent processing                                        │
│  - Duplicate detection                                          │
└────────────────────────────────────────────────────────────────┘
```

## 2. TECH STACK

| Layer | Technology | Justification |
|-------|-----------|---------------|
| Frontend | Next.js + React + TypeScript | Modern, Server-side rendering, SSG for dashboards, TypeScript for safety |
| Styling | TailwindCSS | Fast iteration, utility-first, excellent for fintech UX |
| Charts | Recharts | React-native, easy integration, good for financial data |
| Backend | Node.js + Express + TypeScript | Consistent JS/TS across stack, async I/O for I/O-heavy tasks |
| Database | PostgreSQL | ACID compliance, JSON support for flexibility, strong for financial data |
| ORM | Knex.js / Raw SQL | Balance between control and convenience for complex analytics queries |
| Validation | Zod | TypeScript-native, runtime validation |
| Testing | Jest + Supertest | Standard for Node.js projects |
| Data Processing | Node.js (TypeScript) | Simplicity, avoid complexity of multiple languages |
| Deployment | Docker + AWS/Heroku | Containerized, scalable, easy CI/CD |

## 3. DATABASE SCHEMA

### Core Tables

**users**
- Tracks individual dashboard users
- Minimal scope for MVP (subscription, preferences)

**transactions**
- Core fact table - immutable log of all financial transactions
- Indexed on user_id, date, merchant_id
- Status field to track processing state

**merchants**
- Normalized merchant master data
- Deduplication critical here
- Categories stored separately for flexibility

**categories**
- Standardized spend categories (e.g., "Groceries", "Transport", "Entertainment")
- Parent-child hierarchy support

**transaction_categories**
- Join table: transactions can be categorized
- Confidence score for ML-based categorization (future)

**subscriptions**
- Detected recurring transactions
- Monthly/yearly frequency
- Merchant association

**budgets**
- User-defined budget targets by category
- Month-based tracking

**insights**
- Pre-computed insights (denormalized for fast reads)
- Generated daily by batch process
- Time-series data for trends

## 4. KEY DESIGN PRINCIPLES

### 4.1 Idempotency
- All data ingestion is idempotent
- Transactions identified by `(user_id, date, amount, merchant_id, original_id)` - external transaction ID
- Duplicate inserts skipped silently

### 4.2 Immutability
- Transactions are append-only, never updated
- Corrections added as new transactions (e.g., reversal + new transaction)
- Audit trail automatically maintained

### 4.3 Separation of Concerns
- Data ingestion → Raw transactions table
- Processing layer → Clean, categorized transactions
- Analytics layer → Pre-computed metrics for speed
- API layer → Read-only access patterns

### 4.4 Scalability
- Transactions indexed by user_id + date for time-range queries
- Batch processes run async, don't block API
- Insights pre-computed for fast dashboard loads
- Pagination for large result sets

## 5. DATA FLOW

```
1. INGESTION
   External Data (CSV/API)
   ↓
   Raw Transaction Import
   ↓
   Idempotent Check (skip duplicates)
   ↓
   Store in transactions table (raw status)

2. PROCESSING (Batch Job - nightly)
   Raw transactions (status = 'raw')
   ↓
   Merchant Normalization (fuzzy matching)
   ↓
   Categorization (rule-based engine)
   ↓
   Subscription Detection (recurring pattern analysis)
   ↓
   Update transaction status to 'processed'

3. ANALYTICS (Batch Job - post-processing)
   Processed transactions
   ↓
   Compute metrics:
      - Daily spend by category
      - Monthly trends
      - Rolling 30/60/90 day averages
      - Top merchants
      - Subscription costs
   ↓
   Store in insights table (denormalized)

4. API SERVING
   Client Request → Express API
   ↓
   Query insights/transactions tables
   ↓
   JSON Response (< 200ms)

5. FRONTEND RENDERING
   Next.js Dashboard
   ↓
   Fetch API endpoints
   ↓
   Render charts, KPIs, filters
```

## 6. FILE STRUCTURE

```
ad-dashboard/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── schema.sql
│   │   │   ├── migrations/
│   │   │   └── seeds/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── summary.ts
│   │   │   │   ├── categories.ts
│   │   │   │   ├── trends.ts
│   │   │   │   ├── subscriptions.ts
│   │   │   │   └── insights.ts
│   │   │   └── middleware/
│   │   ├── services/
│   │   │   ├── transactionService.ts
│   │   │   ├── categorizationService.ts
│   │   │   ├── subscriptionService.ts
│   │   │   └── analyticsService.ts
│   │   ├── workers/
│   │   │   ├── processingWorker.ts
│   │   │   ├── analyticsWorker.ts
│   │   │   └── insightWorker.ts
│   │   ├── utils/
│   │   ├── types/
│   │   └── server.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── jest.config.js
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── api/
│   │   ├── components/
│   │   │   ├── dashboard/
│   │   │   ├── charts/
│   │   │   ├── filters/
│   │   │   └── common/
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   ├── hooks/
│   │   │   └── types.ts
│   │   └── styles/
│   ├── next.config.js
│   ├── tailwind.config.ts
│   ├── package.json
│   └── tsconfig.json
│
├── data/
│   ├── mock-transactions.csv
│   └── sample-data.json
│
├── docker-compose.yml
├── .env.example
└── PHASE_*.md
```

## 7. IMPLEMENTATION ROADMAP

| Phase | Duration | Output | Dependencies |
|-------|----------|--------|--------------|
| 0 | 1 day | Architecture + Schema | - |
| 1 | 2 days | Mock data + ingestion API | Phase 0 |
| 2 | 2 days | Categorization engine | Phase 1 |
| 3 | 2 days | Analytics queries | Phase 2 |
| 4 | 1 day | REST API layer | Phase 3 |
| 5 | 3 days | React dashboard UI | Phase 4 |
| 6 | 1 day | Insights engine | Phase 5 |
| 7 | Ongoing | Production hardening | All |

**Total: ~2 weeks for MVP**

## 8. RISK ANALYSIS

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Data quality issues | High | Strict validation, cleansing pipeline |
| Merchant duplicate explosion | High | Fuzzy matching + manual review UI |
| Category assignment errors | Medium | Confidence scoring, manual override |
| Query performance | Medium | Indexes, denormalization, caching |
| Data privacy | High | Encryption, audit logs, no PII |

## 9. SUCCESS CRITERIA

- [ ] Dashboard loads in < 1 second
- [ ] API responses < 200ms
- [ ] Handles 100K+ transactions without slowdown
- [ ] Categorization accuracy > 95%
- [ ] Zero duplicate transaction bugs
- [ ] Full test coverage (>80%)
- [ ] Mobile responsive design
- [ ] Insights generated daily

---

**Next Steps:** Create database schema SQL and initialize backend project structure.
