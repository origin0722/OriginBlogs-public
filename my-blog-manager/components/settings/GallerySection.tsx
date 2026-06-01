import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../ToastProvider';

export default function GallerySection({ formData, handleUpdate, pushToQueue }: any) {
  const { showToast } = useToast();
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean, msg: string } | null>(null);

  const handleTestConnection = async () => {
    // 👈 彻底去掉写死逻辑，完全读取用户在界面输入的 URL 和 Token
    const url = formData.picBedUrl;
    const token = formData.picBedToken;

    if (!url || !token) {
      showToast("请完整填写图床 API 地址和 TOKEN！", "warning");
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    showToast("正在向图床服务器发送校验探针...", "info");

    try {
      const configRes = await fetch(`/backend_config.json?t=${Date.now()}`);
      const configData = await configRes.json();

      const res = await fetch(`http://127.0.0.1:${configData.api_port}/api/picbed/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, token })
      });

      const data = await res.json();
      setTestResult({ success: data.success, msg: data.message });

      if (data.success) {
        showToast("✅ 测试通过！图床已就绪", "success");
      } else {
        showToast("❌ Token 无效或服务异常", "error");
      }
    } catch (error) {
      showToast("无法连接到本地 Python 引擎", "error");
      setTestResult({ success: false, msg: "桌面引擎连接失败，请检查终端日志" });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    if (!formData.picBedUrl || !formData.picBedToken) {
      showToast("API 地址和 TOKEN 不能为空，无法暂存！", "error");
      return;
    }
    // 👈 三个参数全部推送到操作队列
    pushToQueue('更新图床名称', 'picBedName', formData.picBedName);
    pushToQueue('更新图床 API', 'picBedUrl', formData.picBedUrl);
    pushToQueue('更新图床 Token', 'picBedToken', formData.picBedToken);
  };

  return (
    <motion.section initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/50 dark:border-slate-800/50 rounded-[40px] p-8 shadow-2xl">
      <h2 className="text-xl font-black text-slate-800 dark:text-white mb-8">🖼️ 图床引擎设置</h2>

      <div className="max-w-xl space-y-6">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">图床名称标识</label>
          <input
            type="text"
            value={formData.picBedName}
            onChange={e => handleUpdate('picBedName', e.target.value)}
            className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none mt-1 font-bold text-slate-700 dark:text-slate-200"
          />
        </div>

        {/* 👈 新增：彻底解耦的 API 地址输入框 */}
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">API 接口地址 (URL)</label>
          <input
            type="text"
            placeholder="例如: https://pic.dusays.com"
            value={formData.picBedUrl || ''}
            onChange={e => handleUpdate('picBedUrl', e.target.value)}
            className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none mt-1 text-slate-700 dark:text-slate-200"
          />
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">API TOKEN (鉴权密钥)</label>
          <input
            type="password"
            placeholder="输入 Bearer Token 或纯 Token"
            value={formData.picBedToken || ''}
            onChange={e => handleUpdate('picBedToken', e.target.value)}
            className="w-full bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none mt-1 text-slate-700 dark:text-slate-200"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={handleTestConnection}
            disabled={isTesting}
            className={`flex-1 py-3 rounded-2xl text-sm font-black shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2
              ${isTesting ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-pink-500 text-white hover:bg-pink-600 shadow-pink-500/30'}`}
          >
            {isTesting ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : "📡 发送探针测试 Token"}
          </button>

          <button
            onClick={handleSave}
            className="flex-1 py-3 bg-indigo-500 text-white rounded-2xl text-sm font-black shadow-lg hover:bg-indigo-600 shadow-indigo-500/30 transition-all active:scale-95"
          >
            暂存图床配置
          </button>
        </div>

        <AnimatePresence>
          {testResult && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className={`p-4 rounded-2xl border flex items-center gap-3 ${testResult.success ? 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'}`}>
                <span className="text-xl">{testResult.success ? '✅' : '❌'}</span>
                <span className="text-sm font-bold leading-relaxed">{testResult.msg}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </motion.section>
  );
}