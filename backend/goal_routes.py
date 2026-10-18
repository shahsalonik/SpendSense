
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from datetime import date

from auth import current_user

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
    user=Depends(current_user)
):
    return create_goal(user["id"], goal)


@router.get("/goals")
def api_goals(user=Depends(current_user)):
    return {"goals": get_goals(user["id"])}


@router.delete("/goals/{goal_id}")
def api_delete_goal(
    goal_id: str,
    user=Depends(current_user)
):
    return delete_goal(user["id"], goal_id)
