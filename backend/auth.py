"""Opaque, revocable sessions. Only token hashes are stored in PostgreSQL."""
import hashlib
import hmac
import os
import secrets
from fastapi import HTTPException, Request
from auth_database import get_auth_connection

COOKIE = "spendsense_session"
SESSION_SECONDS = 60 * 60 * 24 * 7


def token_hash(token):
    return hashlib.sha256(token.encode()).hexdigest()


def hash_password(password):
    salt = secrets.token_bytes(16)
    derived = hashlib.scrypt(password.encode(), salt=salt, n=2**17, r=8, p=1, maxmem=256*1024*1024)
    return f"scrypt${salt.hex()}${derived.hex()}"


def verify_password(password, stored):
    try:
        algorithm, salt, expected = stored.split("$")
        if algorithm != "scrypt":
            return False
        derived = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt), n=2**17, r=8, p=1, maxmem=256*1024*1024)
        return hmac.compare_digest(derived.hex(), expected)
    except (ValueError, TypeError):
        return False


def require_proxy(request: Request):
    # Only the Next.js server knows this key; it validates browser origin first.
    expected = os.getenv("AUTH_PROXY_SECRET", "")
    if len(expected) < 32:
        raise HTTPException(503, "Authentication is not configured")
    if not hmac.compare_digest(request.headers.get("x-auth-proxy-secret", ""), expected):
        raise HTTPException(403, "Use the SpendSense application to access this endpoint")


def current_user(request: Request):
    require_proxy(request)
    token = request.cookies.get(COOKIE)
    if not token or len(token) > 256:
        raise HTTPException(401, "Please sign in")
    with get_auth_connection() as conn:
        row = conn.execute(
            "SELECT u.id, u.email FROM auth_sessions s JOIN auth_users u ON u.id=s.user_id "
            "WHERE s.token_hash=%s AND s.expires_at > NOW()", (token_hash(token),)
        ).fetchone()
    if not row:
        raise HTTPException(401, "Your session expired. Please sign in again.")
    return {"id": row[0], "email": row[1]}


def limit_attempts(action, identity, maximum=10):
    # DB-backed counters work across serverless instances. No raw email/IP stored.
    bucket = action + ':' + token_hash(identity)
    with get_auth_connection() as conn:
        conn.execute("DELETE FROM auth_rate_limits WHERE expires_at < NOW()")
        row = conn.execute(
            "INSERT INTO auth_rate_limits(bucket,attempts,expires_at) VALUES (%s,1,NOW()+INTERVAL '15 minutes') "
            "ON CONFLICT(bucket) DO UPDATE SET attempts=auth_rate_limits.attempts+1 RETURNING attempts",
            (bucket,)
        ).fetchone()
    if row[0] > maximum:
        raise HTTPException(429, "Too many attempts. Please try again in 15 minutes.")


def set_session(conn, response, user_id):
    token = secrets.token_urlsafe(32)
    conn.execute("DELETE FROM auth_sessions WHERE expires_at < NOW()")
    conn.execute("INSERT INTO auth_sessions VALUES (%s,%s,NOW()+INTERVAL '7 days')", (token_hash(token), user_id))
    response.set_cookie(COOKIE, token, max_age=SESSION_SECONDS, httponly=True,
                        secure=os.getenv("AUTH_COOKIE_SECURE", "true").lower() != "false",
                        samesite="lax", path="/")
