# Spend Analytics Dashboard

A production-grade financial spend analytics system that ingests transaction data, categorizes spending, computes analytics, and displays insights via a modern dashboard.

## 📊 Overview

This project implements a full-stack fintech application with:

- **Data Ingestion**: Mock transaction import (CSV, API simulation)
- **Data Processing**: Categorization, merchant normalization, subscription detection
- **Analytics Engine**: Spend trends, category breakdowns, insights generation
- **REST API**: Fast, paginated endpoints for dashboard consumption
- **React Dashboard**: Modern UI with charts, filters, and KPIs

## 🏗️ Architecture

```
Frontend (Next.js React) 
    ↓ REST API
Backend (Express TypeScript)
    ↓ SQL Queries
Database (PostgreSQL)
    ↓ Batch Processing
Data Pipeline (Categorization, Merchant Normalization, Insights)
```

See [PHASE_0_DESIGN.md](./PHASE_0_DESIGN.md) for detailed architecture.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Docker & Docker Compose (optional, for containerized PostgreSQL)

### 1. Setup Database

```bash
# Using Docker Compose (recommended)
docker-compose up -d

# Or connect to existing PostgreSQL
psql -U user -d spend_analytics -f schema.sql
```

### 2. Setup Backend

```bash
cd backend
npm install
cp ../.env.example ../.env

# Update DATABASE_URL in .env
npm run db:migrate
npm run db:seed
npm run dev
```

Backend runs on `http://localhost:3001`

### 3. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`

## 📁 Project Structure

```
ad-dashboard/
├── PHASE_0_DESIGN.md           # Architecture & design
├── schema.sql                   # PostgreSQL schema
├── .env.example                 # Environment variables
├── docker-compose.yml           # Local development DB
│
├── backend/                     # Node.js Express API
│   ├── src/
│   │   ├── db/                 # Database setup
│   │   ├── api/routes/         # REST endpoints
│   │   ├── services/           # Business logic
│   │   ├── workers/            # Batch jobs
│   │   └── server.ts           # Entry point
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                    # Next.js React app
│   ├── src/
│   │   ├── app/                # Pages & layout
│   │   ├── components/         # React components
│   │   ├── lib/                # Utilities & hooks
│   │   └── styles/             # Global styles
│   ├── package.json
│   └── tailwind.config.ts
│
└── data/
    ├── mock-transactions.csv
    └── sample-data.json
```

## 🔄 Development Phases

Each phase has dedicated documentation:

- **PHASE 0**: ✅ Architecture & Schema (DONE)
- **PHASE 1**: Data Ingestion & Mock API
- **PHASE 2**: Data Processing (Categorization)
- **PHASE 3**: Analytics Engine
- **PHASE 4**: REST API Layer
- **PHASE 5**: React Dashboard UI
- **PHASE 6**: Insights Engine
- **PHASE 7**: Production Hardening

## 📋 API Endpoints

(To be implemented in Phase 4)

```
GET  /api/summary              # Overall spend summary
GET  /api/categories           # Spend by category
GET  /api/trends               # Monthly/daily trends
GET  /api/subscriptions        # Detected subscriptions
GET  /api/insights             # Pre-computed insights
```

## 🗄️ Database Schema

Key tables:

- **users**: Dashboard users
- **transactions**: Immutable transaction log
- **merchants**: Normalized merchants
- **categories**: Spend categories
- **transaction_categories**: Multi-category mapping
- **subscriptions**: Recurring transactions
- **budgets**: User budgets
- **insights**: Pre-computed metrics

## 🧪 Testing

```bash
# Backend
cd backend
npm test                  # Run test suite
npm run test:watch      # Watch mode
npm run lint            # ESLint

# Frontend
cd frontend
npm test
npm run type-check      # TypeScript check
```

## 🔧 Configuration

Environment variables in `.env`:

```
DATABASE_URL=postgresql://...
SERVER_PORT=3001
NEXT_PUBLIC_API_URL=http://localhost:3001
LOG_LEVEL=debug
...
```

See `.env.example` for all variables.

## 📊 Data Processing Pipeline

1. **Raw Import**: Transactions ingested with status='raw'
2. **Processing**: Nightly batch job
   - Merchant normalization (fuzzy matching)
   - Category assignment (rule-based)
   - Subscription detection (recurring patterns)
3. **Analytics**: Post-processing
   - Compute spend by category
   - Generate trends & insights
   - Update insights table
4. **API**: Serves pre-computed data to frontend

## 🚨 Key Design Decisions

- **Immutable Transactions**: All transactions append-only, never updated
- **Idempotent Ingestion**: Duplicates detected via external_id
- **Denormalized Insights**: Pre-computed nightly for <200ms API responses
- **PostgreSQL**: ACID compliance for financial data, excellent for analytics
- **Next.js**: SSR for SEO, SSG for static dashboards, unified JS/TS stack
- **Batch Processing**: Non-blocking categorization and insights generation

## 📈 Success Metrics

- [ ] Dashboard loads in <1 second
- [ ] API responses <200ms
- [ ] Handles 100K+ transactions
- [ ] Categorization accuracy >95%
- [ ] Zero duplicate transaction bugs
- [ ] Test coverage >80%
- [ ] Mobile responsive

## 🤝 Contributing

This is an educational project demonstrating:
- Full-stack fintech architecture
- PostgreSQL schema design for analytics
- TypeScript for type safety
- Production-grade patterns

## 📝 License

MIT

---

**Start with PHASE 0**: Read [PHASE_0_DESIGN.md](./PHASE_0_DESIGN.md)
