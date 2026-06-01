"use client";

import { useCallback, useRef } from "react";
import { Plane } from "lucide-react";

export default function PaperPlaneButton() {
  const asteroidsLoaded = useRef(false);

  const handleClick = useCallback(() => {
    const win = window as any;

    // 销毁已有的游戏实例（避免多个同时运行）
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

    // 首次点击动态加载脚本，后续点击直接创建新游戏
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
    <div className="fixed top-20 right-6 z-[9999]">
      <button
        onClick={handleClick}
        title="纸飞机小游戏"
        className="p-2.5 rounded-full bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-lg text-slate-600 dark:text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 hover:scale-110 transition-all duration-300"
        aria-label="纸飞机小游戏"
      >
        <Plane className="w-5 h-5" />
      </button>
    </div>
  );
}
