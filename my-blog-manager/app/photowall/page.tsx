"use client";

import { useState, useMemo, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import { albums as initialAlbums, Album, Photo } from '../../data/albums';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Search, Image as ImageIcon, X, Save, AlertTriangle, Sparkles, Edit3, CloudUpload } from 'lucide-react';
import { useOperations } from '../../context/OperationContext';
import { useToast } from '../../components/ToastProvider';
import FloatingImageTool from '../../components/editor/FloatingImageTool';

export default function PhotoWallPage() {
  const [currentAlbum, setCurrentAlbum] = useState<Album | null>(null);
  const [selectedImage, setSelectedImage] = useState<{url: string, caption?: string} | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setActiveQuery(searchQuery.toLowerCase());
      setIsTransitioning(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { addOperation } = useOperations();
  const { showToast } = useToast();
  const [editableAlbums, setEditableAlbums] = useState<Album[]>(initialAlbums);

  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; type: 'album' | 'photo'; id?: string; photoIndex?: number; title: string }>({ isOpen: false, type: 'album', title: '' });
  const [albumModal, setAlbumModal] = useState<{ isOpen: boolean; mode: 'add' | 'edit'; data: any }>({ isOpen: false, mode: 'add', data: {} });
  const [photoModal, setPhotoModal] = useState<{ isOpen: boolean; mode: 'add' | 'edit'; index?: number; data: any }>({ isOpen: false, mode: 'add', data: {} });

  const [isImgToolOpen, setIsImgToolOpen] = useState(false);
  const [imgToolTarget, setImgToolTarget] = useState<'album' | 'photo'>('album');

  const syncToQueue = (newAlbums: Album[]) => {
    addOperation({
      id: `photowall_sync_${Date.now()}`,
      type: "sync_photowall",
      label: "同步画廊数据变更",
      value: newAlbums
    });
    showToast("📍 变更已加入待处理队列，请在 Navbar 点击更新本地", "info");
  };

  const { matchedAlbums, matchedPhotos } = useMemo(() => {
    if (!activeQuery) return { matchedAlbums: editableAlbums, matchedPhotos: [] };
    const ma = editableAlbums.filter(album => album.title.toLowerCase().includes(activeQuery) || album.description.toLowerCase().includes(activeQuery));
    const mp = editableAlbums.flatMap(album => album.photos.map(p => ({ ...p, albumName: album.title }))).filter(photo => photo.caption?.toLowerCase().includes(activeQuery));
    return { matchedAlbums: ma, matchedPhotos: mp };
  }, [activeQuery, editableAlbums]);

  return (
    <div className="min-h-screen relative pb-32">
      <Navbar />

      {/* 🌟 核心修复 2：加入 key 强制重置状态！只要 isImgToolOpen 变了，组件就完全重生 */}
      <FloatingImageTool
        key={isImgToolOpen ? 'tool-open' : 'tool-closed'}
        isOpen={isImgToolOpen}
        onClose={() => setIsImgToolOpen(false)}
        onInsert={(url) => {
          if (imgToolTarget === 'album') {
            setAlbumModal(prev => ({ ...prev, data: { ...prev.data, cover: url } }));
          } else {
            setPhotoModal(prev => ({ ...prev, data: { ...prev.data, url: url } }));
          }
          setIsImgToolOpen(false);
        }}
      />

      <AnimatePresence>
        {/* 物理销毁弹窗 */}
        {deleteModal.isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full max-w-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[40px] shadow-2xl border border-white/50 p-10 text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6"><AlertTriangle className="text-red-500" /></div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">确认移除？</h3>
              <p className="text-sm text-slate-500 mb-8 leading-relaxed">该操作将加入队列并清空相关数据</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-black uppercase">取消</button>
                <button onClick={() => {
                   let next;
                   if(deleteModal.type === 'album') next = editableAlbums.filter(a => a.id !== deleteModal.id);
                   else {
                     const album = editableAlbums.find(a => a.id === currentAlbum?.id);
                     if(album) {
                        album.photos = album.photos.filter((_, i) => i !== deleteModal.photoIndex);
                        next = [...editableAlbums];
                        setCurrentAlbum({...album});
                     }
                   }
                   if(next) { setEditableAlbums(next); syncToQueue(next); }
                   setDeleteModal({ ...deleteModal, isOpen: false });
                }} className="flex-1 py-4 bg-red-500 text-white rounded-2xl text-xs font-black uppercase">确认抹除</button>
              </div>
            </motion.div>
          </div>
        )}

        {/* 🌟 相册编辑弹窗 */}
        {albumModal.isOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            {/* 🌟 核心修复 1：去掉了 onClick 属性，防止误触关闭！ */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="relative w-full max-w-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[40px] border border-white/20 p-8 shadow-2xl">
              <h2 className="text-2xl font-black mb-6 dark:text-white">{albumModal.mode === 'add' ? '创建新相册' : '修改相册属性'}</h2>
              <div className="space-y-5">
                <input type="text" value={albumModal.data.title || ''} onChange={e => setAlbumModal({...albumModal, data: {...albumModal.data, title: e.target.value}})} className="w-full bg-slate-100 dark:bg-black/20 rounded-2xl px-5 py-3.5 dark:text-white outline-none border border-transparent focus:border-indigo-500" placeholder="相册名称" />
                <textarea value={albumModal.data.description || ''} onChange={e => setAlbumModal({...albumModal, data: {...albumModal.data, description: e.target.value}})} className="w-full bg-slate-100 dark:bg-black/20 rounded-2xl px-5 py-3.5 dark:text-white h-24 outline-none border border-transparent focus:border-indigo-500 resize-none" placeholder="描述这段记忆..." />

                <div className="relative group">
                   <input type="text" value={albumModal.data.cover || ''} onChange={e => setAlbumModal({...albumModal, data: {...albumModal.data, cover: e.target.value}})} className="w-full bg-slate-100 dark:bg-black/20 rounded-2xl px-5 py-3.5 pr-14 dark:text-white outline-none border border-transparent focus:border-indigo-500" placeholder="封面图片 URL" />
                   <button onClick={() => { setImgToolTarget('album'); setIsImgToolOpen(true); }} className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 transition-colors shadow-md" title="唤起图床">
                      <CloudUpload size={18} />
                   </button>
                </div>
              </div>
              <div className="mt-8 flex gap-3">
                <button onClick={() => setAlbumModal({ ...albumModal, isOpen: false })} className="flex-1 py-3 text-slate-500 font-bold uppercase text-xs hover:text-slate-800 dark:hover:text-white transition-colors">取消</button>
                <button onClick={() => {
                  let next;
                  if(albumModal.mode === 'add') {
                    next = [{ ...albumModal.data, id: `album_${Date.now()}`, photos: [], date: new Date().toISOString().split('T')[0] }, ...editableAlbums];
                  } else {
                    next = editableAlbums.map(a => a.id === albumModal.data.id ? albumModal.data : a);
                  }
                  setEditableAlbums(next); syncToQueue(next); setAlbumModal({ ...albumModal, isOpen: false });
                }} className="flex-1 py-4 bg-indigo-500 text-white rounded-2xl font-black shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 hover:bg-indigo-600 transition-colors"><Save size={18} /> 加入暂存</button>
              </div>
            </motion.div>
          </div>
        )}

        {/* 🌟 照片编辑弹窗 */}
        {photoModal.isOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            {/* 🌟 核心修复 1：同样去掉 onClick 误触关闭 */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="relative w-full max-w-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[40px] border border-white/20 p-8 shadow-2xl">
              <h2 className="text-2xl font-black mb-6 dark:text-white">{photoModal.mode === 'add' ? '添加新照片' : '修改照片描述'}</h2>
              <div className="space-y-5">
                {photoModal.mode === 'add' && (
                  <div className="relative group">
                    <input type="text" value={photoModal.data.url || ''} onChange={e => setPhotoModal({...photoModal, data: {...photoModal.data, url: e.target.value}})} className="w-full bg-slate-100 dark:bg-black/20 rounded-2xl px-5 py-3.5 pr-14 dark:text-white outline-none border border-transparent focus:border-indigo-500" placeholder="照片直链 URL" />
                    <button onClick={() => { setImgToolTarget('photo'); setIsImgToolOpen(true); }} className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 transition-colors shadow-md">
                        <CloudUpload size={18} />
                    </button>
                  </div>
                )}
                <textarea value={photoModal.data.caption || ''} onChange={e => setPhotoModal({...photoModal, data: {...photoModal.data, caption: e.target.value}})} className="w-full bg-slate-100 dark:bg-black/20 rounded-2xl px-5 py-3.5 dark:text-white h-24 outline-none border border-transparent focus:border-indigo-500 resize-none" placeholder="为这张照片写点什么..." />
              </div>
              <div className="mt-8 flex gap-3">
                <button onClick={() => setPhotoModal({ ...photoModal, isOpen: false })} className="flex-1 py-3 text-slate-500 font-bold uppercase text-xs hover:text-slate-800 dark:hover:text-white transition-colors">取消</button>
                <button onClick={() => {
                  if(!currentAlbum) return;
                  const album = editableAlbums.find(a => a.id === currentAlbum.id);
                  if(!album) return;
                  if(photoModal.mode === 'add') album.photos = [{...photoModal.data}, ...album.photos];
                  else album.photos[photoModal.index!] = { ...album.photos[photoModal.index!], caption: photoModal.data.caption };
                  const next = [...editableAlbums];
                  setEditableAlbums(next); setCurrentAlbum({...album}); syncToQueue(next);
                  setPhotoModal({ ...photoModal, isOpen: false });
                }} className="flex-1 py-4 bg-indigo-500 text-white rounded-2xl font-black shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 hover:bg-indigo-600 transition-colors"><Save size={18} /> 加入暂存</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <PageTransition>
        <div className="w-full max-w-7xl mx-auto mt-28 px-4 sm:px-10 relative z-10">

          {!currentAlbum && (
            <div className="animate-fade-in-up">
              <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-6">
                <div>
                  <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-widest mb-2 transition-colors duration-700">光影画廊</h1>
                  <p className="text-slate-600 dark:text-slate-400 font-medium tracking-wider transition-colors duration-700">定格时间，封存泰拉与现实的每一次心跳</p>
                </div>

                <div className="relative w-full md:w-80 group">
                  <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 z-10 text-slate-500 transition-colors group-focus-within:text-indigo-500" />
                  <input
                    type="text" placeholder="搜索相册或描述..." value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-12 pl-12 pr-4 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/50 dark:border-white/10 rounded-full text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm transition-all"
                  />
                </div>
              </div>

              <div className={`transition-opacity duration-300 ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                {activeQuery && matchedPhotos.length > 0 && (
                  <div className="mb-16">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">匹配单张 ({matchedPhotos.length})</h3>
                    <div className="columns-1 sm:columns-2 md:columns-4 gap-6 space-y-6">
                      {matchedPhotos.map((photo, i) => (
                        <div key={i} onClick={() => setSelectedImage(photo)} className="break-inside-avoid relative group rounded-2xl overflow-hidden shadow-lg hover:scale-[1.02] transition-transform">
                          <img src={photo.url} className="w-full h-auto object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-20 mt-10">
                  {!activeQuery && (
                    <div onClick={() => setAlbumModal({ isOpen: true, mode: 'add', data: {} })} className="group cursor-pointer flex flex-col items-center">
                        <div className="relative w-[85%] aspect-[4/3] mb-8 border-4 border-dashed border-slate-300 dark:border-slate-700 rounded-[32px] flex flex-col items-center justify-center bg-white/10 dark:bg-white/5 hover:border-indigo-500 transition-all duration-500">
                          <Plus size={48} className="text-slate-400 group-hover:text-indigo-500 group-hover:rotate-90 transition-all duration-500" />
                          <span className="mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400">创建新相册</span>
                        </div>
                    </div>
                  )}

                  {matchedAlbums.map((album) => (
                    <div key={album.id} className="group cursor-pointer flex flex-col items-center relative">
                      <div className="absolute top-0 right-0 z-50 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0">
                         <button onClick={(e) => { e.stopPropagation(); setAlbumModal({ isOpen: true, mode: 'edit', data: album }); }} className="p-2.5 bg-indigo-500 text-white rounded-xl shadow-lg hover:scale-110 transition-transform"><Edit3 size={16}/></button>
                         <button onClick={(e) => { e.stopPropagation(); setDeleteModal({ isOpen: true, type: 'album', id: album.id, title: album.title }); }} className="p-2.5 bg-red-500 text-white rounded-xl shadow-lg hover:scale-110 transition-transform"><Trash2 size={16}/></button>
                      </div>

                      <div onClick={() => { setSearchQuery(''); setCurrentAlbum(album); }} className="relative w-[85%] aspect-[4/3] mb-8">
                        <div className="absolute inset-0 bg-slate-300 dark:bg-slate-700 rounded-[4px] shadow-md transform rotate-6 translate-x-4 translate-y-2 group-hover:rotate-12 transition-all duration-500 border-[6px] border-white dark:border-slate-200 overflow-hidden opacity-60">
                           {album.photos[2] && <img src={album.photos[2].url} className="w-full h-full object-cover grayscale blur-[2px]" alt="" />}
                        </div>
                        <div className="absolute inset-0 bg-slate-200 dark:bg-slate-600 rounded-[4px] shadow-lg transform -rotate-3 -translate-x-2 -translate-y-1 group-hover:-rotate-6 transition-all duration-500 border-[6px] border-white dark:border-slate-200 overflow-hidden opacity-80 z-10">
                           {album.photos[1] && <img src={album.photos[1].url} className="w-full h-full object-cover grayscale-[50%]" alt="" />}
                        </div>
                        <div className="absolute inset-0 bg-white dark:bg-slate-200 rounded-[4px] shadow-2xl border-[6px] border-white dark:border-slate-200 overflow-hidden z-20 transform group-hover:-translate-y-2 group-hover:scale-105 transition-all duration-500">
                          <img src={album.cover} alt={album.title} className="w-full h-full object-cover" />
                        </div>
                      </div>

                      <div className="text-center px-4 w-full" onClick={() => setCurrentAlbum(album)}>
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <h2 className="text-xl font-bold text-slate-900 dark:text-white transition-colors group-hover:text-indigo-600">{album.title}</h2>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-1">{album.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentAlbum && (
            <div className="animate-fade-in-up">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4 border-b border-slate-300/50 dark:border-slate-700/50 pb-6">
                <div>
                  <button onClick={() => setCurrentAlbum(null)} className="group flex items-center gap-1.5 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-500 mb-4 transition-colors">
                    <div className="bg-white/40 dark:bg-slate-800/50 p-1.5 rounded-lg border border-white/50 shadow-sm"><X size={16} /></div> 返回画廊
                  </button>
                  <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-wider mb-2">{currentAlbum.title}</h1>
                </div>
                <button onClick={() => setAlbumModal({ isOpen: true, mode: 'edit', data: currentAlbum })} className="px-5 py-2.5 rounded-2xl bg-white/40 dark:bg-slate-800/40 border border-white/50 text-xs font-black uppercase text-indigo-500 hover:bg-white transition-all shadow-sm">相册属性</button>
              </div>

              <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">

                <div onClick={() => setPhotoModal({ isOpen: true, mode: 'add', data: {} })} className="break-inside-avoid group cursor-pointer border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-[32px] min-h-[200px] flex flex-col items-center justify-center bg-white/10 dark:bg-slate-800/10 hover:border-indigo-500 transition-all duration-500">
                   <Plus size={32} className="text-slate-400 group-hover:text-indigo-500 transition-all" />
                   <span className="mt-3 text-[10px] font-black uppercase tracking-widest text-slate-400">添加碎片</span>
                </div>

                {currentAlbum.photos.map((photo, index) => (
                  <div key={index} className="break-inside-avoid relative group rounded-2xl overflow-hidden shadow-lg bg-white/20 dark:bg-slate-800/20 border border-white/30 dark:border-white/10 transition-all duration-500 hover:scale-[1.02] cursor-pointer">

                    <div className="absolute top-3 left-3 z-30 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                      <button onClick={(e) => { e.stopPropagation(); setPhotoModal({ isOpen: true, mode: 'edit', index, data: photo }); }} className="w-7 h-7 rounded-lg bg-white/80 backdrop-blur-md text-slate-700 flex items-center justify-center shadow-sm hover:bg-indigo-500 hover:text-white transition-all"><Pencil size={12}/></button>
                      <button onClick={(e) => { e.stopPropagation(); setDeleteModal({ isOpen: true, type: 'photo', photoIndex: index, title: '这张照片' }); }} className="w-7 h-7 rounded-lg bg-white/80 backdrop-blur-md text-red-500 flex items-center justify-center shadow-sm hover:bg-red-500 hover:text-white transition-all"><Trash2 size={12}/></button>
                    </div>

                    <img onClick={() => setSelectedImage(photo)} src={photo.url} alt="" className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105" />
                    {photo.caption && <div className="p-4 bg-white/30 dark:bg-black/20 backdrop-blur-sm text-xs font-bold dark:text-slate-200">{photo.caption}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </PageTransition>

      {selectedImage && (
        <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-4 sm:p-10 cursor-zoom-out animate-fade-in" onClick={() => setSelectedImage(null)}>
          <button className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full p-2"><X size={24} /></button>
          <img src={selectedImage.url} alt="全屏照片" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
          {selectedImage.caption && <div className="absolute bottom-10 px-6 py-3 bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-white text-sm font-medium tracking-wide shadow-2xl">{selectedImage.caption}</div>}
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
}