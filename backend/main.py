from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from finance_routes import router as finance_router 

app = FastAPI(title="SpendSense API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(finance_router)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/")
def root():
    return {
        "app": "SpendSense",
        "status": "running",
        "docs": "/docs"
    }


from analytics import (
    get_summary,
    get_subscriptions,
    get_insights,
)

@app.get("/api/summary")
def summary():
    return get_summary()

@app.get("/api/subscriptions")
def subscriptions():
    return {"subscriptions": get_subscriptions()}

@app.get("/api/insights")
def insights():
    return get_insights()