"use client";
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { siteConfig } from '../../siteConfig';
import { Plus, Pencil, Trash2, Search, Sparkles, AlertTriangle, X } from 'lucide-react';
import { useToast } from '../../components/ToastProvider';

type Chatter = {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  mood?: string;
  cover?: string;
  content: string;
};

export default function ChatterBoard({ chatters: initialChatters }: { chatters: Chatter[] }) {
  const [chatters, setChatters] = useState(initialChatters);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState("全部");
  const { showToast } = useToast();

  // 👇 控制自定义弹窗的状态
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; slug: string | null; title: string | null }>({
    isOpen: false,
    slug: null,
    title: null
  });

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    chatters.forEach(c => c.tags?.forEach(t => tags.add(t)));
    return ["全部", ...Array.from(tags)];
  }, [chatters]);

  const filteredChatters = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return chatters.filter(chatter => {
      const matchSearch = (chatter.title || "").toLowerCase().includes(query) ||
                          (chatter.content || "").toLowerCase().includes(query);
      const matchTag = activeTag === "全部" || chatter.tags?.includes(activeTag);
      return matchSearch && matchTag;
    });
  }, [chatters, searchQuery, activeTag]);

  // 🗑️ 真正的执行删除逻辑
// ... 保持其他部分不变 ...
  const confirmDelete = async () => {
    if (!deleteModal.slug) return;
    const slug = deleteModal.slug;

    try {
      const configRes = await fetch(`/backend_config.json?t=${Date.now()}`);
      const config = await configRes.json();

      // 调用全能删除接口
      const res = await fetch(`http://127.0.0.1:${config.api_port}/api/drafts/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: slug }) // 这里传的是 slug (即 md 的文件名)
      });

      const data = await res.json();
      if (data.success) {
        showToast("🗑️ 物理文件已彻底销毁", "success");
        setChatters(prev => prev.filter(c => c.slug !== slug));
      } else {
        showToast("❌ 销毁失败: " + data.message, "error");
      }
    } catch (err) {
      showToast("❌ 无法连接到 Python 引擎", "error");
    } finally {
      setDeleteModal({ isOpen: false, slug: null, title: null });
    }
  };
  // ... 保持其他部分不变 ...

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-10 py-10 pt-28 relative z-10">

      {/* ---------------------------------------------------------
          💎 自定义绝美确认弹窗 (Custom Modal)
      --------------------------------------------------------- */}
      <AnimatePresence>
        {deleteModal.isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* 背景遮罩 */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDeleteModal({ isOpen: false, slug: null, title: null })}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />

            {/* 弹窗主体 */}
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

              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">确认要销毁吗？</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed">
                你正在尝试抹除 <span className="text-red-500 font-bold">"{deleteModal.title}"</span>。<br />
                此操作将永久从硬盘删除源文件，不可撤回。
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteModal({ isOpen: false, slug: null, title: null })}
                  className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                >
                  先留着吧
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-4 bg-red-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-red-500/30 hover:bg-red-600 transition-all active:scale-95"
                >
                  彻底抹除
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------------------------------------------------
          主页面布局 (保持原样并优化删除调用)
      --------------------------------------------------------- */}

      <div className="mb-14 text-center">
        <motion.h1
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter"
        >
          {siteConfig.chatterTitle || "源石研究笔记"}
        </motion.h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium italic opacity-80 flex items-center justify-center gap-2">
          <Sparkles size={14} className="text-indigo-500" />
          “ {siteConfig.chatterDescription || "日常碎片与灵感记录"} ”
        </p>
      </div>

      <div className="mb-12 flex flex-col items-center gap-8">
        <div className="relative w-full max-w-lg group">
          <input
            type="text" placeholder="搜寻被遗忘的思绪..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/40 dark:border-white/5 rounded-2xl px-6 py-4 pl-14 text-slate-800 dark:text-white shadow-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder-slate-400 font-medium"
          />
          <Search className="w-6 h-6 absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {allTags.map(tag => (
            <button key={tag} onClick={() => setActiveTag(tag)}
              className={`px-5 py-2 rounded-xl text-xs font-black transition-all duration-500 border ${
                activeTag === tag 
                ? 'bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/30 scale-105' 
                : 'bg-white/30 dark:bg-slate-800/30 text-slate-600 dark:text-slate-400 border-white/20 dark:border-white/5 hover:bg-white/60 dark:hover:bg-slate-700/60'
              }`}
            >
              {tag === "全部" ? tag : `# ${tag}`}
            </button>
          ))}
        </div>
      </div>

      <motion.div layout className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">

        {/* 新增项 */}
        <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="break-inside-avoid">
          <Link href="/editor?type=chatter"
            className="group flex flex-col items-center justify-center min-h-[250px] rounded-[32px] border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white/10 dark:bg-slate-800/10 hover:bg-white/30 dark:hover:bg-indigo-500/5 hover:border-indigo-500 transition-all duration-500"
          >
            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-indigo-500 group-hover:text-white group-hover:rotate-90 transition-all duration-500 shadow-sm">
              <Plus size={32} />
            </div>
            <span className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-indigo-500 transition-colors">记录新的灵感...</span>
          </Link>
        </motion.div>

        <AnimatePresence mode='popLayout'>
          {filteredChatters.map((chatter) => (
            <motion.div
              layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              key={chatter.slug} className="break-inside-avoid group relative"
            >
              {/* 悬浮管理按钮组 */}
              <div className="absolute top-5 left-5 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0">
                <Link
                  href={`/editor?id=${chatter.slug}&type=chatter`}
                  className="w-8 h-8 rounded-lg bg-indigo-500 text-white flex items-center justify-center shadow-lg hover:bg-indigo-600 transition-colors"
                >
                  <Pencil size={14} />
                </Link>
                <button
                  // 👇 核心修改：点击不再直接 delete，而是打开自定义弹窗
                  onClick={(e) => {
                    e.preventDefault();
                    setDeleteModal({ isOpen: true, slug: chatter.slug, title: chatter.title || "无标题笔记" });
                  }}
                  className="w-8 h-8 rounded-lg bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <Link href={`/chatter/${chatter.slug}`}
                className="block rounded-[32px] bg-white/40 dark:bg-slate-800/40 backdrop-blur-2xl border border-white/50 dark:border-white/5 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden"
              >
                {chatter.cover && (
                  <div className="w-full h-52 overflow-hidden relative">
                    <img src={chatter.cover} alt="cover" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent"></div>
                  </div>
                )}

                <div className="p-7">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] bg-indigo-500/5 dark:bg-indigo-400/10 px-3 py-1 rounded-lg border border-indigo-500/10">
                      {chatter.date}
                    </div>
                    {chatter.mood && (
                      <div className="text-[10px] font-black text-pink-600 dark:text-pink-400 bg-pink-500/5 dark:bg-pink-400/10 px-3 py-1 rounded-lg border border-pink-500/10">
                        {chatter.mood}
                      </div>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {chatter.title || "碎片笔记"}
                  </h3>

                  <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-5 opacity-90 font-medium italic">
                    {chatter.content}
                  </div>

                  {chatter.tags && chatter.tags.length > 0 && (
                    <div className="mt-6 flex flex-wrap gap-2">
                      {chatter.tags.map(t => (
                        <span key={t} className="text-[9px] font-black text-slate-500 dark:text-slate-400 bg-slate-500/5 dark:bg-white/5 px-2.5 py-1 rounded-md border border-slate-500/10 dark:border-white/5">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}