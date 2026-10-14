import React, { useState, useRef, useEffect } from "react";
import {
  Camera,
  Upload,
  CheckCircle,
  AlertOctagon,
  Sparkles,
  RefreshCw
} from "lucide-react";
import { API_ENDPOINTS } from "../config";
import { FallbackVideoPlayer } from "../components/FallbackVideoPlayer";

interface SampleImage {
  id: string;
  label: string;
  defect_type: string;
  expected: string;
}

const DEFAULT_SAMPLES: SampleImage[] = [
  { id: "sample-pass-1", label: "Pristine 4680 Foil A", defect_type: "pristine_pass", expected: "pass" },
  { id: "sample-pass-2", label: "Pristine Laser Weld", defect_type: "pristine_pass", expected: "pass" },
  { id: "sample-scratch-1", label: "Electrode Surface Scratch", defect_type: "defect_scratch", expected: "reject" },
  { id: "sample-weld-1", label: "Tab Laser Weld Spatter", defect_type: "defect_weld_spatter", expected: "reject" },
  { id: "sample-pinhole-1", label: "Calendering Pinhole Void", defect_type: "defect_pinhole", expected: "reject" },
  { id: "sample-scratch-2", label: "Deep Casing Score Mark", defect_type: "defect_scratch", expected: "reject" },
];

export const VisionQC: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"gallery" | "upload" | "webcam">("gallery");
  const [selectedSample, setSelectedSample] = useState<string>("sample-pass-1");
  const [previewImage, setPreviewImage] = useState<string>(
    `${import.meta.env.BASE_URL}samples/sample-pass-1.jpg`
  );
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Webcam states
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [webcamStreaming, setWebcamStreaming] = useState(false);

  // Trigger prediction on image blob / file
  const runPrediction = async (imagePayload: { file?: File; base64?: string }) => {
    setAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      if (imagePayload.file) {
        formData.append("file", imagePayload.file);
      } else if (imagePayload.base64) {
        formData.append("image_base64", imagePayload.base64);
      }

      const res = await fetch(API_ENDPOINTS.VISION_PREDICT, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Inference API returned HTTP ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      console.error("VisionQC inference failed:", err);
      setError("Backend server is offline or waking up. Please start backend or watch fallback recording.");
    } finally {
      setAnalyzing(false);
    }
  };

  // Run on initial sample
  useEffect(() => {
    handleSelectSample("sample-pass-1");
  }, []);

  // Gallery click handler
  const handleSelectSample = async (sampleId: string) => {
    setSelectedSample(sampleId);
    const imgUrl = `${import.meta.env.BASE_URL}samples/${sampleId}.jpg`;
    setPreviewImage(imgUrl);
    setResult(null);

    try {
      // Fetch image as blob and send to backend
      const fetchRes = await fetch(imgUrl);
      const blob = await fetchRes.blob();
      const file = new File([blob], `${sampleId}.jpg`, { type: "image/jpeg" });
      runPrediction({ file });
    } catch {
      // If relative fetch fails, run with path
      setError("Cannot load sample image. Check /samples directory.");
    }
  };

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreviewImage(objectUrl);
      setSelectedSample("");
      runPrediction({ file });
    }
  };

  // Webcam controls
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setWebcamStreaming(true);
      }
    } catch (err) {
      setError("Webcam access denied or unavailable in this browser environment.");
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setWebcamStreaming(false);
    }
  };

  const captureWebcamSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL("image/jpeg", 0.9);
        setPreviewImage(base64);
        setSelectedSample("");
        runPrediction({ base64 });
      }
    }
  };

  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []);

  return (
    <div className="page-container">
      {/* Fallback Recording Player */}
      <FallbackVideoPlayer
        demoName="VisionQC AI Defect Detection"
        videoSrc="/demo-videos/visionqc_demo.mp4"
      />

      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <span className="brand-badge">DEMO 2 // AI DEFECT DETECTION</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--accent-pass)" }}>
            AUTOMATED OPTICAL INSPECTION (AOI)
          </span>
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.4rem", fontWeight: 800, color: "var(--text-white)" }}>
          VisionQC: Battery Cell & Tab Laser Weld Quality Gate
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", maxWidth: "900px" }}>
          Inference powered by an ONNX-optimized deep neural network trained to detect electrode surface scratches,
          weld spatter porosity, and calendering micro-voids prior to cell formation cycling.
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "24px",
          background: "var(--bg-card)",
          padding: "6px",
          borderRadius: "var(--radius-md)",
          width: "fit-content",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <button
          className={`btn-secondary ${activeTab === "gallery" ? "active" : ""}`}
          onClick={() => {
            stopWebcam();
            setActiveTab("gallery");
          }}
          style={activeTab === "gallery" ? { background: "var(--bg-elevated)", color: "white" } : {}}
        >
          <Sparkles size={16} />
          <span>Curated Sample Gallery</span>
        </button>
        <button
          className={`btn-secondary ${activeTab === "upload" ? "active" : ""}`}
          onClick={() => {
            stopWebcam();
            setActiveTab("upload");
          }}
          style={activeTab === "upload" ? { background: "var(--bg-elevated)", color: "white" } : {}}
        >
          <Upload size={16} />
          <span>Upload Image</span>
        </button>
        <button
          className={`btn-secondary ${activeTab === "webcam" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("webcam");
            startWebcam();
          }}
          style={activeTab === "webcam" ? { background: "var(--bg-elevated)", color: "white" } : {}}
        >
          <Camera size={16} />
          <span>Live Inspection Camera {webcamStreaming ? "(Active)" : ""}</span>
        </button>
      </div>

      {/* Main Inspection Layout */}
      <div className="split-dashboard" style={{ gridTemplateColumns: "1.1fr 0.9fr" }}>
        {/* Left Viewport: Sample Selector + Image Display */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: "24px",
          }}
        >
          {/* Mode 1: Curated Samples Gallery */}
          {activeTab === "gallery" && (
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "0.85rem", fontFamily: "var(--font-mono)", color: "var(--text-secondary)", marginBottom: "10px" }}>
                SELECT A KNOWN TEST SPECIMEN:
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                {DEFAULT_SAMPLES.map((s) => {
                  const isSelected = selectedSample === s.id;
                  const isPass = s.expected === "pass";
                  return (
                    <button
                      key={s.id}
                      onClick={() => handleSelectSample(s.id)}
                      style={{
                        padding: "10px",
                        borderRadius: "var(--radius-sm)",
                        background: isSelected ? "var(--bg-elevated)" : "var(--bg-secondary)",
                        border: `1px solid ${isSelected ? "var(--cyber-cyan)" : "var(--border-subtle)"}`,
                        textAlign: "left",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-white)", marginBottom: "4px" }}>
                        {s.label}
                      </div>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          fontFamily: "var(--font-mono)",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background: isPass ? "var(--accent-pass-bg)" : "var(--accent-reject-bg)",
                          color: isPass ? "var(--accent-pass)" : "var(--accent-reject)",
                        }}
                      >
                        Target: {s.expected.toUpperCase()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mode 2: Custom Upload */}
          {activeTab === "upload" && (
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "30px",
                  borderRadius: "var(--radius-md)",
                  border: "2px dashed var(--border-medium)",
                  background: "var(--bg-secondary)",
                  cursor: "pointer",
                }}
              >
                <Upload size={28} style={{ color: "var(--cyber-cyan)", marginBottom: "8px" }} />
                <span style={{ fontSize: "0.92rem", fontWeight: 600, color: "var(--text-white)" }}>
                  Click to choose inspection image file
                </span>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  Supports JPEG, PNG from battery inspection stations
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                />
              </label>
            </div>
          )}

          {/* Mode 3: Live Webcam */}
          {activeTab === "webcam" && (
            <div style={{ marginBottom: "20px" }}>
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  maxHeight: "360px",
                  borderRadius: "var(--radius-md)",
                  overflow: "hidden",
                  background: "black",
                  border: "1px solid var(--border-medium)",
                }}
              >
                <video
                  ref={videoRef}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} style={{ display: "none" }} />
              </div>
              <button
                className="btn-primary"
                onClick={captureWebcamSnapshot}
                style={{ width: "100%", marginTop: "12px" }}
              >
                <Camera size={16} />
                <span>Capture & Inspect Live Frame</span>
              </button>
            </div>
          )}

          {/* Inspection Viewport with Anomaly Bounding Box */}
          <div
            style={{
              position: "relative",
              background: "#050608",
              border: "1px solid var(--border-medium)",
              borderRadius: "var(--radius-md)",
              overflow: "hidden",
              minHeight: "320px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {previewImage ? (
              <div style={{ position: "relative", maxWidth: "100%", maxHeight: "400px" }}>
                <img
                  src={previewImage}
                  alt="Inspected battery cell"
                  style={{ display: "block", maxWidth: "100%", maxHeight: "400px", objectFit: "contain" }}
                />

                {/* Saliency Anomaly Bounding Box Overlay */}
                {result && result.bounding_box && result.verdict === "reject" && (
                  <div
                    style={{
                      position: "absolute",
                      left: `${(result.bounding_box.x / 224) * 100}%`,
                      top: `${(result.bounding_box.y / 224) * 100}%`,
                      width: `${(result.bounding_box.width / 224) * 100}%`,
                      height: `${(result.bounding_box.height / 224) * 100}%`,
                      border: "2px solid var(--accent-reject)",
                      boxShadow: "0 0 12px rgba(255, 23, 68, 0.6)",
                      pointerEvents: "none",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        top: "-22px",
                        left: "-2px",
                        background: "var(--accent-reject)",
                        color: "white",
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        padding: "1px 6px",
                        borderRadius: "2px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      DEFECT DETECTED
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <span style={{ color: "var(--text-muted)" }}>No specimen selected</span>
            )}
          </div>
        </div>

        {/* Right Telemetry & Results Panel */}
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
                Inspection Verdict
              </h3>
              <span className="badge-concept">ONNX Runtime CPU</span>
            </div>

            {analyzing && (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--cyber-cyan)" }}>
                <RefreshCw size={32} className="spin" style={{ animation: "spin 1s linear infinite", marginBottom: "12px" }} />
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem" }}>
                  RUNNING NEURAL CLASSIFIER INFERENCE...
                </div>
              </div>
            )}

            {!analyzing && result && (
              <div>
                {/* Prominent Verdict Card */}
                <div
                  style={{
                    padding: "20px",
                    borderRadius: "var(--radius-md)",
                    marginBottom: "20px",
                    background: result.verdict === "pass" ? "var(--accent-pass-bg)" : "var(--accent-reject-bg)",
                    border: `1px solid ${result.verdict === "pass" ? "var(--accent-pass)" : "var(--accent-reject)"}`,
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                  }}
                >
                  {result.verdict === "pass" ? (
                    <CheckCircle size={44} style={{ color: "var(--accent-pass)", flexShrink: 0 }} />
                  ) : (
                    <AlertOctagon size={44} style={{ color: "var(--accent-reject)", flexShrink: 0 }} />
                  )}
                  <div>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "1.8rem",
                        fontWeight: 800,
                        color: result.verdict === "pass" ? "var(--accent-pass)" : "var(--accent-reject)",
                        lineHeight: 1.1,
                      }}
                    >
                      {result.verdict === "pass" ? "PASS // PRISTINE" : "REJECT // DEFECT"}
                    </div>
                    <div style={{ fontSize: "0.95rem", color: "var(--text-white)", marginTop: "4px", fontWeight: 600 }}>
                      {result.defect_class || "Zero Anomaly Detected — Nominal Structure"}
                    </div>
                  </div>
                </div>

                {/* Telemetry Breakdown */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "8px" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Model Confidence:</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text-white)" }}>
                      {result.confidence_pct}%
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "8px" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Inference Latency:</span>
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--cyber-cyan)" }}>
                      {result.inference_time_ms} ms (Single CPU Core)
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "8px" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Quality Gate Action:</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: result.verdict === "pass" ? "var(--accent-pass)" : "var(--accent-warn)" }}>
                      {result.action_taken}
                    </span>
                  </div>
                </div>

                {/* Softmax Probability Distribution */}
                <div style={{ marginTop: "16px" }}>
                  <div style={{ fontSize: "0.82rem", fontFamily: "var(--font-mono)", color: "var(--text-secondary)", marginBottom: "8px" }}>
                    SOFTMAX CLASS PROBABILITIES:
                  </div>
                  {result.probabilities &&
                    Object.entries(result.probabilities).map(([cName, pVal]: any) => {
                      const pct = Math.round(pVal * 1000) / 10;
                      const isTop = pct > 50;
                      return (
                        <div key={cName} style={{ marginBottom: "8px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: "3px" }}>
                            <span style={{ color: isTop ? "var(--text-white)" : "var(--text-muted)" }}>{cName}</span>
                            <span style={{ fontFamily: "var(--font-mono)", color: isTop ? "var(--cyber-cyan)" : "var(--text-muted)" }}>
                              {pct}%
                            </span>
                          </div>
                          <div style={{ width: "100%", height: "6px", background: "var(--bg-secondary)", borderRadius: "3px", overflow: "hidden" }}>
                            <div
                              style={{
                                width: `${pct}%`,
                                height: "100%",
                                background: isTop ? (cName.includes("Pristine") ? "var(--accent-pass)" : "var(--accent-reject)") : "var(--border-medium)",
                                transition: "width 0.3s ease",
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {error && (
              <div style={{ color: "var(--accent-warn)", fontSize: "0.85rem", background: "var(--accent-warn-bg)", padding: "12px", borderRadius: "var(--radius-sm)" }}>
                {error}
              </div>
            )}
          </div>

          <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "16px", marginTop: "16px", fontSize: "0.78rem", color: "var(--text-muted)" }}>
            * VisionQC runs a local/hosted ONNX Runtime instance trained offline on battery surface and weld defects with zero data leakage.
          </div>
        </div>
      </div>
    </div>
  );
};
