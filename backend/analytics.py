from collections import defaultdict
from database import get_connection




def get_subscriptions(user_id="demo-user-1"):
    from collections import defaultdict

    with get_connection() as conn:
        rows = conn.execute("""
            SELECT merchant, amount, transaction_date
            FROM transactions
            WHERE user_id = %s
            ORDER BY merchant, transaction_date
        """, (user_id,)).fetchall()

    print("DEBUG: transaction rows =", rows)

    grouped = defaultdict(list)

    for merchant, amount, date in rows:
        grouped[merchant].append((float(amount), date))

    results = []

    for merchant, payments in grouped.items():
        print(f"DEBUG: {merchant}: {payments}")

        if len(payments) < 3:
            print(f"DEBUG: Skipping {merchant}: fewer than 3 payments")
            continue

        intervals = [
            (payments[i][1] - payments[i-1][1]).days
            for i in range(1, len(payments))
        ]

        print(f"DEBUG: {merchant} intervals = {intervals}")

        monthly = all(25 <= days <= 35 for days in intervals)

        if not monthly:
            print(f"DEBUG: Skipping {merchant}: not monthly")
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

    print("DEBUG: subscription results =", results)
    return results


def get_summary(user_id="demo-user-1"):
    with get_connection() as conn:
        rows = conn.execute("""
            SELECT category, SUM(amount)
            FROM transactions
            WHERE user_id = %s
            AND transaction_date >=
                date_trunc('month', NOW())
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


def get_insights(user_id="demo-user-1"):
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