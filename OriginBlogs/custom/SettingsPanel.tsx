"use client";

import { useState, useRef, useEffect } from "react";
import { Settings } from "lucide-react";
import { useEffects } from "./EffectProvider";

function getSeasonLabel(): string {
  const m = new Date().getMonth();
  if (m >= 2 && m <= 4) return "🌸 春 · 樱花";
  if (m >= 5 && m <= 7) return "✨ 夏 · 萤火虫";
  if (m >= 8 && m <= 10) return "🍂 秋 · 红叶";
  return "❄️ 冬 · 雪花";
}

export default function SettingsPanel() {
  const { mouseTrail, seasonalEffect, toggleMouseTrail, toggleSeasonalEffect } = useEffects();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={panelRef} className="fixed top-20 right-16 z-[9999]">
      {/* 触发按钮 */}
      <button
        onClick={() => setOpen(!open)}
        title="特效设置"
        className={`p-2.5 rounded-full bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border shadow-lg transition-all duration-300 ${
          open
            ? "border-sky-400 dark:border-sky-500 text-sky-500 scale-110"
            : "border-white/40 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-sky-500 hover:scale-110"
        }`}
        aria-label="特效设置"
      >
        <Settings className="w-5 h-5" />
      </button>

      {/* 下拉面板 */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-2xl">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3">特效设置</h3>

          {/* 季节特效 */}
          <div className="mb-3">
            <button
              onClick={toggleSeasonalEffect}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/40 dark:bg-slate-800/40 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors"
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

          {/* 鼠标拖尾 */}
          <div>
            <button
              onClick={toggleMouseTrail}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/40 dark:bg-slate-800/40 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors"
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
        </div>
      )}
    </div>
  );
}
