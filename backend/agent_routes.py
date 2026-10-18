
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from agent import send_chat_message
from auth import current_user, limit_attempts
from chat_accounts import owned_assistant, save_thread
from analytics import get_goals, get_subscriptions, get_summary

router = APIRouter()


class SavingsGoal(BaseModel):
    id: str
    name: str
    target_amount: float
    current_saved: float
    deadline: str


class Subscription(BaseModel):
    merchant: str
    previous_amount: float
    current_amount: float
    monthly_increase: float
    price_increased: bool

class SpendingCategory(BaseModel):
    category: str
    amount: float

class SpendingSummary(BaseModel):
    categories: list[SpendingCategory] = Field(default_factory=list)

class FinancialContext(BaseModel):
    goals: list[SavingsGoal] = Field(default_factory=list)
    subscriptions: list[Subscription] = Field(default_factory=list)
    spending: SpendingSummary = Field(default_factory=SpendingSummary)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=10000)
    assistant_id: str | None = None
    thread_id: str | None = None
    context: FinancialContext = Field(default_factory=FinancialContext)


class ChatResponse(BaseModel):
    reply: str
    assistant_id: str
    thread_id: str
    goal_to_create: dict | None = None


@router.post("/api/chat", response_model=ChatResponse)
def chat(request: ChatRequest, user=Depends(current_user)):
    limit_attempts("chat", user["id"], 30)
    try:
        assistant_id = owned_assistant(user["id"], request.thread_id)
        result = send_chat_message(
            message=request.message,
            thread_id=request.thread_id,
            assistant_id=assistant_id,
            context={
                "goals": get_goals(user["id"]),
                "subscriptions": get_subscriptions(user["id"]),
                "spending": get_summary(user["id"]),
            },
        )
        save_thread(user["id"], result["thread_id"])
        return result
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(502, "Unable to get a response from the AI assistant")
