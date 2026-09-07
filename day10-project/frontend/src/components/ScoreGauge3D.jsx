import { useEffect, useState } from "react";

export default function ScoreGauge3D({ score = 0, size = 180 }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const end = Math.min(100, Math.max(0, score));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setAnimatedScore(end);
      return;
    }

    let start = 0;
    const duration = 800;
    const stepTime = 16;
    const steps = duration / stepTime;
    const increment = (end - start) / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setAnimatedScore(end);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.round(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [score]);

  // Color dynamics
  const getTheme = (val) => {
    if (val >= 80) {
      return {
        stroke: "#10b981",
        glow: "rgba(16, 185, 129, 0.3)",
        gradient: ["#34d399", "#059669"],
        textClass: "text-emerald-400",
        label: "Exceptional Match",
      };
    }
    if (val >= 60) {
      return {
        stroke: "#38bdf8",
        glow: "rgba(56, 189, 248, 0.3)",
        gradient: ["#38bdf8", "#0284c7"],
        textClass: "text-sky-400",
        label: "Strong Fit",
      };
    }
    if (val >= 40) {
      return {
        stroke: "#f59e0b",
        glow: "rgba(245, 158, 11, 0.3)",
        gradient: ["#fbbf24", "#d97706"],
        textClass: "text-amber-400",
        label: "Partial Alignment",
      };
    }
    return {
      stroke: "#f43f5e",
      glow: "rgba(244, 63, 94, 0.3)",
      gradient: ["#fb7185", "#e11d48"],
      textClass: "text-rose-400",
      label: "Low Fit",
    };
  };

  const theme = getTheme(score);

  const radius = 64;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  return (
    <div
      className="relative flex flex-col items-center justify-center"
      style={{ perspective: 1000 }}
    >
      {/* 3D Gauge Container with layered rings */}
      <div
        className="relative flex items-center justify-center rounded-full p-4 transition-transform duration-300"
        style={{
          width: size,
          height: size,
          transformStyle: "preserve-3d",
          boxShadow: `0 20px 40px -10px rgba(0,0,0,0.8), 0 0 35px -5px ${theme.glow}`,
          background: "radial-gradient(circle at 50% 30%, rgba(30, 41, 59, 0.6) 0%, rgba(9, 13, 24, 0.95) 75%)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
        }}
      >
        {/* SVG Circular Progress Track */}
        <svg
          className="absolute inset-0 h-full w-full -rotate-90 transform"
          viewBox="0 0 160 160"
        >
          <defs>
            <linearGradient id="scoreGaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={theme.gradient[0]} />
              <stop offset="100%" stopColor={theme.gradient[1]} />
            </linearGradient>
            <filter id="gaugeShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={theme.stroke} floodOpacity="0.5" />
            </filter>
          </defs>

          {/* Background Inset Track */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.06)"
            strokeWidth={strokeWidth}
          />

          {/* Active 3D Glowing Progress Arc */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="url(#scoreGaugeGrad)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            filter="url(#gaugeShadow)"
            style={{
              transition: "stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </svg>

        {/* 3D Center Floating Metallic Bevel Disc */}
        <div
          className="relative z-10 flex h-24 w-24 flex-col items-center justify-center rounded-full border border-white/10 text-center shadow-inner"
          style={{
            background: "linear-gradient(145deg, #131b2e 0%, #080c18 100%)",
            boxShadow: "0 6px 16px rgba(0,0,0,0.8), inset 0 2px 4px rgba(255,255,255,0.2), inset 0 -2px 4px rgba(0,0,0,0.6)",
            transform: "translateZ(14px)",
          }}
        >
          <div className="flex items-baseline">
            <span className={`text-3xl font-extrabold tracking-tight ${theme.textClass}`}>
              {animatedScore}
            </span>
            <span className="text-xs font-semibold text-slate-500">%</span>
          </div>

          <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
            Score
          </span>
        </div>
      </div>
    </div>
  );
}
