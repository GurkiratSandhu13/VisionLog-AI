# VisionLog AI - Automatic Attendance System

VisionLog AI is a full-stack web application designed for real-time facial recognition-based student/employee attendance logging. 

Admins can register individuals by uploading their photo; the system generates facial encodings and stores them in PostgreSQL (via Supabase). The monitor interface polls the client webcam and sends frames to the server, verifying against registered face encodings using the `deepface` library, and automatically logs attendance in real-time.

## Features

- **Real-Time Facial Recognition**: Live active tracking using WebRTC webcams detecting and decoding face footprints seamlessly.
- **DeepFace Powered**: Eliminates complex C++ constraints and CMake requirements of library equivalents by utilizing lightweight Facenet array implementations native to python.
- **Robust Supabase Backend**: Storing embeddings as fast, structured Array types combined directly alongside Supabase Cloud Buckets for Profile image associations.
- **Minimalist React Dashboard**: Intuitive Vite/React-powered visual interface styled via native modern UI logic ensuring smooth session interactions.
- **Zero-Friction Registration**: Direct drag-and-drop registration parsing photo uploads instantly into secure mathematical vector maps.

## Tech Stack Overview

| Layer | Technology | Reason |
|---|---|---|
| Frontend | React.js (Vite), TailwindCSS, react-webcam, React Router v6 | Provide component-driven SPA, fast HMR build, streamlined API configuration. |
| Backend | Python FastAPI | Native Python integration handling async ML pipelines. |
| AI Engine | `deepface` (Facenet) + `cv2` (OpenCV) | Drop-in solution parsing ML pipelines seamlessly. |
| Database | PostgreSQL via Supabase (`supabase-py`) | Managed Postgres DB handling constraints & relationships flawlessly. |
| Image Storage | Supabase Storage buckets | Fast CDN linking user's profile image to PostgreSQL records securely. |

## Quick Start (Local Setup)

1. Clone this repository.

### Backend Setup (`/server`)
2. Navigate into the `server` directory.
3. Create and activate a Python virtual environment (`python3 -m venv venv && source venv/bin/activate`).
4. Install dependencies: `pip install -r requirements.txt`.
5. Copy `.env.example` -> `.env` and fill the variables:
    - `SUPABASE_URL`
    - `SUPABASE_SERVICE_KEY`
    - `STORAGE_BUCKET` (e.g. `user-photos`)
6. Run the FastAPI server: `uvicorn main:app --reload --port 8000`.

### Frontend Setup (`/client`)
7. Open a new terminal and navigate to the `client` directory.
8. Set up your `.env` pointing base URLs to FastAPI:
    - `VITE_API_BASE_URL=http://localhost:8000/api`
9. Run `npm install`.
10. Run the Vite development server via: `npm run dev`.

The frontend should now be running at `http://localhost:5173` locally.

## Project Structure

```text
VisionLog-AI/
├── client/                        # React frontend directory (Vite)
├── server/                        # Python FastAPI backend directory
├── PROJECT_REPORT.md              # Technical Data-Flow architecture details
└── README.md                      # Instructions & overview
```
