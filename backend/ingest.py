import json
from pathlib import Path
from datetime import datetime, timezone
from decimal import Decimal

from nessie import get_purchases
from database import get_connection

ids = json.loads(
    Path("nessie_ids.json").read_text()
)

USER_ID = "nessie-demo-user-1"

MERCHANTS = {
    ids["merchants"]["StreamFlix"]:
        ("StreamFlix", "Entertainment"),

    ids["merchants"]["MusicPlus"]:
        ("MusicPlus", "Entertainment"),

    ids["merchants"]["Campus Cafe"]:
        ("Campus Cafe", "Dining")
}


def parse_date(value):
    dt = datetime.fromisoformat(
        value.replace("Z", "+00:00")
    )

    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)

    return dt.astimezone(timezone.utc)


def sync_purchases():
    purchases = get_purchases(ids["account_id"])
    imported = 0

    with get_connection() as conn:
        with conn.cursor() as cur:
            for purchase in purchases:
                merchant_id = purchase["merchant_id"]

                merchant, category = MERCHANTS.get(
                    merchant_id,
                    ("Other", "Other")
                )

                transaction_id = (
                    purchase.get("_id")
                    or purchase.get("id")
                )

                date_value = (
                    purchase.get("purchase_date")
                    or purchase.get("transaction_date")
                )

                if not transaction_id or not date_value:
                    print("Skipping unrecognized record:", purchase)
                    continue

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
                    VALUES (%s, %s, %s, %s, %s, %s, %s, 'nessie')
                    ON CONFLICT DO NOTHING
                """, (
                    parse_date(date_value),
                    str(transaction_id),
                    USER_ID,
                    str(merchant_id),
                    merchant,
                    category,
                    Decimal(str(purchase["amount"]))
                ))

                imported += cur.rowcount

    return {
        "fetched": len(purchases),
        "imported": imported
    }


if __name__ == "__main__":
    print(sync_purchases())