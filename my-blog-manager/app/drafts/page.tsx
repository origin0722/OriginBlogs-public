"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import { ToastProvider, useToast } from '../../components/ToastProvider';
import { AlertTriangle, Search, Trash2, X, Sparkles, Pencil } from 'lucide-react';

function DraftsContent() {
  const { showToast } = useToast();
  const [drafts, setDrafts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // 👇 自定义弹窗状态管理
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null; title: string | null }>({
    isOpen: false,
    id: null,
    title: null
  });

  const blogPath = "F:/Projects/my-blog";

  const fetchDrafts = async () => {
    setIsLoading(true);
    try {
      const configRes = await fetch(`/backend_config.json?t=${Date.now()}`);
      const configData = await configRes.json();

      const res = await fetch(`http://127.0.0.1:${configData.api_port}/api/drafts/list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blog_path: blogPath })
      });

      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.drafts)) {
        setDrafts(data.drafts);
      } else {
        setDrafts([]);
      }
    } catch (error) {
      setDrafts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, []);

  // 🗑️ 核心逻辑：执行真实的销毁操作
  const confirmDelete = async () => {
    if (!deleteModal.id) return;
    const id = deleteModal.id;

    try {
      const configRes = await fetch(`/backend_config.json?t=${Date.now()}`);
      const configData = await configRes.json();

      const res = await fetch(`http://127.0.0.1:${configData.api_port}/api/drafts/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blog_path: blogPath, id: id })
      });

      const data = await res.json();
      if (data.success) {
        showToast("🗑️ 草稿已被彻底销毁", "success");
        setDrafts(prev => prev.filter(draft => draft.id !== id));
      } else {
        showToast(`销毁失败: ${data.message}`, "error");
      }
    } catch (error) {
      showToast("引擎连接失败", "error");
    } finally {
      // 关闭弹窗并重置状态
      setDeleteModal({ isOpen: false, id: null, title: null });
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const filteredDrafts = drafts.filter(draft =>
    (draft.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (draft.contentPreview || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />

      {/* ---------------------------------------------------------
          💎 自定义绝美确认弹窗 (与杂谈页保持高度统一)
      --------------------------------------------------------- */}
      <AnimatePresence>
        {deleteModal.isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDeleteModal({ isOpen: false, id: null, title: null })}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] border border-white/50 dark:border-white/10 p-10 text-center overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50" />

              <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>

              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">销毁这篇草稿？</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed">
                你正在尝试抹除未发布的草稿 <br />
                <span className="text-red-500 font-bold">"{deleteModal.title}"</span>。<br />
                此操作不可逆，所有未保存的灵感将永久消失。
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteModal({ isOpen: false, id: null, title: null })}
                  className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                >
                  继续保留
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-4 bg-red-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-red-500/30 hover:bg-red-600 transition-all active:scale-95"
                >
                  确认移除
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <PageTransition>
        <main className="w-[90%] max-w-5xl mx-auto mt-28 relative z-10">

          <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl font-black text-slate-800 dark:text-white mb-3 tracking-wider flex items-center gap-3">
                📝 创作草稿箱
                <span className="text-sm font-bold bg-indigo-500 text-white px-3 py-1 rounded-full">{drafts.length}</span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm flex items-center gap-2">
                <Sparkles size={14} className="text-indigo-500" /> 灵感的避风港，所有未发布的心血都在这里。
              </p>
            </div>

            <div className="relative w-full md:w-72 group">
              <input
                type="text"
                placeholder="检索草稿..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 pl-12 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
              />
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            </div>
          </header>

          <div className="mb-8 flex gap-4">
            <Link href="/editor?id=new&type=post" className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-500/30 transition-all active:scale-95 flex items-center gap-2">
              <Pencil size={16} /> 新建文章草稿
            </Link>
            <Link href="/editor?id=new&type=chatter" className="px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-pink-500/30 transition-all active:scale-95 flex items-center gap-2">
              <Sparkles size={16} /> 新建杂谈草稿
            </Link>
          </div>

          {isLoading ? (
            <div className="w-full py-20 flex justify-center">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnimatePresence mode='popLayout'>
                {filteredDrafts.map((draft) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    key={draft.id}
                  >
                    <div className="group bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden relative">

                      <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${draft.type === 'chatter' ? 'bg-pink-500/10 text-pink-600 border-pink-500/20' : 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20'}`}>
                            {draft.type === 'chatter' ? '杂谈' : '文章'}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            {formatDate(draft.lastModified)}
                          </span>
                        </div>

                        <button
                          onClick={() => setDeleteModal({ isOpen: true, id: draft.id, title: draft.title || "无标题草稿" })}
                          className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700/50 text-slate-400 hover:bg-red-500 hover:text-white transition-all shadow-sm z-20"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      <Link href={`/editor?id=${draft.id}`} className="block">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2 group-hover:text-indigo-600 transition-colors line-clamp-1">
                          {draft.title || "无标题草稿"}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed h-10">
                          {draft.contentPreview || "没有任何内容..."}
                        </p>
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {filteredDrafts.length === 0 && (
                <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl">
                  <p className="text-slate-500 font-bold">搜索不到相关草稿，换个关键词试试？</p>
                </div>
              )}
            </div>
          )}

        </main>
      </PageTransition>
    </div>
  );
}

export default function DraftsPage() {
  return (
    <ToastProvider>
      <DraftsContent />
    </ToastProvider>
  );
}