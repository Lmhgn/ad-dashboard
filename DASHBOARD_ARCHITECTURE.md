# PHASE 0 UPDATED: Dashboard Architecture & Data Sources

## Dashboard Reference

**Replicating**: MusicGPT Analytics Dashboard Structure  
**Adapted For**: Financial Spend Analytics

This dashboard provides detailed insights into a user's spending patterns, similar to how MusicGPT provides artist analytics.

---

## DASHBOARD LAYOUT & COMPONENTS

### 1. HEADER SECTION

```
┌────────────────────────────────────────────────────────┐
│  Tabs: OVERVIEW | TARGETING | BENCHMARKS |             │
│        INTELLIGENCE | TIPS & TACTICS | RETROSPECTIVE   │
└────────────────────────────────────────────────────────┘
```

**Purpose**: Navigation between different analytical views

---

### 2. HERO SECTION (Top KPIs)

```
┌─────────────────────────────────────────────────────────────┐
│                      Account Summary                         │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Total Spend  │  │ This Month   │  │ Budget Score │     │
│  │   £14.2M     │  │   £1.2M      │  │    74/100    │     │
│  │ YTD          │  │ (↑ 12% MoM)  │  │ ↗ Health     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  Additional Metrics:                                         │
│  • Active Categories: 18/24                                 │
│  • Top Category: Subscriptions (23%)                        │
│  • Budget Adherence: 87%                                    │
│  • Anomalies Detected: 3                                    │
└─────────────────────────────────────────────────────────────┘
```

**Data Source**: `insights` + `transactions` tables aggregated

---

### 3. CATEGORY PERFORMANCE CARDS (Like "Top Picks")

```
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ GROCERIES        │  │ TRANSPORT        │  │ ENTERTAINMENT    │
│                  │  │                  │  │                  │
│ Score: 85        │  │ Score: 72        │  │ Score: 68        │
│ Monthly: £340    │  │ Monthly: £240    │  │ Monthly: £180    │
│                  │  │                  │  │                  │
│ • Spend trend ↑  │  │ • Overspending   │  │ • Within budget  │
│ • 28 txns        │  │ • 15 txns        │  │ • 12 txns        │
│ • Avg: £12.14    │  │ • Avg: £16       │  │ • Avg: £15       │
│                  │  │                  │  │                  │
│ > View Details   │  │ > View Details   │  │ > View Details   │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

**Data Source**: `monthly_spend_summary` view + budget comparison

---

### 4. INSIGHTS SECTION ("What to do next")

```
┌─────────────────────────────────────────────────────────────┐
│  What to do next                                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ① SET SUBSCRIPTION BUDGET                                   │
│    You're spending £840/month on subscriptions (26% of      │
│    budget). Consider setting a category limit.              │
│    Est. Savings: £120/month                                 │
│    > View Subscriptions                                     │
│                                                              │
│ ② REVIEW DINING SPIKE                                       │
│    Dining expenses jumped 45% in March (£280 vs £185).      │
│    Average daily: £9.33 (vs historical £6.21)               │
│    Est. Overspend: £95 this month                           │
│    > View Dining Transactions                               │
│                                                              │
│ ③ OPTIMIZE TRANSPORT CATEGORY                               │
│    25% of your transport spend is on ride-sharing. Consider │
│    public transport alternatives.                           │
│    Est. Savings: £45/month                                  │
│    > View Recommendations                                   │
│                                                              │
│ ④ RECURRING CHARGE REVIEW                                   │
│    Found 3 subscriptions that haven't been used in 30 days. │
│    Est. Savings: £35/month                                  │
│    > Review Subscriptions                                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Data Source**: `insights` table (pre-computed by batch job)

---

### 5. RECOMMENDATIONS SECTION ("What to act on")

```
┌───────────────────────────────────────────────────────────────┐
│  What to act on                                                │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  ✓ INCREASE TRANSPORT BUDGET                                  │
│    You're at 94% of monthly budget with 8 days remaining.    │
│    Budget: £250 | Spent: £235 | Remaining: £15              │
│    Confidence: HIGH                                           │
│    Actions: [Increase Budget] [Track Daily] [Set Alert]      │
│                                                                │
│  ✓ DINING CATEGORY OVERSPEND                                  │
│    You exceeded March budget by £85 (120% of target).        │
│    Budget: £250 | Spent: £335 | Overage: £85                │
│    Confidence: HIGH                                           │
│    Actions: [Review Merchants] [Set April Target] [Analyze]  │
│                                                                │
│  ○ ENTERTAINMENT UNDERUTILIZED                                │
│    Your entertainment budget is only 60% utilized. You have  │
│    £120 remaining (should allocate or reset for next month). │
│    Budget: £300 | Spent: £180 | Remaining: £120             │
│    Confidence: MEDIUM                                         │
│    Actions: [View Merchants] [Reallocate] [Dismiss]          │
│                                                                │
│  ○ SUBSCRIPTION AUDIT DUE                                     │
│    You have 8 active subscriptions. Last reviewed: Feb 15.   │
│    Estimated monthly: £210 | Last charged: Mar 28           │
│    Confidence: MEDIUM                                         │
│    Actions: [Review All] [Edit Details] [Snooze]             │
│                                                                │
└───────────────────────────────────────────────────────────────┘
```

**Data Source**: `budgets` vs `transactions` + `subscriptions` table

---

### 6. SPENDING TIMING ("When to Launch")

```
┌─────────────────────────────────────────────────────────────┐
│  BEST TIME TO SPEND                                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Q1 (Jan-Mar):     ████████░░  £3.2M  (23% of annual)       │
│  Q2 (Apr-Jun):     ██████░░░░  £2.8M  (20% of annual) ↓    │
│  Q3 (Jul-Sep):     █████████░  £3.6M  (26% of annual) ↑    │
│  Q4 (Oct-Dec):     ████████░░  £3.2M  (31% of annual) PEAK │
│                                                              │
│  Note: Q4 spending peaks (holidays, gifts). Budget          │
│  accordingly. Consider setting 35% higher limit Oct-Dec.   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Data Source**: `transactions` aggregated by quarter + historical trends

---

### 7. BUDGET ALLOCATION STRATEGY ("How to Spend")

```
┌─────────────────────────────────────────────────────────────┐
│  CATEGORY BUDGET ALLOCATION                                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  RECOMMENDED ANNUAL BUDGET: £13,200 (based on spending)     │
│                                                              │
│  Groceries        ████░░░░░░  24% (£3,168)  - 50/50 rule   │
│  Transport        ███░░░░░░░  15% (£1,980)  - Essential     │
│  Dining           ███░░░░░░░  15% (£1,980)  - Entertainment │
│  Subscriptions    ██░░░░░░░░  10% (£1,320)  - Review        │
│  Entertainment    ██░░░░░░░░  10% (£1,320)  - Flexible      │
│  Utilities        ██░░░░░░░░   8% (£1,056)  - Fixed         │
│  Healthcare       █░░░░░░░░░   5% (£660)    - As needed     │
│  Other            ░░░░░░░░░░   3% (£396)    - Misc          │
│                                                              │
│  Note: Based on your 12-month spending patterns. Adjust    │
│  based on your priorities and financial goals.             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Data Source**: `monthly_spend_summary` view + budget analysis

---

### 8. MERCHANT TARGETING ("Who to Reach")

```
┌─────────────────────────────────────────────────────────────┐
│  TOP MERCHANTS BY SPEND                                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Tesco Grocery      £2,400 spent (18% of total)             │
│  Monthly avg: £200  | Last visit: Today                     │
│  Recommendation: Track loyalty programs, compare prices     │
│                                                              │
│  Netflix           £180/year = £15/month                     │
│  Status: Active | Last charge: Mar 28                       │
│  Recommendation: Consider ad-supported tier (save £5/mo)    │
│                                                              │
│  Starbucks         £840 spent (6% of total)                 │
│  Frequency: 2-3x per week | Avg: £4.50                     │
│  Recommendation: Home brewing alternative (save £3/visit)   │
│                                                              │
│  Transport (All)   £2,880 spent (22% of total)             │
│  TfL Pass: £1,320  | Ride-sharing: £960                    │
│  Recommendation: Shift ride-sharing to public transport     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Data Source**: `merchants` + `transactions` aggregation

---

### 9. TRENDING CATEGORIES ("Best of Channel")

```
┌──────────────────────────────────────────────────────────────┐
│ Category Performance Grid                                     │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ GROCERIES              GAS STATION           DINING          │
│ Score: 85              Score: 72             Score: 68       │
│ ████████░░             ███████░░░            ██████░░░░      │
│                                                               │
│ Monthly: £340          Monthly: £240         Monthly: £280   │
│ Avg/txn: £12.14        Avg/txn: £40          Avg/txn: £14    │
│ Count: 28              Count: 6              Count: 20       │
│ Trend: ↑ +8%           Trend: ↓ -3%          Trend: ↑ +12%   │
│                                                               │
│ vs Budget:             vs Budget:            vs Budget:      │
│ ✓ Under (92%)          ✗ Over (110%)         ✗ Over (112%)   │
│                                                               │
│ [View Details]         [View Details]        [View Details]  │
└──────────────────────────────────────────────────────────────┘
```

**Data Source**: `monthly_spend_summary` + budget comparison

---

## DATA SOURCES & INGESTION

### Primary Data Sources

1. **Bank Transactions** (Real or Mock)
   - Source: Open Banking API, Plaid, CSV import
   - Fields: Date, Amount, Merchant, Description
   - Frequency: Daily sync
   - Table: `transactions`

2. **User Account Data**
   - Source: User preferences in app
   - Fields: Budget targets, categories, alerts
   - Frequency: Real-time updates
   - Table: `users`, `budgets`

3. **Merchant Master Data**
   - Source: Merchant normalization engine
   - Fields: Normalized name, category, logo
   - Frequency: Updated on new merchants
   - Table: `merchants`

4. **Subscription Data**
   - Source: Detected from recurring transactions + manual entry
   - Fields: Amount, frequency, renewal date
   - Frequency: Updated weekly
   - Table: `subscriptions`

5. **Category Definitions**
   - Source: Pre-defined + user custom categories
   - Fields: Name, budget limit, color, icon
   - Frequency: Static + user changes
   - Table: `categories`

### Derived Data (Batch Processing)

6. **Insights Engine Output**
   - Computed: Nightly batch job
   - Contains: Anomalies, recommendations, trends
   - Table: `insights`

7. **Analytics Views**
   - Computed: Hourly refresh (or on-demand)
   - Contains: Daily/monthly aggregations
   - Views: `daily_spend_by_category`, `monthly_spend_summary`

---

## DATA FLOW DIAGRAM

```
┌─────────────────────────┐
│  External Data Sources  │
│  • Bank API (Plaid)     │
│  • CSV Upload           │
│  • Manual Entry         │
│  • Budget Settings      │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  Raw Data Ingestion (PHASE 1)       │
│  • Validate transactions            │
│  • Idempotent duplicate check       │
│  • Store with status='raw'          │
└────────────┬────────────────────────┘
             │
             ▼
        TRANSACTIONS TABLE (raw)
             │
             ▼
┌─────────────────────────────────────┐
│  Data Processing (PHASE 2-3)        │
│  • Merchant normalization           │
│  • Category assignment              │
│  • Subscription detection           │
│  • Status → 'processed'             │
└────────────┬────────────────────────┘
             │
             ▼
        TRANSACTIONS TABLE (processed)
        SUBSCRIPTIONS TABLE
        MERCHANTS TABLE
             │
    ┌────────┼────────┬──────────┐
    │        │        │          │
    ▼        ▼        ▼          ▼
  Daily  Monthly  Budget  Insight
  Agg.   Agg.    Check   Engine
    │        │        │          │
    └────────┼────────┼──────────┘
             │
             ▼
        INSIGHTS TABLE (pre-computed daily)
        ANALYTICS VIEWS (hourly refresh)
             │
    ┌────────┴────────┬──────────────┐
    │                 │              │
    ▼                 ▼              ▼
 /api/summary  /api/categories  /api/insights
    │                 │              │
    └────────┬────────┴──────────────┘
             │
             ▼
    FRONTEND DASHBOARD (React)
    • Hero KPIs
    • Category Cards
    • Insights Section
    • Recommendations
    • Charts & Trends
    • Merchant Breakdown
```

---

## DASHBOARD COMPONENT → API ENDPOINT MAPPING

| Component | API Endpoint | Data Source | Cache |
|-----------|---|---|---|
| Hero KPIs (Total Spend, MoM) | `/api/summary` | `insights` + `transactions` | 1 hour |
| Category Performance Cards | `/api/categories` | `monthly_spend_summary` view | 1 hour |
| "What to do next" Insights | `/api/insights?type=spending_increase` | `insights` table | 1 hour |
| "What to act on" Budget Alerts | `/api/budgets/alerts` | `budgets` vs `transactions` | 30 min |
| Spending Timing (Quarterly) | `/api/trends/quarterly` | `transactions` aggregated | 6 hours |
| Budget Allocation Strategy | `/api/budgets/recommended` | Computed from historical | 1 day |
| Top Merchants | `/api/merchants/top` | `merchants` + `transactions` | 1 hour |
| Category Performance Grid | `/api/categories/performance` | `monthly_spend_summary` | 1 hour |
| Subscription List | `/api/subscriptions` | `subscriptions` table | 1 hour |

---

## SCHEMA UPDATES FOR DASHBOARD

Added/Updated fields to support all dashboard components:

**transactions table:**
- `status`: Track processing state (raw → processed)
- `external_id`: Idempotent ingestion key
- `notes`: User notes on transactions

**categories table:**
- `color`: Hex color for dashboard cards
- `icon`: Icon name for visual identity

**subscriptions table:**
- `detected_at`: When subscription was identified
- `last_transaction_date`: Last charge date

**insights table (new):**
- `insight_type`: Categorize insight (anomaly, recommendation, trend)
- `metric_value`: Quantified impact (e.g., "£95 overspend")
- `confidence`: Confidence score for recommendation

**budgets table:**
- `period`: Monthly/quarterly/annual budgets
- `month_year`: Specific month for tracking

---

## SUCCESS METRICS FOR DASHBOARD

- [ ] All KPIs load in <500ms
- [ ] Category cards render instantly (cached data)
- [ ] Insights generated daily with >90% accuracy
- [ ] Budget alerts trigger before overspend
- [ ] Top merchants identified correctly
- [ ] Trends visible in 3-month + rolling 12-month views
- [ ] Mobile responsive on all components
- [ ] No data inconsistencies between views

---

**Next: PHASE 1** will implement the ingestion layer to populate this dashboard with real data.
