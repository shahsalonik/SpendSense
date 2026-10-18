from datetime import datetime, timezone
from database import get_connection


def ensure_sample_data(user_id):
    """Seed once, atomically, without copying any existing user's records."""
    now = datetime.now(timezone.utc)
    with get_connection() as conn:
        created = conn.execute(
            "INSERT INTO financial_profiles(user_id) VALUES (%s) "
            "ON CONFLICT DO NOTHING RETURNING user_id", (user_id,)
        ).fetchone()
        if not created:
            return
        for months_ago in (2, 1, 0):
            month_index = now.year * 12 + now.month - 1 - months_ago
            when = datetime(month_index // 12, month_index % 12 + 1, 1, tzinfo=timezone.utc)
            for merchant, amount in (("StreamFlix", 16.99 if months_ago == 0 else 11.99), ("MusicPlus", 9.99)):
                conn.execute(
                    "INSERT INTO transactions (transaction_date,transaction_id,user_id,merchant_id,merchant,category,amount,source) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
                    (when, f"sample:{user_id}:{merchant}:{months_ago}", user_id,
                     merchant.lower(), merchant, "Entertainment", amount, "sample")
                )
        conn.execute(
            "INSERT INTO transactions (transaction_date,transaction_id,user_id,merchant_id,merchant,category,amount,source) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
            (now.replace(day=1), f"sample:{user_id}:dining", user_id,
             "campus-cafe", "Campus Cafe", "Dining", 75, "sample")
        )
