# PHASE 3: Analytics Engine - Implementation Plan

## Goals

1. **Compute Analytics Metrics** - Daily/monthly aggregations
2. **Trend Analysis** - Rolling averages, percent changes
3. **Budget Comparison** - Budget vs actual spending
4. **Insights Generation** - Actionable recommendations
5. **Pre-compute for Speed** - Store in insights table for <200ms API responses

## Analytics Pipeline

```
Processed Transactions (from PHASE 2)
    ↓
Step 1: DAILY AGGREGATIONS
  • Spend by category per day
  • Total daily spend
  • Transaction count per day
    ↓
Step 2: MONTHLY AGGREGATIONS
  • Spend by category per month
  • Monthly totals
  • Category percentages
    ↓
Step 3: TREND ANALYSIS
  • Rolling 30/60/90 day averages
  • Month-over-month changes
  • Year-over-year changes
    ↓
Step 4: BUDGET ANALYSIS
  • Budget vs actual
  • Over/under status
  • Days remaining
    ↓
Step 5: INSIGHTS GENERATION
  • Spending increases/decreases
  • Top categories
  • Merchant spikes
  • Subscription summaries
  • Budget warnings
    ↓
Step 6: STORE IN INSIGHTS TABLE
  • Pre-computed metrics
  • Updated daily
  • Ready for fast API queries
```

## Metrics to Compute

### Daily Metrics
```
For each day:
  - Total spend: SUM(amount)
  - Transaction count: COUNT(*)
  - Average transaction: AVG(amount)
  - Spend by category: SUM(amount) GROUP BY category_id
```

### Monthly Metrics
```
For each month:
  - Total spend: SUM(amount)
  - Spend by category: SUM(amount) GROUP BY category_id
  - Category percentage: (category_spend / total_spend) * 100
  - Transaction count: COUNT(*)
  - Average transaction: AVG(amount)
```

### Trend Metrics
```
For user:
  - Rolling 30-day average: AVG(daily_spend, last 30 days)
  - Rolling 60-day average: AVG(daily_spend, last 60 days)
  - Rolling 90-day average: AVG(daily_spend, last 90 days)
  - MoM change: (this_month - last_month) / last_month * 100
  - YoY change: (this_year - last_year) / last_year * 100
```

### Budget Analysis
```
For each category:
  - Budget limit: From budgets table
  - Spent this month: SUM(amount) for category
  - Remaining: budget_limit - spent
  - Used percentage: (spent / budget_limit) * 100
  - Status: safe | warning | exceeded
```

### Insights to Generate

```
1. SPENDING_INCREASE
   "Your spending increased by 15% this month (£1,200 vs £1,040)"
   
2. SPENDING_DECREASE
   "You spent 8% less this month (£950 vs £1,030)"
   
3. TOP_CATEGORY
   "Your top spending category this month is Groceries (£420, 35%)"
   
4. SUBSCRIPTION_COST
   "You have 8 active subscriptions costing £215/month"
   
5. BUDGET_EXCEEDED
   "Your Dining budget exceeded by £45 (spent £295 of £250)"
   
6. BUDGET_REMAINING
   "You have £120 remaining in your Entertainment budget"
   
7. MERCHANT_SPIKE
   "Tesco spending increased 40% this month (£420 vs £300)"
   
8. CATEGORY_TREND
   "Your Transport spending is trending up (30-day avg: £85)"
```

## Services to Create

1. `analyticsService.ts` - Compute metrics
2. `insightsService.ts` - Generate insights
3. `analyticsWorker.ts` - Batch job to run nightly
