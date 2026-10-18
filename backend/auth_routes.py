import os
import re
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, Field, field_validator
from auth_database import get_auth_connection
from auth import (COOKIE, current_user, hash_password, limit_attempts, require_proxy,
                  set_session, token_hash, verify_password)
from sample_data import ensure_sample_data

router = APIRouter(prefix="/api/auth", dependencies=[Depends(require_proxy)])


class EmailInput(BaseModel):
    email: str = Field(max_length=254)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value):
        value = value.strip().lower()
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", value):
            raise ValueError("Enter a valid email address")
        return value


class LoginInput(EmailInput):
    password: str = Field(min_length=1, max_length=128)


class SignupInput(EmailInput):
    password: str = Field(min_length=15, max_length=128)


def throttle(request, action, email):
    # This header is set by the trusted frontend proxy, never passed through from the browser.
    limit_attempts(action + ':ip', request.headers.get('x-client-ip', 'unknown'), 30)
    limit_attempts(action + ':email', email, 10)


@router.post("/signup")
def signup(data: SignupInput, request: Request, response: Response):
    throttle(request, 'signup', data.email)
    password_hash = hash_password(data.password)
    user = {"id": 'user:' + str(uuid4()), "email": data.email}
    with get_auth_connection() as conn:
        row = conn.execute(
            "INSERT INTO auth_users(id,email,password_hash) VALUES (%s,%s,%s) "
            "ON CONFLICT(email) DO NOTHING RETURNING id",
            (user['id'], data.email, password_hash)
        ).fetchone()
        if not row:
            raise HTTPException(400, "Unable to create an account with these details. Try signing in.")
        set_session(conn, response, user['id'])
    return {"user": user}


@router.post("/login")
def login(data: LoginInput, request: Request, response: Response):
    throttle(request, 'login', data.email)
    with get_auth_connection() as conn:
        row = conn.execute("SELECT id,email,password_hash FROM auth_users WHERE email=%s FOR UPDATE", (data.email,)).fetchone()
        # Do the same expensive hash work even when the email is unknown.
        if row:
            valid = verify_password(data.password, row[2])
        else:
            hash_password(data.password)
            valid = False
        if not valid:
            raise HTTPException(401, "Email or password is incorrect")
        set_session(conn, response, row[0])
    return {"user": {"id": row[0], "email": row[1]}}


@router.get("/me")
def me(user=Depends(current_user)):
    return {"user": user}


@router.post("/bootstrap")
def bootstrap(user=Depends(current_user)):
    ensure_sample_data(user['id'])
    return {"success": True}


@router.post("/logout")
def logout(request: Request, response: Response):
    token = request.cookies.get(COOKIE)
    if token:
        with get_auth_connection() as conn:
            conn.execute("DELETE FROM auth_sessions WHERE token_hash=%s", (token_hash(token),))
    response.delete_cookie(COOKIE, path="/", httponly=True, samesite="lax",
                           secure=os.getenv("AUTH_COOKIE_SECURE", "true").lower() != "false")
    return {"success": True}
