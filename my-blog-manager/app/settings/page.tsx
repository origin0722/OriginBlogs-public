"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOperations } from '../../context/OperationContext';
import { siteConfig } from '../../siteConfig';
import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import { ToastProvider, useToast } from '../../components/ToastProvider';

import ProfileSection from '../../components/settings/ProfileSection';
import BackgroundSection from '../../components/settings/BackgroundSection';
import MusicSection from '../../components/settings/MusicSection';
import GallerySection from '../../components/settings/GallerySection';
import RepoSection from '../../components/settings/RepoSection';
import DisplaySection from '../../components/settings/DisplaySection';
import CommentSection from '../../components/settings/CommentSection';
import DanmakuSection from '../../components/settings/DanmakuSection';
import FooterSection from '../../components/settings/FooterSection';
// 👇 🌟 引入刚写的 AI 配置组件
import AICatSection from '../../components/settings/AICatSection';

function SettingsContent() {
  const { operations, addOperation } = useOperations();
  const [activeTab, setActiveTab] = useState('profile');
  const { showToast } = useToast();

  const [formData, setFormData] = useState<any>({
    authorName: siteConfig.authorName || "",
    bio: siteConfig.bio || "",
    avatarUrl: siteConfig.avatarUrl || "",
    social: siteConfig.social || {},
    cloudMusicIds: [...(siteConfig.cloudMusicIds || [])],
    bgImages: [...(siteConfig.bgImages || [])],
    gitalkConfig: siteConfig.gitalkConfig || {
      clientID: '',
      clientSecret: '',
      repo: '',
      owner: '',
      admin: []
    },
    danmakuList: [...(siteConfig.danmakuList || [])],
    buildDate: siteConfig.buildDate || "2026-03-23T00:00:00",
    icpConfig: siteConfig.icpConfig || { name: "", link: "" },
    footerBadges: [...(siteConfig.footerBadges || [])],
    // 👇 🌟 初始化小猫 AI 配置数据
    geminiConfig: siteConfig.geminiConfig || {
      modelId: 'gemini-2.5-flash-lite',
      systemPrompt: '',
      maxOutputTokens: 150,
      temperature: 0.85
    }
  });

  const [queryLoading, setQueryLoading] = useState(false);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [musicDetails, setMusicDetails] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetchRealConfig = async () => {
      try {
        const configRes = await fetch(`/backend_config.json?t=${Date.now()}`);
        const configData = await configRes.json();

        const res = await fetch(`http://127.0.0.1:${configData.api_port}/api/config/get`, { cache: 'no-store' });
        const data = await res.json();

        if (data.success && data.data) {
          console.log("✅ 成功从后端拉取到真实配置:", data.data);
          setFormData((prev: any) => ({
            ...prev,
            ...data.data,
            social: { ...(prev.social || {}), ...(data.data.social || {}) },
            gitalkConfig: { ...(prev.gitalkConfig || {}), ...(data.data.gitalkConfig || {}) },
            danmakuList: data.data.danmakuList ? [...data.data.danmakuList] : prev.danmakuList,
            buildDate: data.data.buildDate || prev.buildDate,
            icpConfig: data.data.icpConfig || prev.icpConfig,
            footerBadges: data.data.footerBadges ? [...data.data.footerBadges] : prev.footerBadges,
            // 👇 🌟 合并后端发来的小猫配置
            geminiConfig: { ...(prev.geminiConfig || {}), ...(data.data.geminiConfig || {}) }
          }));
        } else {
          console.error("❌ 后端返回失败:", data.message);
          showToast("读取后端配置失败，当前显示为本地静态数据", "warning");
        }
      } catch (error) {
        console.error("❌ 请求后端配置通道断开:", error);
        showToast("无法连接到 Python 后端服务", "error");
      }
    };

    fetchRealConfig();
  }, []);

  const handleUpdate = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const fetchMusicDetail = async (id: string) => {
    try {
      const configRes = await fetch(`/backend_config.json?t=${Date.now()}`);
      const configData = await configRes.json();
      const res = await fetch(`http://127.0.0.1:${configData.api_port}/api/music/query/${id}`, { cache: 'no-store' });
      const data = await res.json();
      return data.success ? data.data : { error: true, id, name: "查询失败或无版权" };
    } catch (error) {
      return { error: true, id, name: "后端通信通道断开" };
    }
  };

  useEffect(() => {
    const loadInitialMusicDetails = async () => {
      const details: Record<string, any> = { ...musicDetails };
      let hasUpdate = false;
      for (const id of formData.cloudMusicIds || []) {
        if (!details[id]) {
          const info = await fetchMusicDetail(id);
          if (info) {
            details[id] = info;
            hasUpdate = true;
          }
        }
      }
      if (hasUpdate) setMusicDetails(details);
    };
    if (formData.cloudMusicIds?.length > 0) {
      loadInitialMusicDetails();
    }
  }, [formData.cloudMusicIds]);

  const queryMusic = async () => {
    if (!formData.newMusicId) {
      showToast("ID不能为空哦", "warning");
      return;
    }
    setQueryLoading(true);
    setQueryResult(null);

    const info = await fetchMusicDetail(formData.newMusicId);
    if (info && !info.error) {
      setQueryResult(info);
      showToast("获取成功！", "success");
    } else {
      showToast(info?.name || "未找到该歌曲", "error");
    }
    setQueryLoading(false);
  };

  const removeSong = (index: number) => {
    const newList = [...formData.cloudMusicIds];
    newList.splice(index, 1);
    handleUpdate('cloudMusicIds', newList);
    showToast("已移除一首歌曲", "success");
  };

  const confirmAddMusic = () => {
    if (!queryResult) return;
    const targetId = String(queryResult.id);
    const exists = formData.cloudMusicIds.some((id: string | number) => String(id) === targetId);

    if (exists) {
      showToast(`⚠️ 《${queryResult.name}》已经在列表里啦，不要重复添加！`, "warning");
    } else {
      handleUpdate('cloudMusicIds', [...formData.cloudMusicIds, targetId]);
      setMusicDetails(prev => ({ ...prev, [targetId]: queryResult }));
      setQueryResult(null);
      handleUpdate('newMusicId', '');
      showToast("✅ 成功存入播放列表！", "success");
    }
  };

  const pushToQueue = (label: string, key?: string, value?: any) => {
    addOperation({
      id: Date.now().toString(),
      type: 'CONFIG',
      label: `配置暂存：${label}`,
      description: `修改了系统的 ${label}，等待同步至 my-blog`,
      timestamp: new Date().toLocaleTimeString().slice(0, 5),
      payload: formData,
      key: key,
      value: value
    });
    showToast(`🎉 【${label}】已加入右上角操作队列！`, "success");
  };

  // 👇 🌟 在菜单里增加 AI 猫咪入口
  const menuItems = [
    { id: 'profile', name: '个人名片设置', icon: '👤' },
    { id: 'display', name: '视窗画面设置', icon: '🪟' },
    { id: 'background', name: '视觉背景配置', icon: '🌌' },
    { id: 'music', name: '音乐播放设置', icon: '🎵' },
    { id: 'gallery', name: '图库配置管理', icon: '🖼️' },
    { id: 'footer', name: '首页底部设置', icon: '🧩' },
    { id: 'danmaku', name: '全站弹幕设置', icon: '⚡' },
    { id: 'comment', name: '评论系统配置', icon: '💬' },
    { id: 'aicat', name: 'AI 煤球配置', icon: '🐾' }, // 👈 新增的小猫设置
    { id: 'repo', name: '项目仓库设置', icon: '🚀' },
  ];

  return (
    <div className="min-h-screen relative pb-10">
      <Navbar />

      <PageTransition>
        <main className="w-[95%] max-w-7xl mx-auto mt-24 flex flex-col md:flex-row gap-8 items-start relative z-10">

          <div className="w-full md:w-72 shrink-0 flex flex-col gap-4">
            <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-800/50 rounded-3xl p-4 shadow-xl">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-4 ml-2 tracking-widest">系统管理维度</p>
              <nav className="flex flex-col gap-2">
                {menuItems.map((item) => (
                  <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 font-bold text-sm ${activeTab === item.id ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 translate-x-1' : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50'}`}>
                    <span>{item.icon}</span>{item.name}
                  </button>
                ))}
              </nav>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-4 mt-4">
              <p className="text-xs font-black text-amber-600 dark:text-amber-400 mb-2">🔄 数据中枢操作</p>
              <button className="w-full py-2 bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-bold hover:bg-amber-500 hover:text-white transition-all text-left px-4 flex justify-between">
                <span>拉取 my-blog 数据</span><span>📥</span>
              </button>
            </div>
          </div>

          <div className="flex-1 w-full">
            <AnimatePresence mode="wait">
              {activeTab === 'profile' && <ProfileSection key="profile" formData={formData} handleUpdate={handleUpdate} pushToQueue={pushToQueue} />}
              {activeTab === 'display' && <DisplaySection key="display" />}
              {activeTab === 'background' && <BackgroundSection key="background" formData={formData} handleUpdate={handleUpdate} pushToQueue={pushToQueue} />}
              {activeTab === 'music' && <MusicSection key="music" formData={formData} handleUpdate={handleUpdate} pushToQueue={pushToQueue} musicDetails={musicDetails} queryMusic={queryMusic} queryLoading={queryLoading} queryResult={queryResult} confirmAddMusic={confirmAddMusic} removeSong={removeSong} />}
              {activeTab === 'gallery' && <GallerySection key="gallery" formData={formData} handleUpdate={handleUpdate} pushToQueue={pushToQueue} />}
              {activeTab === 'footer' && <FooterSection key="footer" formData={formData} handleUpdate={handleUpdate} pushToQueue={pushToQueue} />}
              {activeTab === 'danmaku' && <DanmakuSection key="danmaku" formData={formData} handleUpdate={handleUpdate} pushToQueue={pushToQueue} />}
              {activeTab === 'comment' && <CommentSection key="comment" formData={formData} handleUpdate={handleUpdate} pushToQueue={pushToQueue} />}
              {/* 👇 🌟 挂载 AI 猫咪面板 */}
              {activeTab === 'aicat' && <AICatSection key="aicat" formData={formData} handleUpdate={handleUpdate} pushToQueue={pushToQueue} />}

              {activeTab === 'repo' && <RepoSection key="repo" />}
            </AnimatePresence>
          </div>

        </main>
      </PageTransition>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ToastProvider>
      <SettingsContent />
    </ToastProvider>
  );
}