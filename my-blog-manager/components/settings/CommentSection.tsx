import { motion } from 'framer-motion';
// 🌟 核心修复：移除了报错的 Github，换成了自带的 GitBranch 图标
import { Save, Key, User, GitBranch, Shield } from 'lucide-react';

interface CommentSectionProps {
  formData: any;
  handleUpdate: (field: string, value: any) => void;
  pushToQueue: (label: string, key?: string, value?: any) => void;
}

export default function CommentSection({ formData, handleUpdate, pushToQueue }: CommentSectionProps) {
  // 安全地获取 Gitalk 配置，防止一开始 undefined 报错
  const gitalk = formData.gitalkConfig || {
    clientID: '',
    clientSecret: '',
    repo: '',
    owner: '',
    admin: []
  };

  const updateGitalk = (key: string, value: any) => {
    handleUpdate('gitalkConfig', { ...gitalk, [key]: value });
  };

  const saveToQueue = () => {
    pushToQueue('Gitalk 评论系统', 'gitalkConfig', gitalk);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col gap-6"
    >
      <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-800/50 rounded-[40px] p-8 shadow-xl">
        <div className="flex justify-between items-center mb-8 border-b border-white/30 dark:border-slate-700/50 pb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
              <span>💬</span> 评论系统配置
            </h2>
            <p className="text-slate-500 text-sm mt-1 font-bold">对接 GitHub Issue 构建的全站评论系统</p>
          </div>
          <button
            onClick={saveToQueue}
            className="px-6 py-3 bg-indigo-500 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-500/30 flex items-center gap-2 hover:bg-indigo-600 transition-colors"
          >
            <Save size={16} /> 保存修改
          </button>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-black uppercase text-slate-400 tracking-widest mb-2 flex items-center gap-2"><Key size={14} className="text-indigo-400" /> Client ID</label>
              <input
                type="text"
                value={gitalk.clientID}
                onChange={(e) => updateGitalk('clientID', e.target.value)}
                className="w-full bg-white/50 dark:bg-slate-800/50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono dark:text-slate-200"
                placeholder="请输入 OAuth Apps 的 Client ID"
              />
            </div>
            <div>
              <label className="text-xs font-black uppercase text-slate-400 tracking-widest mb-2 flex items-center gap-2"><Shield size={14} className="text-red-400" /> Client Secret</label>
              <input
                type="password"
                value={gitalk.clientSecret}
                onChange={(e) => updateGitalk('clientSecret', e.target.value)}
                className="w-full bg-white/50 dark:bg-slate-800/50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono dark:text-slate-200"
                placeholder="请输入 OAuth Apps 的 Client Secret"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              {/* 🌟 核心修复：这里换成了 GitBranch */}
              <label className="text-xs font-black uppercase text-slate-400 tracking-widest mb-2 flex items-center gap-2"><GitBranch size={14} className="text-slate-600 dark:text-slate-300" /> GitHub 仓库名 (Repo)</label>
              <input
                type="text"
                value={gitalk.repo}
                onChange={(e) => updateGitalk('repo', e.target.value)}
                className="w-full bg-white/50 dark:bg-slate-800/50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono dark:text-slate-200"
                placeholder="例如: XHSBlogComment"
              />
            </div>
            <div>
              <label className="text-xs font-black uppercase text-slate-400 tracking-widest mb-2 flex items-center gap-2"><User size={14} className="text-blue-400" /> 仓库拥有者 (Owner)</label>
              <input
                type="text"
                value={gitalk.owner}
                onChange={(e) => updateGitalk('owner', e.target.value)}
                className="w-full bg-white/50 dark:bg-slate-800/50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono dark:text-slate-200"
                placeholder="你的 GitHub 用户名"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-black uppercase text-slate-400 tracking-widest mb-2 flex items-center gap-2"><Shield size={14} className="text-purple-400" /> 管理员列表 (Admin)</label>
            <input
              type="text"
              value={gitalk.admin.join(', ')}
              onChange={(e) => {
                const adminArray = e.target.value.split(',').map(item => item.trim()).filter(item => item !== '');
                updateGitalk('admin', adminArray);
              }}
              className="w-full bg-white/50 dark:bg-slate-800/50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono dark:text-slate-200"
              placeholder="管理员的 GitHub 用户名，多个请用英文逗号(,)分隔"
            />
            <p className="text-xs text-slate-400 mt-2 ml-1">拥有这些 GitHub 账号的人可以初始化和管理评论区。通常写你自己的账号即可。</p>
          </div>
        </div>
      </div>
    </motion.section>
  );
}