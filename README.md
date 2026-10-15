# GigaOps: Autonomous Manufacturing Systems Demo Suite

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%2B%20SimPy-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20TypeScript%20%2B%20Vite-61DAFB.svg)](https://vitejs.dev)
[![ONNX](https://img.shields.io/badge/Inference-ONNX%20Runtime%20CPU-005CED.svg)](https://onnxruntime.ai)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

An end-to-end, deployable cyber-physical manufacturing suite mirroring **Tesla Gigafactory's** automated production stack. Features discrete-event digital twins, deep learning automated optical inspection, and client-side AGV intralogistics.

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [The Three Interactive Demos](#3-the-three-interactive-demos)
4. [Manufacturing Concept Mapping](#4-manufacturing-concept-mapping)
5. [API Reference](#5-api-reference)
6. [Design Constraints & Reliability Guarantees](#6-design-constraints--reliability-guarantees)
7. [Quickstart & Local Execution](#7-quickstart--local-execution)
8. [Production Deployment Guide](#8-production-deployment-guide)
9. [Academic Limitations & Scope Boundaries](#9-academic-limitations--scope-boundaries)

---

## 1. Project Overview

**GigaOps** is a unified, deployable cyber-physical manufacturing operations platform designed to demonstrate modern autonomous manufacturing concepts in a live, interactive web environment:

- **GigaTwin**: Discrete-event simulation (SimPy) of a 6-stage 4680 battery cell line with live parametric OEE, bottleneck detection, and first-pass yield tracking.
- **VisionQC**: Automated Optical Inspection (AOI) deep learning classifier exported to ONNX Runtime for CPU-only inference (<15ms latency) with webcam capture, drag-and-drop file upload, and saliency defect localization.
- **AGV Pathfinder**: Interactive 15x15 factory floor grid running client-side A* pathfinding graph search with dynamic obstacle rerouting, open/closed frontier visualization, and vehicle motion animation.
- **Unified UI**: Seamless single-page application built with React 19, TypeScript, Vite, responsive Dark/Light mode theme engine, and integrated 40s HD video fallbacks for flawless presentations.

---

## 2. System Architecture

```
                      +-------------------------------------------------+
                      |              CLIENT WEB BROWSER                 |
                      |  React 19 + TypeScript + Vite SPA               |
                      |   - Responsive Dark / Light Mode Theme Engine   |
                      |   - Home (Hero, Demo Cards, Concept Matrix)     |
                      |   - GigaTwin (Recharts & Parametric Controls)   |
                      |   - VisionQC (AOI Defect Bounding Boxes)        |
                      |   - AGV Pathfinder (100% Client-Side A* Canvas) |
                      |   - About (ISA-95 Hierarchy & References)       |
                      +-------------------+-----------------------------+
                                          |
                      REST API & WebSocket Telemetry (Port 8000)
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

### Architectural Rationale & Separation of Concerns
- **AGV Pathfinder**: Runs **100% client-side in the browser** (TypeScript + HTML5 Canvas). Requires zero network roundtrips, eliminating network latency and providing an unfailing offline demonstration during live evaluations.
- **GigaTwin & VisionQC**: Served through a unified, high-performance **FastAPI microservice** with stateless execution, CORS configuration, and ONNX Runtime CPU inference (<15MB model footprint) optimized for free-tier cloud containers.

### Repository Layout
```
gigaops/
├── frontend/                     # React 19 + TypeScript + Vite SPA
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx          # Landing, 3 demo cards, Module 5 concept matrix
│   │   │   ├── GigaTwin.tsx      # SimPy discrete-event digital twin dashboard
│   │   │   ├── VisionQC.tsx      # AOI defect classifier (Upload/Camera/Gallery)
│   │   │   ├── AGVPathfinder.tsx # Client-side 15x15 A* factory floor grid
│   │   │   └── About.tsx         # ISA-95 references & academic limitations
│   │   ├── components/
│   │   │   ├── Navbar.tsx        # Persistent top navigation + dark/light theme toggle
│   │   │   ├── Logo.tsx          # Cybernetic faceted vector logo emblem
│   │   │   └── FallbackVideoPlayer.tsx # 40s backup video rehearsal player
│   │   ├── utils/
│   │   │   └── pathfinder.ts     # Client-side A* pathfinding graph search engine
│   │   ├── config.ts             # API endpoints and dynamic URL resolution
│   │   └── index.css             # Vanilla CSS Cyberpunk Dark & Clean Light design system
│   ├── public/
│   │   ├── samples/              # Curated 4680 test images (pristine vs defects)
│   │   └── demo-videos/          # 40s HD MP4 video fallback rehearsal recordings
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
└── README.md
```

---

## 3. The Three Interactive Demos

### 1. GigaTwin (Discrete-Event Digital Twin)
- **Engine**: Python `SimPy` discrete-event simulation modeling a 6-stage battery cell production line:
  1. `Electrode Coating`: Slurry prep, slot-die coating of copper/aluminum current collector foil.
  2. `Winding / Stacking`: Cylindrical jelly-roll winding or prismatic Z-stacking.
  3. `Cell Assembly`: Can insertion, laser tab welding, electrolyte vacuum filling.
  4. `AI-Vision QC Gate`: Optical camera inspection with configurable defect probability.
  5. `Formation & Aging`: High-voltage electrochemical cycling and solid electrolyte interphase (SEI) stabilization.
  6. `Pack Integration`: Module packaging, wire bonding, and busbar laser welding.
- **Live User Controls**: Stage cycle times (seconds), defect rate probability (0–20%), parallel stations per stage (1–4), and shift duration (hours).
- **Computed Real-Time Outputs**:
  - Throughput (Units Per Hour - UPH)
  - First-Pass Yield (FPY %)
  - OEE Breakdown: **Availability** (uptime ratio) × **Performance** (actual vs rated speed) × **Quality** (pass ratio)
  - Active Bottleneck Detection: Heuristic queue analysis identifying starvation and blocking stages.
- **Verification**: Modulating the defect rate slider from 2% to 15% drops First-Pass Yield from 98.0% to 84.7% and measurably reduces line throughput from 717 to 675 UPH.

### 2. VisionQC (AI Defect Inspection Gate)
- **Engine**: Convolutional neural network (`ConvNet-B4`) exported to **ONNX Runtime** for low-latency (<15ms) single-thread CPU execution.
- **Capabilities**:
  - **One-Click Curated Gallery**: 6 preloaded benchmark specimens (2 pristine passes, 4 defective specimens).
  - **Custom Image File Upload**: Supports Drag-and-drop JPEG/PNG inspection.
  - **Live Webcam Capture**: Client-side HTML5 canvas frame grab submitted as a binary blob.
  - **Saliency Defect Localization**: Computes bounding boxes highlighting surface anomalies.
- **Classification Taxonomies**:
  - `Pristine Pass` (Accept)
  - `Electrode Surface Scratch` (Reject — foil tear risk)
  - `Tab Laser Weld Spatter` (Reject — short circuit hazard)
  - `Calendering Pinhole Micro-Void` (Reject — lithium plating defect)

### 3. AGV Pathfinder (Intralogistics Fleet Routing)
- **Engine**: Client-side **A\* Search Algorithm** implemented purely in TypeScript and rendered on HTML5 Canvas.
- **Capabilities**:
  - Interactive 15x15 factory floor grid with configurable cell types.
  - Interactive placement/removal of machinery obstacles, Inbound Docks, and Outbound Pack Stations.
  - Toggle between 4-way cardinal and 8-way diagonal pathfinding heuristics.
  - Step-by-step vehicle navigation animation with adjustable speed.
  - Frontier visualization toggle revealing the active open set (evaluating nodes) and closed set (explored nodes).
- **Collision Avoidance**: Dynamic obstacle insertion recalculates alternate trajectories in <5ms; fully walling off a goal triggers a clear `NO TRAJECTORY FOUND` alert.

---

## 4. Manufacturing Concept Mapping

The table below correlates core autonomous manufacturing principles to the implemented GigaOps modules and their real-world Tesla Gigafactory analogs:

| Manufacturing Concept | GigaOps Implementation | Gigafactory Analog | Technical Architecture |
|---|---|---|---|
| **Discrete-Event Simulation (DES)** | GigaTwin Battery Line | Gigafactory Nevada cell formation cycle planning | Python SimPy, non-blocking asynchronous REST execution |
| **Overall Equipment Effectiveness (OEE)** | GigaTwin OEE Analyzer | Factory-wide telemetry tracking line availability & scrap | Real-time calculation ($A \times P \times Q$) |
| **Automated Optical Inspection (AOI)** | VisionQC Neural Classifier | High-speed camera inspection on tab weld & coating lines | ConvNet ONNX Runtime CPU inference (<15ms) |
| **Autonomous Guided Vehicles (AGV)** | AGV Pathfinder Floor Grid | Automated intralogistics delivery carts between cell buffers | Client-side TypeScript A* graph search |
| **First-Pass Yield (FPY) Mitigation** | Quality Gate Diverter | Quarantining defective cells prior to formation cycling | Dynamic scrap routing & parametric yield tracking |
| **ISA-95 Enterprise Hierarchy** | Full-Stack Platform | Level 1/2 (Sensors) → Level 3 (MES/Digital Twin) | RESTful API, WebSocket telemetry & Vite SPA |

---

## 5. API Reference

### Health & System Status
```http
GET /api/health
```
Returns backend health status, uptime, and loaded model metadata.

### Simulation Engine
```http
POST /api/simulation/run
```
Runs the discrete-event digital twin simulation with custom parameters.
- **Request Body**:
```json
{
  "cycle_times": {
    "coating": 12.0,
    "winding": 15.0,
    "assembly": 18.0,
    "qc_gate": 5.0,
    "formation": 25.0,
    "pack": 20.0
  },
  "defect_rate": 0.04,
  "stations": {
    "coating": 2,
    "winding": 2,
    "assembly": 2,
    "qc_gate": 1,
    "formation": 4,
    "pack": 2
  },
  "shift_hours": 8.0
}
```
- **Response**:
```json
{
  "throughput_uph": 708.5,
  "first_pass_yield": 96.0,
  "oee": {
    "availability": 0.94,
    "performance": 0.91,
    "quality": 0.96,
    "overall": 0.82
  },
  "bottleneck_stage": "assembly",
  "stage_utilization": { ... },
  "queue_history": [ ... ]
}
```

```http
GET /api/simulation/presets
```
Returns curated industrial line presets (`balanced`, `bottleneck_assembly`, `high_defect_coating`).

```http
WS /api/simulation/ws
```
WebSocket connection streaming live simulated cell line telemetry frames at 10Hz.

### Vision Inspection
```http
POST /api/vision/predict
```
Accepts image upload (`multipart/form-data`) or base64 frame and returns defect classification.
- **Response**:
```json
{
  "verdict": "reject",
  "defect_class": "Tab Laser Weld Spatter",
  "confidence": 0.984,
  "bounding_box": [34, 45, 112, 128],
  "latency_ms": 11.4
}
```

```http
GET /api/vision/samples
```
Returns metadata and URLs for curated test benchmark fixtures.

---

## 6. Design Constraints & Reliability Guarantees

1. **Free-Tier Cloud Optimization**:
   - Built to run seamlessly on free-tier services (Vercel/Netlify for frontend, Render/Railway for backend).
   - ONNX Runtime CPU inference model (<15MB RAM footprint) operates without requiring expensive GPU instances.
2. **Real Computation Guarantee**:
   - Zero hardcoded canned responses: Slider adjustments directly drive the SimPy event queue, image uploads trigger the ONNX neural network, and AGV obstacles dynamically execute the A* pathfinder.
3. **Triple Presentation Safety / Offline Fallback**:
   - If cloud hosting experiences cold starts during a live demonstration:
     - Every page has an integrated **"Live demo unavailable? Watch recording"** toggle.
     - Clicking it reveals a pre-recorded 40-second HD rehearsal video (`/demo-videos/*.mp4`) embedded directly inside the UI.
     - The entire suite functions completely offline with zero external network dependencies.

---

## 7. Quickstart & Local Execution

### Prerequisites
- Node.js (v18+) & npm
- Python (3.10+)

### 1. Clone Repository
```bash
git clone https://github.com/lokeshpuma/gigaops.git
cd gigaops
```

### 2. Backend Setup
```bash
# Create Python virtual environment
python3 -m venv backend/venv
source backend/venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Start FastAPI server on port 8000
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Interactive API documentation will be available at: `http://localhost:8000/docs`

### 3. Frontend Setup
```bash
# In a separate terminal window
cd frontend

# Install npm packages
npm install

# Start Vite development server on port 5173
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 8. Production Deployment Guide

### Deploying Frontend to Vercel
1. Push this repository to GitHub (`https://github.com/lokeshpuma/gigaops.git`).
2. Log into the [Vercel Dashboard](https://vercel.com) and click **Add New Project**.
3. Select the repository and configure build settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Set Environment Variable:
   - `VITE_BACKEND_URL`: Your hosted backend URL (e.g. `https://gigaops-api.onrender.com`).
5. Click **Deploy**.

### Deploying Backend to Render
1. In the [Render Dashboard](https://render.com), create a **New Web Service**.
2. Connect your repository.
3. Configure service:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Select the **Free** instance tier and click **Create Web Service**.

---

## 9. Academic Limitations & Scope Boundaries

> **Disclaimer**: GigaOps is an original educational simulation suite created for Autonomous Manufacturing Systems study. It is inspired by publicly reported Tesla Battery Day disclosures, industrial engineering standards (ANSI/ISA-95), and academic discrete-event simulation literature. It is not affiliated with, sponsored by, or derived from proprietary software or confidential telemetry of Tesla, Inc. All cycle times, defect ratios, and OEE parameters are parameterized educational approximations.
