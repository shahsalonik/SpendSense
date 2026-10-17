import os
import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("BACKBOARD_API_KEY")
ASSISTANT_ID = os.getenv("BACKBOARD_ASSISTANT_ID")
BASE_URL = "https://app.backboard.io/api"

if not API_KEY or not ASSISTANT_ID:
    raise ValueError("Missing Backboard credentials in .env")

headers = {
    "X-API-Key": API_KEY,
}

def create_thread():
    response = requests.post(
        f"{BASE_URL}/assistants/{ASSISTANT_ID}/threads",
        headers=headers,
        timeout=30,
    )
    response.raise_for_status()
    data = response.json()
    return data.get("thread_id") or data.get("id")


def send_message(thread_id, message):
    response = requests.post(
        f"{BASE_URL}/threads/{thread_id}/messages",
        headers=headers,
        data={
            "content": message,
            "memory": "Auto",
            "stream": "false",
        },
        timeout=60,
    )

    print("Status:", response.status_code)
    print("Response:", response.text[:3000])

    response.raise_for_status()
    return response.json()


print("=== Conversation 1: Save a goal ===")

thread_1 = create_thread()
print("Thread 1:", thread_1)

send_message(
    thread_1,
    "I'm saving $2,000 for a vacation by December. "
    "Please remember this goal.",
)

print("\n=== Conversation 2: Recall the goal ===")

thread_2 = create_thread()
print("Thread 2:", thread_2)

send_message(
    thread_2,
    "What am I saving for, how much do I need, "
    "and when is my deadline?",
)