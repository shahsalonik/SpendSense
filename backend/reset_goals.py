
from database import get_connection

with get_connection() as conn:
    conn.execute("""
        DROP TABLE IF EXISTS savings_goals;

        CREATE TABLE savings_goals (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            name TEXT NOT NULL,
            target_amount NUMERIC(12, 2) NOT NULL,
            current_saved NUMERIC(12, 2) NOT NULL,
            deadline DATE NOT NULL
        );

        CREATE INDEX idx_savings_goals_user
        ON savings_goals (user_id);
    """)

print("Savings goals table reset successfully!")
