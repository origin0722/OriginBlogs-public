"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useEffects } from "./EffectProvider";

function getSeason(): { name: string; label: string } {
  const m = new Date().getMonth();
  if (m >= 2 && m <= 4) return { name: "spring", label: "春" };
  if (m >= 5 && m <= 7) return { name: "summer", label: "夏" };
  if (m >= 8 && m <= 10) return { name: "autumn", label: "秋" };
  return { name: "winter", label: "冬" };
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
  sway: number;
  swaySpeed: number;
  phase: number;
  type: "petal" | "firefly" | "leaf" | "snow";
  color: string;
}

export default function SeasonalEffect() {
  const pathname = usePathname();
  const { seasonalEffect } = useEffects();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const animFrame = useRef<number>(0);
  const season = useRef(getSeason());

  // 子站页面禁用
  const disabled = pathname?.startsWith("/garden/") || !seasonalEffect;

  useEffect(() => {
    if (disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const s = season.current.name;
    const isMobile = window.innerWidth < 768;
    const maxParticles = isMobile ? 12 : 20;

    // 预填充粒子
    particles.current = [];
    for (let i = 0; i < maxParticles; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      let p: Particle;

      switch (s) {
        case "spring":
          p = {
            x, y,
            vx: -0.2 + Math.random() * 0.4,
            vy: 0.5 + Math.random() * 0.8,
            size: 6 + Math.random() * 8,
            opacity: 0.4 + Math.random() * 0.5,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.03,
            sway: Math.random() * 20,
            swaySpeed: 0.005 + Math.random() * 0.01,
            phase: Math.random() * Math.PI * 2,
            type: "petal",
            color: ["#f9a8d4", "#f472b6", "#fbcfe8", "#ec4899", "#fce7f3"][Math.floor(Math.random() * 5)],
          };
          break;
        case "summer":
          p = {
            x, y,
            vx: (Math.random() - 0.5) * 0.3,
            vy: -(0.15 + Math.random() * 0.3),
            size: 1.5 + Math.random() * 1.5,
            opacity: 0.3 + Math.random() * 0.3,
            rotation: 0,
            rotationSpeed: 0,
            sway: Math.random() * 30,
            swaySpeed: 0.006 + Math.random() * 0.008,
            phase: Math.random() * Math.PI * 2,
            type: "firefly",
            color: `hsl(${60 + Math.random() * 40}, 100%, ${65 + Math.random() * 20}%)`,
          };
          break;
        case "autumn":
          p = {
            x, y,
            vx: -0.3 + Math.random() * 0.6,
            vy: 0.5 + Math.random() * 1.0,
            size: 5 + Math.random() * 7,
            opacity: 0.5 + Math.random() * 0.5,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.04,
            sway: Math.random() * 15,
            swaySpeed: 0.006 + Math.random() * 0.01,
            phase: Math.random() * Math.PI * 2,
            type: "leaf",
            color: ["#d97706", "#b45309", "#ea580c", "#ca8a04", "#a16207"][Math.floor(Math.random() * 5)],
          };
          break;
        default: // winter
          p = {
            x, y,
            vx: -0.2 + Math.random() * 0.4,
            vy: 0.3 + Math.random() * 0.6,
            size: 2 + Math.random() * 4,
            opacity: 0.5 + Math.random() * 0.5,
            rotation: 0,
            rotationSpeed: 0,
            sway: Math.random() * 10,
            swaySpeed: 0.004 + Math.random() * 0.008,
            phase: Math.random() * Math.PI * 2,
            type: "snow",
            color: "#ffffff",
          };
      }
      particles.current.push(p);
    }

    // 各季节粒子生成器
    const spawners: Record<string, (cw: number, ch: number) => Particle> = {
      spring: (cw) => ({
        x: Math.random() * cw, y: -20,
        vx: -0.2 + Math.random() * 0.4, vy: 0.5 + Math.random() * 0.8,
        size: 6 + Math.random() * 8, opacity: 0.4 + Math.random() * 0.5,
        rotation: Math.random() * Math.PI * 2, rotationSpeed: (Math.random() - 0.5) * 0.03,
        sway: Math.random() * 20, swaySpeed: 0.005 + Math.random() * 0.01,
        phase: Math.random() * Math.PI * 2, type: "petal",
        color: ["#f9a8d4", "#f472b6", "#fbcfe8", "#ec4899", "#fce7f3"][Math.floor(Math.random() * 5)],
      }),
      summer: (cw, ch) => ({
        x: Math.random() * cw, y: Math.random() * ch,
        vx: (Math.random() - 0.5) * 0.3, vy: -(0.15 + Math.random() * 0.3),
        size: 1.5 + Math.random() * 1.5, opacity: 0,
        rotation: 0, rotationSpeed: 0,
        sway: Math.random() * 30, swaySpeed: 0.006 + Math.random() * 0.008,
        phase: Math.random() * Math.PI * 2, type: "firefly",
        color: `hsl(${60 + Math.random() * 40}, 100%, ${65 + Math.random() * 20}%)`,
      }),
      autumn: (cw) => ({
        x: Math.random() * cw, y: -20,
        vx: -0.3 + Math.random() * 0.6, vy: 0.5 + Math.random() * 1.0,
        size: 5 + Math.random() * 7, opacity: 0.5 + Math.random() * 0.5,
        rotation: Math.random() * Math.PI * 2, rotationSpeed: (Math.random() - 0.5) * 0.04,
        sway: Math.random() * 15, swaySpeed: 0.006 + Math.random() * 0.01,
        phase: Math.random() * Math.PI * 2, type: "leaf",
        color: ["#d97706", "#b45309", "#ea580c", "#ca8a04", "#a16207"][Math.floor(Math.random() * 5)],
      }),
      winter: (cw) => ({
        x: Math.random() * cw, y: -10,
        vx: -0.2 + Math.random() * 0.4, vy: 0.3 + Math.random() * 0.6,
        size: 2 + Math.random() * 4, opacity: 0.5 + Math.random() * 0.5,
        rotation: 0, rotationSpeed: 0,
        sway: Math.random() * 10, swaySpeed: 0.004 + Math.random() * 0.008,
        phase: Math.random() * Math.PI * 2, type: "snow",
        color: "#ffffff",
      }),
    };

    // 绘制函数
    const drawPetal = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size / 2, p.size / 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawFirefly = (p: Particle) => {
      const glow = Math.sin(Date.now() * 0.002 + p.phase) * 0.35 + 0.35;
      const alpha = p.opacity * glow;
      if (alpha < 0.02) return;
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.5);
      // 提取 HSL 颜色中的数值，构造 hsla
      const hslMatch = p.color.match(/hsl\(([^)]+)\)/);
      if (hslMatch) {
        gradient.addColorStop(0, p.color);
        gradient.addColorStop(0.3, `hsla(${hslMatch[1]}, 0.3)`);
      } else {
        gradient.addColorStop(0, p.color);
        gradient.addColorStop(0.3, p.color);
      }
      gradient.addColorStop(1, "transparent");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawLeaf = (p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(0, -p.size / 2);
      ctx.quadraticCurveTo(p.size / 2, 0, 0, p.size / 2);
      ctx.quadraticCurveTo(-p.size / 2, 0, 0, -p.size / 2);
      ctx.fill();
      ctx.restore();
    };

    const drawSnow = (p: Particle) => {
      ctx.beginPath();
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    };

    const drawMap: Record<string, (p: Particle) => void> = {
      petal: drawPetal,
      firefly: drawFirefly,
      leaf: drawLeaf,
      snow: drawSnow,
    };

    let frameCount = 0;

    const loop = () => {
      frameCount++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const max = isMobile ? 15 : 25;
      if (particles.current.length < max) {
        const spawnRate = isMobile ? 80 : 50;
        if (frameCount % spawnRate === 0) {
          particles.current.push(spawners[s](canvas.width, canvas.height));
        }
      }

      particles.current = particles.current.filter((p) => {
        p.x += p.vx + Math.sin(Date.now() * p.swaySpeed + p.phase) * 0.3;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        const margin = 50;
        return p.x > -margin && p.x < canvas.width + margin && p.y < canvas.height + margin;
      });

      for (const p of particles.current) {
        drawMap[p.type]?.(p);
      }

      animFrame.current = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animFrame.current);
    };
  }, [disabled]);

  if (disabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[9997] pointer-events-none"
    />
  );
}
