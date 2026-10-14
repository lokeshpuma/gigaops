import React, { useState, useEffect } from "react";
import {
  Activity,
  Play,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Layers,
  Sparkles
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from "recharts";
import { API_ENDPOINTS } from "../config";
import { FallbackVideoPlayer } from "../components/FallbackVideoPlayer";

interface SimParams {
  shift_hours: number;
  defect_rate_pct: number;
  electrode_cycle_time: number;
  electrode_stations: number;
  winding_cycle_time: number;
  winding_stations: number;
  assembly_cycle_time: number;
  assembly_stations: number;
  qc_cycle_time: number;
  qc_stations: number;
  formation_cycle_time: number;
  formation_stations: number;
  pack_cycle_time: number;
  pack_stations: number;
  planned_downtime_minutes: number;
}

const DEFAULT_PARAMS: SimParams = {
  shift_hours: 8.0,
  defect_rate_pct: 3.5,
  electrode_cycle_time: 12.0,
  electrode_stations: 3,
  winding_cycle_time: 15.0,
  winding_stations: 4,
  assembly_cycle_time: 18.0,
  assembly_stations: 4,
  qc_cycle_time: 4.0,
  qc_stations: 2,
  formation_cycle_time: 22.0,
  formation_stations: 6,
  pack_cycle_time: 20.0,
  pack_stations: 4,
  planned_downtime_minutes: 30.0,
};

export const GigaTwin: React.FC = () => {
  const [params, setParams] = useState<SimParams>(DEFAULT_PARAMS);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Execute simulation against backend
  const executeSimulation = async (simParams: SimParams = params) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_ENDPOINTS.SIMULATION_RUN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(simParams),
      });

      if (!res.ok) {
        throw new Error(`Simulation engine returned status ${res.status}`);
      }

      const data = await res.json();
      setResults(data);
    } catch (err: any) {
      console.error("GigaTwin run failed:", err);
      setError(
        "Backend server is offline or waking up. Please start backend locally (`uvicorn app.main:app`) or watch the fallback recording."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeSimulation(DEFAULT_PARAMS);
  }, []);

  const handleSliderChange = (field: keyof SimParams, value: number) => {
    setParams((prev) => ({ ...prev, [field]: value }));
  };

  const applyPreset = (presetType: "nominal" | "high_defect" | "bottleneck") => {
    let p = { ...DEFAULT_PARAMS };
    if (presetType === "nominal") {
      p = { ...DEFAULT_PARAMS, defect_rate_pct: 2.0 };
    } else if (presetType === "high_defect") {
      p = { ...DEFAULT_PARAMS, defect_rate_pct: 18.0 };
    } else if (presetType === "bottleneck") {
      p = {
        ...DEFAULT_PARAMS,
        assembly_cycle_time: 32.0,
        assembly_stations: 2,
        defect_rate_pct: 4.0,
      };
    }
    setParams(p);
    executeSimulation(p);
  };

  return (
    <div className="page-container">
      {/* Fallback Recording Player */}
      <FallbackVideoPlayer
        demoName="GigaTwin Digital Twin"
        videoSrc="/demo-videos/gigatwin_demo.mp4"
      />

      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <span className="brand-badge">DEMO 1 // CPS DIGITAL TWIN</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--cyber-cyan)" }}>
            SIMPY DISCRETE-EVENT ENGINE
          </span>
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.4rem", fontWeight: 800, color: "var(--text-white)" }}>
          GigaTwin: Battery Cell Manufacturing Line Digital Twin
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", maxWidth: "900px" }}>
          Adjust line parameters in real time to simulate the 6-stage 4680 cell manufacturing line.
          Observe dynamic impacts on throughput (UPH), Overall Equipment Effectiveness (OEE), First-Pass Yield (FPY),
          and identify the active line bottleneck stage.
        </p>
      </div>

      {/* Presets Bar */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
          marginBottom: "24px",
          flexWrap: "wrap",
          padding: "16px 20px",
          background: "var(--bg-card)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
          FACTORY PRESETS:
        </span>
        <button className="btn-secondary" onClick={() => applyPreset("nominal")}>
          <Sparkles size={14} style={{ color: "var(--cyber-cyan)" }} />
          <span>Nominal Line (2% Defect)</span>
        </button>
        <button className="btn-secondary" onClick={() => applyPreset("high_defect")}>
          <AlertTriangle size={14} style={{ color: "var(--accent-reject)" }} />
          <span>Calendering Anomaly (18% Defect)</span>
        </button>
        <button className="btn-secondary" onClick={() => applyPreset("bottleneck")}>
          <Layers size={14} style={{ color: "var(--accent-warn)" }} />
          <span>Assembly Choke Point (Bottleneck)</span>
        </button>
      </div>

      {/* Primary Telemetry Strip */}
      {results && results.summary && (
        <div className="metrics-strip">
          <div className="metric-tile highlight">
            <div className="metric-label">
              <span>Throughput</span>
              <TrendingUp size={16} style={{ color: "var(--cyber-cyan)" }} />
            </div>
            <div className="metric-value">
              {results.summary.throughput_uph}{" "}
              <span style={{ fontSize: "1rem", color: "var(--text-muted)" }}>UPH</span>
            </div>
            <div className="metric-sub">
              {results.summary.packs_completed.toLocaleString()} good packs in {results.summary.shift_hours}h shift
            </div>
          </div>

          <div className="metric-tile">
            <div className="metric-label">
              <span>Overall OEE</span>
              <Activity size={16} style={{ color: "var(--accent-pass)" }} />
            </div>
            <div className="metric-value" style={{ color: "var(--accent-pass)" }}>
              {results.summary.oee.overall_pct}%
            </div>
            <div className="metric-sub">
              A: {results.summary.oee.availability_pct}% | P: {results.summary.oee.performance_pct}% | Q:{" "}
              {results.summary.oee.quality_pct}%
            </div>
          </div>

          <div className="metric-tile">
            <div className="metric-label">
              <span>First-Pass Yield</span>
              <CheckCircle2 size={16} style={{ color: "var(--cyber-cyan)" }} />
            </div>
            <div className="metric-value">{results.summary.fpy_pct}%</div>
            <div className="metric-sub">
              {results.summary.qc_rejected} defects rejected / {results.summary.qc_inspected} inspected
            </div>
          </div>

          <div className="metric-tile bottleneck">
            <div className="metric-label">
              <span>Critical Bottleneck</span>
              <AlertTriangle size={16} style={{ color: "var(--accent-reject)" }} />
            </div>
            <div className="metric-value" style={{ color: "var(--accent-reject)", fontSize: "1.5rem" }}>
              {results.summary.bottleneck_stage}
            </div>
            <div className="metric-sub">Stage with highest buffer queue and utilization</div>
          </div>
        </div>
      )}

      {/* Main Split Layout: Controls + Simulation Charts */}
      <div className="split-dashboard">
        {/* Controls Sidebar */}
        <div className="control-panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem", fontWeight: 700 }}>
              Simulation Controls
            </h3>
            <button
              className="btn-outline"
              style={{ padding: "4px 10px", fontSize: "0.75rem" }}
              onClick={() => {
                setParams(DEFAULT_PARAMS);
                executeSimulation(DEFAULT_PARAMS);
              }}
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          </div>

          {/* Defect Rate Slider - Key Acceptance Test */}
          <div className="slider-group" style={{ padding: "12px", background: "var(--bg-secondary)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-medium)" }}>
            <div className="slider-header">
              <span style={{ fontWeight: 600, color: "var(--accent-warn)" }}>QC Gate Defect Rate</span>
              <span className="slider-val" style={{ color: "var(--accent-warn)" }}>{params.defect_rate_pct}%</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="25.0"
              step="0.5"
              value={params.defect_rate_pct}
              onChange={(e) => handleSliderChange("defect_rate_pct", parseFloat(e.target.value))}
            />
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Acceptance Test: Modulate 2% ➔ 15% to verify live FPY drop.
            </div>
          </div>

          {/* Shift Hours */}
          <div className="slider-group">
            <div className="slider-header">
              <span>Shift Length</span>
              <span className="slider-val">{params.shift_hours} Hours</span>
            </div>
            <input
              type="range"
              min="2"
              max="24"
              step="1"
              value={params.shift_hours}
              onChange={(e) => handleSliderChange("shift_hours", parseFloat(e.target.value))}
            />
          </div>

          {/* Stage Cycle Times */}
          <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "16px" }}>
            <div style={{ fontSize: "0.85rem", fontFamily: "var(--font-mono)", color: "var(--text-secondary)", marginBottom: "12px" }}>
              STAGE CYCLE TIMES (SECONDS):
            </div>

            <div className="slider-group" style={{ marginBottom: "12px" }}>
              <div className="slider-header">
                <span>1. Electrode Coating</span>
                <span className="slider-val">{params.electrode_cycle_time}s</span>
              </div>
              <input
                type="range"
                min="4"
                max="40"
                step="1"
                value={params.electrode_cycle_time}
                onChange={(e) => handleSliderChange("electrode_cycle_time", parseFloat(e.target.value))}
              />
            </div>

            <div className="slider-group" style={{ marginBottom: "12px" }}>
              <div className="slider-header">
                <span>2. Winding / Stacking</span>
                <span className="slider-val">{params.winding_cycle_time}s</span>
              </div>
              <input
                type="range"
                min="5"
                max="40"
                step="1"
                value={params.winding_cycle_time}
                onChange={(e) => handleSliderChange("winding_cycle_time", parseFloat(e.target.value))}
              />
            </div>

            <div className="slider-group" style={{ marginBottom: "12px" }}>
              <div className="slider-header">
                <span>3. Cell Assembly</span>
                <span className="slider-val">{params.assembly_cycle_time}s</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="1"
                value={params.assembly_cycle_time}
                onChange={(e) => handleSliderChange("assembly_cycle_time", parseFloat(e.target.value))}
              />
            </div>

            <div className="slider-group" style={{ marginBottom: "12px" }}>
              <div className="slider-header">
                <span>4. QC Gate Inspection</span>
                <span className="slider-val">{params.qc_cycle_time}s</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                step="1"
                value={params.qc_cycle_time}
                onChange={(e) => handleSliderChange("qc_cycle_time", parseFloat(e.target.value))}
              />
            </div>

            <div className="slider-group" style={{ marginBottom: "12px" }}>
              <div className="slider-header">
                <span>5. Formation & Aging</span>
                <span className="slider-val">{params.formation_cycle_time}s</span>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                step="1"
                value={params.formation_cycle_time}
                onChange={(e) => handleSliderChange("formation_cycle_time", parseFloat(e.target.value))}
              />
            </div>

            <div className="slider-group">
              <div className="slider-header">
                <span>6. Pack Integration</span>
                <span className="slider-val">{params.pack_cycle_time}s</span>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                step="1"
                value={params.pack_cycle_time}
                onChange={(e) => handleSliderChange("pack_cycle_time", parseFloat(e.target.value))}
              />
            </div>
          </div>

          <button
            className="btn-primary"
            style={{ width: "100%", marginTop: "12px" }}
            onClick={() => executeSimulation()}
            disabled={loading}
          >
            <Play size={18} />
            <span>{loading ? "Simulating SimPy Line..." : "Run SimPy Simulation"}</span>
          </button>

          {error && (
            <div style={{ color: "var(--accent-warn)", fontSize: "0.82rem", background: "var(--accent-warn-bg)", padding: "10px", borderRadius: "var(--radius-sm)" }}>
              {error}
            </div>
          )}
        </div>

        {/* Charts & Stage Cards View */}
        <div>
          {/* Stage Utilization Bar Chart */}
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
              padding: "24px",
              marginBottom: "24px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 700 }}>
                  Stage Utilization & Queue Levels
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>
                  Red bar designates the active bottleneck stage (highest utilization & queue accumulation).
                </p>
              </div>
              <span className="badge-concept">Simulated Telemetry</span>
            </div>

            {results && results.stages && (
              <div style={{ height: "300px", width: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={results.stages} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                    <XAxis
                      dataKey="stage"
                      stroke="var(--text-secondary)"
                      tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      stroke="var(--text-secondary)"
                      tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                      unit="%"
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border-medium)",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="utilization_pct" name="Utilization (%)" radius={[4, 4, 0, 0]}>
                      {results.stages.map((entry: any, index: number) => {
                        const isBn = entry.stage === results.summary.bottleneck_stage;
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={isBn ? "var(--accent-reject)" : "var(--cyber-cyan)"}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Time Series Output Chart */}
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
              padding: "24px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 700 }}>
                  Cumulative Production & First-Pass Yield Over Shift
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>
                  Time-series progression simulated over {params.shift_hours} operating hours.
                </p>
              </div>
              <span className="badge-concept">Time-Series Telemetry</span>
            </div>

            {results && results.time_series && (
              <div style={{ height: "280px", width: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={results.time_series} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                    <XAxis
                      dataKey="time_hours"
                      stroke="var(--text-secondary)"
                      unit="h"
                      tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                    />
                    <YAxis
                      stroke="var(--text-secondary)"
                      tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border-medium)",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="cumulative_packs"
                      name="Packs Completed"
                      stroke="var(--accent-pass)"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="qc_rejected"
                      name="Scrapped Defective Cells"
                      stroke="var(--accent-reject)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
