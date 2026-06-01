import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, MessageSquarePlus, Trash2, Zap } from 'lucide-react';
import { useToast } from '../ToastProvider';

interface DanmakuSectionProps {
  formData: any;
  handleUpdate: (field: string, value: any) => void;
  pushToQueue: (label: string, key?: string, value?: any) => void;
}

export default function DanmakuSection({ formData, handleUpdate, pushToQueue }: DanmakuSectionProps) {
  const [newDanmaku, setNewDanmaku] = useState('');
  const { showToast } = useToast();

  const danmakuList: string[] = formData.danmakuList || [];

  const handleAdd = () => {
    if (!newDanmaku.trim()) {
      showToast("弹幕内容不能为空哦", "warning");
      return;
    }
    if (danmakuList.includes(newDanmaku.trim())) {
      showToast("这条弹幕已经存在啦", "warning");
      return;
    }
    const updatedList = [newDanmaku.trim(), ...danmakuList];
    handleUpdate('danmakuList', updatedList);
    setNewDanmaku('');
    showToast("弹幕已添加", "success");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  const handleRemove = (indexToRemove: number) => {
    const updatedList = danmakuList.filter((_, index) => index !== indexToRemove);
    handleUpdate('danmakuList', updatedList);
    showToast("弹幕已移除", "success");
  };

  const saveToQueue = () => {
    pushToQueue('背景弹幕矩阵', 'danmakuList', danmakuList);
  };

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
              <Zap className="text-yellow-500" /> 弹幕矩阵池
            </h2>
            <p className="text-slate-500 text-sm mt-1 font-bold">管理飘过你主页上空的那些奇思妙想</p>
          </div>
          <button
            onClick={saveToQueue}
            className="px-6 py-3 bg-yellow-500 text-white rounded-2xl font-black text-sm shadow-lg shadow-yellow-500/30 flex items-center gap-2 hover:bg-yellow-600 transition-colors"
          >
            <Save size={16} /> 保存修改
          </button>
        </div>

        <div className="space-y-8">
          {/* 输入框区域 */}
          <div className="relative flex items-center gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <MessageSquarePlus size={18} className="text-slate-400" />
              </div>
              <input
                type="text"
                value={newDanmaku}
                onChange={(e) => setNewDanmaku(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-white/60 dark:bg-slate-800/60 rounded-2xl pl-12 pr-4 py-4 outline-none focus:ring-2 focus:ring-yellow-500 text-sm font-bold text-slate-700 dark:text-slate-200 border border-white/40 dark:border-slate-700/50 shadow-inner placeholder:text-slate-400"
                placeholder="输入你想让大家看到的碎碎念，回车添加..."
              />
            </div>
            <button
              onClick={handleAdd}
              className="h-full px-6 py-4 bg-slate-800 dark:bg-slate-700 text-white rounded-2xl font-black text-sm hover:scale-105 transition-transform whitespace-nowrap shadow-md"
            >
              发射!
            </button>
          </div>

          {/* 弹幕流展示区域 */}
          <div className="bg-slate-100/50 dark:bg-slate-950/30 rounded-3xl p-6 border border-slate-200/50 dark:border-slate-800/50 min-h-[300px]">
            {danmakuList.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 opacity-60 pt-10">
                <MessageSquarePlus size={48} className="mb-4" />
                <p className="font-bold text-sm">弹幕池空空如也，快去发射一条吧！</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                <AnimatePresence>
                  {danmakuList.map((text, index) => (
                    <motion.div
                      key={`${text}-${index}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8, filter: "blur(4px)" }}
                      className="group flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-yellow-400 dark:hover:border-yellow-500 transition-colors"
                    >
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {text}
                      </span>
                      <button
                        onClick={() => handleRemove(index)}
                        className="w-6 h-6 flex items-center justify-center rounded-md bg-red-50 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all ml-1"
                        title="删除这条弹幕"
                      >
                        <Trash2 size={12} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

        </div>
      </div>
    </motion.section>
  );
}