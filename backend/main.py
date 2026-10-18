
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from auth_routes import router as auth_router
from fastapi.middleware.cors import CORSMiddleware

from finance_routes import router as finance_router
from agent_routes import router as agent_router
from goal_routes import router as goal_router

app = FastAPI(title="SpendSense API")
app.include_router(auth_router)

@app.exception_handler(RequestValidationError)
async def validation_error(request, exc):
    # Never echo submitted passwords, tokens, or other input in validation errors.
    message = "Check your entries. New passwords must be 15–128 characters; enter a valid email address." if request.url.path.startswith("/api/auth/") else "Check the submitted fields and try again."
    return JSONResponse(status_code=422, content={"detail": message})


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://spend-sense-7a29.vercel.app",
    ],
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
