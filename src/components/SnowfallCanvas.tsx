import React, { useEffect, useRef } from 'react';

interface SnowfallCanvasProps {
  intensity: 1 | 2 | 3 | 4 | 5;
  isChristmasMorning: boolean;
  enabled: boolean;
}

interface Flake {
  x: number;
  y: number;
  radius: number;
  speedY: number;
  speedX: number;
  opacity: number;
  shimmerPhase: number;
  color: string;
}

export const SnowfallCanvas: React.FC<SnowfallCanvasProps> = ({
  intensity,
  isChristmasMorning,
  enabled,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReducedMotion) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const count = isChristmasMorning ? 85 : 28 + intensity * 10;
    const palette = isChristmasMorning
      ? ['#ffffff', '#bae6fd', '#fde68a', '#ddd6fe', '#fed7aa']
      : ['#ffffff', '#e0f2fe', '#ddd6fe', '#fef3c7'];

    const flakes: Flake[] = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2.4 + 0.8,
      speedY: Math.random() * 0.65 + 0.25 + intensity * 0.06,
      speedX: (Math.random() - 0.5) * 0.45,
      opacity: Math.random() * 0.55 + 0.2,
      shimmerPhase: Math.random() * Math.PI * 2,
      color: palette[Math.floor(Math.random() * palette.length)],
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (const f of flakes) {
        f.y += f.speedY;
        f.x += f.speedX + Math.sin(f.shimmerPhase) * 0.18;
        f.shimmerPhase += 0.02;

        if (f.y > height + 8) {
          f.y = -8;
          f.x = Math.random() * width;
        }
        if (f.x > width + 8) f.x = -8;
        if (f.x < -8) f.x = width + 8;

        const alpha =
          f.opacity * (0.75 + 0.25 * Math.sin(f.shimmerPhase * 1.5));
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = window.requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [intensity, isChristmasMorning, enabled]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-10 h-full w-full"
    />
  );
};
