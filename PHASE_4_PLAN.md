# PHASE 4: Frontend Dashboard - Implementation Plan

## Goals

1. **Dashboard Layout** - Modern fintech UI (like MusicGPT)
2. **KPI Cards** - Hero metrics (total spend, monthly, budget score)
3. **Charts** - Category breakdown, trends, time series
4. **Insights Widget** - Display generated insights
5. **Filters** - Date range, category selection
6. **Responsive Design** - Mobile-first, works on all devices

## Dashboard Structure

```
┌─────────────────────────────────────────────────────┐
│                    HEADER                           │
│  Logo    |  Navigation  |  User Menu  |  Settings   │
├─────────────────────────────────────────────────────┤
│                  FILTERS                            │
│  [Date Range] [Category] [View Type]                │
├─────────────────────────────────────────────────────┤
│              HERO KPI CARDS                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │Total     │  │This Month│  │Budget    │          │
│  │£14.2M    │  │£1.2M     │  │Score: 74 │          │
│  │YTD       │  │↑12% MoM  │  │Health ✓  │          │
│  └──────────┘  └──────────┘  └──────────┘          │
├─────────────────────────────────────────────────────┤
│              CHARTS (2 COLUMN)                      │
│  ┌────────────────────┐  ┌──────────────────────┐   │
│  │ Category Pie Chart │  │ Trends Line Chart    │   │
│  │ (Groceries 35%)    │  │ (MoM, rolling avg)   │   │
│  └────────────────────┘  └──────────────────────┘   │
├─────────────────────────────────────────────────────┤
│           CATEGORY PERFORMANCE GRID                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │Groceries │  │Transport │  │Dining    │          │
│  │Score: 85 │  │Score: 72 │  │Score: 68 │          │
│  │£420/mo   │  │£240/mo   │  │£280/mo   │          │
│  └──────────┘  └──────────┘  └──────────┘          │
├─────────────────────────────────────────────────────┤
│              BUDGET STATUS                          │
│  Groceries: ███████░░ 92% (£368/£400)              │
│  Transport: ████░░░░░░ 47% (£118/£250)             │
│  Dining:    ██████████ 118% (£295/£250) ⚠️         │
├─────────────────────────────────────────────────────┤
│              INSIGHTS SECTION                       │
│  ↑ Spending increased 19% this month                │
│  → Top category: Groceries (£420, 35%)              │
│  💡 You have 8 subscriptions (£215.87/month)        │
│  ⚠️  Dining budget exceeded by £45                  │
└─────────────────────────────────────────────────────┘
```

## Components to Create

```
frontend/src/components/
├── dashboard/
│   ├── Dashboard.tsx          # Main page
│   ├── KPICards.tsx           # Hero metrics
│   └── Filters.tsx            # Date/category filters
│
├── charts/
│   ├── CategoryPieChart.tsx   # Pie chart of categories
│   ├── TrendsLineChart.tsx    # Monthly trends
│   ├── DailySpendChart.tsx    # Day-by-day line chart
│   └── BudgetChart.tsx        # Budget progress bars
│
├── widgets/
│   ├── CategoryGrid.tsx       # Category performance cards
│   ├── InsightsWidget.tsx     # Insights cards
│   ├── SubscriptionsWidget.tsx # Active subscriptions
│   └── BudgetWidget.tsx       # Budget status
│
└── common/
    ├── Card.tsx              # Base card component
    ├── Skeleton.tsx          # Loading states
    ├── Alert.tsx             # Alerts/warnings
    └── Button.tsx            # Button styles
```

## Pages

```
frontend/src/app/
├── layout.tsx                # Root layout
├── page.tsx                  # Dashboard (/)
├── transactions/
│   ├── page.tsx              # Transaction list
│   └── [id]/page.tsx         # Transaction detail
├── budgets/
│   └── page.tsx              # Budget settings
├── subscriptions/
│   └── page.tsx              # Subscription management
└── settings/
    └── page.tsx              # User settings
```

## Features

1. **Real-time Data** - Fetches from backend APIs
2. **Loading States** - Skeleton screens while loading
3. **Error Handling** - Graceful error messages
4. **Filtering** - By date range, category
5. **Responsive** - Mobile, tablet, desktop
6. **Dark Mode** - Optional (Tailwind support)
7. **Charts** - Recharts for visualization
8. **Caching** - React Query for efficient data fetching
