
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from goal_pacing import goal_with_pace
from datetime import date

from auth import current_user

from analytics import get_goals, create_goal, delete_goal

router = APIRouter(prefix="/api")


class SavingsGoal(BaseModel):
    name: str
    target_amount: float
    current_saved: float = 0
    deadline: date
    as_of: date | None = None


@router.post("/goals")
def api_create_goal(
    goal: SavingsGoal,
    user=Depends(current_user)
):
    result = create_goal(user["id"], goal)
    saved = {**goal.model_dump(exclude={"as_of"}), "id": result["id"], "deadline": goal.deadline.isoformat()}
    return {**result, "goal": goal_with_pace(saved, goal.as_of)}


@router.get("/goals")
def api_goals(as_of: date | None = None, user=Depends(current_user)):
    today = as_of or date.today()
    return {"goals": [goal_with_pace(goal, today) for goal in get_goals(user["id"])]}


@router.delete("/goals/{goal_id}")
def api_delete_goal(
    goal_id: str,
    user=Depends(current_user)
):
    return delete_goal(user["id"], goal_id)
