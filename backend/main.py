
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from finance_routes import router as finance_router
from agent_routes import router as agent_router
from goal_routes import router as goal_router

app = FastAPI(title="SpendSense API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Financial data endpoints
app.include_router(finance_router)

# Backboard AI chat endpoint
app.include_router(agent_router)

# saving goals endpoint 
app.include_router(goal_router)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/")
def root():
    return {
        "app": "SpendSense",
        "status": "running",
        "docs": "/docs",
    }
