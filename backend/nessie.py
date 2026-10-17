import os
import requests
from dotenv import load_dotenv

load_dotenv()

BASE = os.getenv(
    "NESSIE_BASE_URL",
    "https://api.nessieisreal.com"
)

KEY = os.environ["NESSIE_API_KEY"]

def nessie_request(method, path, data=None):
    response = requests.request(
        method,
        f"{BASE}{path}",
        params={"key": KEY},
        json=data,
        timeout=30
    )

    response.raise_for_status()
    return response.json()

def create_customer():
    payload = {
        "first_name": "Demo",
        "last_name": "User",
        "address": {
            "street_number": "123",
            "street_name": "Main St",
            "city": "College Park",
            "state": "MD",
            "zip": "20740"
        }
    }

    return nessie_request("POST", "/customers", payload)


def create_merchant(name, category):
    payload = {
        "name": name,
        "category": category,
        "address": {
            "street_number": "456",
            "street_name": "University Blvd",
            "city": "College Park",
            "state": "MD",
            "zip": "20740"
        },
        "geocode": {
            "lat": 38.9869,
            "lng": -76.9426
        }
    }

    return nessie_request("POST", "/merchants", payload)


def create_account(customer_id):
    payload = {
        "type": "Checking",
        "nickname": "SpendSense Checking",
        "rewards": 0,
        "balance": 2500.00
    }

    return nessie_request(
        "POST",
        f"/customers/{customer_id}/accounts",
        payload
    )

def create_purchase(account_id, merchant_id,
                    amount, purchase_date):
    payload = {
        "merchant_id": merchant_id,
        "medium": "balance",
        "purchase_date": purchase_date,
        "amount": amount,
        "status": "completed",
        "description": "SpendSense demo purchase"
    }

    return nessie_request(
        "POST",
        f"/accounts/{account_id}/purchases",
        payload
    )

def get_accounts():
    return nessie_request("GET", "/accounts")

def get_purchases(account_id):
    return nessie_request(
        "GET",
        f"/accounts/{account_id}/purchases"
    )

def get_customers():
    return nessie_request("GET", "/customers")


def get_merchants():
    return nessie_request("GET", "/merchants")


    