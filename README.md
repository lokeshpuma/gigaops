# GigaOps: Autonomous Manufacturing Systems Demo Suite

[![Course](https://img.shields.io/badge/Course-22RI751%20Autonomous%20Manufacturing-red.svg)](https://github.com/lokeshpuma/URL-Status-Checker)
[![Team](https://img.shields.io/badge/Team-Group%20G9-blue.svg)](https://github.com/lokeshpuma/URL-Status-Checker)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%2B%20SimPy-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20TypeScript%20%2B%20Vite-61DAFB.svg)](https://vitejs.dev)
[![ONNX](https://img.shields.io/badge/Inference-ONNX%20Runtime%20CPU-005CED.svg)](https://onnxruntime.ai)

An end-to-end, deployable cyber-physical manufacturing suite mirroring **Tesla Gigafactory's** automated production stack. Developed for **Group G9 (22RI751 — Autonomous Manufacturing Systems)**.

---

## 1. System Architecture

```
                      +-------------------------------------------------+
                      |              CLIENT WEB BROWSER                 |
                      |  React + Vite SPA (Modern Cyber Dark Theme)     |
                      |   - Home (Hero, Demo Cards, Concept Matrix)     |
                      |   - GigaTwin (Live Recharts & Sliders)          |
                      |   - VisionQC (AOI Defect Bounding Boxes)        |
                      |   - AGV Pathfinder (Client-Side A* Canvas Grid) |
                      |   - About (Team G9, ISA-95 & References)        |
                      +-------------------+-----------------------------+
                                          |
                      REST API / WebSocket Telemetry (Port 8000)
                                          |
                                          v
                      +-------------------------------------------------+
                      |               FASTAPI BACKEND                   |
                      |  +---------------------+ +--------------------+ |
                      |  | GigaTwin Digital    | | VisionQC Defect    | |
                      |  | Twin Engine (SimPy) | | Classifier (ONNX)  | |
                      |  +---------------------+ +--------------------+ |
                      +-------------------------------------------------+
```

### Repository Structure
```
.
├── frontend/                     # React 19 + TypeScript + Vite SPA
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx          # Landing, 3 demo cards, Module 5 concept matrix
│   │   │   ├── GigaTwin.tsx      # SimPy discrete-event digital twin dashboard
│   │   │   ├── VisionQC.tsx      # AOI defect classifier (Upload/Camera/Gallery)
│   │   │   ├── AGVPathfinder.tsx # Client-side 15x15 A* factory floor grid
│   │   │   └── About.tsx         # Team G9, ISA-95 references, academic limitations
│   │   ├── components/
│   │   │   ├── Navbar.tsx        # Persistent nav + live backend health ping
│   │   │   └── FallbackVideoPlayer.tsx # 40s backup video player toggle
│   │   ├── utils/
│   │   │   └── pathfinder.ts     # Client-side A* pathfinding graph search
│   │   ├── config.ts             # API endpoints and dynamic URL resolution
│   │   └── index.css             # Vanilla CSS Cyberpunk Dark Mode design system
│   ├── public/
│   │   ├── samples/              # Curated 4680 test images (pristine vs defects)
│   │   └── demo-videos/          # 40s HD MP4 video fallback recordings
│   └── package.json
│
├── backend/                      # Python FastAPI Microservice
│   ├── app/
│   │   ├── main.py               # FastAPI entrypoint, CORS & static routing
│   │   ├── routers/
│   │   │   ├── simulation.py     # REST & WebSocket endpoints for GigaTwin
│   │   │   └── vision.py         # ONNX Runtime defect inference endpoint
│   │   ├── models/
│   │   │   ├── simpy_line.py     # 6-stage battery discrete-event digital twin
│   │   │   ├── defect_model.onnx # Exported ONNX weights (< 15MB CPU runtime)
│   │   │   └── defect_model.pt   # PyTorch checkpoint weights
│   │   └── static/samples/       # Inspection test fixtures
│   ├── requirements.txt
│   └── Dockerfile                # Production container deployment
│
├── ml-training/                  # Model training & export pipeline
│   ├── train_defect_model.py     # Synthetic generator & ONNX exporter
│   ├── train_defect_model.ipynb  # Reproducible Jupyter notebook
│   └── dataset_notes.md          # Dataset provenance & CC-BY 4.0 license notes
│
├── demo-videos/                  # 40s HD MP4 fallback rehearsal video recordings
│   ├── gigatwin_demo.mp4
│   ├── visionqc_demo.mp4
│   └── agv_pathfinder_demo.mp4
│
├── render.yaml                   # Render.com Blueprint configuration
├── PRD.md                        # Project Requirements Document
└── README.md
```

---

## 2. The Three Interactive Demos

### 1. GigaTwin (Discrete-Event Digital Twin)
- **Engine:** Python `SimPy` discrete-event simulation modeling a 6-stage battery line:
  1. `Electrode Coating` (slurry prep, coating copper/aluminum foil)
  2. `Winding / Stacking` (jelly-roll winding or prismatic Z-stacking)
  3. `Cell Assembly` (can insertion, tab laser welding, electrolyte filling)
  4. `AI-Vision QC Gate` (camera inspection with configurable defect probability)
  5. `Formation & Aging` (electrochemical cycling & SEI layer formation)
  6. `Pack Integration` (module packaging, wire bonding, busbar welding)
- **Outputs (Computed in Real Time):** Throughput (UPH), OEE Breakdown (Availability × Performance × Quality), First-Pass Yield (FPY %), and active Bottleneck identification.
- **Acceptance Verified:** Modulating defect rate slider from 2% to 15% drops First-Pass Yield from 98.0% to 84.7% and throttles throughput from 717 to 675 UPH.

### 2. VisionQC (AI Defect Detection Gate)
- **Engine:** `ConvNet-B4` deep convolutional classifier exported to **ONNX Runtime** for low-latency (<15ms) single-thread CPU execution.
- **Capabilities:**
  - One-click gallery test inputs (2 pristine passes, 4 realistic defect specimens).
  - Custom image drag-and-drop file uploader.
  - Live webcam frame capture via HTML5 canvas blob.
  - Saliency gradient anomaly bounding boxes highlighting defect regions.
- **Classes:** `Pristine Pass`, `Electrode Surface Scratch`, `Tab Laser Weld Spatter`, `Calendering Pinhole Micro-Void`.
- **Acceptance Verified:** 100% test accuracy across all 6 reference test fixtures.

### 3. AGV Pathfinder (Factory Floor Intralogistics)
- **Engine:** Client-side **A* Search Algorithm** implemented purely in TypeScript and HTML5 canvas.
- **Capabilities:**
  - Interactive 15x15 factory floor grid.
  - Click to place/remove machinery obstacles, designate Inbound Dock and Pack Station.
  - Toggle between 4-way cardinal and 8-way diagonal routing.
  - Toggle live A* frontier (open set) and explored (closed set) cell visualization.
  - Step-by-step vehicle navigation animation.
- **Acceptance Verified:** Placing obstacles forces collision-free path deviation; fully enclosing the goal gracefully displays a clear `NO TRAJECTORY FOUND` alert.

---

## 3. Quickstart & Local Execution

### Prerequisites
- Node.js (v18+) & npm
- Python (3.10+)

### 1. Backend Setup & Run
```bash
# Clone the repository
git clone https://github.com/lokeshpuma/URL-Status-Checker.git gigaops
cd gigaops

# Create Python virtual environment
python3 -m venv backend/venv
source backend/venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Start FastAPI backend (port 8000)
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API docs available at: `http://localhost:8000/docs`

### 2. Frontend Setup & Run
```bash
# In a separate terminal
cd frontend

# Install dependencies
npm install

# Start Vite dev server (port 5173)
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 4. Free-Tier Deployment Guide

### Deploying Frontend to Vercel (Free Tier)
1. Push this repository to GitHub.
2. In the [Vercel Dashboard](https://vercel.com), click **Add New Project** and import the repository.
3. Configure settings:
   - **Root Directory:** `frontend`
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Set Environment Variable:
   - `VITE_BACKEND_URL`: Your hosted backend URL (e.g., `https://gigaops-backend.onrender.com`).
5. Click **Deploy**.

### Deploying Backend to Render (Free Tier)
1. In the [Render Dashboard](https://render.com), click **New Web Service**.
2. Connect your GitHub repository.
3. Select **Docker** or **Python Runtime**:
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Select the **Free** instance type.
5. Deploy.

---

## 5. Offline Fallback & Live Presentation Safety

If cloud hosting has a cold start during a 2-minute live presentation:
1. Every page has an integrated **"Live demo unavailable? Watch recording"** toggle.
2. Clicking it opens a pre-recorded 40-second HD rehearsal video (`/demo-videos/*.mp4`) embedded directly inside the UI.
3. The entire site also functions offline locally with single commands.

---

## 6. Academic Limitations & Scope Boundary (§6 Compliance)

> **Disclaimer:** GigaOps is an original educational simulation created for Course 22RI751 (Autonomous Manufacturing Systems). It is inspired by publicly reported Tesla Battery Day disclosures and academic manufacturing literature. It is not affiliated with, sponsored by, or derived from proprietary software or private telemetry of Tesla, Inc. All defect classifiers and digital twin rates are educational approximations.

---

## 7. Group G9 Team Members

- **Lokesh M (Lead)** — Systems & Frontend Architect, AGV Pathfinder Lead
- **Team Member 2** — Simulation & Digital Twin Lead (GigaTwin SimPy Model)
- **Team Member 3** — Computer Vision Lead (VisionQC ONNX Model)
- **Team Member 4** — Manufacturing Domain & Report Documentation Lead
