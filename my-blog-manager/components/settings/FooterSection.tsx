import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Calendar, Shield, Link2, Plus, Trash2, LayoutTemplate } from 'lucide-react';
import { useToast } from '../ToastProvider';

interface FooterSectionProps {
  formData: any;
  handleUpdate: (field: string, value: any) => void;
  pushToQueue: (label: string, key?: string, value?: any) => void;
}

export default function FooterSection({ formData, handleUpdate, pushToQueue }: FooterSectionProps) {
  const { showToast } = useToast();

  // 1. 初始化数据，如果 formData 还没加载到，提供默认回退
  const buildDate = formData.buildDate || "2026-03-23T00:00:00";
  const icpConfig = formData.icpConfig || { name: "", link: "" };
  const footerBadges = formData.footerBadges || [];

  // 用于新增徽章的临时状态
  const [newBadgeName, setNewBadgeName] = useState("");
  const [newBadgeColor, setNewBadgeColor] = useState("text-indigo-500");

  const saveToQueue = () => {
    pushToQueue('首页底部配置', 'footerConfig', {
      buildDate,
      icpConfig,
      footerBadges
    });
  };

  const handleAddBadge = () => {
    if (!newBadgeName.trim()) {
      showToast("徽章名称不能为空", "warning");
      return;
    }
    // 默认给一个通用的星星 SVG 图标
    const newBadge = {
      name: newBadgeName.trim(),
      color: newBadgeColor,
      svg: '<path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>'
    };
    handleUpdate('footerBadges', [...footerBadges, newBadge]);
    setNewBadgeName("");
    showToast("徽章添加成功！你可以稍后在源码中替换自定义SVG", "success");
  };

  const handleRemoveBadge = (indexToRemove: number) => {
    const updated = footerBadges.filter((_: any, i: number) => i !== indexToRemove);
    handleUpdate('footerBadges', updated);
  };

  // 预设一些好看的颜色给徽章用
  const colorPresets = [
    "text-slate-500", "text-sky-500", "text-cyan-400", "text-teal-400",
    "text-indigo-500", "text-purple-500", "text-pink-500", "text-rose-400", "text-amber-500"
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col gap-6"
    >
      <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-800/50 rounded-[40px] p-8 shadow-xl">
        <div className="flex justify-between items-center mb-8 border-b border-white/30 dark:border-slate-700/50 pb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
              <LayoutTemplate className="text-indigo-500" /> 首页底部设置
            </h2>
            <p className="text-slate-500 text-sm mt-1 font-bold">定义仪表盘的数据来源与网站底线保障</p>
          </div>
          <button
            onClick={saveToQueue}
            className="px-6 py-3 bg-indigo-500 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-500/30 flex items-center gap-2 hover:bg-indigo-600 transition-colors"
          >
            <Save size={16} /> 保存修改
          </button>
        </div>

        <div className="space-y-8">

          {/* 1. 建站时间选择 */}
          <div>
            <label className="text-xs font-black uppercase text-slate-400 tracking-widest mb-2 flex items-center gap-2">
              <Calendar size={14} className="text-indigo-400" /> 建站时间 (起始原点)
            </label>
            <input
              type="datetime-local"
              value={buildDate.slice(0, 16)} // datetime-local 需要 YYYY-MM-DDThh:mm 格式
              onChange={(e) => handleUpdate('buildDate', `${e.target.value}:00`)}
              className="w-full bg-white/60 dark:bg-slate-800/60 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-slate-700 dark:text-slate-200 border border-white/40 dark:border-slate-700/50"
            />
            <p className="text-[10px] text-slate-400 mt-2 ml-1">首页仪表盘的“运行时间”将根据此时间点自动推算。</p>
          </div>

          <hr className="border-white/20 dark:border-slate-700/30" />

          {/* 2. 备案信息 */}
          <div>
            <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
              <Shield size={16} className="text-emerald-500" /> ICP 备案信息
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-1.5 block">备案号 / 显示名称</label>
                <input
                  type="text"
                  value={icpConfig.name}
                  onChange={(e) => handleUpdate('icpConfig', { ...icpConfig, name: e.target.value })}
                  className="w-full bg-white/60 dark:bg-slate-800/60 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium text-slate-700 dark:text-slate-200 border border-white/40 dark:border-slate-700/50"
                  placeholder="例如: 萌ICP备 20260240号"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-1.5 block flex items-center gap-1"><Link2 size={12}/> 跳转链接</label>
                <input
                  type="text"
                  value={icpConfig.link}
                  onChange={(e) => handleUpdate('icpConfig', { ...icpConfig, link: e.target.value })}
                  className="w-full bg-white/60 dark:bg-slate-800/60 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium text-slate-700 dark:text-slate-200 border border-white/40 dark:border-slate-700/50"
                  placeholder="例如: https://icp.gov.moe/..."
                />
              </div>
            </div>
          </div>

          <hr className="border-white/20 dark:border-slate-700/30" />

          {/* 3. 技术栈徽章管理 */}
          <div>
            <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
              <LayoutTemplate size={16} className="text-cyan-500" /> 技术栈徽章管理
            </h3>

            {/* 已有徽章列表 */}
            <div className="flex flex-wrap gap-3 mb-6">
              <AnimatePresence>
                {footerBadges.map((badge: any, index: number) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="group relative px-3 py-1.5 bg-white/50 dark:bg-slate-700/50 rounded-lg shadow-sm border border-white/40 dark:border-slate-600 flex items-center gap-1.5"
                  >
                    <svg className={`w-3.5 h-3.5 ${badge.color}`} fill="currentColor" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: badge.svg }} />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{badge.name}</span>

                    {/* 悬浮删除按钮 */}
                    <button
                      onClick={() => handleRemoveBadge(index)}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-md"
                    >
                      <Trash2 size={10} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              {footerBadges.length === 0 && <span className="text-xs text-slate-400">目前没有配置任何徽章哦</span>}
            </div>

            {/* 新增徽章面板 */}
            <div className="bg-slate-50/50 dark:bg-slate-950/30 rounded-2xl p-4 border border-slate-200/50 dark:border-slate-800/50 flex flex-col md:flex-row items-center gap-3">
              <input
                type="text"
                value={newBadgeName}
                onChange={(e) => setNewBadgeName(e.target.value)}
                placeholder="新徽章名称 (如: React)"
                className="flex-1 bg-white dark:bg-slate-800 rounded-lg px-3 py-2 text-sm outline-none border border-slate-200 dark:border-slate-700"
              />

              <div className="flex items-center gap-2 px-2 border-l border-slate-200 dark:border-slate-700">
                {colorPresets.map(color => (
                  <button
                    key={color}
                    onClick={() => setNewBadgeColor(color)}
                    className={`w-5 h-5 rounded-full transition-transform ${newBadgeColor === color ? 'scale-125 ring-2 ring-offset-1 ring-slate-300' : 'hover:scale-110'}`}
                  >
                    {/* 使用 Tailwind 类名推导个近似底色展示 */}
                    <div className={`w-full h-full rounded-full bg-current ${color}`}></div>
                  </button>
                ))}
              </div>

              <button
                onClick={handleAddBadge}
                className="ml-2 px-4 py-2 bg-cyan-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-cyan-600 transition-colors shadow-sm"
              >
                <Plus size={14} /> 添加
              </button>
            </div>

          </div>

        </div>
      </div>
    </motion.section>
  );
}