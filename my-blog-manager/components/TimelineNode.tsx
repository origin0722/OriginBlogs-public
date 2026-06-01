"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Pencil, Trash2, Calendar, Tag } from "lucide-react";

interface Props {
  post: any;
  index: number;
  onDelete: (slug: string, title: string) => void;
}

export default function TimelineNode({ post, index, onDelete }: Props) {
  const isLeft = index % 2 === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`flex justify-between items-center w-full ${isLeft ? 'md:flex-row-reverse' : 'flex-row'}`}
    >
      {/* 对面占位 */}
      <div className="order-1 w-5/12 hidden md:block"></div>

      {/* 节点球 */}
      <div className="z-20 flex items-center justify-center order-1 bg-white dark:bg-slate-900 shadow-xl w-6 h-6 rounded-full border-4 border-indigo-400 ring-4 ring-indigo-200/50 dark:ring-indigo-900/30 transition-all duration-1000"></div>

      {/* 卡片容器 */}
      <div className="order-1 w-full md:w-5/12 group relative">

        {/* 👇 悬浮管理工具栏 */}
        <div className={`absolute top-4 ${isLeft ? 'right-4' : 'left-4'} z-30 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-y-2 group-hover:translate-y-0`}>
          <Link
            href={`/editor?id=${post.slug}&type=post`}
            className="w-8 h-8 rounded-lg bg-indigo-500 text-white flex items-center justify-center shadow-lg hover:bg-indigo-600 active:scale-90 transition-all"
            title="编辑文章"
          >
            <Pencil size={14} />
          </Link>
          <button
            onClick={(e) => {
              e.preventDefault();
              onDelete(post.slug, post.title);
            }}
            className="w-8 h-8 rounded-lg bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 active:scale-90 transition-all"
            title="销毁文章"
          >
            <Trash2 size={14} />
          </button>
        </div>

        <Link href={`/posts/${post.slug}`} className="block">
          <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl rounded-[32px] shadow-xl border border-white/60 dark:border-white/10 transition-all duration-500 hover:scale-[1.02] hover:bg-white/80 dark:hover:bg-slate-800/70 overflow-hidden flex flex-col">

            {/* 封面图 */}
            <div className="w-full h-40 overflow-hidden relative">
              <img src={post.cover} alt={post.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-80" />

              <div className="absolute bottom-4 left-6 flex items-center gap-2 text-[10px] font-black text-white/90 uppercase tracking-widest">
                <Calendar size={12} className="text-indigo-400" />
                {post.date}
              </div>
            </div>

            {/* 文本内容 */}
            <div className="p-7">
              <h3 className="font-bold text-xl text-slate-800 dark:text-white mb-3 group-hover:text-indigo-500 transition-colors line-clamp-1 leading-tight">
                {post.title}
              </h3>

              {post.tags && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {post.tags.map((tag: string) => (
                    <span key={tag} className="px-2 py-0.5 rounded-md text-[9px] font-black bg-indigo-500/5 text-slate-400 border border-slate-500/10">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2 font-medium opacity-80">
                {post.description}
              </p>
            </div>
          </div>
        </Link>
      </div>
    </motion.div>
  );
}