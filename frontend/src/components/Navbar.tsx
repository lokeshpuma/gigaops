import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Activity,
  Eye,
  Navigation,
  Info,
  Layers,
  Sun,
  Moon
} from "lucide-react";
import { API_ENDPOINTS } from "../config";
import { Logo } from "./Logo";

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("gigaops-theme") as "dark" | "light") || "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("gigaops-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

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
    <header className="app-header">
      <nav className="navbar">
        <Link to="/" className="nav-brand">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Logo size={28} />
            <span style={{ color: "var(--text-white)", letterSpacing: "-0.03em" }}>GIGAOPS</span>
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

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            type="button"
            onClick={toggleTheme}
            className="theme-toggle-btn"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle Light and Dark Mode"
          >
            {theme === "dark" ? (
              <Sun size={18} style={{ color: "var(--accent-warn)" }} />
            ) : (
              <Moon size={18} style={{ color: "var(--cyber-cyan)" }} />
            )}
          </button>

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
        </div>
      </nav>
    </header>
  );
};
