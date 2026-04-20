from deepface import DeepFace
import cv2
import numpy as np
import base64
from typing import Optional


def encode_image_bytes(image_bytes: bytes) -> Optional[list]:
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        print("encode_image_bytes: could not decode image")
        return None
    tmp_path = "/tmp/reg_face.jpg"
    cv2.imwrite(tmp_path, img)
    try:
        result = DeepFace.represent(
            img_path=tmp_path,
            model_name="Facenet",
            enforce_detection=True
        )
        embedding = result[0]["embedding"]
        print(f"encode_image_bytes: success, embedding length={len(embedding)}")
        return embedding
    except Exception as e:
        print(f"encode_image_bytes: failed — {e}")
        return None


def recognize_from_frame(frame_base64: str, known_users: list) -> list:
    if not known_users:
        print("recognize_from_frame: no known users, skipping")
        return []

    img_data = base64.b64decode(frame_base64)
    nparr = np.frombuffer(img_data, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if frame is None:
        print("recognize_from_frame: could not decode frame")
        return []

    tmp_path = "/tmp/frame.jpg"
    cv2.imwrite(tmp_path, frame)
    print(f"recognize_from_frame: frame shape={frame.shape}, saved to {tmp_path}")

    try:
        detected = DeepFace.represent(
            img_path=tmp_path,
            model_name="Facenet",
            enforce_detection=False
        )
        print(f"recognize_from_frame: deepface detected {len(detected)} face(s)")
    except Exception as e:
        print(f"recognize_from_frame: DeepFace.represent failed — {e}")
        return []

    known_encodings = [np.array(u["encoding"]) for u in known_users]
    matches = []

    for face in detected:
        query_enc = np.array(face["embedding"])
        
        region = face.get("facial_area", {})
        x = region.get("x", 0)
        y = region.get("y", 0)
        w = region.get("w", 0)
        h = region.get("h", 0)
        
        if w < 30 or h < 30:
            print(f"Skipping tiny detection: w={w}, h={h}")
            continue

        distances = [np.linalg.norm(query_enc - k) for k in known_encodings]
        
        best_idx = int(np.argmin(distances))
        best_dist = distances[best_idx]
        print(f"recognize_from_frame: best distance = {best_dist:.4f}")

        # CORRECTED THRESHOLD: Facenet deepface distances are typically
        # 15-40. Use 15 as the match threshold (not 10).
        if best_dist < 15:
            matched_user = known_users[best_idx]
            matches.append({
                "user_id": matched_user["user_id"],
                "name": matched_user["name"],
                "confidence": round(max(0, 1 - (best_dist / 30)), 3),
                "location": [y, x + w, y + h, x]
            })
            print(f"recognize_from_frame: MATCH — {matched_user['name']} at dist {best_dist:.4f}")
        else:
            print(f"recognize_from_frame: no match (dist {best_dist:.4f} >= threshold 15)")

    return matches
