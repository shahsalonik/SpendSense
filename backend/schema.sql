CREATE TABLE IF NOT EXISTS transactions (
    transaction_date TIMESTAMPTZ NOT NULL,
    transaction_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    merchant_id TEXT NOT NULL,
    merchant TEXT NOT NULL,
    category TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    source TEXT NOT NULL DEFAULT 'nessie',
    PRIMARY KEY (transaction_id, transaction_date)
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_date
ON transactions (user_id, transaction_date DESC);

CREATE TABLE IF NOT EXISTS savings_goals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    target_amount NUMERIC(12, 2) NOT NULL,
    current_saved NUMERIC(12, 2) NOT NULL,
    deadline DATE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_savings_goals_user
ON savings_goals (user_id);