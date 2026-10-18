
from fastapi import APIRouter, Depends, HTTPException

from auth import current_user

from analytics import (
    get_summary,
    get_subscriptions,
    get_insights,
)


router = APIRouter(prefix="/api")

# Every account-specific endpoint derives its identity from the session.


@router.post("/sync")
def sync(user=Depends(current_user)):
    raise HTTPException(403, "Bank sync is not available for sample accounts")


@router.get("/summary")
def summary(
    user=Depends(current_user)
):
    return get_summary(user["id"])


@router.get("/subscriptions")
def subscriptions(
    user=Depends(current_user)
):
    return {
        "subscriptions": get_subscriptions(user["id"])
    }


@router.get("/insights")
def insights(
    user=Depends(current_user)
):
    return get_insights(user["id"])
