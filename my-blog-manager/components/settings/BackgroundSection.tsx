import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../ToastProvider';

export default function BackgroundSection({ formData, handleUpdate, pushToQueue }: any) {
  const { showToast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // 👈 新增状态：用来存放刚刚上传成功，但还没决定是否加入背景的图片 URL
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const removeBg = (index: number) => {
    const newList = [...formData.bgImages];
    newList.splice(index, 1);
    handleUpdate('bgImages', newList);
    showToast("已移除一张背景图", "success");
  };

  const addBgUrl = () => {
    if (!formData.newBgUrl) {
      showToast("URL不能为空哦", "warning");
      return;
    }
    if (formData.bgImages.includes(formData.newBgUrl)) {
      showToast("这张图已经在背景列表里啦", "warning");
      return;
    }
    handleUpdate('bgImages', [...formData.bgImages, formData.newBgUrl]);
    handleUpdate('newBgUrl', '');
    showToast("✅ 成功添加背景图！", "success");
  };

  // 【核心功能】：真实的图床上传逻辑
  const handleFileUpload = async (file: File) => {
    const picUrl = formData.picBedUrl || "https://pic.dusays.com";
    const picToken = formData.picBedToken;

    if (!picToken) {
      showToast("⛔ 无法上传！请先在【图库配置管理】中填写图床 Token", "error");
      return;
    }
    if (!file.type.startsWith('image/')) {
      showToast("只能上传图片文件哦！", "warning");
      return;
    }

    setIsUploading(true);
    showToast("正在将图片传送至图床引擎...", "info");

    try {
      const configRes = await fetch(`/backend_config.json?t=${Date.now()}`);
      const configData = await configRes.json();

      // 构建 multipart/form-data
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('url', picUrl);
      uploadData.append('token', picToken);

      const res = await fetch(`http://127.0.0.1:${configData.api_port}/api/picbed/upload`, {
        method: 'POST',
        body: uploadData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        showToast("🎉 图片上传成功！请确认是否加入背景库", "success");
        // 👈 上传成功，拿到真实 URL，触发确认面板
        setPendingImageUrl(data.url);
      } else {
        showToast(`上传失败: ${data.message}`, "error");
      }
    } catch (error) {
      showToast("无法连接到 Python 引擎上传通道", "error");
    } finally {
      setIsUploading(false);
    }
  };

  // 确认或取消加入背景
  const confirmAddPendingImage = () => {
    if (pendingImageUrl) {
      handleUpdate('bgImages', [...formData.bgImages, pendingImageUrl]);
      showToast("✅ 已成功加入视觉背景库！", "success");
      setPendingImageUrl(null);
    }
  };

  const cancelPendingImage = () => {
    setPendingImageUrl(null);
    showToast("已取消操作，但图片已保存在图床中", "info");
  };

  const onDragOver = (e: any) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e: any) => { e.preventDefault(); setIsDragging(false); };
  const onDrop = (e: any) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <motion.section initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/50 dark:border-slate-800/50 rounded-[40px] p-8 shadow-2xl flex flex-col gap-8 relative overflow-hidden">

      <header className="flex justify-between items-end relative z-10">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">🌌 视觉背景配置</h2>
          <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">管理网站的全局轮播背景图 ({formData.bgImages?.length || 0} 张)</p>
        </div>
        {/* 👈 修复暂存参数：传入真正的 key 和 value */}
        <button onClick={() => pushToQueue('视觉背景图', 'bgImages', formData.bgImages)} className="px-6 py-2 bg-indigo-500 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-500/20 active:scale-95 transition-all">
          暂存背景修改
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
        <div className="bg-slate-100/50 dark:bg-slate-800/50 rounded-3xl p-6 custom-scrollbar max-h-[450px] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <AnimatePresence>
              {formData.bgImages?.map((url: string, index: number) => (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} key={index} className="relative group rounded-2xl overflow-hidden aspect-video shadow-md border border-white/20">
                  <img src={url} alt={`bg-${index}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    <button onClick={() => removeBg(index)} className="w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center font-bold shadow-xl hover:bg-red-600 scale-0 group-hover:scale-100 transition-transform">✕</button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          {(!formData.bgImages || formData.bgImages.length === 0) && (
            <div className="w-full h-32 flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl text-slate-400 text-xs font-bold">没有背景图，快去添加吧！</div>
          )}
        </div>

        <div className="space-y-6 flex flex-col relative">
          <div className="bg-white/50 dark:bg-slate-800/50 rounded-3xl p-5 border border-white/40 dark:border-slate-700/50 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-3">🔗 粘贴网络图片 URL</p>
            <div className="flex gap-2">
              <input type="text" placeholder="https://..." value={formData.newBgUrl} onChange={e => handleUpdate('newBgUrl', e.target.value)} className="flex-1 bg-white dark:bg-slate-900 border-none rounded-xl px-4 py-2 text-xs outline-none shadow-inner" />
              <button onClick={addBgUrl} className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-500/20 active:scale-95">添加</button>
            </div>
          </div>

          <div
            onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`flex-1 min-h-[200px] border-2 border-dashed rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-300 relative overflow-hidden
              ${isDragging ? 'border-indigo-500 bg-indigo-500/10 scale-[1.02]' : 'border-slate-300 dark:border-slate-600 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:border-indigo-400'}
            `}
          >
            <input type="file" ref={fileInputRef} onChange={e => e.target.files && handleFileUpload(e.target.files[0])} className="hidden" accept="image/*" />

            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-xl transition-all duration-300 ${isDragging ? 'bg-indigo-500 text-white rotate-12' : 'bg-white dark:bg-slate-800 text-slate-500'}`}>
              {isUploading ? "⏳" : "☁️"}
            </div>

            <div className="text-center z-10">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                {isUploading ? "正在上传至图床..." : "点击或将图片拖拽至此"}
              </p>
            </div>

            {isUploading && (
              <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 👈 【新增】：上传成功后的浮动确认面板 */}
      <AnimatePresence>
        {pendingImageUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-md rounded-[40px] flex items-center justify-center p-6"
          >
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-white/20">
              <h3 className="text-lg font-black text-slate-800 dark:text-white mb-4 text-center">✅ 图床返回成功！</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 text-center">是否将此图片设为网站轮播背景？</p>

              <div className="w-full aspect-video rounded-xl overflow-hidden mb-6 shadow-inner border border-slate-200 dark:border-slate-700">
                <img src={pendingImageUrl} alt="preview" className="w-full h-full object-cover" />
              </div>

              <div className="flex gap-3">
                <button onClick={cancelPendingImage} className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                  不了，仅上传
                </button>
                <button onClick={confirmAddPendingImage} className="flex-1 py-3 bg-pink-500 text-white rounded-xl text-xs font-black shadow-lg shadow-pink-500/30 hover:bg-pink-600 active:scale-95 transition-all">
                  ✨ 加入背景库
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.section>
  );
}