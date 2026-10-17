
from fastapi import APIRouter, Query
from pydantic import BaseModel
from datetime import date

from analytics import get_goals, create_goal, delete_goal

router = APIRouter(prefix="/api")


class SavingsGoal(BaseModel):
    name: str
    target_amount: float
    current_saved: float = 0
    deadline: date


@router.post("/goals")
def api_create_goal(
    goal: SavingsGoal,
    user_id: str = Query(default="demo-user-1")
):
    return create_goal(user_id, goal)


@router.get("/goals")
def api_goals(user_id: str = Query(default="demo-user-1")):
    return {"goals": get_goals(user_id)}


@router.delete("/goals/{goal_id}")
def api_delete_goal(
    goal_id: str,
    user_id: str = Query(default="demo-user-1")
):
    return delete_goal(user_id, goal_id)