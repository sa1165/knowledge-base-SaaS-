import React, { useRef } from 'react';

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export const ThreeDCard: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const ref = useRef<HTMLDivElement | null>(null);

  const handleMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const dx = (x - cx) / cx; // -1 to 1
    const dy = (y - cy) / cy;
    const rotY = clamp(dx * 8, -12, 12);
    const rotX = clamp(-dy * 8, -12, 12);
    el.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.02)`;
    el.style.boxShadow = `${-rotY}px ${rotX}px 40px rgba(2,6,23,0.25)`;
  };

  const handleLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = `perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)`;
    el.style.boxShadow = `0 20px 60px rgba(2,6,23,0.08)`;
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{
        transition: 'transform 200ms ease, box-shadow 200ms ease',
        transformStyle: 'preserve-3d'
      }}
    >
      {children}
    </div>
  );
};

export default ThreeDCard;
