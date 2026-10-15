import React from "react";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { Logo } from "./components/Logo";
import { Home } from "./pages/Home";
import { GigaTwin } from "./pages/GigaTwin";
import { VisionQC } from "./pages/VisionQC";
import { AGVPathfinder } from "./pages/AGVPathfinder";
import { About } from "./pages/About";

export const App: React.FC = () => {
  return (
    <Router>
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        {/* Persistent Top Navigation Bar */}
        <Navbar />

        {/* Dynamic Route View */}
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/gigatwin" element={<GigaTwin />} />
            <Route path="/visionqc" element={<VisionQC />} />
            <Route path="/agv-pathfinder" element={<AGVPathfinder />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="app-footer">
          <div className="footer-inner">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <Logo size={24} />
                <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--text-white)", letterSpacing: "-0.02em" }}>
                  GIGAOPS
                </span>
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                Autonomous Manufacturing Systems
              </div>
            </div>

            <div className="footer-disclaimer">
              Educational simulation prototype developed for academic study. Not affiliated with or endorsed
              by Tesla, Inc. All simulation data and defect classifications are computed via open-source
              models and synthetic industrial benchmarks.
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;
