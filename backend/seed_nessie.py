import json
from pathlib import Path

from nessie import (
    create_customer,
    create_merchant,
    create_account
)

ID_FILE = Path("nessie_ids.json")


def extract_id(result):
    """Handle common Nessie creation response formats."""
    if not isinstance(result, dict):
        return None

    # Some responses wrap the created object.
    if isinstance(result.get("objectCreated"), dict):
        return result["objectCreated"].get("_id")

    return result.get("_id")


def main():
    # 1. Create merchants.
    merchants = [
        ("StreamFlix", "Entertainment"),
        ("MusicPlus", "Entertainment"),
        ("Campus Cafe", "Dining")
    ]

    merchant_ids = {}

    for name, category in merchants:
        result = create_merchant(name, category)
        print(f"\nMerchant response for {name}: {result}")

        merchant_id = extract_id(result)

        if not merchant_id:
            raise RuntimeError(
                f"Could not extract ID for {name}. "
                "Inspect the response above."
            )

        merchant_ids[name] = merchant_id

    # 2. Create the demo customer.
    customer_result = create_customer()
    print("\nCustomer response:", customer_result)

    customer_id = extract_id(customer_result)

    if not customer_id:
        raise RuntimeError(
            "Could not extract customer ID."
        )

    # 3. Create a checking account for that customer.
    account_result = create_account(customer_id)
    print("\nAccount response:", account_result)

    account_id = extract_id(account_result)

    if not account_id:
        raise RuntimeError(
            "Could not extract account ID."
        )

    # 4. Save IDs for later scripts.
    ids = {
        "customer_id": customer_id,
        "account_id": account_id,
        "merchants": merchant_ids
    }

    ID_FILE.write_text(json.dumps(ids, indent=2))

    print("\nSuccessfully created demo records!")
    print(json.dumps(ids, indent=2))
    print(f"\nIDs saved to {ID_FILE}")


if __name__ == "__main__":
    main()