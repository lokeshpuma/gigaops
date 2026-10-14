"""
GigaTwin Simulation Router
Provides REST and WebSocket endpoints for SimPy battery manufacturing line digital twin.
"""

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from typing import Dict, Any, List
import asyncio
from app.models.simpy_line import BatteryLineSimulation, SimulationParams

router = APIRouter(prefix="/api/simulation", tags=["simulation"])

@router.post("/run")
async def run_simulation(params: SimulationParams) -> Dict[str, Any]:
    """
    Execute SimPy discrete-event simulation with user-specified line parameters.
    Computes throughput, OEE, FPY, and bottleneck stage dynamically.
    """
    try:
        sim = BatteryLineSimulation(params)
        results = sim.run()
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation execution error: {str(e)}")

@router.get("/presets")
async def get_presets() -> List[Dict[str, Any]]:
    """
    Returns verified factory operating scenarios for rapid demo testing during presentation.
    """
    return [
        {
            "id": "giga_texas_nominal",
            "name": "Tesla Giga Texas Baseline (4680 High-Speed)",
            "description": "Nominal high-efficiency operating line. Balanced cycle times, 3.5% defect rate, healthy OEE > 85%.",
            "params": {
                "shift_hours": 8.0,
                "defect_rate_pct": 3.5,
                "electrode_cycle_time": 12.0,
                "electrode_stations": 3,
                "winding_cycle_time": 15.0,
                "winding_stations": 4,
                "assembly_cycle_time": 18.0,
                "assembly_stations": 4,
                "qc_cycle_time": 4.0,
                "qc_stations": 2,
                "formation_cycle_time": 22.0,
                "formation_stations": 6,
                "pack_cycle_time": 20.0,
                "pack_stations": 4,
                "planned_downtime_minutes": 25.0,
            }
        },
        {
            "id": "high_defect_calendering",
            "name": "Calendering Anomaly (High Defect Stress Test)",
            "description": "Elevated electrode coating defect rate (16.0%). Tests AI-Vision QC gate rejection and reveals scrap diversion impact.",
            "params": {
                "shift_hours": 8.0,
                "defect_rate_pct": 16.0,
                "electrode_cycle_time": 12.0,
                "electrode_stations": 3,
                "winding_cycle_time": 15.0,
                "winding_stations": 4,
                "assembly_cycle_time": 18.0,
                "assembly_stations": 4,
                "qc_cycle_time": 4.0,
                "qc_stations": 2,
                "formation_cycle_time": 22.0,
                "formation_stations": 6,
                "pack_cycle_time": 20.0,
                "pack_stations": 4,
                "planned_downtime_minutes": 25.0,
            }
        },
        {
            "id": "assembly_choke",
            "name": "Cell Assembly Choke Point (Starvation/Blockage)",
            "description": "Cell Assembly station count reduced to 2 with cycle time slowed to 28s. Creates a massive line bottleneck and starving downstream formation.",
            "params": {
                "shift_hours": 8.0,
                "defect_rate_pct": 3.5,
                "electrode_cycle_time": 10.0,
                "electrode_stations": 4,
                "winding_cycle_time": 12.0,
                "winding_stations": 5,
                "assembly_cycle_time": 28.0,
                "assembly_stations": 2,
                "qc_cycle_time": 4.0,
                "qc_stations": 2,
                "formation_cycle_time": 18.0,
                "formation_stations": 6,
                "pack_cycle_time": 18.0,
                "pack_stations": 4,
                "planned_downtime_minutes": 30.0,
            }
        }
    ]

@router.websocket("/ws")
async def simulation_websocket(websocket: WebSocket):
    """
    WebSocket endpoint for live telemetry streaming.
    Useful for animating real-time simulation ticks on the digital twin dashboard.
    """
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            params = SimulationParams(**data.get("params", {}))
            sim = BatteryLineSimulation(params)
            results = sim.run()

            # Stream time-series intervals with slight delay for dynamic visualization
            time_series = results.get("time_series", [])
            for frame in time_series:
                await websocket.send_json({"type": "telemetry_frame", "data": frame})
                await asyncio.sleep(0.08)

            await websocket.send_json({"type": "simulation_completed", "data": results})
    except WebSocketDisconnect:
        pass
    except Exception as e:
        await websocket.send_json({"type": "error", "message": str(e)})
