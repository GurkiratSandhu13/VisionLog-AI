from pydantic import BaseModel
from typing import Optional, List

class RecognizeRequest(BaseModel):
    session_id: str
    frame_base64: str

class SessionRequest(BaseModel):
    session_name: str

class SubmitSessionRequest(BaseModel):
    session_id: str
    submitted_by: str
