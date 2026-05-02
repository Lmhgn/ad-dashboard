# PHASE 2: Data Processing - Implementation Plan

## Goals

1. **Merchant Normalization** - Deduplicate merchants using fuzzy matching
2. **Categorization Engine** - Assign categories to transactions (rule-based)
3. **Subscription Detection** - Identify recurring transactions
4. **Batch Processing** - Update transaction status to 'processed'

## Processing Pipeline

```
Raw Transactions (status='raw')
    ↓
Step 1: Merchant Normalization
  • Fuzzy match merchant names
  • Create deduplicated merchant records
  • Update transaction.merchant_id
    ↓
Step 2: Categorization
  • Apply categorization rules
  • Assign categories with confidence scores
  • Handle edge cases (multi-category)
    ↓
Step 3: Subscription Detection
  • Analyze recurring patterns (same amount + merchant)
  • Identify monthly/annual subscriptions
  • Create subscription records
    ↓
Step 4: Mark as Processed
  • Update status from 'raw' → 'processed'
  • Update timestamps
    ↓
Processed Transactions (ready for analytics in PHASE 3)
```

## Processing Logic

### Merchant Normalization

**Matching Strategy:**
```
1. Exact match (case-insensitive)
   "TESCO" == "tesco" == "Tesco" → Same merchant

2. Fuzzy match (Levenshtein distance < 2)
   "Tesco Grocery" ~= "Tesco Store" → Same merchant

3. Keyword matching
   Contains "Tesco" → Tesco merchant
   Contains "Costa" → Costa merchant
```

**Example:**
```
Input: "TESCO SUPERMARKET"
Normalized: "tesco"
Found Match: "tesco" (distance=1)
Result: merchant_id = 42
```

### Categorization Engine

**Rule-Based Rules:**
```
IF merchant_name CONTAINS "netflix" OR "spotify" OR "amazon prime"
   THEN category = "Subscriptions" (confidence=0.99)

IF merchant_name CONTAINS "tesco" OR "sainsbury" OR "waitrose"
   THEN category = "Groceries" (confidence=0.95)

IF merchant_name CONTAINS "uber" OR "lyft" OR "tfl" OR "rail"
   THEN category = "Transport" (confidence=0.95)

IF merchant_name CONTAINS "costa" OR "starbucks" OR "pret"
   THEN category = "Dining" (confidence=0.90)

IF merchant_name CONTAINS "boots" OR "gym" OR "doctor"
   THEN category = "Healthcare" (confidence=0.85)
```

**Multi-Category Support:**
```
"Tesco Fuel" → Groceries (0.80) + Shopping (0.15)
"Waitrose Flowers" → Groceries (0.70) + Gifts (0.25)
```

### Subscription Detection

**Algorithm:**
```
For each user:
  For each merchant:
    Get all transactions in last 90 days
    
    If transaction_count >= 3 AND
       amount_variance < 15% AND
       frequency is regular (monthly/weekly/etc):
      
      → Create subscription record
      → Calculate next_occurrence_date
      → Estimate annual_cost
```

**Example:**
```
Transactions:
- 2024-01-07: Netflix £12.99
- 2024-02-07: Netflix £12.99
- 2024-03-07: Netflix £12.99

Pattern: Same day every month, same amount
Result: Subscription detected
  Name: Netflix
  Frequency: monthly
  Amount: £12.99
  Next charge: 2024-04-07
  Annual cost: £155.88
```

## Services to Create

1. `categorizationService.ts` - Rule-based categorization
2. `merchantService.ts` - Merchant normalization + fuzzy matching
3. `subscriptionService.ts` - Subscription detection
4. `processingWorker.ts` - Batch job to run all three
