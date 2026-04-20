from fastapi import APIRouter, HTTPException
from database import supabase
from face_engine import recognize_from_frame
from models import RecognizeRequest, SessionRequest, SubmitSessionRequest
from datetime import datetime, timezone

router = APIRouter()

@router.post("/sessions")
def create_session(req: SessionRequest):
    res = supabase.table("attendance_sessions").insert({"session_name": req.session_name}).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to create session")
    return res.data[0]

@router.post("/recognize")
def recognize_face(req: RecognizeRequest):
    users_res = supabase.table("users").select("id, name, face_encoding").execute()
    known_users = []
    
    for u in users_res.data:
        if u.get("face_encoding"):
            known_users.append({
                "user_id": u["id"],
                "name": u["name"],
                "encoding": u["face_encoding"]
            })
            
    print(f"[RECOGNIZE] Fetched {len(known_users)} user encodings from DB")
            
    matches = recognize_from_frame(req.frame_base64, known_users)
    
    for match in matches:
        try:
            exists = supabase.table("attendance_logs").select("id").eq("session_id", req.session_id).eq("user_id", match["user_id"]).execute()
            if not exists.data:
                supabase.table("attendance_logs").insert({
                    "session_id": req.session_id,
                    "user_id": match["user_id"],
                    "confidence": match["confidence"]
                }).execute()
        except Exception:
            pass # ignore duplicates
            
    return {"matches": matches}

@router.post("/submit")
def submit_session(req: SubmitSessionRequest):
    res = supabase.table("attendance_sessions").update({
        "submitted_at": datetime.now(timezone.utc).isoformat(),
        "submitted_by": req.submitted_by
    }).eq("id", req.session_id).execute()
    
    if not res.data:
        raise HTTPException(500, "Update failed")
        
    return res.data[0]

@router.get("/history")
def get_history():
    sessions = supabase.table("attendance_sessions").select("*").order("started_at", desc=True).execute().data
    logs = supabase.table("attendance_logs").select("session_id, id").execute().data
    
    logs_count = {}
    if logs:
        for log in logs:
            sid = log["session_id"]
            logs_count[sid] = logs_count.get(sid, 0) + 1
        
    if sessions:
        for s in sessions:
            s["participant_count"] = logs_count.get(s["id"], 0)
        
    return sessions

@router.get("/sessions/{session_id}")
def get_session_detail(session_id: str):
    session_res = supabase.table("attendance_sessions").select("*").eq("id", session_id).execute()
    if not session_res.data:
        raise HTTPException(404, "Session not found")
        
    logs_res = supabase.table("attendance_logs").select("*, users(name)").eq("session_id", session_id).execute()
    
    session_data = session_res.data[0]
    session_data["logs"] = logs_res.data if logs_res else []
    return session_data
