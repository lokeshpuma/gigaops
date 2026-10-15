"""
GigaOps FastAPI Backend Service
Autonomous Manufacturing Systems Demo Suite
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.routers import simulation, vision

app = FastAPI(
    title="GigaOps Autonomous Manufacturing Systems API",
    description="Backend microservice providing SimPy discrete-event digital twin and ONNX vision defect inspection for Tesla Gigafactory manufacturing systems study.",
    version="1.0.0",
)

# Cross-Origin Resource Sharing (CORS) configured for both localhost and production hosting
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(simulation.router)
app.include_router(vision.router)

# Mount static files directory if present
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/")
def root():
    return {
        "status": "online",
        "system": "GigaOps Autonomous Manufacturing Systems",
        "case_study": "Tesla Gigafactory Battery Cell & Intralogistics Architecture",
        "endpoints": {
            "health": "/api/health",
            "simulation_run": "/api/simulation/run",
            "simulation_presets": "/api/simulation/presets",
            "simulation_ws": "/api/simulation/ws",
            "vision_predict": "/api/vision/predict",
            "vision_samples": "/api/vision/samples",
            "docs": "/docs",
        }
    }

@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "uptime": "nominal",
        "modules": {
            "gigatwin": "SimPy Discrete-Event Digital Twin Engine Ready",
            "visionqc": "ONNX Runtime Battery Defect Classifier Ready",
            "agv_pathfinder": "Client-Side Autonomous Transport Engine Ready",
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
