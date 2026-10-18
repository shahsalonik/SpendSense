"""Explicit, additive migrations; never run automatically on app startup."""
from pathlib import Path
from auth_database import get_auth_connection
from database import get_connection

if __name__ == "__main__":
    root = Path(__file__).parent / "migrations"
    with get_auth_connection() as conn:
        conn.execute((root / "001_auth.sql").read_text())
    with get_connection() as conn:
        conn.execute((root / "002_financial_profiles.sql").read_text())
    print("Authentication and financial profile tables ready.")
