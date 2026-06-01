import { useState } from 'react';
import { motion } from 'framer-motion';

export default function DisplaySection({ showToast }: any) {
  const [customWidth, setCustomWidth] = useState<number | ''>('');
  const [customHeight, setCustomHeight] = useState<number | ''>('');

  const presets = [
    { name: "4K 超高清", w: 3840, h: 2160 },
    { name: "2K 高清", w: 2560, h: 1440 },
    { name: "1080P 全高清", w: 1920, h: 1080 },
    { name: "MacBook Pro 默认", w: 1440, h: 900 },
    { name: "720P 紧凑版", w: 1280, h: 720 },
    { name: "最小安全尺寸", w: 1024, h: 768 }
  ];

  const applyResolution = async (w: number, h: number) => {
    if (w < 1024 || h < 768) {
      showToast("❌ 宽高不能低于 1024x768，否则排版会崩坏！", "error");
      return;
    }

    if (typeof window !== 'undefined' && (window as any).pywebview?.api) {
      await (window as any).pywebview.api.resize_window(w, h);
      showToast(`✅ 视窗已平滑切换至 ${w} × ${h} 并永久保存`, "success");
    } else {
      showToast("未连接到 Python 桌面核心", "error");
    }
  };

  return (
    <motion.section initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/50 dark:border-slate-800/50 rounded-[40px] p-8 shadow-2xl">
      <div className="flex items-center gap-3 mb-8">
        <h2 className="text-xl font-black text-slate-800 dark:text-white">🪟 视窗画面设置</h2>
        <span className="px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-[10px] font-bold border border-amber-500/20">
          极客特调功能
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

        {/* 左侧：预设选项 */}
        <div className="space-y-4">
          <p className="text-[10px] font-black text-slate-400 uppercase">📺 快速预设</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-3">
            {presets.map((p, i) => (
              <button
                key={i}
                onClick={() => applyResolution(p.w, p.h)}
                className="w-full flex flex-col items-start justify-center p-4 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-indigo-50 hover:border-indigo-300 dark:hover:bg-indigo-900/30 transition-all group"
              >
                <span className="font-bold text-sm text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{p.name}</span>
                <span className="text-xs font-mono text-slate-400 mt-1">{p.w} × {p.h}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 右侧：自定义与警告信息 */}
        <div className="space-y-6">
          <div className="bg-indigo-50 dark:bg-slate-800/80 rounded-3xl p-6 border border-indigo-100 dark:border-slate-700">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-4">✍️ 自定义分辨率</p>
            <div className="flex items-center gap-2 mb-4">
              {/* 【修复】：去掉了引起报错的 Tailwind 伪类写法 */}
              <input
                type="number"
                placeholder="宽 (W)"
                value={customWidth}
                onChange={(e) => setCustomWidth(e.target.value ? Number(e.target.value) : '')}
                className="w-full bg-white dark:bg-slate-900 border-none rounded-xl px-4 py-3 text-sm outline-none shadow-sm text-center font-mono"
              />
              <span className="text-slate-400 font-bold">×</span>
              <input
                type="number"
                placeholder="高 (H)"
                value={customHeight}
                onChange={(e) => setCustomHeight(e.target.value ? Number(e.target.value) : '')}
                className="w-full bg-white dark:bg-slate-900 border-none rounded-xl px-4 py-3 text-sm outline-none shadow-sm text-center font-mono"
              />
            </div>
            <button
              onClick={() => {
                if (customWidth && customHeight) applyResolution(customWidth, customHeight);
                else showToast("请填写完整的宽高数值", "warning");
              }}
              className="w-full py-3 bg-indigo-500 text-white rounded-xl text-sm font-black shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
            >
              应用并保存配置
            </button>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-2xl flex gap-3 items-start">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-1">物理尺寸限制</p>
              <p className="text-[10px] text-amber-700/80 dark:text-amber-400/80 leading-relaxed">
                为了防止控制台的组件相互重叠挤压或 UI 崩坏，底层引擎已锁定 <strong>最小安全分辨率为 1024 × 768</strong>。所有低于此数值的设定都会被系统强行驳回。
              </p>
            </div>
          </div>
        </div>

      </div>
    </motion.section>
  );
}