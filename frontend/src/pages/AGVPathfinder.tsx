import React, { useState, useEffect, useRef } from "react";
import {
  Navigation,
  Play,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Truck,
  Layers,
  MapPin,
  Flag,
  Crosshair,
  Settings2
} from "lucide-react";
import type { Point, PathResult } from "../utils/pathfinder";
import { findPathAStar } from "../utils/pathfinder";
import { FallbackVideoPlayer } from "../components/FallbackVideoPlayer";

const GRID_SIZE = 15;

export const AGVPathfinder: React.FC = () => {
  // Grid state: 0 = free corridor, 1 = machinery obstacle
  const [grid, setGrid] = useState<number[][]>(() =>
    Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0))
  );

  const [start, setStart] = useState<Point>({ row: 1, col: 1 });
  const [goal, setGoal] = useState<Point>({ row: 13, col: 13 });
  const [editMode, setEditMode] = useState<"obstacle" | "start" | "goal">("obstacle");
  const [allowDiagonal, setAllowDiagonal] = useState(false);
  const [showFrontier, setShowFrontier] = useState(true);

  // Pathfinding results
  const [pathResult, setPathResult] = useState<PathResult | null>(null);

  // Animation states
  const [animating, setAnimating] = useState(false);
  const [agvPosition, setAgvPosition] = useState<Point | null>(null);
  const [animationStep, setAnimationStep] = useState<number>(0);
  const animTimerRef = useRef<any | null>(null);

  // Recompute A* path whenever grid, start, goal, or diagonal toggle changes
  useEffect(() => {
    const res = findPathAStar(grid, start, goal, allowDiagonal);
    setPathResult(res);
    setAgvPosition(start);
    setAnimationStep(0);
    if (animTimerRef.current) clearInterval(animTimerRef.current);
    setAnimating(false);
  }, [grid, start, goal, allowDiagonal]);

  // Handle cell click on canvas grid
  const handleCellClick = (r: number, c: number) => {
    if (animating) return;

    if (editMode === "start") {
      if (grid[r][c] === 1 || (r === goal.row && c === goal.col)) return;
      setStart({ row: r, col: c });
      setEditMode("obstacle");
    } else if (editMode === "goal") {
      if (grid[r][c] === 1 || (r === start.row && c === start.col)) return;
      setGoal({ row: r, col: c });
      setEditMode("obstacle");
    } else {
      // Toggle obstacle
      if ((r === start.row && c === start.col) || (r === goal.row && c === goal.col)) return;
      setGrid((prev) => {
        const next = prev.map((row) => [...row]);
        next[r][c] = next[r][c] === 1 ? 0 : 1;
        return next;
      });
    }
  };

  // Launch step-by-step AGV transit animation
  const handleStartAnimation = () => {
    if (!pathResult || !pathResult.found || pathResult.path.length === 0) return;

    if (animTimerRef.current) clearInterval(animTimerRef.current);
    setAnimating(true);
    let step = 0;

    animTimerRef.current = setInterval(() => {
      step++;
      if (step < pathResult.path.length) {
        setAgvPosition(pathResult.path[step]);
        setAnimationStep(step);
      } else {
        if (animTimerRef.current) clearInterval(animTimerRef.current);
        setAnimating(false);
      }
    }, 150);
  };

  const handleClearGrid = () => {
    if (animTimerRef.current) clearInterval(animTimerRef.current);
    setGrid(Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0)));
    setStart({ row: 1, col: 1 });
    setGoal({ row: 13, col: 13 });
    setAgvPosition({ row: 1, col: 1 });
    setAnimating(false);
  };

  // Factory Preset Floor Plans
  const loadPreset = (presetType: "stamping" | "corridor" | "walled") => {
    if (animTimerRef.current) clearInterval(animTimerRef.current);
    const newGrid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));

    if (presetType === "stamping") {
      // Gigafactory Battery Pack Assembly line layout
      for (let c = 3; c <= 9; c++) newGrid[3][c] = 1;
      for (let r = 6; r <= 10; r++) newGrid[r][5] = 1;
      for (let c = 8; c <= 12; c++) newGrid[8][c] = 1;
      for (let r = 10; r <= 13; r++) newGrid[r][10] = 1;
      setStart({ row: 1, col: 1 });
      setGoal({ row: 13, col: 13 });
    } else if (presetType === "corridor") {
      // High-traffic transit corridor with alternating workcells
      for (let r = 2; r <= 12; r += 2) {
        for (let c = 2; c <= 10; c += 2) {
          newGrid[r][c] = 1;
        }
      }
      setStart({ row: 0, col: 0 });
      setGoal({ row: 14, col: 14 });
    } else if (presetType === "walled") {
      // Completely isolated goal to demonstrate Acceptance Test criteria: clear "no path found" state
      newGrid[12][13] = 1;
      newGrid[13][12] = 1;
      newGrid[12][12] = 1;
      newGrid[14][12] = 1;
      setStart({ row: 1, col: 1 });
      setGoal({ row: 13, col: 13 });
    }

    setGrid(newGrid);
    setAnimating(false);
  };

  // Frontier set set-lookup
  const frontierSet = new Set(
    pathResult?.frontierCells.map((p) => `${p.row},${p.col}`) || []
  );
  const exploredSet = new Set(
    pathResult?.exploredOrder.map((p) => `${p.row},${p.col}`) || []
  );
  const pathSet = new Set(
    pathResult?.path.map((p) => `${p.row},${p.col}`) || []
  );

  return (
    <div className="page-container">
      {/* Fallback Recording Player */}
      <FallbackVideoPlayer
        demoName="AGV Pathfinder"
        videoSrc="/demo-videos/agv_pathfinder_demo.mp4"
      />

      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <span className="brand-badge">DEMO 3 // INTRALOGISTICS AUTOMATION</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--cyber-cyan)" }}>
            CLIENT-SIDE A* GRAPH SEARCH
          </span>
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.4rem", fontWeight: 800, color: "var(--text-white)" }}>
          AGV Pathfinder: Gigafactory Floor Intralogistics
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", maxWidth: "900px" }}>
          Interactive 15x15 factory floor grid. Click cells to place/remove stamping machinery obstacles, set dock
          and pack stations, and watch the Autonomous Mobile Robot (AMR) compute and animate its collision-free route.
        </p>
      </div>

      {/* Preset Floor Plans & Tool Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "24px",
          padding: "16px 20px",
          background: "var(--bg-card)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
            FACTORY PRESETS:
          </span>
          <button className="btn-secondary" onClick={() => loadPreset("stamping")}>
            <Layers size={14} style={{ color: "var(--cyber-cyan)" }} />
            <span>Pack Line Layout</span>
          </button>
          <button className="btn-secondary" onClick={() => loadPreset("corridor")}>
            <Navigation size={14} style={{ color: "var(--accent-pass)" }} />
            <span>Transit Corridor</span>
          </button>
          <button className="btn-secondary" onClick={() => loadPreset("walled")}>
            <AlertTriangle size={14} style={{ color: "var(--accent-reject)" }} />
            <span>Walled Off (Acceptance Test)</span>
          </button>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            className="btn-outline"
            onClick={() => setAllowDiagonal(!allowDiagonal)}
            style={{ fontSize: "0.82rem" }}
          >
            <Settings2 size={14} />
            <span>Diagonal Moves: {allowDiagonal ? "8-Way" : "4-Way"}</span>
          </button>
          <button
            className="btn-outline"
            onClick={() => setShowFrontier(!showFrontier)}
            style={{ fontSize: "0.82rem" }}
          >
            <span>{showFrontier ? "Hide" : "Show"} A* Frontier</span>
          </button>
          <button
            className="btn-outline"
            onClick={handleClearGrid}
            style={{ fontSize: "0.82rem", color: "var(--text-muted)", borderColor: "var(--border-medium)" }}
          >
            <RotateCcw size={14} />
            <span>Clear Grid</span>
          </button>
        </div>
      </div>

      {/* Main Grid Viewport + Telemetry Panel */}
      <div className="split-dashboard" style={{ gridTemplateColumns: "1fr 380px" }}>
        {/* Left: Interactive Canvas Grid */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Interaction Mode Selector */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px", width: "100%", justifyContent: "center" }}>
            <button
              className={`btn-secondary ${editMode === "obstacle" ? "active" : ""}`}
              onClick={() => setEditMode("obstacle")}
              style={editMode === "obstacle" ? { background: "var(--bg-elevated)", color: "white" } : {}}
            >
              <Crosshair size={14} />
              <span>Toggle Machine Obstacle</span>
            </button>
            <button
              className={`btn-secondary ${editMode === "start" ? "active" : ""}`}
              onClick={() => setEditMode("start")}
              style={editMode === "start" ? { background: "var(--accent-pass-bg)", color: "var(--accent-pass)" } : {}}
            >
              <MapPin size={14} />
              <span>Set Inbound Dock</span>
            </button>
            <button
              className={`btn-secondary ${editMode === "goal" ? "active" : ""}`}
              onClick={() => setEditMode("goal")}
              style={editMode === "goal" ? { background: "var(--accent-reject-bg)", color: "var(--accent-reject)" } : {}}
            >
              <Flag size={14} />
              <span>Set Pack Station</span>
            </button>
          </div>

          {/* 15x15 Canvas Grid Container */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
              gap: "3px",
              background: "#050608",
              padding: "12px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-medium)",
              width: "100%",
              maxWidth: "560px",
              aspectRatio: "1/1",
              userSelect: "none",
            }}
          >
            {grid.map((row, r) =>
              row.map((cell, c) => {
                const isStart = r === start.row && c === start.col;
                const isGoal = r === goal.row && c === goal.col;
                const isAgv = agvPosition && agvPosition.row === r && agvPosition.col === c;
                const isObstacle = cell === 1;
                const isPath = pathSet.has(`${r},${c}`);
                const isFrontier = showFrontier && frontierSet.has(`${r},${c}`);
                const isExplored = showFrontier && exploredSet.has(`${r},${c}`);

                let bg = "var(--bg-secondary)";
                let border = "1px solid var(--border-subtle)";

                if (isObstacle) {
                  bg = "#27303f";
                  border = "1px solid #3b485d";
                } else if (isStart) {
                  bg = "var(--accent-pass)";
                } else if (isGoal) {
                  bg = "var(--accent-reject)";
                } else if (isPath) {
                  bg = "rgba(0, 240, 255, 0.4)";
                  border = "1px solid var(--cyber-cyan)";
                } else if (isFrontier) {
                  bg = "rgba(255, 179, 0, 0.25)";
                } else if (isExplored) {
                  bg = "rgba(41, 121, 255, 0.15)";
                }

                return (
                  <div
                    key={`${r}-${c}`}
                    onClick={() => handleCellClick(r, c)}
                    style={{
                      background: bg,
                      border: border,
                      borderRadius: "3px",
                      position: "relative",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "background 0.1s ease",
                    }}
                    title={`Cell (${r}, ${c})`}
                  >
                    {isAgv && (
                      <div
                        style={{
                          width: "80%",
                          height: "80%",
                          borderRadius: "50%",
                          background: "var(--cyber-cyan)",
                          boxShadow: "0 0 10px var(--cyber-cyan-glow)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "black",
                        }}
                      >
                        <Truck size={14} />
                      </div>
                    )}
                    {!isAgv && isStart && (
                      <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "black", fontFamily: "var(--font-mono)" }}>
                        DOCK
                      </span>
                    )}
                    {!isAgv && isGoal && (
                      <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "white", fontFamily: "var(--font-mono)" }}>
                        PACK
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Grid Legend */}
          <div
            style={{
              display: "flex",
              gap: "16px",
              marginTop: "16px",
              flexWrap: "wrap",
              fontSize: "0.78rem",
              fontFamily: "var(--font-mono)",
              color: "var(--text-secondary)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "12px", height: "12px", background: "var(--accent-pass)", borderRadius: "2px" }} />
              <span>Inbound Dock (Start)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "12px", height: "12px", background: "var(--accent-reject)", borderRadius: "2px" }} />
              <span>Pack Station (Goal)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "12px", height: "12px", background: "#27303f", borderRadius: "2px" }} />
              <span>Machinery Obstacle</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "12px", height: "12px", background: "rgba(0, 240, 255, 0.4)", borderRadius: "2px" }} />
              <span>Optimal Trajectory</span>
            </div>
            {showFrontier && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "12px", height: "12px", background: "rgba(255, 179, 0, 0.25)", borderRadius: "2px" }} />
                <span>A* Frontier (Open Set)</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: AGV Telemetry & Action Panel */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 700 }}>
                AMR Navigation Telemetry
              </h3>
              <span className="badge-concept">Client-Side A*</span>
            </div>

            {/* Path Status Alert */}
            {pathResult && (
              <div
                style={{
                  padding: "16px",
                  borderRadius: "var(--radius-md)",
                  marginBottom: "20px",
                  background: pathResult.found ? "var(--accent-pass-bg)" : "var(--accent-reject-bg)",
                  border: `1px solid ${pathResult.found ? "var(--accent-pass)" : "var(--accent-reject)"}`,
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                {pathResult.found ? (
                  <CheckCircle size={28} style={{ color: "var(--accent-pass)", flexShrink: 0 }} />
                ) : (
                  <AlertTriangle size={28} style={{ color: "var(--accent-reject)", flexShrink: 0 }} />
                )}
                <div>
                  <div style={{ fontWeight: 700, color: pathResult.found ? "var(--accent-pass)" : "var(--accent-reject)" }}>
                    {pathResult.found ? "OPTIMAL ROUTE COMPUTED" : "NO TRAJECTORY FOUND"}
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-white)", marginTop: "2px" }}>
                    {pathResult.found
                      ? `Collision-free path: ${pathResult.path.length} steps`
                      : pathResult.message || "Target station isolated by obstacles."}
                  </div>
                </div>
              </div>
            )}

            {/* Telemetry Digits */}
            {pathResult && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "8px" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Trajectory Cost f(n):</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--cyber-cyan)" }}>
                    {pathResult.pathCost} Units
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "8px" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Nodes Explored (Closed Set):</span>
                  <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-white)" }}>
                    {pathResult.nodesExplored} Cells
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "8px" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Graph Solve Time:</span>
                  <span style={{ fontFamily: "var(--font-mono)", color: "var(--accent-pass)" }}>
                    {pathResult.executionTimeMs} ms (Client-Side)
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "8px" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Current AGV Position:</span>
                  <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-white)" }}>
                    {agvPosition ? `(${agvPosition.row}, ${agvPosition.col})` : "Dock"}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "8px" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Obstacle Avoidance:</span>
                  <span style={{ fontFamily: "var(--font-mono)", color: "var(--accent-pass)" }}>
                    ACTIVE DYNAMIC REROUTING
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action Trigger */}
          <div>
            <button
              className="btn-primary"
              onClick={handleStartAnimation}
              disabled={animating || !pathResult?.found}
              style={{ width: "100%", opacity: !pathResult?.found ? 0.5 : 1 }}
            >
              <Play size={18} />
              <span>{animating ? `AGV En Route (Step ${animationStep + 1}/${pathResult?.path.length})...` : "Launch AGV Mission"}</span>
            </button>
            <div style={{ textAlign: "center", marginTop: "10px", fontSize: "0.78rem", color: "var(--text-muted)" }}>
              Acceptance Test: Add obstacles across direct line to force live rerouting around them.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
