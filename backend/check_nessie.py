import json
from pathlib import Path

from nessie import get_purchases

ids = json.loads(
    Path("nessie_ids.json").read_text()
)

purchases = get_purchases(ids["account_id"])

print(json.dumps(purchases, indent=2))
print(f"\nNumber of purchases: {len(purchases)}")
