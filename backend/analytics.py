
from collections import defaultdict
from database import get_connection
from uuid import uuid4


def get_subscriptions(user_id):
    with get_connection() as conn:
        rows = conn.execute("""
            SELECT merchant, amount, transaction_date
            FROM transactions
            WHERE user_id = %s
            ORDER BY merchant, transaction_date
        """, (user_id,)).fetchall()


    grouped = defaultdict(list)

    for merchant, amount, date in rows:
        grouped[merchant].append((float(amount), date))

    results = []

    for merchant, payments in grouped.items():

        if len(payments) < 3:
            continue

        intervals = [
            (payments[i][1] - payments[i - 1][1]).days
            for i in range(1, len(payments))
        ]


        monthly = all(25 <= days <= 35 for days in intervals)

        if not monthly:
            continue

        previous = payments[-2][0]
        current = payments[-1][0]

        results.append({
            "merchant": merchant,
            "previous_amount": previous,
            "current_amount": current,
            "monthly_increase": round(current - previous, 2),
            "price_increased": current > previous
        })

    return results


def get_summary(user_id):
    with get_connection() as conn:
        rows = conn.execute("""
            SELECT category, SUM(amount)
            FROM transactions
            WHERE user_id = %s
            AND transaction_date >= date_trunc('month', NOW())
            GROUP BY category
            ORDER BY SUM(amount) DESC
        """, (user_id,)).fetchall()

    return {
        "categories": [
            {
                "category": category,
                "amount": float(amount)
            }
            for category, amount in rows
        ]
    }


def get_insights(user_id):
    return {
        "insights": [
            {
                "type": "subscription_increase",
                **subscription
            }
            for subscription in get_subscriptions(user_id)
            if subscription["price_increased"]
        ]
    }


def get_goals(user_id):
    with get_connection() as conn:
        rows = conn.execute("""
            SELECT id, name, target_amount, current_saved, deadline
            FROM savings_goals
            WHERE user_id = %s
            ORDER BY deadline
        """, (user_id,)).fetchall()

    return [
        {
            "id": row[0],
            "name": row[1],
            "target_amount": float(row[2]),
            "current_saved": float(row[3]),
            "deadline": row[4].isoformat(),
        }
        for row in rows
    ]


def create_goal(user_id, goal):
    goal_id = str(uuid4())

    with get_connection() as conn:
        conn.execute("""
            INSERT INTO savings_goals (
                id, user_id, name, target_amount,
                current_saved, deadline
            )
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            goal_id,
            user_id,
            goal.name,
            goal.target_amount,
            goal.current_saved,
            goal.deadline
        ))

    return {
        "success": True,
        "id": goal_id
    }


def delete_goal(user_id, goal_id):
    with get_connection() as conn:
        result = conn.execute("""
            DELETE FROM savings_goals
            WHERE user_id = %s AND id = %s
        """, (user_id, goal_id))

    return {
        "success": result.rowcount > 0
    }
