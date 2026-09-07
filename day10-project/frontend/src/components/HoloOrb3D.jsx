/**
 * 3D Holographic AI Core Orb
 * Multi-layer orbital gimbal rings with CSS 3D transforms,
 * dynamic inner plasma core, and audio-reactive ripples.
 */
export default function HoloOrb3D({ isStreaming = false, size = "md" }) {
  const dimensions = {
    sm: "h-9 w-9",
    md: "h-14 w-14",
    lg: "h-20 w-20",
  }[size] || "h-14 w-14";

  return (
    <div className={`relative ${dimensions} flex items-center justify-center`} style={{ perspective: 600 }}>
      {/* Outer ambient glow */}
      <div
        className={`absolute inset-0 rounded-full blur-xl transition-all duration-700 ${
          isStreaming
            ? "bg-cyan-500/35 scale-125"
            : "bg-indigo-500/20 scale-100 group-hover:scale-110"
        }`}
      />

      {/* 3D Orbit Ring 1 (X-Y Plane) */}
      <div
        className={`absolute inset-0 rounded-full border border-indigo-400/40 transition-all duration-300 ${
          isStreaming ? "animate-spin-slow border-cyan-400/70" : "animate-spin-slow"
        }`}
        style={{
          transformStyle: "preserve-3d",
          transform: "rotateX(68deg) rotateY(15deg)",
          boxShadow: isStreaming ? "0 0 15px rgba(56, 189, 248, 0.4)" : "none",
        }}
      />

      {/* 3D Orbit Ring 2 (Counter-rotation, Angled) */}
      <div
        className={`absolute inset-0 rounded-full border border-cyan-400/30 transition-all duration-300 ${
          isStreaming ? "animate-spin-slow-reverse border-indigo-300/80" : "animate-spin-slow-reverse"
        }`}
        style={{
          transformStyle: "preserve-3d",
          transform: "rotateX(-55deg) rotateY(40deg)",
          boxShadow: isStreaming ? "0 0 15px rgba(99, 102, 241, 0.4)" : "none",
        }}
      />

      {/* 3D Core Sphere with layered gloss and gradient */}
      <div
        className={`relative z-10 flex h-4/5 w-4/5 items-center justify-center rounded-2xl transition-all duration-500 ${
          isStreaming
            ? "bg-gradient-to-tr from-cyan-500 via-indigo-500 to-sky-300 text-slate-950 shadow-lg shadow-cyan-500/30"
            : "bg-gradient-to-tr from-indigo-900/90 via-slate-900 to-indigo-950/90 text-white border border-white/20 shadow-xl shadow-black/60"
        }`}
        style={{
          boxShadow: "0 10px 25px -5px rgba(0,0,0,0.8), inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -2px 6px rgba(0,0,0,0.6)",
          transform: "translateZ(10px)",
        }}
      >
        <span className="font-extrabold tracking-tight text-xs sm:text-sm drop-shadow-sm select-none">
          LK
        </span>

        {/* Specular highlight */}
        <div className="pointer-events-none absolute top-1 left-1.5 h-2 w-3 rounded-full bg-white/40 blur-[1px]" />
      </div>

      {/* Floating active status beacon */}
      <div className="absolute -bottom-0.5 -right-0.5 z-20 flex h-3.5 w-3.5 items-center justify-center">
        <span
          className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
            isStreaming ? "bg-cyan-400" : "bg-emerald-400"
          }`}
        />
        <span
          className={`relative inline-flex h-2 w-2 rounded-full border border-black/80 ${
            isStreaming ? "bg-cyan-400" : "bg-emerald-400"
          }`}
        />
      </div>
    </div>
  );
}
