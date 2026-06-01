"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { siteConfig } from '../../siteConfig'; // 确保路径正确，可能需要根据你的目录结构调整为 '../siteConfig'

export default function AdminDashboard() {
  // 当前选中的功能模块
  const [activeTab, setActiveTab] = useState('dashboard');

  // 操作队列（模拟你说的：上传照片、保存文章算一次操作）
  // 这里先放两条假数据看看效果，后面我们会通过全局状态或 Context 来动态管理
  const [operations, setOperations] = useState([
    { id: 1, text: '更新了个人头像', time: '10:05' },
    { id: 2, text: '保存草稿《GNN虚拟筛选环境配置》', time: '10:30' }
  ]);

  // 控制操作箱的展开与折叠
  const [isOpBoxOpen, setIsOpBoxOpen] = useState(false);

  // 左侧导航菜单配置
  const menuItems = [
    { id: 'dashboard', name: '全息仪表盘', icon: '🌌' },
    { id: 'posts', name: '文章与草稿', icon: '📝' },
    { id: 'gallery', name: '光影画廊', icon: '🖼️' },
    { id: 'settings', name: '系统核心配置', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 md:px-10 flex flex-col md:flex-row gap-6 max-w-[1600px] mx-auto relative z-10">

      {/* ==========================================
          1. 左侧中枢导航栏
          ========================================== */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full md:w-64 shrink-0 flex flex-col gap-6"
      >
        {/* 个人名片区 */}
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-3xl p-6 flex flex-col items-center shadow-lg">
          <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-indigo-500 to-purple-500 mb-4 shadow-[0_0_20px_rgba(99,102,241,0.4)]">
            <img src={siteConfig.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover border-2 border-white dark:border-slate-800" />
          </div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-wider">{siteConfig.authorName}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-bold tracking-[0.2em] uppercase">CMS Administrator</p>
        </div>

        {/* 导航菜单区 */}
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-3xl p-4 shadow-lg flex flex-col gap-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 font-bold text-sm
                ${activeTab === item.id 
                  ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30 translate-x-2' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:translate-x-1'}
              `}
            >
              <span className="text-lg">{item.icon}</span>
              {item.name}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ==========================================
          2. 右侧工作区
          ========================================== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex flex-col gap-6"
      >
        {/* 顶部操作面板 (包含红点消息和部署按钮) */}
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-3xl h-20 px-6 flex items-center justify-between shadow-lg relative">

          <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            {menuItems.find(m => m.id === activeTab)?.name}
          </h1>

          <div className="flex items-center gap-4">
            {/* 操作箱图标与红点 */}
            <div className="relative">
              <button
                onClick={() => setIsOpBoxOpen(!isOpBoxOpen)}
                className="w-12 h-12 rounded-xl bg-white/50 dark:bg-slate-800/50 flex items-center justify-center text-xl hover:bg-white dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
              >
                📥
              </button>
              {operations.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 border-2 border-white dark:border-slate-900 text-[10px] font-black text-white items-center justify-center">
                    {operations.length}
                  </span>
                </span>
              )}

              {/* 操作箱下拉列表 */}
              <AnimatePresence>
                {isOpBoxOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-16 w-80 bg-white/90 dark:bg-slate-800/90 backdrop-blur-2xl border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-4 z-50"
                  >
                    <h3 className="text-sm font-black text-slate-800 dark:text-white mb-3 flex justify-between items-center">
                      待同步操作列表
                      <span className="text-xs text-slate-400 font-normal hover:text-indigo-500 cursor-pointer">清空</span>
                    </h3>

                    {operations.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-4">暂无待处理操作</p>
                    ) : (
                      <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                        {operations.map(op => (
                          <div key={op.id} className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 flex justify-between items-center group">
                            <span className="text-sm text-slate-700 dark:text-slate-200 truncate pr-2">{op.text}</span>
                            <button className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 一键部署按钮 */}
            <button className="h-12 px-6 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-black text-sm shadow-lg shadow-indigo-500/30 flex items-center gap-2 transition-all active:scale-95">
              🚀 全部上传并部署
            </button>
          </div>
        </div>

        {/* 核心内容渲染区 (根据 Tab 动态切换) */}
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-3xl p-6 min-h-[500px] shadow-lg">

          {activeTab === 'dashboard' && (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400 gap-4 pt-20">
              <span className="text-6xl">🌌</span>
              <p className="font-bold tracking-widest text-sm">系统运转良好，随时准备接收指令</p>
            </div>
          )}

          {activeTab === 'posts' && (
            <div className="text-slate-500 text-center pt-20">双栏 Markdown 编辑器即将部署于此...</div>
          )}

          {activeTab === 'gallery' && (
            <div className="text-slate-500 text-center pt-20">图床配置与相册管理即将部署于此...</div>
          )}

          {activeTab === 'settings' && (
            <div className="text-slate-500 text-center pt-20">核心变量 siteConfig 控制台即将部署于此...</div>
          )}

        </div>
      </motion.div>
    </div>
  );
}