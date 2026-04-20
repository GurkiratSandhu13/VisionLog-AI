from database import supabase

res = supabase.table("users").select("id, name, face_encoding").execute()
users = res.data

print(f"Total Users Found: {len(users)}")
for u in users:
    encoding = u.get("face_encoding")
    length = len(encoding) if encoding else 0
    print(f"User: {u['name']}, face_encoding length: {length}")
    if length != 128:
        print(f"  -> Error: Invalid or null encoding. Deleting user {u['id']}")
        supabase.table("users").delete().eq("id", u["id"]).execute()

