"use client";

import { useEffect, useRef } from "react";
import { useEffects } from "./EffectProvider";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
}

export default function MouseTrail() {
  const { mouseTrail } = useEffects();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!mouseTrail) return;
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
      for (let i = 0; i < 2; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 1.5 + 0.5;
        particles.current.push({
          x: e.clientX + (Math.random() - 0.5) * 8,
          y: e.clientY + (Math.random() - 0.5) * 8,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1,
          life: 0,
          maxLife: Math.random() * 30 + 20,
          size: Math.random() * 3 + 1.5,
          hue: Math.random() * 60 + 180, // 蓝紫色系
        });
      }
      if (particles.current.length > 200) {
        particles.current = particles.current.slice(-150);
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
        p.vy += 0.02;
        p.vx *= 0.98;
        p.vy *= 0.98;

        const progress = p.life / p.maxLife;
        const alpha = progress < 0.3 ? progress / 0.3 : 1 - (progress - 0.3) / 0.7;
        const scale = 1 - progress * 0.5;

        ctx.save();
        ctx.globalAlpha = Math.max(0, alpha) * 0.8;
        ctx.fillStyle = `hsl(${p.hue}, 80%, 70%)`;
        ctx.shadowColor = `hsl(${p.hue}, 80%, 70%)`;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * scale, 0, Math.PI * 2);
        ctx.fill();
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
  }, [mouseTrail]);

  if (!mouseTrail) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[9997] pointer-events-none"
    />
  );
}
