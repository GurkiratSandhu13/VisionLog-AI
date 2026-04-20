# Project Report: Automatic Attendance System

## 1. Project Overview
The Automatic Attendance System is a full-stack web application designed for real-time facial recognition-based student/employee attendance logging. Admins can register individuals by uploading their photo; the system generates facial encodings and stores them in PostgreSQL (via Supabase). The monitor interface polls the client webcam and sends frames to the server, verifying against registered face encodings using the `deepface` library, logging attendance in real-time.

## 2. Architecture Diagram
```text
[ Browser / Webcam (React + Vite) ]
        |       ^
 (HTTP POST)    | (JSON Match Results & Overlays)
        v       |
[ FastAPI Backend (Python) ] <--- [ deepface (Facial Recognition Engine) ]
        |       ^
 (SQL / API)    | (Data / Assets)
        v       |
[ Supabase (PostgreSQL DB + Storage Bucket) ]
```

## 3. Why FastAPI over Node.js
FastAPI was chosen as the sole backend strictly to natively accommodate Python-based Machine Learning models (`deepface`, `face_recognition`). Bridging a Node.js server to a Python worker through CLI subprocesses or microservices introduces unnecessary latency (crucial for webcam frame polling), operational complexity, and memory overhead. FastAPI inherently supports async operations, making it extremely performant for network bound database calls, while sharing the identical runtime required to build and deploy ML inference logic seamlessly.

## 4. Complete Folder Structure
```text
attendance-system/
├── client/                        # React.js frontend directory (Vite)
│   ├── src/                       
... (standard Vite structure) ...  # Assets, pages, layouts
│
├── server/                        # Python FastAPI backend directory
│   ├── main.py                    # Entry point connecting routers and configuring CORS
│   ├── face_engine.py             # Utilizes DeepFace & OpenCV to encode faces and match live frames
│   ├── database.py                # Supabase Python Client initialized and connection exported
│   ├── models.py                  # Pydantic schemas formatting the DB Request and Response patterns
│   ├── routes/
│   │   ├── users.py               # Registration handling, storing image bytes visually to buckets
│   │   └── attendance.py          # Start Session logic, polling matches, recording history
│   ├── utils/
│   │   └── storage.py             # Helper to format base64/bytes chunks directly into Supabase buckets
│   ├── requirements.txt           # Listed pip dependencies
│   └── .env                       # Backend tokens (SUPABASE_URL, SUPABASE_SERVICE_KEY)
│
├── PROJECT_REPORT.md              # Documentation reference (You are here)
└── README.md                      # Basic repo guidelines
```

## 5. Tech Stack Table

| Layer | Technology | Reason |
|---|---|---|
| Frontend | React.js (Vite), TailwindCSS, react-webcam, Axios, React Router v6 | Provide component-driven SPA, fast HMR build, streamlined API configuration. |
| Backend | Python FastAPI | Native Python integration avoiding NodeJS bottlenecks, handling sync image encodings. |
| Face Recognition | `deepface` (Facenet) + `cv2` (OpenCV) | Drop-in solution parsing ML pipelines bypassing local C++ / CMake requirements of `dlib`. |
| Database | PostgreSQL via Supabase (`supabase-py`) | Managed Postgres DB handling constraints & relationships flawlessly with free tier access. |
| Image Storage | Supabase Storage buckets | Fast CDN linking user's profile image to PostgreSQL records natively natively. |
| File Uploads | FastAPI `UploadFile` (built-in) | Read multipart-formData memory safely eliminating external parsing modules. |

## 6. All API Endpoints

### Users Router (`/api/users`)
- **`POST /register`**
  - Schema: `multipart/form-data` (`name` string, `role` string, `photo` UploadFile)
  - Returns: Registered `user` object without the explicit encoding array.
  - Case: Throws `422` if no face is detected by `deepface`.
- **`GET /`**
  - Schema: No args.
  - Returns: Array of user dicts.
- **`DELETE /{id}`**
  - Schema: User UUID Path param.
  - Returns: `{ "status": "success" }`. Delete Cascade cleans dependencies. 

### Attendance Router (`/api/attendance`)
- **`POST /sessions`**
  - Schema: `{"session_name": str}`.
  - Returns: `{"session_id", "session_name", "started_at"}`
- **`POST /recognize`**
  - Schema: `{"frame_base64": str, "session_id": str}`
  - Returns: `{"matches": [ {"user_id", "name", "confidence", "location": [y1, x2, y2, x1]} ]}`
- **`POST /submit`**
  - Schema: `{"session_id": str, "submitted_by": str}`
  - Returns: Success block with completed time stamp.
- **`GET /history`** -> Returns total session metadata via JOIN COUNT block.
- **`GET /sessions/{id}`** -> Returns specific session metrics with array of `attendance_logs`.

## 7. Database Schema

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE,
  role VARCHAR(50) DEFAULT 'student',
  photo_url TEXT,
  face_encoding FLOAT8[],                    -- Facenet 128-element array via deepface
  registered_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE attendance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_name VARCHAR(150),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  submitted_by VARCHAR(100)
);

CREATE TABLE attendance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  marked_at TIMESTAMPTZ DEFAULT NOW(),
  confidence FLOAT,
  UNIQUE(session_id, user_id)               -- Prevent duplicate logs per session
);
```

## 8. Environment Variables

### `/client/.env`
- `VITE_API_BASE_URL`: Base URL mapped to `http://localhost:8000/api` dictating where Axios fires requests.

### `/server/.env`
- `SUPABASE_URL`: DB Connection String URL target given via the Supabase Dashboard.
- `SUPABASE_SERVICE_KEY`: Service role bypassing Postgres RLS strictly for the backend client execution.
- `STORAGE_BUCKET`: E.g. `user-photos` (Used to construct storage uploads path).
- `PORT`: Execution portal map (Usually `8000`).

## 9. Local Setup Instructions
1. `git clone` the repository.
2. In a separate tab, cd into `/server`, create a virtual environment (`python -m venv venv`), activate it, and run `pip install -r requirements.txt`.
3. In `/server` copy `.env.example` -> `.env` and fill the variables.
4. Run FastAPI via: `uvicorn main:app --reload --port 8000`.
5. CD into `/client`, run `npm install`.
6. Run Vite server via: `npm run dev`.

## 10. DeepFace vs dlib Installation Notice
Initially architected using `face_recognition` (`dlib` wrapper), this structure enforces C++ CMake compilers globally on the OS. Because this acts as a hard failure-point on local testing and specific Mac Silicon infrastructure, `deepface` has been instantiated as a zero-compile replacement engine driving identical 128-D `Facenet` array encoding formats natively in pure Python format.

## 11. Known Limitations
- Desktop optimized (M2 Webcams logic, untested cleanly via mobile responsive viewports).
- Synchronous polling model via React Hooks 2s timers rather than pure WebSocket push connections. 
- DeepFace inherently is more intensive than standard `face_recognition` wrappers; slight compute usage latency during simultaneous frames may occur.

## 12. Data Flow Diagrams

**User Registration Pipeline**
```text
Browser Form [photo + string] ---> FastAPI /register 
---> deepface.represent(tmp_image) 
---> [Success] -> Supabase Storage (S3Bucket)
---> [Success] -> Supabase DB `users` (encoding[], url) -> 返回(201 Browser)
```

**Attendance Recognition Logic**
```text
React Webcam Component [Every 2s] 
---> canvas.toDataURL(base64) ---> FastAPI /recognize 
---> cv2 decodes bytearray ---> deepface.represent() extracts encoding 
---> np.linalg.norm determines distance between DB Face vs Current Face 
---> Confirmed Array ---> DB `attendance_logs` [ON CONFLICT DO NOTHING]
---> FastAPI returns {"matches": [...]} ---> React draws Bounding Box 
```
