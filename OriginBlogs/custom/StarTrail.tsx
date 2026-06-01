"use client";

import { useEffect, useRef } from "react";
import { useEffects } from "./EffectProvider";

const COLORS = ["#D61C59", "#E7D84B", "#1B8798"];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export default function StarTrail() {
  const { starTrail } = useEffects();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!starTrail) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const handleMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      particles.current.push({
        x: e.clientX + (Math.random() - 0.5) * 6,
        y: e.clientY + (Math.random() - 0.5) * 6,
        vx: (Math.random() < 0.5 ? -1 : 1) * Math.random() * 0.8,
        vy: 0.5 + Math.random() * 1.2,
        life: 0,
        maxLife: 60 + Math.random() * 30,
        color,
        size: 16 + Math.random() * 12,
      });
      if (particles.current.length > 150) {
        particles.current = particles.current.slice(-100);
      }
    };
    window.addEventListener("mousemove", handleMove);

    let frame: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.current.forEach((p) => {
        p.life++;
        p.x += p.vx;
        p.y += p.vy;

        const progress = p.life / p.maxLife;
        const alpha = 1 - progress;
        const scale = 1 - progress * 0.6;

        ctx.save();
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.fillStyle = p.color;
        ctx.font = `${p.size * scale}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("*", p.x, p.y);
        ctx.restore();
      });

      particles.current = particles.current.filter((p) => p.life < p.maxLife);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMove);
    };
  }, [starTrail]);

  if (!starTrail) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[9997] pointer-events-none"
    />
  );
}
