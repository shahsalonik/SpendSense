import requests
from fastapi import HTTPException
from auth_database import get_auth_connection
from agent import BASE_URL, API_KEY


def owned_assistant(user_id, thread_id=None):
    with get_auth_connection() as conn:
        # Serialize first-assistant creation for simultaneous chats from one account.
        row = conn.execute("SELECT assistant_id FROM auth_users WHERE id=%s FOR UPDATE", (user_id,)).fetchone()
        if not row:
            raise HTTPException(401, "Please sign in")
        if thread_id:
            owned = conn.execute("SELECT 1 FROM auth_chat_threads WHERE thread_id=%s AND user_id=%s", (thread_id, user_id)).fetchone()
            if not owned or not row[0]:
                raise HTTPException(404, "Conversation not found")
        if row[0]:
            return row[0]
        response = requests.post(f"{BASE_URL}/assistants", headers={"X-API-Key": API_KEY}, json={
            "name": "SpendSense Personal Assistant",
            "description": "Private financial coach for one SpendSense account",
            "system_prompt": "You are SpendSense, a concise financial coach. Use only supplied financial data. Distinguish potential savings from saved money. Follow the dashboard's goal action protocol."
        }, timeout=30)
        response.raise_for_status()
        result = response.json()
        assistant_id = result.get('assistant_id') or result.get('id')
        if not isinstance(assistant_id, str) or not assistant_id:
            raise ValueError('Missing assistant ID')
        conn.execute("UPDATE auth_users SET assistant_id=%s WHERE id=%s", (assistant_id, user_id))
        return assistant_id


def save_thread(user_id, thread_id):
    with get_auth_connection() as conn:
        conn.execute("INSERT INTO auth_chat_threads(thread_id,user_id) VALUES (%s,%s) ON CONFLICT DO NOTHING", (thread_id, user_id))
