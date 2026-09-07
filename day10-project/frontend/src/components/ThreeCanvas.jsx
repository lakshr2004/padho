import { useEffect, useRef } from "react";

/**
 * High-performance 3D Wireframe Polyhedron & Particle Depth Field
 * Built with native Canvas 3D vector rotation matrix and perspective projection.
 * Zero-lag 60fps rendering that dynamically reacts to mouse tilt and streaming states.
 * Respects tab visibility and prefers-reduced-motion for optimal GPU/battery performance.
 */
export default function ThreeCanvas({ isStreaming = false }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const ctx = canvas.getContext("2d");
    let animationFrameId;
    let width = (canvas.width = canvas.parentElement.clientWidth);
    let height = (canvas.height = canvas.parentElement.clientHeight);

    let mouseX = 0;
    let mouseY = 0;
    let targetRotX = 0;
    let targetRotY = 0;
    let rotX = 0.4;
    let rotY = 0.5;
    let rotZ = 0.2;
    let isPaused = false;

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / width - 0.5;
      const y = (e.clientY - rect.top) / height - 0.5;
      mouseX = x;
      mouseY = y;
      targetRotY = x * 1.5;
      targetRotX = -y * 1.5;
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isPaused = true;
        cancelAnimationFrame(animationFrameId);
      } else {
        isPaused = false;
        animationFrameId = requestAnimationFrame(render);
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Generate 3D Icosahedron Vertices & Edges
    const phi = (1 + Math.sqrt(5)) / 2;
    const baseVertices = [
      [-1,  phi, 0], [ 1,  phi, 0], [-1, -phi, 0], [ 1, -phi, 0],
      [ 0, -1,  phi], [ 0,  1,  phi], [ 0, -1, -phi], [ 0,  1, -phi],
      [  phi, 0, -1], [  phi, 0,  1], [ -phi, 0, -1], [ -phi, 0,  1]
    ];

    // Normalize vertices
    const vertices = baseVertices.map(v => {
      const len = Math.hypot(v[0], v[1], v[2]);
      return [v[0] / len, v[1] / len, v[2] / len];
    });

    // Generate edges connecting vertices with distance < 1.1
    const edges = [];
    for (let i = 0; i < vertices.length; i++) {
      for (let j = i + 1; j < vertices.length; j++) {
        const d = Math.hypot(
          vertices[i][0] - vertices[j][0],
          vertices[i][1] - vertices[j][1],
          vertices[i][2] - vertices[j][2]
        );
        if (d < 1.1) {
          edges.push([i, j]);
        }
      }
    }

    // Floating 3D Star/Data particles
    const particleCount = 40;
    const particles = Array.from({ length: particleCount }, () => ({
      x: (Math.random() - 0.5) * 800,
      y: (Math.random() - 0.5) * 600,
      z: (Math.random() - 0.5) * 600,
      size: Math.random() * 2 + 1,
      speedZ: Math.random() * 0.4 + 0.2,
      opacity: Math.random() * 0.4 + 0.2
    }));

    let tick = 0;

    const render = () => {
      if (isPaused) return;
      tick++;
      ctx.clearRect(0, 0, width, height);

      // Smooth camera interpolation towards mouse target
      rotX += (targetRotX - rotX) * 0.05 + 0.003 * (isStreaming ? 2.5 : 1);
      rotY += (targetRotY - rotY) * 0.05 + 0.005 * (isStreaming ? 2.5 : 1);
      rotZ += 0.001;

      // Draw subtle perspective grid waves
      const cx = width / 2;
      const cy = height * 0.45;
      const fov = 420;
      const scale = 160 * (isStreaming ? 1.08 + Math.sin(tick * 0.1) * 0.05 : 1);

      // 1. Render Background Floating 3D Particles
      particles.forEach(p => {
        p.z -= p.speedZ * (isStreaming ? 2 : 1);
        if (p.z < -300) p.z = 300;

        const pFov = 350;
        const pz = p.z + 400;
        if (pz > 0) {
          const projX = cx + (p.x + mouseX * 80) * (pFov / pz);
          const projY = cy + (p.y + mouseY * 80) * (pFov / pz);

          if (projX >= 0 && projX <= width && projY >= 0 && projY <= height) {
            const alpha = Math.max(0, Math.min(1, (1 - p.z / 300) * 0.35 * p.opacity));
            ctx.fillStyle = isStreaming 
              ? `rgba(56, 189, 248, ${alpha})`
              : `rgba(129, 140, 248, ${alpha})`;
            ctx.beginPath();
            ctx.arc(projX, projY, p.size * (pFov / pz), 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });

      // 2. Rotate & Project 3D Icosahedron
      const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
      const cosZ = Math.cos(rotZ), sinZ = Math.sin(rotZ);

      const projected = vertices.map(([x, y, z]) => {
        // Rotation X
        let y1 = y * cosX - z * sinX;
        let z1 = y * sinX + z * cosX;
        // Rotation Y
        let x2 = x * cosY + z1 * sinY;
        let z2 = -x * sinY + z1 * cosY;
        // Rotation Z
        let x3 = x2 * cosZ - y1 * sinZ;
        let y3 = x2 * sinZ + y1 * cosZ;

        // Perspective projection
        const zDist = z2 + 2.8;
        const px = cx + (x3 * scale * fov) / (fov * zDist);
        const py = cy + (y3 * scale * fov) / (fov * zDist);
        return { x: px, y: py, z: z2 };
      });

      // 3. Draw 3D Edges with depth lighting
      edges.forEach(([i, j]) => {
        const v1 = projected[i];
        const v2 = projected[j];
        const avgZ = (v1.z + v2.z) / 2;
        const normZ = (avgZ + 1) / 2;

        const alpha = Math.max(0.08, Math.min(0.85, normZ * 0.7));
        
        ctx.beginPath();
        ctx.moveTo(v1.x, v1.y);
        ctx.lineTo(v2.x, v2.y);

        if (isStreaming) {
          ctx.strokeStyle = `rgba(56, 189, 248, ${alpha * 1.3})`;
          ctx.lineWidth = 1.4 + normZ * 1.2;
          ctx.shadowColor = "rgba(56, 189, 248, 0.6)";
          ctx.shadowBlur = 10;
        } else {
          ctx.strokeStyle = `rgba(99, 102, 241, ${alpha * 0.9})`;
          ctx.lineWidth = 1.0 + normZ * 0.8;
          ctx.shadowColor = "rgba(99, 102, 241, 0.4)";
          ctx.shadowBlur = 6;
        }
        ctx.stroke();
      });

      // Reset shadow
      ctx.shadowBlur = 0;

      // 4. Draw 3D Nodes
      projected.forEach(node => {
        const normZ = (node.z + 1) / 2;
        const radius = Math.max(1.5, 2.5 * normZ);
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = isStreaming ? "#38bdf8" : "#818cf8";
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isStreaming]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-50 transition-opacity duration-700"
      style={{ filter: "drop-shadow(0 0 25px rgba(99, 102, 241, 0.12))" }}
    />
  );
}
