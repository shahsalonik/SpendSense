import os
import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("BACKBOARD_API_KEY")
BASE_URL = "https://app.backboard.io/api"

if not API_KEY:
    raise ValueError("Missing BACKBOARD_API_KEY")

instructions = """
You are SpendSense, an AI-powered personal finance assistant.

Your responsibilities:
1. Help users understand their spending habits.
2. Explain recurring subscriptions and price increases.
3. Help users set realistic savings goals.
4. Remember important user preferences and financial goals.
5. Give actionable, personalized financial suggestions.

Important rules:
- Never invent transaction amounts or financial data.
- Only reference financial information provided by the backend.
- Clearly distinguish confirmed spending data from estimates.
- Explain how subscription price increases affect savings goals.
- Be supportive, concise, and practical.
- Do not claim that a subscription has been canceled unless confirmed.

When a user mentions a savings goal, remember:
- What they are saving for
- Their target amount
- Their deadline
"""

response = requests.post(
    f"{BASE_URL}/assistants",
    headers={
        "X-API-Key": API_KEY,
        "Content-Type": "application/json",
    },
    json={
        "name": "SpendSense Financial Assistant",
        "description": "AI financial coach with persistent memory",
        "system_prompt": instructions,
    },
    timeout=30,
)

print("Status:", response.status_code)
print("Response:", response.text[:3000])

if response.ok:
    data = response.json()
    assistant_id = data.get("assistant_id") or data.get("id")

    if assistant_id:
        print("\nAssistant created successfully!")
        print("Assistant ID:", assistant_id)