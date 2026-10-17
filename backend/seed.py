
from datetime import datetime, timezone
from decimal import Decimal

from database import get_connection

USER = "demo-user-1"

transactions = [
    ("t1", "streamflix", "StreamFlix", "Entertainment", "2026-08-01", 11.99),
    ("t2", "streamflix", "StreamFlix", "Entertainment", "2026-09-01", 11.99),
    ("t3", "streamflix", "StreamFlix", "Entertainment", "2026-10-01", 16.99),

    ("t4", "musicplus", "MusicPlus", "Entertainment", "2026-08-05", 9.99),
    ("t5", "musicplus", "MusicPlus", "Entertainment", "2026-09-05", 9.99),
    ("t6", "musicplus", "MusicPlus", "Entertainment", "2026-10-05", 9.99),

    ("t7", "campus-cafe", "Campus Cafe", "Dining", "2026-09-10", 20.00),
    ("t8", "campus-cafe", "Campus Cafe", "Dining", "2026-10-10", 75.00),
]

with get_connection() as conn:
    with conn.cursor() as cur:
        for tx_id, merchant_id, merchant, category, date, amount in transactions:
            transaction_date = datetime.fromisoformat(date).replace(
                tzinfo=timezone.utc
            )

            cur.execute("""
                INSERT INTO transactions (
                    transaction_date,
                    transaction_id,
                    user_id,
                    merchant_id,
                    merchant,
                    category,
                    amount,
                    source
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT DO NOTHING
            """, (
                transaction_date,
                tx_id,
                USER,
                merchant_id,
                merchant,
                category,
                Decimal(str(amount)),
                "demo"
            ))

print("Seed transactions inserted!")