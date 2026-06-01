"use client";

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BackButton from '../../components/BackButton';
import { projectsData as initialProjects, Project } from '../../data/projects';
import { Plus, Pencil, Trash2, AlertTriangle, Save, Edit3, X, Sparkles, Code2 } from 'lucide-react';
import { useOperations } from '../../context/OperationContext';
import { useToast } from '../../components/ToastProvider';

export default function ProjectsBoard() {
  const { addOperation } = useOperations();
  const { showToast } = useToast();

  // 1. 核心状态
  const [editableProjects, setEditableProjects] = useState<Project[]>(initialProjects);
  const [searchQuery, setSearchQuery] = useState("");

  // 2. 弹窗状态
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null; name: string | null }>({ isOpen: false, id: null, name: null });
  const [projectModal, setProjectModal] = useState<{ isOpen: boolean; mode: 'add' | 'edit'; data: Partial<Project> }>({ isOpen: false, mode: 'add', data: {} });

  // 3. 搜索过滤逻辑
  const filteredProjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return editableProjects;
    return editableProjects.filter(p =>
      (p.name || "").toLowerCase().includes(query) ||
      (p.description || "").toLowerCase().includes(query) ||
      (p.tags || []).some(t => t.toLowerCase().includes(query))
    );
  }, [searchQuery, editableProjects]);

  // --- 核心逻辑：加入暂存队列 ---
  const syncToQueue = (nextList: Project[]) => {
    addOperation({
      id: `sync_projects_${Date.now()}`,
      type: "sync_projects",
      label: "同步项目矩阵变更",
      value: nextList
    });
    showToast("📍 变更已加入待处理队列，请在 Navbar 点击更新本地", "info");
  };

  const handleSaveProject = () => {
    const { mode, data } = projectModal;
    if (!data.name || !data.githubUrl) {
      showToast("名称和 GitHub 地址是必填项", "warning");
      return;
    }

    let next;
    if (mode === 'add') {
      const newProj: Project = {
        id: `proj_${Date.now()}`,
        name: data.name!,
        githubUrl: data.githubUrl!,
        description: data.description || '暂无描述。',
        icon: data.icon || '🚀',
        tags: data.tags || ['OpenSource']
      };
      next = [newProj, ...editableProjects];
    } else {
      next = editableProjects.map(p => p.id === data.id ? { ...p, ...data } as Project : p);
    }
    setEditableProjects(next);
    syncToQueue(next);
    setProjectModal({ isOpen: false, mode: 'add', data: {} });
  };

  const confirmDelete = () => {
    if (!deleteModal.id) return;
    const next = editableProjects.filter(p => p.id !== deleteModal.id);
    setEditableProjects(next);
    syncToQueue(next);
    setDeleteModal({ isOpen: false, id: null, name: null });
  };

  // GitHub 原生 SVG 图标组件
  const GithubIcon = () => (
    <svg className="w-8 h-8 text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white transition-colors flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
  );

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-10 py-10 relative z-10">

      {/* 💎 销毁确认弹窗 */}
      <AnimatePresence>
        {deleteModal.isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[40px] shadow-2xl border border-white/50 p-10 text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6"><AlertTriangle className="text-red-500" /></div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">注销项目？</h3>
              <p className="text-sm text-slate-500 mb-8 leading-relaxed text-balance">确认从矩阵中移除 <span className="font-bold text-red-500">"{deleteModal.name}"</span> 吗？</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-black uppercase">保留</button>
                <button onClick={confirmDelete} className="flex-1 py-4 bg-red-500 text-white rounded-2xl text-xs font-black uppercase shadow-lg">确认移除</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 💎 项目编辑弹窗 */}
      <AnimatePresence>
        {projectModal.isOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setProjectModal({ ...projectModal, isOpen: false })} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="relative w-full max-w-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[40px] border border-white/20 p-8 shadow-2xl">
               <h2 className="text-2xl font-black mb-6 dark:text-white flex items-center gap-2"><Code2 className="text-indigo-500" /> {projectModal.mode === 'add' ? '开启新项目' : '修改项目档案'}</h2>
               <div className="space-y-4">
                 <div className="flex gap-4">
                    <input type="text" value={projectModal.data.icon || ''} onChange={e => setProjectModal({...projectModal, data: {...projectModal.data, icon: e.target.value}})} className="w-20 bg-slate-100 dark:bg-black/20 rounded-2xl px-5 py-3 text-center text-2xl border-none outline-none focus:ring-2 focus:ring-indigo-500" placeholder="图标" />
                    <input type="text" value={projectModal.data.name || ''} onChange={e => setProjectModal({...projectModal, data: {...projectModal.data, name: e.target.value}})} className="flex-1 bg-slate-100 dark:bg-black/20 rounded-2xl px-5 py-3 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 border-none" placeholder="项目名称" />
                 </div>
                 <input type="text" value={projectModal.data.githubUrl || ''} onChange={e => setProjectModal({...projectModal, data: {...projectModal.data, githubUrl: e.target.value}})} className="w-full bg-slate-100 dark:bg-black/20 rounded-2xl px-5 py-3 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 border-none" placeholder="GitHub URL" />
                 <textarea value={projectModal.data.description || ''} onChange={e => setProjectModal({...projectModal, data: {...projectModal.data, description: e.target.value}})} className="w-full bg-slate-100 dark:bg-black/20 rounded-2xl px-5 py-3 dark:text-white h-24 outline-none resize-none focus:ring-2 focus:ring-indigo-500 border-none" placeholder="项目描述..." />
                 <input type="text" value={projectModal.data.tags?.join(', ') || ''} onChange={e => setProjectModal({...projectModal, data: {...projectModal.data, tags: e.target.value.split(',').map(t => t.trim())}})} className="w-full bg-slate-100 dark:bg-black/20 rounded-2xl px-5 py-3 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 border-none" placeholder="技术栈 (逗号分隔)" />
               </div>
               <div className="mt-8 flex gap-3">
                 <button onClick={() => setProjectModal({ ...projectModal, isOpen: false })} className="flex-1 py-3 text-slate-500 font-bold uppercase text-xs">取消</button>
                 <button onClick={handleSaveProject} className="flex-1 py-4 bg-indigo-500 text-white rounded-2xl font-black shadow-lg flex items-center justify-center gap-2"><Save size={18} /> 加入暂存</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 顶部标题区 */}
      <div className="mb-8 flex flex-col items-center md:items-start">
        <div className="w-full flex justify-start mb-6"><BackButton /></div>
        <div className="text-center md:text-left w-full">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-widest uppercase">Projects Matrix</h1>
          <p className="text-slate-600 dark:text-slate-400 font-serif italic opacity-80 flex items-center justify-center md:justify-start gap-2">
            <Sparkles size={14} className="text-indigo-500" /> 开源项目、科研代码与实验室折腾记录
          </p>
        </div>
      </div>

      {/* 搜索框 */}
      <div className="mb-12 flex justify-center w-full">
        <div className="relative w-full max-w-lg group">
          <input type="text" placeholder="搜索项目、代号或技术栈..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-full px-6 py-3 pl-12 text-slate-800 dark:text-white shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-serif" />
          <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
      </div>

      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">

        {/* 👇 新建项目虚线矩阵 */}
        <motion.div layout onClick={() => setProjectModal({ isOpen: true, mode: 'add', data: { icon: '🚀', tags: [] } })} className="group cursor-pointer flex flex-col items-center justify-center min-h-[320px] rounded-[40px] border-4 border-dashed border-slate-300 dark:border-slate-700 bg-white/10 hover:border-indigo-500 hover:bg-indigo-500/5 transition-all duration-500">
            <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-md group-hover:rotate-90">
              <Plus size={40} />
            </div>
            <span className="mt-4 text-xs font-black uppercase tracking-[0.3em] text-slate-400 group-hover:text-indigo-500">INIT NEW PROJECT</span>
        </motion.div>

        <AnimatePresence mode='popLayout'>
          {filteredProjects.map((project) => (
            <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} key={project.id} className="h-full relative group">

              {/* 👇 悬浮管理按钮 */}
              <div className="absolute top-8 right-8 z-30 flex gap-2 opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0">
                  <button onClick={(e) => { e.preventDefault(); setProjectModal({ isOpen: true, mode: 'edit', data: project }); }} className="w-9 h-9 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"><Edit3 size={16}/></button>
                  <button onClick={(e) => { e.preventDefault(); setDeleteModal({ isOpen: true, id: project.id, name: project.name }); }} className="w-9 h-9 rounded-xl bg-red-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"><Trash2 size={16}/></button>
              </div>

              <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="block h-full rounded-[40px] bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-xl overflow-hidden transition-all duration-700 hover:-translate-y-1 p-8 md:p-10 relative group">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors"></div>

                <div className="flex items-start justify-between mb-8 relative z-10">
                  <div className="flex items-center gap-5">
                    <span className="text-5xl group-hover:scale-110 transition-transform duration-500">{project.icon}</span>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{project.name}</h2>
                  </div>
                  <GithubIcon />
                </div>

                <p className="text-sm text-slate-700 dark:text-slate-300 font-serif leading-relaxed line-clamp-3 mb-10 relative z-10 min-h-[60px]">
                  {project.description}
                </p>

                <div className="flex flex-wrap gap-2 relative z-10">
                  {project.tags.map(tag => (
                    <span key={tag} className="text-[10px] font-black tracking-widest uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/10 shadow-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </a>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {filteredProjects.length === 0 && searchQuery && (
        <div className="text-center py-20 text-slate-500 font-serif italic">
          代号为 [{searchQuery}] 的档案似乎在云端消失了...
        </div>
      )}
    </div>
  );
}