
from fastapi import APIRouter, Query

from analytics import (
    get_summary,
    get_subscriptions,
    get_insights,
)

from ingest import sync_purchases

router = APIRouter(prefix="/api")

# Development/demo user IDs only.
# This is not an authentication mechanism.


@router.post("/sync")
def sync():
    return sync_purchases()


@router.get("/summary")
def summary(
    user_id: str = Query(default="demo-user-1")
):
    return get_summary(user_id)


@router.get("/subscriptions")
def subscriptions(
    user_id: str = Query(default="demo-user-1")
):
    return {
        "subscriptions": get_subscriptions(user_id)
    }


@router.get("/insights")
def insights(
    user_id: str = Query(default="demo-user-1")
):
    return get_insights(user_id)