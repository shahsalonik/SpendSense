
from database import get_connection

with get_connection() as conn:
    with conn.cursor() as cur:
        cur.execute("""
            CREATE EXTENSION IF NOT EXISTS timescaledb;
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS transactions (
                transaction_date TIMESTAMPTZ NOT NULL,
                transaction_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                merchant_id TEXT NOT NULL,
                merchant TEXT NOT NULL,
                category TEXT NOT NULL,
                amount NUMERIC(12,2) NOT NULL,
                source TEXT NOT NULL,
                PRIMARY KEY (
                    transaction_id,
                    transaction_date
                )
            );
        """)

        cur.execute("""
            SELECT create_hypertable(
                'transactions',
                'transaction_date',
                migrate_data => TRUE,
                if_not_exists => TRUE
            );
        """)

print("Database ready!")