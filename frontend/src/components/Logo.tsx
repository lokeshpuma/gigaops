import React from "react";

interface LogoProps {
  size?: number;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 32, className = "" }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="gigaopsLogoGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E82127" />
          <stop offset="45%" stopColor="#FF334B" />
          <stop offset="100%" stopColor="#00F0FF" />
        </linearGradient>
        <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#E82127" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Outer cybernetic faceted frame */}
      <path
        d="M24 4L42 14.5V33.5L24 44L6 33.5V14.5L24 4Z"
        stroke="url(#gigaopsLogoGrad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="var(--bg-card)"
      />

      {/* Cybernetic geometric G path */}
      <path
        d="M32 18.5C29.8 15.2 26.2 13.8 22.5 13.8C16.2 13.8 12.5 18.5 12.5 24C12.5 29.5 16.5 34.2 22.5 34.2C28.5 34.2 32.5 30 32.5 24.5H22.5"
        stroke="url(#gigaopsLogoGrad)"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Optical core sensor diode & alignment markers */}
      <circle cx="22.5" cy="24.5" r="2.5" fill="#00F0FF" />
      <circle cx="24" cy="4" r="1.5" fill="#E82127" />
      <circle cx="42" cy="14.5" r="1.5" fill="#00F0FF" />
      <circle cx="6" cy="33.5" r="1.5" fill="#FF334B" />
    </svg>
  );
};

export default Logo;
