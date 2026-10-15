import React from "react";
import {
  BookOpen,
  AlertTriangle
} from "lucide-react";

export const About: React.FC = () => {
  const references = [
    {
      id: 1,
      citation:
        "Tesla, Inc. (2020). Battery Day Presentation & Gigafactory Manufacturing Architecture Disclosures. Fremont, CA.",
    },
    {
      id: 2,
      citation:
        "International Society of Automation. (2018). ANSI/ISA-95 Enterprise-Control System Integration: Part 1 - Models and Terminology.",
    },
    {
      id: 3,
      citation:
        "Matloff, N. (2008). Introduction to Discrete-Event Simulation and the SimPy Language. University of California, Davis.",
    },
    {
      id: 4,
      citation:
        "Song, K., & Yan, Y. (2013). A noise robust method based on completed local binary patterns for hot-rolled steel surface defect detection. Applied Surface Science, 285, 858-864.",
    },
    {
      id: 5,
      citation:
        "Hart, P. E., Nilsson, N. J., & Raphael, B. (1968). A Formal Basis for the Heuristic Determination of Minimum Cost Paths. IEEE Transactions on Systems Science and Cybernetics, 4(2), 100-107.",
    },
    {
      id: 6,
      citation:
        "Nakajima, S. (1988). Introduction to Total Productive Maintenance (TPM). Productivity Press, Cambridge, MA. (Foundational OEE derivation).",
    },
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: "36px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--text-muted)" }}>
            AUTONOMOUS MANUFACTURING SYSTEMS
          </span>
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.4rem", fontWeight: 800, color: "var(--text-white)" }}>
          About GigaOps & Technical Report
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", maxWidth: "900px" }}>
          An educational cyber-physical manufacturing suite modeling Tesla Gigafactory battery production lines,
          automated optical inspection, and intralogistics.
        </p>
      </div>



      {/* Limitations & Educational Disclaimer (PRD §4.4 & §6 requirement) */}
      <section
        style={{
          background: "rgba(255, 179, 0, 0.06)",
          border: "1px solid rgba(255, 179, 0, 0.3)",
          borderRadius: "var(--radius-lg)",
          padding: "32px",
          marginBottom: "48px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          <AlertTriangle size={24} style={{ color: "var(--accent-warn)" }} />
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 700, color: "var(--text-white)" }}>
            Academic Model Limitations & Scope Boundaries
          </h2>
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "12px" }}>
          <strong>Educational Disclaimer:</strong> The models presented in GigaOps (GigaTwin SimPy line,
          VisionQC classifier, AGV Pathfinder) are simplified educational demonstrations developed strictly
          for academic instruction and evaluation. They are <em>not</em> production manufacturing software
          and are not validated against real proprietary Tesla factory hardware or confidential telemetry.
        </p>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.6 }}>
          All cycle times, defect ratios, and OEE figures are parameterized estimates derived from publicly reported
          manufacturing literature, Tesla Battery Day public presentations, and academic benchmarks. No claim is made
          that this simulation reproduces Tesla's proprietary MES or machine controllers.
        </p>
      </section>

      {/* Numbered Reference List (PRD §4.4 requirement) */}
      <section
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          padding: "32px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <BookOpen size={20} style={{ color: "var(--cyber-cyan)" }} />
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 700, color: "var(--text-white)" }}>
            Academic References & Industry Benchmarks
          </h2>
        </div>
        <ol style={{ paddingLeft: "24px", color: "var(--text-secondary)", lineHeight: 1.8, fontSize: "0.92rem" }}>
          {references.map((ref) => (
            <li key={ref.id} style={{ marginBottom: "10px" }}>
              <span style={{ color: "var(--text-primary)" }}>{ref.citation}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
};
