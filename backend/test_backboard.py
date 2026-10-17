import os
import requests
from dotenv import load_dotenv

load_dotenv()

URL = "https://app.backboard.io/api/threads/messages"

HEADERS = {
    "X-API-Key": os.environ["BACKBOARD_API_KEY"],
    "Content-Type": "application/json"
}

def send(content, assistant_id=None, thread_id=None):
    payload = {
        "content": content,
        "memory": "Auto",
        "stream": False
    }

    if assistant_id:
        payload["assistant_id"] = assistant_id

    if thread_id:
        payload["thread_id"] = thread_id

    response = requests.post(
        URL,
        headers=HEADERS,
        json=payload,
        timeout=90
    )

    response.raise_for_status()
    return response.json()

first = send(
    "Remember that I'm saving $2,000 "
    "for a vacation in December."
)

print("First response:", first)

second = send(
    "What goal am I saving for?",
    assistant_id=first["assistant_id"]
)

print("Second response:", second)