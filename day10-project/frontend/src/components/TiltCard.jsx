import { useState, useRef, useCallback } from "react";

/**
 * Premium interactive 3D Tilt Card.
 * Uses GPU-accelerated 3D transforms (rotateX, rotateY, translateZ)
 * combined with dynamic specular lighting glare that tracks cursor coordinates.
 * Disables transform on touch devices or when prefers-reduced-motion is active.
 */
export default function TiltCard({
  children,
  className = "",
  tiltAmount = 8,
  glare = true,
  onClick,
  style = {}
}) {
  const cardRef = useRef(null);
  const [transform, setTransform] = useState({
    rotateX: 0,
    rotateY: 0,
    glareX: 50,
    glareY: 50,
    glareOpacity: 0,
    isHovered: false,
  });

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Normalized from -1 to 1
    const normX = (x / rect.width) * 2 - 1;
    const normY = (y / rect.height) * 2 - 1;

    setTransform({
      rotateX: -normY * tiltAmount,
      rotateY: normX * tiltAmount,
      glareX: (x / rect.width) * 100,
      glareY: (y / rect.height) * 100,
      glareOpacity: 0.15,
      isHovered: true,
    });
  }, [tiltAmount]);

  const handleMouseLeave = useCallback(() => {
    setTransform({
      rotateX: 0,
      rotateY: 0,
      glareX: 50,
      glareY: 50,
      glareOpacity: 0,
      isHovered: false,
    });
  }, []);

  return (
    <div
      style={{ perspective: 1200 }}
      className="preserve-3d"
    >
      <div
        ref={cardRef}
        onClick={onClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg) ${
            transform.isHovered ? "translateZ(6px)" : "translateZ(0px)"
          }`,
          transformStyle: "preserve-3d",
          transition: transform.isHovered
            ? "transform 0.08s ease-out, box-shadow 0.15s ease-out"
            : "transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.5s ease-out",
          ...style,
        }}
        className={`relative overflow-hidden rounded-2xl ${className}`}
      >
        {/* Dynamic Specular Sheen Layer */}
        {glare && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-20 rounded-2xl transition-opacity duration-300"
            style={{
              opacity: transform.glareOpacity,
              background: `radial-gradient(circle at ${transform.glareX}% ${transform.glareY}%, rgba(255, 255, 255, 0.35) 0%, rgba(99, 102, 241, 0.1) 35%, transparent 70%)`,
            }}
          />
        )}

        {/* Content with preserve-3d */}
        <div className="relative z-10 h-full w-full">
          {children}
        </div>
      </div>
    </div>
  );
}
