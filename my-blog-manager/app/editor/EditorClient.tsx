"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import RichTextEditor, { RichTextEditorHandle } from '../../components/editor/RichTextEditor';
import MetaMatrix from '../../components/editor/MetaMatrix';
import FloatingImageTool from '../../components/editor/FloatingImageTool';

export default function EditorClient({ historyPostTags, historyChatterTags, historyMoods }: any) {
  const searchParams = useSearchParams();
  const docId = searchParams.get('id') || 'new';
  const docType = (searchParams.get('type') as 'post' | 'chatter' | 'about') || 'post';

  const [title, setTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [cover, setCover] = useState('');
  const [summary, setSummary] = useState('');
  const [mood, setMood] = useState('');
  const [content, setContent] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isImgToolOpen, setIsImgToolOpen] = useState(false);
  const editorRef = useRef<RichTextEditorHandle>(null);

  // 【核心修复】：如果是 About 模式，初始化时强制锁定标题
  useEffect(() => {
    if (docType === 'about') {
      setTitle('关于我');
    }
  }, [docType]);

  useEffect(() => {
    if (docId !== 'new') {
      const loadDraft = async () => {
        try {
          const configRes = await fetch('/backend_config.json');
          const config = await configRes.json();
          const res = await fetch(`http://127.0.0.1:${config.api_port}/api/drafts/get`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ blog_path: "F:/Projects/my-blog", id: docId })
          });
          const data = await res.json();
          if (data.success) {
            // 如果是 about，依然强制覆盖标题
            setTitle(docType === 'about' ? '关于我' : (data.draft.title || ''));
            setTags(data.draft.tags || []);
            setCover(data.draft.cover || '');
            setSummary(data.draft.description || '');
            setMood(data.draft.mood || '');
            setContent(data.draft.content || '');
          }
        } catch (e) { console.error("读取草稿失败", e); }
      };
      loadDraft();
    }
  }, [docId, docType]);

  const handleSave = async (isPublish: boolean) => {
    setIsSaving(true);
    const payload = {
      blog_path: "F:/Projects/my-blog",
      id: docType === 'about' ? 'about' : (docId === 'new' ? null : docId),
      type: docType,
      title: docType === 'about' ? '关于我' : title,
      tags: docType === 'about' ? [] : tags,
      cover,
      mood: docType === 'chatter' ? mood : null,
      description: docType === 'about' ? '' : summary,
      content: editorRef.current?.getContent(),
      published: isPublish
    };

    // 此处对接后端 API ...
    console.log("执行物理落盘:", payload);

    setTimeout(() => {
      setIsSaving(false);
      setLastSaved(new Date().toLocaleTimeString());
    }, 1000);
  };

  return (
    <main className="mx-auto w-[96%] max-w-[1750px] flex flex-row gap-6 z-10 relative" style={{ marginTop: '112px', height: 'calc(100vh - 112px - 32px)', marginBottom: '32px' }}>
      <section className="flex-1 min-w-0 h-full bg-white/30 dark:bg-slate-800/40 backdrop-blur-[60px] rounded-[50px] shadow-2xl border border-white/30 dark:border-white/10 flex flex-col overflow-hidden transition-all duration-700">
        <RichTextEditor
          ref={editorRef}
          title={title}
          setTitle={setTitle}
          initialContent={content}
          onOpenImageTool={() => setIsImgToolOpen(true)}
          // 【核心修复】：将锁定状态传给编辑器
          isTitleLocked={docType === 'about'}
        />
      </section>

      <aside className="w-[360px] shrink-0 h-full bg-white/30 dark:bg-slate-800/40 backdrop-blur-[60px] rounded-[50px] shadow-2xl border border-white/30 dark:border-white/10 flex flex-col overflow-hidden transition-all duration-700">
        <MetaMatrix
          type={docType}
          tags={tags} setTags={setTags}
          cover={cover} setCover={setCover}
          summary={summary} setSummary={setSummary}
          mood={mood} setMood={setMood}
          allHistoryPostTags={historyPostTags}
          allHistoryChatterTags={historyChatterTags}
          allHistoryMoods={historyMoods}
          onSave={handleSave}
          isSaving={isSaving}
          lastSaved={lastSaved}
          isLoadingTags={false}
          onOpenImageTool={() => {}}
        />
      </aside>

      <FloatingImageTool isOpen={isImgToolOpen} onClose={() => setIsImgToolOpen(false)} onInsert={(url) => editorRef.current?.insertImage(url)} />
    </main>
  );
}