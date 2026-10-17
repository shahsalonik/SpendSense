
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from agent import send_chat_message

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
    message: str
    assistant_id: str | None = None
    thread_id: str | None = None
    context: FinancialContext = Field(default_factory=FinancialContext)


class ChatResponse(BaseModel):
    reply: str
    assistant_id: str
    thread_id: str
    goal_to_create: dict | None = None


@router.post("/api/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    try:
        return send_chat_message(
            message=request.message,
            thread_id=request.thread_id,
            context=request.context.model_dump(),
        )
    except Exception as e:
        print(f"Backboard error: {e}")
        raise HTTPException(
            status_code=502,
            detail="Unable to get a response from the AI assistant",
        )
