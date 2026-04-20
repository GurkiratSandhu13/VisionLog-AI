from database import supabase
import os

BUCKET_NAME = os.environ.get("STORAGE_BUCKET", "user-photos")

def upload_photo(file_bytes: bytes, file_name: str) -> str:
    response = supabase.storage.from_(BUCKET_NAME).upload(
        path=file_name,
        file=file_bytes,
        file_options={"content-type": "image/jpeg", "x-upsert": "true"}
    )
    public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(file_name)
    return public_url

def delete_photo(file_name: str):
    supabase.storage.from_(BUCKET_NAME).remove([file_name])
