import React, { useState } from "react";
import { PlayCircle, ChevronDown, ChevronUp, Video } from "lucide-react";

interface FallbackVideoPlayerProps {
  demoName: string;
  videoSrc: string;
}

export const FallbackVideoPlayer: React.FC<FallbackVideoPlayerProps> = ({
  demoName,
  videoSrc,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ marginBottom: "28px" }}>
      <div className="fallback-banner">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "rgba(0, 240, 255, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--cyber-cyan)",
            }}
          >
            <Video size={18} />
          </div>
          <div>
            <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-white)" }}>
              Live demo unavailable or server waking up?
            </div>
            <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
              Watch the pre-recorded 40-second HD rehearsal demonstration of {demoName} in action.
            </div>
          </div>
        </div>

        <button
          className="btn-outline"
          onClick={() => setIsOpen(!isOpen)}
          style={{ whiteSpace: "nowrap" }}
        >
          <PlayCircle size={16} />
          <span>{isOpen ? "Hide Recording" : "Watch Recording"}</span>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {isOpen && (
        <div className="fallback-video-box">
          <div
            style={{
              padding: "10px 16px",
              background: "rgba(21, 24, 31, 0.95)",
              borderBottom: "1px solid var(--border-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "0.82rem",
              fontFamily: "var(--font-mono)",
              color: "var(--cyber-cyan)",
            }}
          >
            <span>[BACKUP VIDEO FEED] // {demoName.toUpperCase()} REHEARSAL PLAYBACK</span>
            <span style={{ color: "var(--accent-pass)" }}>● 1080P ARCHIVED RUN</span>
          </div>
          <video
            src={videoSrc}
            controls
            autoPlay
            loop
            playsInline
            style={{ width: "100%", maxHeight: "540px", objectFit: "contain", background: "#000" }}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      )}
    </div>
  );
};
