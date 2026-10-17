
from database import get_connection

with get_connection() as conn:
    rows = conn.execute("""
        SELECT user_id, name, target_amount, current_saved, deadline
        FROM savings_goals
    """).fetchall()

    for row in rows:
        print(row)

    print(f"Total goals: {len(rows)}")
