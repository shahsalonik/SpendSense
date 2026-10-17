import os
import requests
from dotenv import load_dotenv

load_dotenv()

BASE_URL = "https://app.backboard.io/api"
API_KEY = os.getenv("BACKBOARD_API_KEY")
ASSISTANT_ID = os.getenv("BACKBOARD_ASSISTANT_ID")

if not API_KEY or not ASSISTANT_ID:
    raise RuntimeError("Missing Backboard credentials")


def send_chat_message(message: str, thread_id: str | None = None):
    headers = {"X-API-Key": API_KEY}

    # Create a new conversation if one wasn't supplied
    if not thread_id:
        response = requests.post(
            f"{BASE_URL}/assistants/{ASSISTANT_ID}/threads",
            headers=headers,
            timeout=30,
        )
        response.raise_for_status()

        data = response.json()
        thread_id = data.get("thread_id") or data.get("id")

        if not thread_id:
            raise ValueError("Backboard did not return a thread ID")

    # Send the user's message
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
    response.raise_for_status()

    data = response.json()

    # Extract the assistant's response
    reply = data.get("content") or data.get("message")

    if isinstance(reply, dict):
        reply = reply.get("content")

    if not isinstance(reply, str):
        raise ValueError(f"Unexpected Backboard response: {data}")

    return {
        "reply": reply,
        "assistant_id": ASSISTANT_ID,
        "thread_id": thread_id,
    }