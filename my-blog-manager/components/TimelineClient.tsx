"use client";

import { useState, useMemo, useRef, useEffect } from 'react';
import TimelineNode from './TimelineNode';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, AlertTriangle, Sparkles, LayoutGrid, ListTree, Calendar, Hash, ArrowRight, Edit3, ArrowUp } from 'lucide-react';
import { useToast } from './ToastProvider';
import Link from 'next/link';

export default function TimelineClient({ posts: initialPosts, tags }: { posts: any[], tags: { name: string, count: number }[] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 🌟 核心状态：视图模式 ('timeline' | 'card')
  const [viewMode, setViewMode] = useState<'timeline' | 'card'>('timeline');
  const [showScrollTop, setShowScrollTop] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const gridScrollRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; slug: string | null; title: string | null }>({
    isOpen: false,
    slug: null,
    title: null
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return posts.filter(post =>
      post.title.toLowerCase().includes(query) ||
      (post.description && post.description.toLowerCase().includes(query))
    );
  }, [posts, searchQuery]);

  const timelinePosts = useMemo(() => {
    return posts.filter(post => {
      return selectedTag === 'All' || post.tags?.includes(selectedTag);
    });
  }, [posts, selectedTag]);

  const confirmDelete = async () => {
    if (!deleteModal.slug) return;
    try {
      const configRes = await fetch(`/backend_config.json?t=${Date.now()}`);
      const config = await configRes.json();
      const res = await fetch(`http://127.0.0.1:${config.api_port}/api/drafts/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteModal.slug })
      });
      const data = await res.json();
      if (data.success) {
        showToast("🗑️ 文章已从硬盘物理粉碎", "success");
        setPosts(prev => prev.filter(p => p.slug !== deleteModal.slug));
      } else {
        showToast("❌ 销毁失败: " + data.message, "error");
      }
    } catch (err) {
      showToast("无法连接到 Python 引擎", "error");
    } finally {
      setDeleteModal({ isOpen: false, slug: null, title: null });
    }
  };

  const handleGridScroll = () => {
    if (gridScrollRef.current) {
      setShowScrollTop(gridScrollRef.current.scrollTop > 200);
    }
  };

  const scrollToTop = () => {
    if (gridScrollRef.current) {
      try {
        gridScrollRef.current.scroll({
          top: 0,
          left: 0,
          behavior: 'smooth'
        });
      } catch (error) {
        gridScrollRef.current.scrollTo(0, 0);
      }
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto mt-28 px-4 sm:px-10 relative z-10">

      {/* 💎 统一的销毁确认弹窗 */}
      <AnimatePresence>
        {deleteModal.isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteModal({ isOpen: false, slug: null, title: null })} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[40px] shadow-2xl border border-white/50 dark:border-white/10 p-10 text-center overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50" />
              <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6"><AlertTriangle className="w-10 h-10 text-red-500" /></div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">销毁这篇文章？</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed">你正在抹除 <span className="text-red-500 font-bold">"{deleteModal.title}"</span>。<br />此操作将永久删除物理 MD 文件，不可撤回。</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteModal({ isOpen: false, slug: null, title: null })} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all">保留</button>
                <button onClick={confirmDelete} className="flex-1 py-4 bg-red-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-red-500/30 hover:bg-red-600 transition-all">确认销毁</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="text-center mb-12 relative z-20">
        <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">研究终端</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium flex items-center justify-center gap-2 italic">
          <Sparkles size={16} className="text-indigo-500" /> 总计 {posts.length} 篇研究记录
        </p>
      </div>

      {/* 🌟 搜索与控制面板 */}
      <div className="flex flex-col items-center gap-8 mb-16 relative z-[99]">
        <div className="relative w-full max-w-lg group" ref={searchContainerRef}>
          <input
            type="text"
            placeholder="搜寻被封存的知识..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            className="w-full bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/40 dark:border-white/5 rounded-2xl px-6 py-4 pl-14 text-slate-800 dark:text-white shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder-slate-400 font-medium relative z-20"
          />
          <Search className="w-6 h-6 absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors z-20" />

          <AnimatePresence>
            {isDropdownOpen && searchQuery.trim() !== '' && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-0 right-0 mt-3 bg-white/80 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden max-h-[360px] overflow-y-auto z-[100]"
              >
                {searchResults.length > 0 ? (
                  <div className="flex flex-col py-2">
                    {searchResults.map((post) => (
                      <Link
                        href={`/posts/${post.slug}`}
                        key={post.slug}
                        onClick={() => setIsDropdownOpen(false)}
                        className="px-6 py-4 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors group border-b border-slate-100/50 dark:border-slate-800/50 last:border-0 flex flex-col gap-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1 pr-4">
                            {post.title}
                          </h4>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md shrink-0">
                            {post.date.split(' ')[0]}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 leading-relaxed">
                          {post.description}
                        </p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="px-6 py-8 text-center text-slate-500 dark:text-slate-400 text-sm font-medium">
                    赛博空间里找不到这个印记 🌌
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="w-full flex flex-col md:flex-row justify-between items-center gap-6 bg-white/30 dark:bg-slate-800/30 backdrop-blur-md p-4 rounded-3xl border border-white/20 dark:border-white/5">
          <div className="flex flex-wrap justify-center md:justify-start gap-2 flex-1">
            <button onClick={() => setSelectedTag('All')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${selectedTag === 'All' ? 'bg-indigo-500 text-white shadow-md' : 'bg-white/50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-white'}`}>
              全部档案
            </button>
            {tags.map(tag => (
              <button key={tag.name} onClick={() => setSelectedTag(tag.name)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${selectedTag === tag.name ? 'bg-indigo-500 text-white shadow-md' : 'bg-white/50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-white'}`}>
                {tag.name} <span className="opacity-50 ml-1">{tag.count}</span>
              </button>
            ))}
          </div>

          <div className="flex bg-white/50 dark:bg-slate-900/50 p-1 rounded-2xl shadow-inner shrink-0">
            <button onClick={() => setViewMode('timeline')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all duration-300 ${viewMode === 'timeline' ? 'bg-white dark:bg-slate-700 text-indigo-500 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
              <ListTree size={16} />
              <span className="hidden sm:inline">中枢链路</span>
            </button>
            <button onClick={() => setViewMode('card')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all duration-300 ${viewMode === 'card' ? 'bg-white dark:bg-slate-700 text-indigo-500 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
              <LayoutGrid size={16} />
              <span className="hidden sm:inline">矩阵网格</span>
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">

        {/* ================= 模式 1：网格卡片流 ================= */}
        {viewMode === 'card' && (
          <motion.div
            key="card-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="relative w-full"
          >
            <style dangerouslySetInnerHTML={{ __html: `
              .cyber-scrollbar::-webkit-scrollbar {
                width: 12px; 
              }
              .cyber-scrollbar::-webkit-scrollbar-track {
                background: rgba(99, 102, 241, 0.05);
                border-radius: 12px;
                margin-top: 20px;
                margin-bottom: 56px; 
              }
              .cyber-scrollbar::-webkit-scrollbar-thumb {
                background: linear-gradient(180deg, #818cf8 0%, #c084fc 100%);
                border-radius: 12px;
                border: 2px solid transparent;
                background-clip: padding-box;
              }
              .cyber-scrollbar::-webkit-scrollbar-thumb:hover {
                background: linear-gradient(180deg, #6366f1 0%, #a855f7 100%);
                border: 2px solid transparent;
                background-clip: padding-box;
              }
              .fade-edges {
                -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%);
                mask-image: linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%);
              }
            `}} />

            <div
              ref={gridScrollRef}
              onScroll={handleGridScroll}
              className="h-[75vh] overflow-y-auto cyber-scrollbar pr-5 pb-10 fade-edges"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 pb-10">

                {/* 新建卡片 */}
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
                  <Link href="/editor?id=new&type=post" className="group flex flex-col items-center justify-center h-full min-h-[300px] rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-white/40 dark:bg-slate-800/40 hover:border-indigo-500 hover:bg-indigo-500/10 transition-all duration-500">
                    <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500 shadow-md mb-4">
                      <Plus size={24} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-indigo-500 transition-colors">撰写新研究</span>
                  </Link>
                </motion.div>

                {/* 渲染卡片 */}
                {timelinePosts.map((post, idx) => (
                  <motion.div key={post.slug} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, delay: idx * 0.05 }}>
                    <div className="bg-white/60 dark:bg-slate-800/70 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-3xl overflow-hidden shadow-lg flex flex-col h-full group relative">

                      {/* 🌟 核心修正：点击卡片主体，跳转到前台阅读页面 (/posts/xxx) */}
                      <Link href={`/posts/${post.slug}`} className="block flex-1 flex flex-col cursor-pointer">
                        <div className="relative h-40 overflow-hidden">
                          <img src={post.cover} alt={post.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                          <span className="absolute bottom-3 left-4 text-white/90 text-xs font-mono font-bold bg-black/40 backdrop-blur-sm px-2 py-1 rounded-md">
                            {post.date.split(' ')[0]}
                          </span>
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2 line-clamp-2 transition-colors group-hover:text-indigo-500">{post.title}</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-3 flex-1">{post.description || "没有描述..."}</p>
                          <div className="flex flex-wrap gap-2 mt-auto">
                            {post.tags.map((tag: string) => (
                              <span key={tag} className="text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded-md">#{tag}</span>
                            ))}
                          </div>
                        </div>
                      </Link>

                      {/* 🌟 核心修正：独立于 Link 之外的绝对定位按钮区，互不干扰！ */}
                      <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
                        {/* 真正的编辑按钮，指向 /editor */}
                        <Link href={`/editor?id=${post.slug}&type=post`} className="p-2 bg-indigo-500/90 backdrop-blur-md text-white rounded-xl hover:bg-indigo-600 hover:scale-110 shadow-lg shadow-indigo-500/30 transition-all cursor-pointer">
                          <Edit3 size={16} />
                        </Link>
                        {/* 物理销毁按钮 */}
                        <button onClick={(e) => { e.preventDefault(); setDeleteModal({ isOpen: true, slug: post.slug, title: post.title }); }} className="p-2 bg-red-500/90 backdrop-blur-md text-white rounded-xl hover:bg-red-600 hover:scale-110 shadow-lg shadow-red-500/30 transition-all cursor-pointer">
                          <AlertTriangle size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* 火箭按钮：完美补位 */}
            <AnimatePresence>
              {showScrollTop && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.5, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.5, y: 10 }}
                  onClick={scrollToTop}
                  className="absolute bottom-4 -right-3 w-9 h-9 flex items-center justify-center bg-gradient-to-t from-purple-500 to-indigo-500 text-white rounded-full shadow-lg shadow-purple-500/40 hover:shadow-purple-500/60 hover:-translate-y-1 transition-all z-50 group pointer-events-auto"
                  title="回到顶部"
                >
                  <ArrowUp size={18} className="group-hover:-translate-y-1 transition-transform" />
                </motion.button>
              )}
            </AnimatePresence>

          </motion.div>
        )}

        {/* ================= 模式 2：传统时间线 ================= */}
        {viewMode === 'timeline' && (
          <motion.div
            key="timeline-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="relative overflow-hidden p-2 md:p-10 min-h-[500px]"
          >
            <div className="absolute border-opacity-20 border-indigo-500 dark:border-indigo-400/20 h-full border-2 left-1/2 transform -translate-x-1/2 rounded-full transition-colors duration-1000"></div>

            <div className="relative z-10 flex flex-col gap-16">
              <div className="flex justify-between items-center w-full md:flex-row">
                 <div className="order-1 w-5/12 hidden md:block"></div>
                 <div className="z-20 flex items-center justify-center order-1 bg-white dark:bg-slate-900 shadow-xl w-6 h-6 rounded-full border-4 border-dashed border-indigo-400 animate-spin-slow"></div>
                 <div className="order-1 w-full md:w-5/12">
                    <Link href="/editor?id=new&type=post" className="group flex flex-col items-center justify-center min-h-[160px] rounded-[32px] border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white/20 dark:bg-slate-800/20 hover:border-indigo-500 hover:bg-indigo-500/5 transition-all duration-500 relative overflow-hidden">
                        <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500 shadow-md relative z-10">
                            <Plus size={24} />
                        </div>
                        <span className="mt-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-indigo-500 transition-colors relative z-10">撰写新研究...</span>
                    </Link>
                 </div>
              </div>

              <AnimatePresence mode='popLayout'>
                {timelinePosts.map((post, index) => (
                  <TimelineNode
                    key={post.slug}
                    post={post}
                    index={index + 1}
                    onDelete={(slug, title) => setDeleteModal({ isOpen: true, slug, title })}
                  />
                ))}
              </AnimatePresence>

              {timelinePosts.length === 0 && (
                 <div className="text-center py-20 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-sm">
                    这个频段没有接收到任何信号 📡
                 </div>
              )}
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}