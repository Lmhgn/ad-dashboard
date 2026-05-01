-- ============================================================================
-- SPEND ANALYTICS DASHBOARD - DATABASE SCHEMA
-- PostgreSQL 14+
-- ============================================================================

-- ============================================================================
-- 1. USERS TABLE
-- ============================================================================

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'GBP',
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    subscription_tier VARCHAR(50) NOT NULL DEFAULT 'free',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CHECK (subscription_tier IN ('free', 'basic', 'premium'))
);

CREATE INDEX idx_users_email ON users(email);

-- ============================================================================
-- 2. MERCHANTS TABLE
-- ============================================================================

CREATE TABLE merchants (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_name VARCHAR(255) NOT NULL,
    normalized_name VARCHAR(255) NOT NULL,
    merchant_id_external VARCHAR(255),
    logo_url VARCHAR(500),
    website VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, normalized_name)
);

CREATE INDEX idx_merchants_user_id ON merchants(user_id);
CREATE INDEX idx_merchants_normalized_name ON merchants(normalized_name);

-- ============================================================================
-- 3. CATEGORIES TABLE
-- ============================================================================

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) NOT NULL DEFAULT '#6B7280',
    icon VARCHAR(50),
    parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_name ON categories(name);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);

-- ============================================================================
-- 4. TRANSACTIONS TABLE (Core Fact Table)
-- ============================================================================

CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    merchant_id INTEGER REFERENCES merchants(id) ON DELETE SET NULL,
    original_merchant_name VARCHAR(255) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'GBP',
    transaction_date DATE NOT NULL,
    posted_date DATE NOT NULL,
    external_id VARCHAR(255),
    description TEXT,
    transaction_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'raw',
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, external_id),
    CHECK (status IN ('raw', 'processing', 'processed', 'error')),
    CHECK (transaction_type IN ('debit', 'credit', 'transfer')),
    CHECK (amount > 0)
);

CREATE INDEX idx_transactions_user_id_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX idx_transactions_user_id_status ON transactions(user_id, status);
CREATE INDEX idx_transactions_merchant_id ON transactions(merchant_id);
CREATE INDEX idx_transactions_external_id ON transactions(user_id, external_id);
CREATE INDEX idx_transactions_posted_date ON transactions(posted_date);

-- ============================================================================
-- 5. TRANSACTION CATEGORIES TABLE (Join Table)
-- ============================================================================

CREATE TABLE transaction_categories (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    confidence DECIMAL(3, 2) NOT NULL DEFAULT 1.00,
    is_manual_override BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(transaction_id, category_id),
    CHECK (confidence >= 0 AND confidence <= 1)
);

CREATE INDEX idx_transaction_categories_transaction_id ON transaction_categories(transaction_id);
CREATE INDEX idx_transaction_categories_category_id ON transaction_categories(category_id);

-- ============================================================================
-- 6. SUBSCRIPTIONS TABLE
-- ============================================================================

CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    merchant_id INTEGER NOT NULL REFERENCES merchants(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'GBP',
    frequency VARCHAR(50) NOT NULL,
    next_occurrence_date DATE NOT NULL,
    last_transaction_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    detected_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'annual')),
    CHECK (amount > 0)
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_merchant_id ON subscriptions(merchant_id);
CREATE INDEX idx_subscriptions_is_active ON subscriptions(is_active);

-- ============================================================================
-- 7. BUDGETS TABLE
-- ============================================================================

CREATE TABLE budgets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'GBP',
    period VARCHAR(50) NOT NULL DEFAULT 'monthly',
    month_year DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, category_id, month_year),
    CHECK (amount > 0),
    CHECK (period IN ('weekly', 'monthly', 'quarterly', 'annual'))
);

CREATE INDEX idx_budgets_user_id_month_year ON budgets(user_id, month_year);

-- ============================================================================
-- 8. INSIGHTS TABLE (Denormalized for fast reads)
-- ============================================================================

CREATE TABLE insights (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    insight_type VARCHAR(100) NOT NULL,
    insight_text TEXT NOT NULL,
    metric_value DECIMAL(15, 2),
    metric_name VARCHAR(100),
    category_id INTEGER REFERENCES categories(id),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    confidence DECIMAL(3, 2) NOT NULL DEFAULT 1.00,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CHECK (insight_type IN (
        'spending_increase',
        'spending_decrease',
        'top_category',
        'subscription_cost',
        'budget_exceeded',
        'budget_remaining',
        'merchant_spike',
        'category_trend'
    ))
);

CREATE INDEX idx_insights_user_id_created_at ON insights(user_id, created_at DESC);
CREATE INDEX idx_insights_user_id_period ON insights(user_id, period_start, period_end);
CREATE INDEX idx_insights_insight_type ON insights(user_id, insight_type);

-- ============================================================================
-- 9. AUDIT LOGS TABLE
-- ============================================================================

CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id_created_at ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- ============================================================================
-- 10. SEED DEFAULT CATEGORIES
-- ============================================================================

INSERT INTO categories (name, description, color, icon) VALUES
    ('Groceries', 'Food and groceries', '#10B981', 'shopping-bag'),
    ('Transport', 'Public transport, taxi, fuel', '#3B82F6', 'car'),
    ('Entertainment', 'Movies, games, hobbies', '#F59E0B', 'star'),
    ('Utilities', 'Water, gas, electricity', '#8B5CF6', 'zap'),
    ('Healthcare', 'Medical, prescriptions, fitness', '#EC4899', 'heart'),
    ('Dining', 'Restaurants and cafes', '#F97316', 'utensils'),
    ('Shopping', 'Clothing, home, general retail', '#06B6D4', 'shopping-cart'),
    ('Subscriptions', 'Streaming, software, membership', '#6366F1', 'repeat'),
    ('Travel', 'Hotels, flights, vacation', '#14B8A6', 'plane'),
    ('Personal Care', 'Hair, beauty, wellness', '#EC4899', 'sparkles'),
    ('Financial Charges', 'Fees, interest, transfers', '#6B7280', 'credit-card'),
    ('Work', 'Business, professional services', '#4F46E5', 'briefcase'),
    ('Education', 'Courses, books, tuition', '#0EA5E9', 'book-open'),
    ('Gifts & Donations', 'Gifts, charity, transfers', '#D946EF', 'gift'),
    ('Uncategorized', 'Transactions awaiting categorization', '#9CA3AF', 'question-mark')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 11. HELPER VIEWS
-- ============================================================================

-- Daily spend by category
CREATE OR REPLACE VIEW daily_spend_by_category AS
SELECT
    t.user_id,
    t.transaction_date,
    c.name as category_name,
    c.id as category_id,
    SUM(t.amount) as total_amount,
    COUNT(t.id) as transaction_count
FROM transactions t
LEFT JOIN transaction_categories tc ON t.id = tc.transaction_id
LEFT JOIN categories c ON tc.category_id = c.id
WHERE t.status = 'processed' AND t.transaction_type = 'debit'
GROUP BY t.user_id, t.transaction_date, c.id, c.name;

-- Monthly spend summary
CREATE OR REPLACE VIEW monthly_spend_summary AS
SELECT
    t.user_id,
    DATE_TRUNC('month', t.transaction_date)::DATE as month,
    c.name as category_name,
    c.id as category_id,
    SUM(t.amount) as total_amount,
    AVG(t.amount) as avg_amount,
    COUNT(t.id) as transaction_count
FROM transactions t
LEFT JOIN transaction_categories tc ON t.id = tc.transaction_id
LEFT JOIN categories c ON tc.category_id = c.id
WHERE t.status = 'processed' AND t.transaction_type = 'debit'
GROUP BY t.user_id, DATE_TRUNC('month', t.transaction_date), c.id, c.name;

-- ============================================================================
-- 12. COMMENTS FOR CLARITY
-- ============================================================================

COMMENT ON TABLE transactions IS 'Core immutable transaction log. All transactions append-only, never updated.';
COMMENT ON COLUMN transactions.status IS 'raw: just imported, processing: being categorized, processed: ready for analytics, error: failed processing';
COMMENT ON COLUMN transactions.external_id IS 'ID from source system (e.g., Plaid transaction_id) for idempotent inserts';
COMMENT ON TABLE transaction_categories IS 'Join table supporting multiple categories per transaction with confidence scoring';
COMMENT ON TABLE subscriptions IS 'Detected recurring transactions. Identified by pattern analysis in batch process.';
COMMENT ON TABLE insights IS 'Pre-computed metrics and insights. Generated nightly for fast dashboard loads.';

-- ============================================================================
-- EOF
-- ============================================================================
