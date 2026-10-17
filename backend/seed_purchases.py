import json
from pathlib import Path

from nessie import create_purchase

ids = json.loads(
    Path("nessie_ids.json").read_text()
)

account_id = ids["account_id"]
merchants = ids["merchants"]

purchases = [
    # StreamFlix: subscription price increase
    ("StreamFlix", 11.99, "2026-08-01"),
    ("StreamFlix", 11.99, "2026-09-01"),
    ("StreamFlix", 16.99, "2026-10-01"),

    # MusicPlus: stable subscription
    ("MusicPlus", 9.99, "2026-08-05"),
    ("MusicPlus", 9.99, "2026-09-05"),
    ("MusicPlus", 9.99, "2026-10-05"),

    # Dining: regular and unusually high spending
    ("Campus Cafe", 20.00, "2026-09-10"),
    ("Campus Cafe", 75.00, "2026-10-10")
]

for merchant_name, amount, date in purchases:
    merchant_id = merchants[merchant_name]

    result = create_purchase(
        account_id,
        merchant_id,
        amount,
        date
    )

    print(
        f"Created {merchant_name}: "
        f"${amount:.2f} on {date}"
    )
    print(result)