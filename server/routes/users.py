from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from database import supabase
from face_engine import encode_image_bytes
from utils.storage import upload_photo, delete_photo
import uuid

router = APIRouter()

@router.post("/register")
async def register_user(
    name: str = Form(...),
    email: str = Form(None),
    role: str = Form("student"),
    photo: UploadFile = File(...)
):
    try:
        photo_bytes = await photo.read()
        encoding = encode_image_bytes(photo_bytes)
        
        if encoding is None:
            raise HTTPException(status_code=422, detail="No face detected — upload a clear frontal photo")
        
        # Ensure it is a list
        encoding_list = encoding if isinstance(encoding, list) else encoding.tolist() if hasattr(encoding, 'tolist') else list(encoding)

        user_id = str(uuid.uuid4())
        filename = f"{user_id}.jpg"
        
        try:
            photo_url = upload_photo(photo_bytes, filename)
            print(f"[STORAGE] Upload successful. URL: {photo_url}")
        except Exception as e:
            print(f"[STORAGE ERROR] {e}")
            raise HTTPException(status_code=500, detail=f"Storage upload failed: {e}")
            
        user_data = {
            "id": user_id,
            "name": name,
            "email": email,
            "role": role,
            "photo_url": photo_url,
            "face_encoding": encoding_list
        }
        
        try:
            res = supabase.table("users").insert(user_data).execute()
            if not res.data:
                raise HTTPException(status_code=500, detail="Failed to insert into DB")
                
            created_user = res.data[0]
            created_user.pop("face_encoding", None)
            return created_user
        except Exception as e:
            print(f"[DB ERROR] {e}")
            raise HTTPException(status_code=500, detail=f"Database insert failed: {e}")
            
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"[SYSTEM ERROR] {e}")
        raise HTTPException(status_code=500, detail=f"Internal registration error: {e}")

@router.get("/")
def get_users():
    res = supabase.table("users").select("id, name, email, role, photo_url, registered_at").execute()
    return res.data

@router.delete("/{user_id}")
def delete_user(user_id: str):
    res = supabase.table("users").select("photo_url").eq("id", user_id).execute()
    if res.data and res.data[0].get("photo_url"):
        filename = f"{user_id}.jpg"
        try:
            delete_photo(filename)
        except Exception:
            pass
            
    supabase.table("users").delete().eq("id", user_id).execute()
    return {"status": "success"}
