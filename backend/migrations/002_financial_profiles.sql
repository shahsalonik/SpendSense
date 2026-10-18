-- Run ONLY against DATABASE_URL (the existing financial database).
CREATE TABLE IF NOT EXISTS financial_profiles (
    user_id TEXT PRIMARY KEY,
    sample_data_created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
