"""Authentication storage is deliberately separate from financial storage."""
import os
import psycopg
from dotenv import load_dotenv

load_dotenv()


def get_auth_connection():
    url = os.getenv("AUTH_DATABASE_URL")
    if not url:
        raise RuntimeError("AUTH_DATABASE_URL is required")
    return psycopg.connect(url)
