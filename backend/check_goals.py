from database import get_connection

with get_connection() as conn:
    rows = conn.execute("""
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'savings_goals'
        ORDER BY ordinal_position
    """).fetchall()

    for row in rows:
        print(row)