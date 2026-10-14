import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Activity,
  Eye,
  Navigation,
  Info,
  Layers
} from "lucide-react";
import { API_ENDPOINTS } from "../config";

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;
    const checkHealth = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.HEALTH);
        if (res.ok) {
          if (isMounted) setBackendOnline(true);
        } else {
          if (isMounted) setBackendOnline(false);
        }
      } catch {
        if (isMounted) setBackendOnline(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const navItems = [
    { path: "/", label: "Home", icon: Layers },
    { path: "/gigatwin", label: "GigaTwin", icon: Activity },
    { path: "/visionqc", label: "VisionQC", icon: Eye },
    { path: "/agv-pathfinder", label: "AGV Pathfinder", icon: Navigation },
    { path: "/about", label: "About & Report", icon: Info },
  ];

  return (
    <header style={{ borderBottom: "1px solid var(--border-subtle)", background: "rgba(8, 9, 11, 0.9)", backdropFilter: "blur(12px)" }}>
      <nav className="navbar">
        <Link to="/" className="nav-brand">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "var(--text-white)", letterSpacing: "-0.03em" }}>GIGAOPS</span>
            <span className="brand-badge">TESLA CASE STUDY</span>
          </div>
        </Link>

        <div className="nav-links">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? "active" : ""}`}
              >
                <Icon size={16} className="nav-icon" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="nav-status" title={backendOnline ? "FastAPI Backend Online" : "FastAPI Backend Offline / Waking Up"}>
          <span className={`status-dot ${backendOnline === false ? "offline" : ""}`} />
          <span>
            {backendOnline === null
              ? "CONNECTING..."
              : backendOnline
              ? "BACKEND ONLINE"
              : "OFFLINE / LOCAL"}
          </span>
        </div>
      </nav>
    </header>
  );
};
