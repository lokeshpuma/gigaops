/**
 * Global API and environment configuration.
 * Adapts automatically between local development and hosted deployments.
 */

export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:8000"
    : "");

export const API_ENDPOINTS = {
  HEALTH: `${BACKEND_URL}/api/health`,
  SIMULATION_RUN: `${BACKEND_URL}/api/simulation/run`,
  SIMULATION_PRESETS: `${BACKEND_URL}/api/simulation/presets`,
  SIMULATION_WS: BACKEND_URL
    ? `${BACKEND_URL.replace(/^http/, "ws")}/api/simulation/ws`
    : `ws://${typeof window !== "undefined" ? window.location.host : "localhost:8000"}/api/simulation/ws`,
  VISION_PREDICT: `${BACKEND_URL}/api/vision/predict`,
  VISION_SAMPLES: `${BACKEND_URL}/api/vision/samples`,
};
