"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Plane, Settings } from "lucide-react";
import { useEffects } from "./EffectProvider";

function getSeasonLabel(): string {
  const m = new Date().getMonth();
  if (m >= 2 && m <= 4) return "🌸 春 · 樱花";
  if (m >= 5 && m <= 7) return "✨ 夏 · 萤火虫";
  if (m >= 8 && m <= 10) return "🍂 秋 · 红叶";
  return "❄️ 冬 · 雪花";
}

export default function NavbarExtras() {
  const { mouseTrail, seasonalEffect, starTrail, toggleMouseTrail, toggleSeasonalEffect, toggleStarTrail } = useEffects();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const asteroidsLoaded = useRef(false);

  // 点击外部关闭设置面板
  useEffect(() => {
    if (!settingsOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [settingsOpen]);

  // 纸飞机游戏
  const handlePaperPlane = useCallback(() => {
    const win = window as any;
    if (win.ASTEROIDSPLAYERS?.length) {
      for (const instance of win.ASTEROIDSPLAYERS) {
        try {
          if (instance.gameContainer?.parentNode) {
            instance.gameContainer.parentNode.removeChild(instance.gameContainer);
          }
        } catch (e) {}
      }
      win.ASTEROIDSPLAYERS = [];
    }
    if (!asteroidsLoaded.current) {
      asteroidsLoaded.current = true;
      const script = document.createElement("script");
      script.src = "/games/asteroids.js";
      document.head.appendChild(script);
    } else {
      win.ASTEROIDSPLAYERS.push(new win.Asteroids());
    }
  }, []);

  return (
    <div className="flex items-center gap-1 ml-4">
      {/* 纸飞机 */}
      <button
        onClick={handlePaperPlane}
        title="纸飞机小游戏"
        className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:text-sky-500 dark:hover:text-sky-400 transition-colors"
      >
        <Plane className="w-[18px] h-[18px]" />
      </button>

      {/* 设置 */}
      <div ref={panelRef} className="relative">
        <button
          onClick={() => setSettingsOpen(!settingsOpen)}
          title="特效设置"
          className={`p-2 rounded-lg transition-colors ${
            settingsOpen
              ? "text-sky-500 bg-sky-50 dark:bg-sky-500/10"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:text-sky-500 dark:hover:text-sky-400"
          }`}
        >
          <Settings className="w-[18px] h-[18px]" />
        </button>

        {settingsOpen && (
          <div className="absolute right-0 top-full mt-2 w-60 p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3">特效设置</h3>

            <div className="mb-3">
              <button
                onClick={toggleSeasonalEffect}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/40 dark:bg-slate-800/40 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors"
              >
                <div className="flex flex-col items-start gap-0.5">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">季节特效</span>
                  <span className="text-[10px] text-slate-400">{getSeasonLabel()}</span>
                </div>
                <div className={`w-9 h-5 rounded-full transition-colors flex-shrink-0 ${seasonalEffect ? "bg-sky-500" : "bg-slate-300 dark:bg-slate-600"}`}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform mt-0.5 ${seasonalEffect ? "translate-x-[18px]" : "translate-x-[2px]"}`} />
                </div>
              </button>
            </div>

            <div className="mb-3">
              <button
                onClick={toggleMouseTrail}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/40 dark:bg-slate-800/40 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors"
              >
                <div className="flex flex-col items-start gap-0.5">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">鼠标拖尾</span>
                  <span className="text-[10px] text-slate-400">蓝紫色粒子轨迹</span>
                </div>
                <div className={`w-9 h-5 rounded-full transition-colors flex-shrink-0 ${mouseTrail ? "bg-sky-500" : "bg-slate-300 dark:bg-slate-600"}`}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform mt-0.5 ${mouseTrail ? "translate-x-[18px]" : "translate-x-[2px]"}`} />
                </div>
              </button>
            </div>

            <div>
              <button
                onClick={toggleStarTrail}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/40 dark:bg-slate-800/40 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors"
              >
                <div className="flex flex-col items-start gap-0.5">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">星星拖尾</span>
                  <span className="text-[10px] text-slate-400">彩色 * 字符飘落</span>
                </div>
                <div className={`w-9 h-5 rounded-full transition-colors flex-shrink-0 ${starTrail ? "bg-sky-500" : "bg-slate-300 dark:bg-slate-600"}`}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform mt-0.5 ${starTrail ? "translate-x-[18px]" : "translate-x-[2px]"}`} />
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
