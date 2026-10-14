import React from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Eye,
  Navigation,
  ArrowRight,
  Zap,
  ExternalLink
} from "lucide-react";

export const Home: React.FC = () => {
  const conceptMappings = [
    {
      concept: "Cyber-Physical Systems (CPS) & IIoT Telemetry",
      demo: "GigaTwin Digital Twin",
      demoPath: "/gigatwin",
      teslaExample: "Gigafactory Texas 4680 battery line telemetry streaming machine cycles into SCADA / MES systems.",
      techStack: "SimPy discrete-event simulation engine, Python async queues, WebSocket time-series streaming",
    },
    {
      concept: "Discrete-Event Simulation & Bottleneck Optimization",
      demo: "GigaTwin Digital Twin",
      demoPath: "/gigatwin",
      teslaExample: "Theory of Constraints (TOC) applied to electrode coating & assembly queues to maximize shift throughput.",
      techStack: "Resource queue modeling, stochastic cycle times, OEE breakdown (Availability x Performance x Quality)",
    },
    {
      concept: "Machine Vision Quality Control Gate (AOI)",
      demo: "VisionQC Defect Detection",
      demoPath: "/visionqc",
      teslaExample: "High-speed automated optical & laser inspection of battery can weld beads and electrode slurry coating.",
      techStack: "ConvNet-B4 CNN, ONNX Runtime CPU inference (<15ms), gradient-saliency anomaly bounding boxes",
    },
    {
      concept: "Autonomous Mobile Robots (AMR / AGV)",
      demo: "AGV Pathfinder",
      demoPath: "/agv-pathfinder",
      teslaExample: "Intralogistics fleet moving stamped chassis parts and battery modules between presses and pack lines.",
      techStack: "Client-side TypeScript A* graph search, dynamic obstacle rerouting, frontier open/closed set visualization",
    },
    {
      concept: "First-Pass Yield (FPY) & Scrap Mitigation",
      demo: "GigaTwin + VisionQC Integration",
      demoPath: "/gigatwin",
      teslaExample: "Diverting micro-fissured cells prior to formation cycling to prevent lithium thermal runaway and scrap propagation.",
      techStack: "Dynamic scrap routing, real-time FPY % computation, parametric sensitivity analysis",
    },
  ];

  return (
    <div className="page-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-pill">
          <Zap size={14} style={{ color: "var(--tesla-red)" }} />
          <span>COURSE 22RI751 // AUTONOMOUS MANUFACTURING SYSTEMS</span>
        </div>

        <h1 className="hero-title">
          GigaOps: Autonomous Manufacturing Systems
        </h1>

        <p className="hero-subtitle">
          An interactive, deployable demonstration suite mirroring Tesla Gigafactory's
          cyber-physical production stack — featuring discrete-event digital twins,
          deep learning optical quality control, and client-side AGV intralogistics.
        </p>

        <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/gigatwin" className="btn-primary">
            <Activity size={18} />
            <span>Launch GigaTwin</span>
          </Link>
          <Link to="/visionqc" className="btn-secondary">
            <Eye size={18} />
            <span>Inspect VisionQC</span>
          </Link>
          <Link to="/agv-pathfinder" className="btn-secondary">
            <Navigation size={18} />
            <span>Explore AGV Pathfinder</span>
          </Link>
        </div>
      </section>

      {/* 3 Core Interactive Demos Grid */}
      <section>
        <div className="demos-grid">
          {/* Card 1: GigaTwin */}
          <div className="demo-card">
            <div>
              <div className="card-icon-wrap" style={{ color: "var(--cyber-cyan)" }}>
                <Activity size={28} />
              </div>
              <h2 className="card-title">1. GigaTwin</h2>
              <p className="card-desc">
                Discrete-event digital twin of a 4680 battery manufacturing line. Adjust stage cycle
                times and defect probabilities to observe live simulated throughput, OEE breakdown, and
                bottleneck queues.
              </p>
              <div className="card-meta">
                <span className="meta-tag">SimPy Engine</span>
                <span className="meta-tag">OEE / FPY Telemetry</span>
                <span className="meta-tag">Bottleneck Analysis</span>
              </div>
            </div>
            <Link to="/gigatwin" className="btn-primary" style={{ width: "100%" }}>
              <span>Open GigaTwin Demo</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Card 2: VisionQC */}
          <div className="demo-card">
            <div>
              <div className="card-icon-wrap" style={{ color: "var(--accent-pass)" }}>
                <Eye size={28} />
              </div>
              <h2 className="card-title">2. VisionQC</h2>
              <p className="card-desc">
                Automated Optical Inspection (AOI) powered by an ONNX neural network. Upload cell
                photos or use live webcam to detect surface scratches, laser weld spatter, and calendering pinholes.
              </p>
              <div className="card-meta">
                <span className="meta-tag">ONNX Runtime</span>
                <span className="meta-tag">Live Camera / Gallery</span>
                <span className="meta-tag">Anomaly Bounding Boxes</span>
              </div>
            </div>
            <Link to="/visionqc" className="btn-primary" style={{ width: "100%" }}>
              <span>Open VisionQC Demo</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Card 3: AGV Pathfinder */}
          <div className="demo-card">
            <div>
              <div className="card-icon-wrap" style={{ color: "var(--accent-warn)" }}>
                <Navigation size={28} />
              </div>
              <h2 className="card-title">3. AGV Pathfinder</h2>
              <p className="card-desc">
                Interactive Gigafactory floor grid for Autonomous Guided Vehicles. Place stamping machinery
                obstacles, set material docks, and watch client-side A* pathfinding animate optimal collision-free routes.
              </p>
              <div className="card-meta">
                <span className="meta-tag">Client-Side Canvas</span>
                <span className="meta-tag">A* Pathfinding</span>
                <span className="meta-tag">Frontier Visualization</span>
              </div>
            </div>
            <Link to="/agv-pathfinder" className="btn-primary" style={{ width: "100%" }}>
              <span>Open AGV Pathfinder Demo</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Module 5 Concept-Mapping Table (PRD §4.4 requirement) */}
      <section className="concept-table-wrap">
        <div className="section-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span className="brand-badge">EVALUATION CRITERIA</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--text-muted)" }}>
              SYLLABUS ALIGNMENT
            </span>
          </div>
          <h2 className="section-title">Module 5 Concept-Mapping Matrix</h2>
          <p className="section-subtitle">
            Direct mapping between core autonomous manufacturing syllabus concepts, the interactive GigaOps demos,
            and real-world Tesla Gigafactory operational practices.
          </p>
        </div>

        <div className="table-responsive">
          <table className="concept-table">
            <thead>
              <tr>
                <th style={{ width: "24%" }}>Syllabus Concept</th>
                <th style={{ width: "18%" }}>GigaOps Demo</th>
                <th style={{ width: "32%" }}>Tesla Gigafactory Case Study Context</th>
                <th style={{ width: "26%" }}>Implementation Architecture</th>
              </tr>
            </thead>
            <tbody>
              {conceptMappings.map((row, idx) => (
                <tr key={idx}>
                  <td>
                    <div style={{ fontWeight: 600, color: "var(--text-white)", marginBottom: "4px" }}>
                      {row.concept}
                    </div>
                  </td>
                  <td>
                    <Link to={row.demoPath} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <span className="badge-concept">{row.demo}</span>
                      <ExternalLink size={12} style={{ color: "var(--cyber-cyan)" }} />
                    </Link>
                  </td>
                  <td>
                    <div style={{ color: "var(--text-secondary)", fontSize: "0.92rem", lineHeight: 1.5 }}>
                      {row.teslaExample}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                      {row.techStack}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
