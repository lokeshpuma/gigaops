"""
GigaTwin - Battery Cell Production Line Discrete-Event Digital Twin
Built using SimPy for Tesla Gigafactory Autonomous Manufacturing Systems case study.

Stages:
1. Electrode Coating (Foil preparation, active material slurry coating, calendering)
2. Winding / Stacking (Electrode jelly-roll winding or prismatic/pouch Z-stacking)
3. Cell Assembly (Can insertion, tab laser welding, electrolyte precision injection)
4. AI-Vision QC Gate (Automated optical/X-ray inspection with configurable defect detection)
5. Formation & Aging (Controlled electrochemical cycling, SEI passivation layer formation)
6. Pack Integration (Module nesting, wire bonding, busbar welding, battery pack sealing)
"""

import random
import simpy
from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field


class StageConfig(BaseModel):
    name: str
    cycle_time_sec: float = Field(gt=0, description="Mean processing time per unit in seconds")
    parallel_stations: int = Field(ge=1, le=16, description="Number of parallel machines at this stage")
    variance_pct: float = Field(default=0.10, ge=0.0, le=0.50, description="Cycle time variance (+/- %)")


class SimulationParams(BaseModel):
    shift_hours: float = Field(default=8.0, ge=1.0, le=24.0, description="Shift duration in hours")
    defect_rate_pct: float = Field(default=3.5, ge=0.0, le=30.0, description="QC gate defect rate percentage")
    electrode_cycle_time: float = Field(default=12.0, ge=2.0, le=60.0)
    electrode_stations: int = Field(default=3, ge=1, le=10)
    winding_cycle_time: float = Field(default=15.0, ge=2.0, le=60.0)
    winding_stations: int = Field(default=4, ge=1, le=10)
    assembly_cycle_time: float = Field(default=18.0, ge=2.0, le=60.0)
    assembly_stations: int = Field(default=4, ge=1, le=10)
    qc_cycle_time: float = Field(default=4.0, ge=1.0, le=30.0)
    qc_stations: int = Field(default=2, ge=1, le=8)
    formation_cycle_time: float = Field(default=22.0, ge=2.0, le=90.0)
    formation_stations: int = Field(default=6, ge=1, le=16)
    pack_cycle_time: float = Field(default=20.0, ge=2.0, le=80.0)
    pack_stations: int = Field(default=4, ge=1, le=10)
    planned_downtime_minutes: float = Field(default=30.0, ge=0.0, le=120.0)
    random_seed: Optional[int] = Field(default=42)


class StageMetrics:
    def __init__(self, name: str, stations: int, cycle_time: float):
        self.name = name
        self.stations = stations
        self.cycle_time = cycle_time
        self.units_entered = 0
        self.units_completed = 0
        self.total_busy_time = 0.0
        self.queue_lengths: List[int] = []
        self.wait_times: List[float] = []

    def record_queue(self, q_len: int):
        self.queue_lengths.append(q_len)

    def avg_queue(self) -> float:
        return sum(self.queue_lengths) / max(1, len(self.queue_lengths))

    def max_queue(self) -> int:
        return max(self.queue_lengths) if self.queue_lengths else 0

    def utilization(self, total_sim_time: float) -> float:
        total_capacity_time = total_sim_time * self.stations
        if total_capacity_time <= 0:
            return 0.0
        return min(100.0, (self.total_busy_time / total_capacity_time) * 100.0)

    def avg_wait_time(self) -> float:
        return sum(self.wait_times) / max(1, len(self.wait_times))


class BatteryLineSimulation:
    def __init__(self, params: SimulationParams):
        self.params = params
        if params.random_seed is not None:
            random.seed(params.random_seed)

        self.env = simpy.Environment()
        self.sim_duration_seconds = params.shift_hours * 3600.0

        # Stage metrics tracking
        self.stages: Dict[str, StageMetrics] = {
            "Electrode Coating": StageMetrics("Electrode Coating", params.electrode_stations, params.electrode_cycle_time),
            "Winding / Stacking": StageMetrics("Winding / Stacking", params.winding_stations, params.winding_cycle_time),
            "Cell Assembly": StageMetrics("Cell Assembly", params.assembly_stations, params.assembly_cycle_time),
            "AI-Vision QC Gate": StageMetrics("AI-Vision QC Gate", params.qc_stations, params.qc_cycle_time),
            "Formation & Aging": StageMetrics("Formation & Aging", params.formation_stations, params.formation_cycle_time),
            "Pack Integration": StageMetrics("Pack Integration", params.pack_stations, params.pack_cycle_time),
        }

        # SimPy Resources
        self.resources = {
            "Electrode Coating": simpy.Resource(self.env, capacity=params.electrode_stations),
            "Winding / Stacking": simpy.Resource(self.env, capacity=params.winding_stations),
            "Cell Assembly": simpy.Resource(self.env, capacity=params.assembly_stations),
            "AI-Vision QC Gate": simpy.Resource(self.env, capacity=params.qc_stations),
            "Formation & Aging": simpy.Resource(self.env, capacity=params.formation_stations),
            "Pack Integration": simpy.Resource(self.env, capacity=params.pack_stations),
        }

        # Quality Counters
        self.total_started = 0
        self.qc_inspected = 0
        self.qc_rejected = 0
        self.qc_passed = 0
        self.packs_completed = 0

        # Time-series telemetry (sampled every 30 simulated minutes)
        self.time_series_interval = 1800.0  # 30 mins in sec
        self.time_series_records: List[Dict[str, Any]] = []

    def _sample_cycle_time(self, base_time: float) -> float:
        # Uniform variation around mean
        var = base_time * 0.10
        return max(0.5, random.uniform(base_time - var, base_time + var))

    def _cell_process(self, cell_id: int):
        self.total_started += 1

        # 1. Electrode Coating
        yield from self._run_stage("Electrode Coating", self.params.electrode_cycle_time)

        # 2. Winding / Stacking
        yield from self._run_stage("Winding / Stacking", self.params.winding_cycle_time)

        # 3. Cell Assembly
        yield from self._run_stage("Cell Assembly", self.params.assembly_cycle_time)

        # 4. AI-Vision QC Gate
        yield from self._run_stage("AI-Vision QC Gate", self.params.qc_cycle_time)
        self.qc_inspected += 1

        # Defect determination based on user configured defect_rate_pct
        is_defective = random.random() < (self.params.defect_rate_pct / 100.0)
        if is_defective:
            self.qc_rejected += 1
            # Defective cell routed to rework / scrap line, does NOT proceed to formation
            return

        self.qc_passed += 1

        # 5. Formation & Aging
        yield from self._run_stage("Formation & Aging", self.params.formation_cycle_time)

        # 6. Pack Integration
        yield from self._run_stage("Pack Integration", self.params.pack_cycle_time)
        self.packs_completed += 1

    def _run_stage(self, stage_name: str, base_time: float):
        resource = self.resources[stage_name]
        metrics = self.stages[stage_name]
        metrics.units_entered += 1
        metrics.record_queue(len(resource.queue))

        req_time = self.env.now
        with resource.request() as req:
            yield req
            wait_time = self.env.now - req_time
            metrics.wait_times.append(wait_time)

            duration = self._sample_cycle_time(base_time)
            yield self.env.timeout(duration)
            metrics.total_busy_time += duration
            metrics.units_completed += 1

    def _cell_generator(self):
        cell_id = 0
        # Feeding rate adapts to electrode capacity with small stochastic jitter
        electrode_cap = self.params.electrode_stations / self.params.electrode_cycle_time
        inter_arrival = max(0.5, 1.0 / electrode_cap)

        while True:
            self.env.process(self._cell_process(cell_id))
            cell_id += 1
            yield self.env.timeout(random.expovariate(1.0 / inter_arrival))

    def _telemetry_monitor(self):
        while True:
            yield self.env.timeout(self.time_series_interval)
            elapsed_hours = self.env.now / 3600.0
            throughput_per_hr = self.packs_completed / max(0.01, elapsed_hours)
            fpy = (self.qc_passed / max(1, self.qc_inspected)) * 100.0

            snapshot = {
                "time_hours": round(elapsed_hours, 1),
                "cumulative_packs": self.packs_completed,
                "current_throughput_uph": round(throughput_per_hr, 1),
                "qc_inspected": self.qc_inspected,
                "qc_rejected": self.qc_rejected,
                "fpy_pct": round(fpy, 2),
            }
            # Snapshot stage queues
            for name, res in self.resources.items():
                snapshot[f"{name}_queue"] = len(res.queue)

            self.time_series_records.append(snapshot)

    def run(self) -> Dict[str, Any]:
        # Start processes
        self.env.process(self._cell_generator())
        self.env.process(self._telemetry_monitor())

        # Execute simulation
        self.env.run(until=self.sim_duration_seconds)

        # Post-simulation calculations
        total_hours = self.params.shift_hours
        planned_production_sec = self.sim_duration_seconds
        operating_time_sec = max(1.0, planned_production_sec - (self.params.planned_downtime_minutes * 60.0))

        # Availability = Operating Time / Planned Production Time
        availability = min(1.0, operating_time_sec / planned_production_sec)

        # Performance = Total Good Units / (Operating Time * Ideal Run Rate)
        # Ideal run rate is bounded by slowest stage theoretical rate
        stage_capacities = {}
        for name, stage in self.stages.items():
            cap_per_sec = stage.stations / stage.cycle_time
            stage_capacities[name] = cap_per_sec

        min_capacity_per_sec = min(stage_capacities.values())
        ideal_run_units = operating_time_sec * min_capacity_per_sec
        performance = min(1.0, self.packs_completed / max(1.0, ideal_run_units))

        # Quality = Good Units / Total Units Entered Formation
        quality = (self.qc_passed / max(1, self.qc_inspected))
        fpy_pct = quality * 100.0

        # OEE = Availability * Performance * Quality
        oee_pct = (availability * performance * quality) * 100.0
        throughput_uph = self.packs_completed / total_hours

        # Identify Bottleneck Stage
        # Defined as highest average queue length + highest wait time + highest utilization
        stage_reports = []
        bottleneck_candidate = None
        max_bottleneck_score = -1.0

        for name, metrics in self.stages.items():
            util = round(metrics.utilization(self.sim_duration_seconds), 1)
            avg_q = round(metrics.avg_queue(), 2)
            max_q = metrics.max_queue()
            avg_wait = round(metrics.avg_wait_time(), 1)

            # Bottleneck score blends queue size and utilization
            score = (avg_q * 2.0) + (util * 0.8) + (avg_wait * 0.1)
            if score > max_bottleneck_score:
                max_bottleneck_score = score
                bottleneck_candidate = name

            stage_reports.append({
                "stage": name,
                "stations": metrics.stations,
                "cycle_time_sec": metrics.cycle_time,
                "utilization_pct": util,
                "avg_queue": avg_q,
                "max_queue": max_q,
                "avg_wait_sec": avg_wait,
                "units_completed": metrics.units_completed,
            })

        return {
            "summary": {
                "shift_hours": total_hours,
                "total_units_started": self.total_started,
                "packs_completed": self.packs_completed,
                "throughput_uph": round(throughput_uph, 1),
                "fpy_pct": round(fpy_pct, 2),
                "defect_rate_configured_pct": self.params.defect_rate_pct,
                "qc_inspected": self.qc_inspected,
                "qc_rejected": self.qc_rejected,
                "bottleneck_stage": bottleneck_candidate,
                "oee": {
                    "overall_pct": round(oee_pct, 1),
                    "availability_pct": round(availability * 100.0, 1),
                    "performance_pct": round(performance * 100.0, 1),
                    "quality_pct": round(quality * 100.0, 1),
                }
            },
            "stages": stage_reports,
            "time_series": self.time_series_records,
            "disclaimer": "Simulated discrete-event educational digital twin. Non-proprietary demonstration model."
        }
