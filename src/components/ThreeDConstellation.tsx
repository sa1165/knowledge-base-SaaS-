import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  z: number;
  baseX: number;
  baseY: number;
  baseZ: number;
  vx: number;
  vy: number;
  vz: number;
  color: string;
  size: number;
}

export const ThreeDConstellation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, px: 0, py: 0, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    const particleCount = 65;
    const connectionDistance = 140;
    const focalLength = 300;

    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 600);

    let centerX = width / 2;
    let centerY = height / 2;

    // Palette of premium colors matching the brand
    const colors = [
      'rgba(99, 102, 241, 0.75)', // Indigo / Brand
      'rgba(34, 211, 238, 0.75)',  // Cyan
      'rgba(167, 139, 250, 0.75)', // Purple
      'rgba(59, 130, 246, 0.75)',  // Blue
    ];

    const createParticles = () => {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        // Position randomly in a 3D bounding box
        const x = (Math.random() - 0.5) * width * 0.9;
        const y = (Math.random() - 0.5) * height * 0.9;
        const z = (Math.random() - 0.5) * 400; // depth

        particles.push({
          x,
          y,
          z,
          baseX: x,
          baseY: y,
          baseZ: z,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          vz: (Math.random() - 0.5) * 0.4,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 2 + 1.5,
        });
      }
    };

    createParticles();

    // Handle Resize
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || 600;
      centerX = width / 2;
      centerY = height / 2;
      createParticles();
    };
    window.addEventListener('resize', handleResize);

    // Mouse Listeners (relative to canvas container)
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left - centerX;
      mouseRef.current.y = e.clientY - rect.top - centerY;
      mouseRef.current.active = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    const parent = canvas.parentElement;
    if (parent) {
      parent.addEventListener('mousemove', handleMouseMove);
      parent.addEventListener('mouseleave', handleMouseLeave);
    }

    let rotX = 0.001;
    let rotY = 0.0015;
    let rotZ = 0.0005;

    // Smooth rotational state based on mouse position
    let angleX = 0;
    let angleY = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Inertia rotation based on mouse coordinates
      let targetAngleX = 0;
      let targetAngleY = 0;
      if (mouseRef.current.active) {
        targetAngleX = (mouseRef.current.y / height) * 0.4;
        targetAngleY = (mouseRef.current.x / width) * 0.4;
      }

      angleX += (targetAngleX - angleX) * 0.05;
      angleY += (targetAngleY - angleY) * 0.05;

      const cosX = Math.cos(angleX + rotX);
      const sinX = Math.sin(angleX + rotX);
      const cosY = Math.cos(angleY + rotY);
      const sinY = Math.sin(angleY + rotY);
      const cosZ = Math.cos(rotZ);
      const sinZ = Math.sin(rotZ);

      // Update and project particles
      const projected: { sx: number; sy: number; sz: number; color: string; size: number; alpha: number }[] = [];

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Drift base position slightly for organic movement
        p.baseX += p.vx;
        p.baseY += p.vy;
        p.baseZ += p.vz;

        // Bounce back if drifting too far from bounds
        if (Math.abs(p.baseX) > width * 0.6) p.vx *= -1;
        if (Math.abs(p.baseY) > height * 0.6) p.vy *= -1;
        if (Math.abs(p.baseZ) > 300) p.vz *= -1;

        // Apply 3D Rotations around axes
        // Y Axis rotation
        let x1 = p.baseX * cosY - p.baseZ * sinY;
        let z1 = p.baseX * sinY + p.baseZ * cosY;

        // X Axis rotation
        let y2 = p.baseY * cosX - z1 * sinX;
        let z2 = p.baseY * sinX + z1 * cosX;

        // Z Axis rotation
        let x3 = x1 * cosZ - y2 * sinZ;
        let y3 = x1 * sinZ + y2 * cosZ;

        // Perspective Projection
        // Make focalLength adjust to keep sizes reasonable, clamping the denominator to prevent division-by-zero or negative scales
        const scale = focalLength / Math.max(50, focalLength + z2);
        
        // Add subtle mouse attraction in 3D
        let dx = 0;
        let dy = 0;
        if (mouseRef.current.active) {
          const screenX = centerX + x3 * scale;
          const screenY = centerY + y3 * scale;
          const mdx = (mouseRef.current.x + centerX) - screenX;
          const mdy = (mouseRef.current.y + centerY) - screenY;
          const dist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (dist < 180) {
            const force = (180 - dist) * 0.04;
            x3 += (mdx / dist) * force;
            y3 += (mdy / dist) * force;
          }
        }

        const sx = centerX + x3 * scale;
        const sy = centerY + y3 * scale;
        
        // Fade out particles that are too close or deep behind camera
        const alpha = Math.min(1, Math.max(0.05, (300 - z2) / 600));

        projected.push({
          sx,
          sy,
          sz: z2,
          color: p.color,
          size: Math.max(0.1, p.size * scale),
          alpha,
        });
      }

      // Draw Connections (lines between close points)
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const p1 = projected[i];
          const p2 = projected[j];

          const dx = p1.sx - p2.sx;
          const dy = p1.sy - p2.sy;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDistance) {
            // Compute average alpha and scale it based on distance
            const baseAlpha = (p1.alpha + p2.alpha) / 2;
            const lineAlpha = baseAlpha * (1 - dist / connectionDistance) * 0.28;
            
            ctx.beginPath();
            ctx.moveTo(p1.sx, p1.sy);
            ctx.lineTo(p2.sx, p2.sy);
            ctx.strokeStyle = `rgba(99, 102, 241, ${lineAlpha})`;
            ctx.lineWidth = Math.min(1.5, baseAlpha * 1.2);
            ctx.stroke();
          }
        }
      }

      // Draw Nodes
      for (let i = 0; i < projected.length; i++) {
        const p = projected[i];
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, p.size, 0, Math.PI * 2);
        
        // Draw glow effect for points in foreground
        if (p.sz < 0) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = p.color;
        } else {
          ctx.shadowBlur = 0;
        }
        
        // Split color to customize transparency
        const colString = p.color.replace('0.75', p.alpha.toFixed(2));
        ctx.fillStyle = colString;
        ctx.fill();
      }

      ctx.shadowBlur = 0; // Reset shadow

      // Drift angles slowly for continuous rotation in background
      rotX += 0.0003;
      rotY += 0.0004;

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (parent) {
        parent.removeEventListener('mousemove', handleMouseMove);
        parent.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.85
      }}
    />
  );
};

export default ThreeDConstellation;
