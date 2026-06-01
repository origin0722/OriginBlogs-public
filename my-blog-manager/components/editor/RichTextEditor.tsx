"use client";

import React, { useState, useImperativeHandle, forwardRef, useEffect, useRef } from 'react';
import { useEditor, EditorContent, Extension } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';

// 🌟 引入 Markdown 插件
import { Markdown } from 'tiptap-markdown';

// 🌟 引入满血版 C++ 语法高亮
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { createLowlight, all } from 'lowlight';

import {
  Undo2, Redo2, Eraser, Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, List, ListOrdered, ListTodo,
  Highlighter, Code2, Heading1, Heading2, Heading3,
  Type, ImageIcon, Quote, RemoveFormatting, ChevronDown,
  Pipette, Hash, Check, Link2, Superscript as SupIcon, Subscript as SubIcon, Minus, Palette, Lock
} from 'lucide-react';

const lowlight = createLowlight(all);

const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '100%',
        renderHTML: attributes => ({
          style: `width: ${attributes.width}; height: auto; display: block; margin: 2rem auto; border-radius: 2rem; box-shadow: 0 20px 50px rgba(0,0,0,0.15);`
        })
      }
    };
  },
});

const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() { return { types: ['textStyle'] }; },
  addGlobalAttributes() { return [{ types: this.options.types, attributes: { fontSize: { default: null, parseHTML: element => element.style.fontSize?.replace(/['"]+/g, ''), renderHTML: attributes => attributes.fontSize ? { style: `font-size: ${attributes.fontSize}` } : {} } } }]; },
  addCommands() { return { setFontSize: (fontSize: string) => ({ chain }) => chain().setMark('textStyle', { fontSize }).run() }; },
});

// 🌟 终极修复：彻底废弃 absolute 下拉框，升级为 Fixed 居中模态框 (Modal)！
// 这样就能 100% 逃脱父级容器的 overflow 限制，绝对不可能再被遮挡！
const CustomColorPicker = ({ activeColor, onSelect, onConfirm, recentColors, onClose }: any) => {
  const presets = ['#000000', '#6366F1', '#EC4899', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6'];
  const [hex, setHex] = useState(activeColor);
  return (
    <>
      {/* 带有毛玻璃模糊效果的全屏遮罩 */}
      <div className="fixed inset-0 z-[9990] bg-slate-900/20 dark:bg-black/40 backdrop-blur-sm transition-all" onClick={onClose} />

      {/* 永远居中显示的调色板面板 */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl rounded-[32px] p-6 shadow-2xl border border-white/40 dark:border-white/10 z-[9999] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex flex-col gap-5">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Color Palette</span>
            <button onClick={() => onConfirm(hex)} className="w-8 h-8 flex items-center justify-center bg-indigo-500 text-white rounded-full hover:scale-110 transition-transform">
              <Check size={16}/>
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2.5">
            {presets.map(c => (
              <button
                key={c}
                onClick={() => { setHex(c); onSelect(c); }}
                className="w-full aspect-square rounded-xl border border-white/20 hover:scale-110 hover:shadow-md transition-all"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 p-3 rounded-2xl border border-white/10 shadow-inner">
            <Hash size={14} className="text-slate-400" />
            <input
              type="text"
              value={(hex || '').replace('#','')}
              onChange={(e) => { const val = '#' + e.target.value; setHex(val); if(val.length === 7) onSelect(val); }}
              className="bg-transparent w-full text-sm font-black outline-none uppercase text-slate-800 dark:text-slate-200"
            />
          </div>
          {recentColors && recentColors.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-200/50 dark:border-white/10">
              {recentColors.map((c: string) => (
                <button
                  key={c}
                  onClick={() => { setHex(c); onSelect(c); }}
                  className="w-6 h-6 rounded-full border border-white/40 shadow-sm hover:scale-125 transition-transform"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export interface RichTextEditorHandle {
  insertImage: (url: string) => void;
  getContent: () => string;
}

interface EditorProps {
  title: string;
  setTitle: (val: string) => void;
  initialContent?: string;
  onOpenImageTool: () => void;
  isTitleLocked?: boolean;
  onChange?: () => void;
}

const RichTextEditor = forwardRef<RichTextEditorHandle, EditorProps>(({ title, setTitle, initialContent, onOpenImageTool, isTitleLocked, onChange }, ref) => {
  const [textColors, setTextColors] = useState<string[]>(['#6366F1', '#000000']);
  const [highlightColors, setHighlightColors] = useState<string[]>(['#FEF08A', '#BBF7D0']);
  const [showTextPicker, setShowTextPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);

  const loadedContentRef = useRef<string | null>(null);
  const [, setRenderTrigger] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: 'cpp',
        HTMLAttributes: {
          class: 'bg-[#282c34] text-[#abb2bf] p-6 rounded-[1.5rem] font-mono my-6 overflow-x-auto shadow-inner'
        },
      }),
      Underline, Subscript, Superscript, TextStyle, Color, FontSize, CustomImage,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-indigo-500 underline cursor-pointer font-bold' } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: true }),
      TaskList.configure({ HTMLAttributes: { class: 'not-prose space-y-3' } }),
      TaskItem.configure({ nested: true }),
    ],
    content: initialContent || '',
    immediatelyRender: false,
    onUpdate: () => {
      if (onChange) onChange();
    },
    onTransaction: () => {
      setRenderTrigger(v => v + 1);
    },
    editorProps: {
      attributes: { class: 'prose prose-slate dark:prose-invert prose-lg max-w-none w-full focus:outline-none min-h-full pb-60 font-serif leading-relaxed px-4 editor-content-area' }
    },
  });

  useImperativeHandle(ref, () => ({
    insertImage: (url: string) => {
      if (editor) {
        editor.chain().focus().setImage({ src: url }).run();
        if (onChange) onChange();
      }
    },
    getContent: () => {
      if (!editor) return '';
      let html = editor.getHTML();

      html = html.replace(/<p><\/p>/gi, '<br>&zwj;');
      html = html.replace(/<p><br><\/p>/gi, '<br>&zwj;');

      return html;
    }
  }), [editor, onChange]);

  useEffect(() => {
    if (!editor || !initialContent) return;
    if (loadedContentRef.current !== initialContent) {
      const safeContent = initialContent.replace(/~~([\s\S]*?)~~/g, '<s>$1</s>');
      editor.commands.setContent(safeContent, false);
      loadedContentRef.current = initialContent;
    }
  }, [editor, initialContent]);

  if (!editor) return null;

  const currentFontSize = editor.getAttributes('textStyle').fontSize || "default";

  const toggleLink = () => {
    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const previousUrl = editor.getAttributes('link').href || '';
    const url = window.prompt('请输入跳转链接 (URL):', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    const safeUrl = /^https?:\/\//.test(url) ? url : `https://${url}`;
    editor.chain().focus().extendMarkRange('link').setLink({ href: safeUrl }).run();
  };

  const Btn = ({ onClick, active, children, title }: any) => (
    <button
      onClick={onClick}
      title={title}
      className={`p-2.5 rounded-xl transition-all duration-300 ease-out flex items-center justify-center 
        ${active ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/40 scale-110' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}
    >
      {children}
    </button>
  );

  return (
    <div className="flex flex-col h-full w-full min-h-0 bg-transparent relative">
      <style dangerouslySetInnerHTML={{ __html: `
        .editor-content-area h1 { font-size: 3rem !important; font-weight: 950 !important; margin-bottom: 2rem !important; margin-top: 3rem !important; line-height: 1.1; color: inherit; } 
        .editor-content-area h2 { font-size: 2.2rem !important; font-weight: 800 !important; margin-bottom: 1.5rem !important; margin-top: 2rem !important; } 
        .editor-content-area h3 { font-size: 1.5rem !important; font-weight: 700 !important; margin-bottom: 1rem !important; } 
        .editor-content-area p { font-size: 1.15rem !important; line-height: 1.85 !important; } 
        .editor-content-area ul { list-style-type: disc !important; padding-left: 1.5rem !important; } 
        .editor-content-area ol { list-style-type: decimal !important; padding-left: 1.5rem !important; }
        
        .editor-content-area s, .editor-content-area del { text-decoration-line: line-through !important; opacity: 0.6; }

        .editor-content-area blockquote {
          border-left: 4px solid #6366f1 !important;
          background-color: rgba(99, 102, 241, 0.05) !important;
          padding: 1rem 1.5rem !important;
          margin: 1.5rem 0 !important;
          border-radius: 0 1.25rem 1.25rem 0 !important;
          font-style: italic !important;
          color: #64748b !important;
        }
        .editor-content-area blockquote p {
          margin: 0 !important; 
          color: inherit !important;
        }
        .dark .editor-content-area blockquote {
          border-left-color: #818cf8 !important;
          background-color: rgba(129, 140, 248, 0.1) !important;
          color: #94a3b8 !important;
        }

        .editor-content-area pre code, .editor-content-area p code {
          font-family: ui-rounded, 'Quicksand', 'Nunito', 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Source Code Pro', Menlo, Monaco, Consolas, monospace !important;
          font-variant-ligatures: contextual !important;
          font-weight: 500 !important;
          letter-spacing: 0.02em !important;
        }
        
        .editor-content-area p code {
           background-color: rgba(99, 102, 241, 0.1) !important; color: #6366f1 !important; padding: 0.2rem 0.4rem !important; border-radius: 0.5rem !important; font-size: 0.85em !important;
        }

        .editor-content-area pre code .hljs-comment, .editor-content-area pre code .hljs-quote { color: #5c6370; font-style: italic; }
        .editor-content-area pre code .hljs-doctag, .editor-content-area pre code .hljs-keyword, .editor-content-area pre code .hljs-formula { color: #c678dd; }
        .editor-content-area pre code .hljs-keyword.type_, .editor-content-area pre code .hljs-type { color: #c678dd; } 
        .editor-content-area pre code .hljs-section, .editor-content-area pre code .hljs-name, .editor-content-area pre code .hljs-selector-tag, .editor-content-area pre code .hljs-deletion, .editor-content-area pre code .hljs-subst { color: #e06c75; }
        .editor-content-area pre code .hljs-literal { color: #56b6c2; }
        .editor-content-area pre code .hljs-string, .editor-content-area pre code .hljs-regexp, .editor-content-area pre code .hljs-addition, .editor-content-area pre code .hljs-attribute, .editor-content-area pre code .hljs-meta-string { color: #98c379; }
        .editor-content-area pre code .hljs-built_in, .editor-content-area pre code .hljs-class .hljs-title, .editor-content-area pre code .hljs-title.class_ { color: #e6c07b; } 
        .editor-content-area pre code .hljs-attr, .editor-content-area pre code .hljs-variable, .editor-content-area pre code .hljs-template-variable, .editor-content-area pre code .hljs-selector-class, .editor-content-area pre code .hljs-selector-attr, .editor-content-area pre code .hljs-selector-pseudo, .editor-content-area pre code .hljs-number { color: #d19a66; }
        .editor-content-area pre code .hljs-symbol, .editor-content-area pre code .hljs-bullet, .editor-content-area pre code .hljs-link, .editor-content-area pre code .hljs-meta, .editor-content-area pre code .hljs-selector-id, .editor-content-area pre code .hljs-title, .editor-content-area pre code .hljs-title.function_ { color: #61aeee; } 
      `}} />

      <div className="shrink-0 px-12 pt-14 pb-4 flex items-center gap-4">
        <input
          type="text"
          value={title}
          onChange={(e) => !isTitleLocked && setTitle(e.target.value)}
          readOnly={isTitleLocked}
          placeholder="文章大标题..."
          className={`flex-1 text-5xl font-black bg-transparent border-none outline-none transition-all tracking-tighter 
            ${isTitleLocked ? 'text-slate-400 dark:text-slate-600 cursor-default select-none' : 'text-slate-900 dark:text-white placeholder:text-slate-200 dark:placeholder:text-slate-800'}
          `}
        />
        {isTitleLocked && (
          <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center gap-2 text-slate-400 border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-right duration-500">
            <Lock size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">System Locked</span>
          </div>
        )}
      </div>

      <div className="shrink-0 px-8 py-2.5 border-y border-white/20 dark:border-white/10 flex flex-wrap items-center gap-1.5 bg-white/10 dark:bg-black/20 backdrop-blur-md z-50">
        <div className="flex items-center gap-1"><Btn onClick={() => editor.chain().focus().undo().run()}><Undo2 size={16}/></Btn><Btn onClick={() => editor.chain().focus().redo().run()}><Redo2 size={16}/></Btn><Btn onClick={() => editor.chain().focus().unsetAllMarks().run()}><RemoveFormatting size={16}/></Btn></div>
        <div className="w-px h-6 bg-slate-400/20 mx-1" />

        <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 rounded-xl px-2">
          <ChevronDown size={12} className="text-slate-400" />
          <select
            value={currentFontSize}
            onChange={(e) => {
              editor.chain().focus().setFontSize(e.target.value).run();
            }}
            className="bg-transparent text-[10px] font-black p-2 outline-none text-slate-700 dark:text-slate-300"
          >
            <option value="default" disabled>字号</option>
            {['14px', '16px', '18px', '20px', '24px', '32px', '48px'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-1">
          <Btn onClick={() => editor.chain().focus().setParagraph().run()} active={editor.isActive('paragraph') && !editor.isActive('heading')} title="正文"><Type size={18}/></Btn>
          <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="一级标题 (#)">
            <div className="flex items-center gap-1 font-black"><Heading1 size={16}/><span className="text-[10px] opacity-60">#</span></div>
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="二级标题 (##)">
            <div className="flex items-center gap-1 font-black"><Heading2 size={16}/><span className="text-[10px] opacity-60">##</span></div>
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="三级标题 (###)">
            <div className="flex items-center gap-1 font-black"><Heading3 size={16}/><span className="text-[10px] opacity-60">###</span></div>
          </Btn>
        </div>

        <div className="w-px h-6 bg-slate-400/20 mx-1" />
        <div className="flex items-center gap-1">
          <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')}><Bold size={16}/></Btn>
          <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')}><Italic size={16}/></Btn>
          <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')}><UnderlineIcon size={16}/></Btn>
          <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')}><Strikethrough size={16}/></Btn>
          <Btn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')}><Code2 size={16}/></Btn>
        </div>
        <div className="w-px h-6 bg-slate-400/20 mx-1" />
        <div className="flex items-center gap-1"><Btn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })}><AlignLeft size={16}/></Btn><Btn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })}><AlignCenter size={16}/></Btn><Btn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })}><AlignRight size={16}/></Btn></div>
        <div className="w-px h-6 bg-slate-400/20 mx-1" />
        <div className="flex items-center gap-1"><Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')}><List size={16}/></Btn><Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')}><ListOrdered size={16}/></Btn><Btn onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive('taskList')}><ListTodo size={16}/></Btn><Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')}><Quote size={16}/></Btn></div>
        <div className="w-px h-6 bg-slate-400/20 mx-1" />

        <div className="flex items-center gap-1">
          <Btn onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive('superscript')}><SupIcon size={16}/></Btn>
          <Btn onClick={() => editor.chain().focus().toggleSubscript().run()} active={editor.isActive('subscript')}><SubIcon size={16}/></Btn>
          <Btn onClick={toggleLink} active={editor.isActive('link')}><Link2 size={16}/></Btn>
          <Btn onClick={onOpenImageTool}><ImageIcon size={16} className="text-indigo-500"/></Btn>
        </div>

        {editor.isActive('image') && <div className="flex items-center gap-1 ml-4 bg-indigo-500/10 p-1 px-3 rounded-2xl border border-indigo-500/20 border-dashed animate-in slide-in-from-left">{['25%', '50%', '75%', '100%'].map(s => <button key={s} onClick={() => editor.chain().focus().updateAttributes('image', { width: s }).run()} className="px-2 py-1 text-[9px] font-bold hover:bg-white rounded-lg transition-all">{s}</button>)}</div>}
        <div className="flex-1" />
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1.5 px-3 rounded-2xl border border-white/10 shadow-inner">
              <Palette size={14} className="text-slate-400 mr-2" />
              <div className="flex items-center gap-1 pr-2 border-r border-white/10">
                {textColors.map(c => <button key={c} onClick={() => editor.chain().focus().setColor(c).run()} onContextMenu={(e) => { e.preventDefault(); setTextColors(prev => prev.filter(col => col !== c)); }} className="w-4 h-4 rounded-full border border-white/40 hover:scale-125 transition-all shadow-sm" style={{ backgroundColor: c }} />)}
              </div>
              <button onClick={() => { setShowTextPicker(true); setShowHighlightPicker(false); }} className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center border border-indigo-500/30 ml-1">
                <Pipette size={14} className="text-indigo-500" />
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1.5 px-3 rounded-2xl border border-white/10 shadow-inner">
              <Highlighter size={14} className="text-slate-400 mr-2" />
              <div className="flex items-center gap-1 pr-2 border-r border-white/10">
                {highlightColors.map(c => <button key={c} onClick={() => editor.chain().focus().setHighlight({ color: c }).run()} onContextMenu={(e) => { e.preventDefault(); setHighlightColors(prev => prev.filter(col => col !== c)); }} className="w-4 h-4 rounded-md border border-white/40 hover:scale-125 transition-all shadow-sm" style={{ backgroundColor: c }} />)}
              </div>
              <button onClick={() => { setShowHighlightPicker(true); setShowTextPicker(false); }} className="w-8 h-8 rounded-xl bg-yellow-400 shadow-xl flex items-center justify-center border border-white/20 ml-1">
                <Highlighter size={14} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 将弹窗从 Toolbar 结构中抽离出来，独立于 Flex 布局之外！ */}
      {showTextPicker && <CustomColorPicker activeColor="#6366F1" recentColors={textColors} onClose={() => setShowTextPicker(false)} onSelect={(c: string) => editor.chain().focus().setColor(c).run()} onConfirm={(c: string) => { if(!textColors.includes(c)) setTextColors(p => [c, ...p].slice(0, 6)); setShowTextPicker(false); }} />}
      {showHighlightPicker && <CustomColorPicker activeColor="#FEF08A" recentColors={highlightColors} onClose={() => setShowHighlightPicker(false)} onSelect={(c: string) => editor.chain().focus().setHighlight({ color: c }).run()} onConfirm={(c: string) => { if(!highlightColors.includes(c)) setHighlightColors(p => [c, ...p].slice(0, 6)); setShowHighlightPicker(false); }} />}

      <div className="flex-1 overflow-y-auto px-12 py-12 custom-scrollbar"><EditorContent editor={editor} /></div>
    </div>
  );
});

RichTextEditor.displayName = 'RichTextEditor';
export default RichTextEditor;