from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.auth import router as auth_router

app = FastAPI(title="CivicFix API", version="0.1.0")

# CORS: allow the local Vite dev server to call this API during development.
# This will be tightened / made environment-driven in a later phase.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)


@app.get("/api/v1/health")
def health_check():
    return {"status": "ok"}
