CREATE TABLE IF NOT EXISTS savings_goals (
    user_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    target_amount NUMERIC(12,2) NOT NULL,
    current_saved NUMERIC(12,2) NOT NULL,
    deadline DATE NOT NULL
);