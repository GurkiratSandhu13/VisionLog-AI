from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import users, attendance
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Attendance System API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(attendance.router, prefix="/api/attendance", tags=["attendance"])

@app.get("/health")
def health():
    return {"status": "ok"}
