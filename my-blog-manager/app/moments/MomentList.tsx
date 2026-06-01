"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { MapPin, MessageSquare, Clock, Sparkles, Search, ArrowDownAZ, ArrowUpZA, ChevronLeft, ChevronRight, Ghost, Plus, Image as ImageIcon, X, Send, Link as LinkIcon, Zap, Trash2, AlertTriangle } from 'lucide-react';
import MomentComments from '../../components/MomentComments';
import { useToast } from '../../components/ToastProvider';
import { siteConfig } from '../../siteConfig';
import { useOperations } from '../../context/OperationContext';

function timeAgo(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return '刚刚';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} 分钟前`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} 小时前`;
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

export default function MomentList({ moments, authorName, avatarUrl }: any) {
  const [openCommentId, setOpenCommentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [lightbox, setLightbox] = useState<{ images: string[], index: number } | null>(null);

  const { showToast } = useToast();
  const { operations, addOperation, removeOperation } = useOperations();

  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [newMoment, setNewMoment] = useState({ content: '', location: '', images: [] as string[] });
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUrlInput, setImageUrlInput] = useState('');

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const processedMoments = useMemo(() => {
    let baseMoments = moments ? [...moments] : [];

    // 拦截并在顶层混合暂缓队列的数据
    const pendingMoments = operations
      .filter(op => op.type === 'create_moment')
      .map(op => ({
        ...op.payload,
        opId: op.id,
        isPending: true
      }));

    let result = [...pendingMoments, ...baseMoments];

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter(m =>
        (m.content || '').toLowerCase().includes(query) ||
        (m.location || '').toLowerCase().includes(query)
      );
    }

    result.sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });
    return result;
  }, [moments, searchQuery, sortOrder, operations]);

  const nextImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!lightbox) return;
    setLightbox({ ...lightbox, index: (lightbox.index + 1) % lightbox.images.length });
  };

  const prevImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!lightbox) return;
    setLightbox({ ...lightbox, index: (lightbox.index - 1 + lightbox.images.length) % lightbox.images.length });
  };

  const handleFileUpload = async (files: FileList | File[]) => {
    const picUrl = (siteConfig as any).picBedUrl || "https://pic.dusays.com";
    const picToken = (siteConfig as any).picBedToken;
    if (!picToken) { showToast("未配置图床 Token！", "error"); return; }
    setIsUploading(true);
    showToast(`正在上传 ${files.length} 张图片...`, "info");
    try {
      const configRes = await fetch(`/backend_config.json?t=${Date.now()}`);
      const configData = await configRes.json();
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const uploadData = new FormData();
        uploadData.append('file', files[i]);
        uploadData.append('url', picUrl);
        uploadData.append('token', picToken);
        const res = await fetch(`http://127.0.0.1:${configData.api_port}/api/picbed/upload`, {
          method: 'POST',
          body: uploadData,
        });
        const data = await res.json();
        if (data.success && data.url) newUrls.push(data.url);
        else showToast(`第 ${i+1} 张上传失败`, "error");
      }
      if (newUrls.length > 0) {
        setNewMoment(prev => ({ ...prev, images: [...prev.images, ...newUrls] }));
        showToast(`✅ 成功添加 ${newUrls.length} 张图片`, "success");
      }
    } catch (error: any) {
      showToast(`连接异常: ${error.message}`, "error");
    } finally {
      setIsUploading(false);
      setIsDragging(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) handleFileUpload(e.dataTransfer.files);
  };

  const handleAddImageUrl = () => {
    if (imageUrlInput.trim()) {
      setNewMoment(prev => ({ ...prev, images: [...prev.images, imageUrlInput.trim()] }));
      setImageUrlInput('');
      showToast("✅ 已添加网络图片", "success");
    }
  };

  const handleQueueMoment = () => {
    if (!newMoment.content.trim()) {
      showToast("内容不能为空哦！", "warning");
      return;
    }
    const payload = {
      id: `moment-${Date.now()}`,
      date: new Date().toISOString(),
      content: newMoment.content,
      location: newMoment.location,
      images: newMoment.images
    };
    addOperation({
      id: `op-moment-${Date.now()}`,
      type: 'create_moment',
      label: `[发布说说] ${newMoment.content.slice(0, 12)}...`,
      payload: payload,
      timestamp: new Date().toLocaleString()
    });
    showToast("✅ 队列保存成功！\n请点击右上角导航栏的 📥 收件箱更新本地", "success");
    setIsPublishOpen(false);
    setNewMoment({ content: '', location: '', images: [] });
  };

  const handleDirectPublish = async () => {
    if (!newMoment.content.trim()) {
      showToast("说说内容不能为空！", "error");
      return;
    }
    setIsSubmitting(true);
    showToast("🚀 正在强行直连 Python 引擎...", "info");

    try {
      const configRes = await fetch(`/backend_config.json?t=${Date.now()}`);
      if (!configRes.ok) throw new Error("无法读取 backend_config.json");
      const configData = await configRes.json();

      const payload = {
        id: `moment-${Date.now()}`,
        date: new Date().toISOString(),
        content: newMoment.content,
        location: newMoment.location,
        images: newMoment.images
      };
      const apiUrl = `http://127.0.0.1:${configData.api_port}/api/moments/save`;

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(`后端返回 HTTP 状态码: ${res.status}`);

      const data = await res.json();
      if (data.success) {
        showToast("🎉 发布成功！正在刷新...", "success");
        setIsPublishOpen(false);
        setNewMoment({ content: '', location: '', images: [] });
        setTimeout(() => window.location.reload(), 1000);
      } else {
        showToast(`⚠️ 后端拒绝了请求：${data.message}`, "error");
      }
    } catch (error: any) {
      showToast(`🚨 请求彻底断裂：${error.message}`, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeDelete = async () => {
    if (!deleteConfirmId) return;
    setIsDeleting(true);
    try {
      const configRes = await fetch(`/backend_config.json?t=${Date.now()}`);
      const configData = await configRes.json();
      const apiUrl = `http://127.0.0.1:${configData.api_port}/api/moments/delete`;

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteConfirmId })
      });

      const data = await res.json();
      if (data.success) {
        showToast("🗑️ 说说已彻底删除", "success");
        setTimeout(() => window.location.reload(), 1000);
      } else {
        showToast(`删除失败: ${data.message}`, "error");
      }
    } catch (error: any) {
      showToast(`连接失败: ${error.message}`, "error");
    } finally {
      setIsDeleting(false);
      setDeleteConfirmId(null);
    }
  };

  const handleDeleteClick = (moment: any) => {
    if (moment.isPending) {
      removeOperation(moment.opId);
      showToast("已撤销暂缓的说说", "success");
    } else {
      setDeleteConfirmId(moment.id);
    }
  };

  const renderImages = (images: string[]) => {
    if (!images || images.length === 0) return null;
    const count = images.length;

    if (count === 1) {
      return (
        <div className="mt-8 flex justify-center w-full">
          <div onClick={() => setLightbox({ images, index: 0 })} className="max-w-[280px] overflow-hidden rounded-2xl border border-slate-200/50 dark:border-white/10 shadow-xl cursor-zoom-in group">
            <img src={images[0]} alt="moment" className="w-full h-auto max-h-[400px] object-contain group-hover:scale-105 transition-transform duration-500" />
          </div>
        </div>
      );
    }

    const columns = count === 4 ? 2 : 3;
    const maxWidth = count === 4 ? '210px' : '320px';

    return (
      <div className="w-full flex justify-center mt-8">
        <div className="grid gap-2 mx-auto" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)`, width: '100%', maxWidth: maxWidth }}>
          {images.slice(0, 9).map((src, idx) => {
            const isLastVisible = idx === 8 && count > 9;
            return (
              <div key={idx} onClick={() => setLightbox({ images, index: idx })} className="group relative aspect-square overflow-hidden rounded-xl bg-slate-200/20 dark:bg-slate-700/20 border border-slate-200/50 dark:border-white/10 cursor-zoom-in">
                <img src={src} alt="moment" className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                {isLastVisible && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white backdrop-blur-[2px]">
                    <span className="text-xl font-black">+{count - 9}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // 🌟 将卡片渲染抽象为一个函数，方便分列渲染
  const renderMomentCard = (moment: any) => (
    <motion.div
      key={moment.id}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.4, type: 'spring', stiffness: 100 }}
      className="flex flex-col bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-[40px] shadow-xl border border-white/40 dark:border-white/10 p-8 md:p-10 transition-shadow hover:shadow-2xl overflow-hidden relative group w-full"
    >
      {/* 霓虹队列状态提示 */}
      {moment.isPending && (
        <div className="absolute top-0 left-0 w-full bg-amber-500/10 text-amber-600 dark:text-amber-400 py-1.5 flex justify-center items-center gap-2 text-[10px] font-black tracking-widest uppercase border-b border-amber-500/20 backdrop-blur-md z-10">
          <Clock size={12} className="animate-pulse" /> 等待更新至本地
        </div>
      )}

      {/* 悬浮删除按钮 */}
      <button
        onClick={() => handleDeleteClick(moment)}
        className={`absolute ${moment.isPending ? 'top-10' : 'top-6'} right-6 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-red-500 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-sm z-10`}
      >
        <Trash2 size={14} />
      </button>

      <div className={`flex items-center gap-4 mb-8 pb-6 border-b border-slate-200/50 dark:border-slate-700/50 relative ${moment.isPending ? 'mt-4' : ''}`}>
        <div className="w-14 h-14 shrink-0 rounded-2xl overflow-hidden shadow-md border-2 border-white dark:border-slate-700">
          <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col">
          <h3 className="text-lg font-black text-[#576b95] dark:text-[#7f99cc] tracking-wide">{authorName}</h3>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-bold mt-1"><Clock size={12} /> {timeAgo(moment.date)}</div>
        </div>
      </div>
      <p className="text-slate-800 dark:text-slate-200 text-[16px] leading-relaxed whitespace-pre-wrap font-medium break-words">{moment.content}</p>

      {renderImages(moment.images)}

      <div className="mt-10 flex items-center justify-between">
        <div className="min-w-0 flex-1">
          {moment.location && <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 max-w-full truncate border border-indigo-500/10"><MapPin size={12} /> {moment.location}</span>}
        </div>
        <button onClick={() => setOpenCommentId(openCommentId === moment.id ? null : moment.id)} className={`w-10 h-10 flex items-center justify-center shrink-0 rounded-full transition-all shadow-sm ${openCommentId === moment.id ? 'bg-indigo-500 text-white shadow-indigo-500/30 rotate-12' : 'bg-white/80 dark:bg-slate-800 text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
          <MessageSquare size={16} />
        </button>
      </div>

      <AnimatePresence>
        {openCommentId === moment.id && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1, marginTop: 24 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="bg-slate-50/50 dark:bg-slate-900/50 rounded-3xl p-6 border border-slate-200/50 dark:border-slate-700/50 relative shadow-inner">
              <div className="absolute -top-2 right-8 w-4 h-4 bg-slate-50/50 dark:bg-slate-900/50 rotate-45 border-l border-t border-slate-200/50"></div>
              <MomentComments id={`/moments/${moment.id}`} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  return (
    <div className="w-[90%] max-w-6xl mx-auto py-10 mt-28 relative z-10 flex-1 flex flex-col min-h-[85vh]">

      <div className="mb-14 text-center relative">
        <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter">生活动态</motion.h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium italic opacity-80 flex items-center justify-center gap-2">
          <Sparkles size={14} className="text-indigo-500" /> “ 在代码之外捕捉瞬间的温度 ”
        </p>
      </div>

      <div className="mb-16 flex flex-col items-center gap-8">
        <button
          onClick={() => setIsPublishOpen(true)}
          className="group relative px-10 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl shadow-lg shadow-indigo-500/30 text-white font-black tracking-widest text-sm hover:shadow-indigo-500/50 hover:-translate-y-1 transition-all duration-300 flex items-center gap-2 overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          <Plus size={18} className="relative z-10" />
          <span className="relative z-10">写点什么...</span>
        </button>

        <div className="relative w-full max-w-lg group">
          <Search className="w-6 h-6 absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors z-20 pointer-events-none" />
          <input type="text" placeholder="搜寻被遗忘的记忆..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/40 dark:border-white/5 rounded-2xl px-6 py-4 pl-14 text-slate-800 dark:text-white shadow-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium relative z-10" />
        </div>

        <div className="flex bg-white/50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-white/50 dark:border-white/10 shadow-sm relative z-10">
          <button onClick={() => setSortOrder('desc')} className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black transition-all duration-300 ${sortOrder === 'desc' ? 'bg-indigo-500 text-white shadow-lg scale-105' : 'text-slate-500 hover:text-indigo-500'}`}>
            <ArrowDownAZ size={14} /> 最新
          </button>
          <button onClick={() => setSortOrder('asc')} className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black transition-all duration-300 ${sortOrder === 'asc' ? 'bg-indigo-500 text-white shadow-lg scale-105' : 'text-slate-500 hover:text-indigo-500'}`}>
            <ArrowUpZA size={14} /> 最早
          </button>
        </div>
      </div>

      {/* 🌟 完美的 Flexbox 分列瀑布流！彻底告别错位和缝隙！ */}
      <LayoutGroup>
        {processedMoments.length > 0 ? (
          <div className="flex flex-col md:flex-row gap-8 pb-32 w-full items-start">
            {/* 左列 */}
            <div className="flex-1 flex flex-col gap-8 w-full min-w-0">
              <AnimatePresence mode='popLayout'>
                {processedMoments.filter((_, i) => i % 2 === 0).map(moment => renderMomentCard(moment))}
              </AnimatePresence>
            </div>
            {/* 右列 */}
            <div className="flex-1 flex flex-col gap-8 w-full min-w-0">
              <AnimatePresence mode='popLayout'>
                {processedMoments.filter((_, i) => i % 2 === 1).map(moment => renderMomentCard(moment))}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-24 min-h-[450px]">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center px-10 py-20 bg-white/40 dark:bg-slate-800/30 backdrop-blur-3xl rounded-[50px] border border-white/30 dark:border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] max-w-lg w-full mx-auto">
              <div className="w-24 h-24 bg-indigo-500/10 rounded-3xl flex items-center justify-center mb-8 relative">
                <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full animate-pulse"></div>
                <Ghost size={48} className="text-indigo-500 relative z-10" strokeWidth={1.5} />
              </div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">{searchQuery ? "没找到相关记忆" : "朋友圈空空如也"}</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-lg leading-relaxed px-4">{searchQuery ? `尝试精简你的搜索词，或者换个心情再次出发。` : `还没有记录下任何生活碎片呢，不如现在就开始？`}</p>
            </motion.div>
          </div>
        )}
      </LayoutGroup>

      {/* 发布弹窗 */}
      <AnimatePresence>
        {isPublishOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/70 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)] border border-white/50 dark:border-white/10 p-10 overflow-hidden flex flex-col max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-60" />

              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                  <Sparkles className="text-indigo-500" /> 记录新瞬间
                </h2>
                <button onClick={() => setIsPublishOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <textarea
                value={newMoment.content}
                onChange={(e) => setNewMoment(prev => ({...prev, content: e.target.value}))}
                placeholder="这一刻的想法..."
                className="w-full bg-white/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-5 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[120px] resize-none mb-6 font-medium custom-scrollbar"
              />

              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 group">
                  <MapPin className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="所在位置 (可选)"
                    value={newMoment.location}
                    onChange={(e) => setNewMoment(prev => ({...prev, location: e.target.value}))}
                    className="w-full bg-white/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl py-3 pl-12 pr-4 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4 mb-6">
                <div
                  onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                    isDragging 
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20' 
                      : 'border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <input type="file" multiple ref={fileInputRef} onChange={(e) => e.target.files && handleFileUpload(e.target.files)} accept="image/*" className="hidden" />
                  {isUploading ? (
                    <Clock className="animate-spin text-indigo-500" size={28} />
                  ) : (
                    <ImageIcon className="text-slate-400" size={28} />
                  )}
                  <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                    {isUploading ? '极速上传中...' : '点击或拖拽图片到这里'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative flex-1 group">
                    <LinkIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      type="text"
                      placeholder="粘贴外链 URL 添加..."
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      className="w-full bg-white/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl py-3 pl-12 pr-4 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                  <button
                    onClick={handleAddImageUrl}
                    disabled={!imageUrlInput.trim()}
                    className="px-5 py-3 rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 font-bold text-sm hover:bg-indigo-200 dark:hover:bg-indigo-500/30 transition-all disabled:opacity-50 shrink-0"
                  >
                    添加
                  </button>
                </div>
              </div>

              {newMoment.images.length > 0 && (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 mb-8">
                  {newMoment.images.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm group">
                      <img src={img} alt="preview" className="w-full h-full object-cover" />
                      <button
                        onClick={(e) => { e.stopPropagation(); setNewMoment(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) })) }}
                        className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-3 mt-auto pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                <button onClick={() => setIsPublishOpen(false)} className="flex-1 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black uppercase tracking-widest text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                  取消
                </button>

                <button
                  onClick={handleQueueMoment}
                  disabled={isUploading || isSubmitting}
                  className="flex-[1.5] py-4 px-2 rounded-2xl bg-slate-800 text-white font-black uppercase tracking-[0.1em] text-xs shadow-lg hover:bg-slate-900 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send size={16} /> 加入队列
                </button>

                <button
                  onClick={handleDirectPublish}
                  disabled={isUploading || isSubmitting}
                  className="flex-[2] py-4 px-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black uppercase tracking-[0.2em] text-[13px] shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Clock className="animate-spin" size={18} /> : <Zap size={18} className="fill-current text-yellow-300" />}
                  立即发布
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteConfirmId(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-sm bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[40px] shadow-2xl border border-white/50 p-10 text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="text-red-500" size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">删除这条记忆？</h3>
              <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                物理文件将被彻底销毁<br />并且无法被找回。
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirmId(null)} disabled={isDeleting} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-black uppercase transition-colors hover:bg-slate-200 dark:hover:bg-slate-700">取消</button>
                <button onClick={executeDelete} disabled={isDeleting} className="flex-1 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-xs font-black uppercase shadow-lg shadow-red-500/30 transition-all flex justify-center items-center">
                  {isDeleting ? <Clock className="animate-spin" size={16} /> : '确认粉碎'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-slate-950/98 backdrop-blur-xl flex items-center justify-center cursor-pointer overflow-hidden"
            onClick={() => setLightbox(null)}
          >
            {lightbox.images.length > 1 && (
              <>
                <button className="absolute left-6 md:left-12 w-14 h-14 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full text-white transition-all z-50 border border-white/5 backdrop-blur-md" onClick={prevImg}><ChevronLeft size={36} /></button>
                <button className="absolute right-6 md:right-12 w-14 h-14 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full text-white transition-all z-50 border border-white/5 backdrop-blur-md" onClick={nextImg}><ChevronRight size={36} /></button>
              </>
            )}
            <motion.div key={lightbox.index} initial={{ opacity: 0, scale: 0.9, x: 50 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9, x: -50 }} className="relative w-full h-full flex flex-col items-center justify-center p-4 md:p-12 pointer-events-none">
              <img src={lightbox.images[lightbox.index]} className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-[0_0_80px_rgba(0,0,0,0.5)] border border-white/10" alt="fullscreen" />
              <div className="absolute bottom-10 px-5 py-2 rounded-full bg-white/5 backdrop-blur-md text-white/70 text-xs font-black tracking-widest border border-white/10">
                {lightbox.index + 1} / {lightbox.images.length}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}