'use client'

import React, { useRef, useCallback, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

export default function RichTextEditor({ value, onChange, placeholder = '내용을 입력하세요' }: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      // outline:none 제거 — :focus-visible 링은 아래 <style>에서 처리 (WCAG 2.4.7)
      attributes: { style: 'min-height: 280px; padding: 14px; font-family: var(--font-sans); font-size: 0.92rem; line-height: 1.8; color: var(--white);' },
    },
  })

  const handleImageUpload = useCallback(async (file: File) => {
    if (!editor) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/posts/upload-image', { method: 'POST', body: form })
      const json = await res.json()
      if (!res.ok) { alert(json.error ?? '업로드 실패'); return }
      editor.chain().focus().setImage({ src: json.url }).run()
    } finally {
      setUploading(false)
    }
  }, [editor])

  if (!editor) return null

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg2)', overflow: 'hidden' }}>
      {/* 툴바 */}
      <div style={{
        display: 'flex', gap: '4px', padding: '8px 10px',
        borderBottom: '1px solid var(--border)', background: 'var(--bg3)',
        flexWrap: 'wrap', alignItems: 'center',
      }}>
        <ToolBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="굵게">B</ToolBtn>
        <ToolBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="기울임"><i>I</i></ToolBtn>
        <ToolBtn active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="제목">H2</ToolBtn>
        <ToolBtn active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="소제목">H3</ToolBtn>
        <Divider />
        <ToolBtn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="목록">•≡</ToolBtn>
        <ToolBtn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="번호 목록">1≡</ToolBtn>
        <ToolBtn active={false} onClick={() => editor.chain().focus().setHorizontalRule().run()} title="구분선">—</ToolBtn>
        <Divider />
        {/* 이미지 업로드 버튼 */}
        <button
          type="button"
          title="이미지 삽입"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          style={{
            padding: '4px 10px', minHeight: 30, border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', background: uploading ? 'var(--border)' : 'var(--bg2)',
            color: 'var(--gold)', fontSize: '0.8rem', fontWeight: 700,
            cursor: uploading ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)',
          }}
        >
          {uploading ? '업로드 중…' : <><span aria-hidden="true">🖼</span>{' 이미지'}</>}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.target.value = '' }}
        />
      </div>

      {/* 에디터 본문 */}
      <EditorContent editor={editor} />

      <style>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: var(--gray);
          pointer-events: none;
          height: 0;
        }
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: var(--radius);
          margin: 8px 0;
          display: block;
        }
        .ProseMirror h2 { font-size: 1.3rem; font-weight: 700; margin: 16px 0 8px; color: var(--white); }
        .ProseMirror h3 { font-size: 1.1rem; font-weight: 600; margin: 14px 0 6px; color: var(--white); }
        .ProseMirror ul { padding-left: 1.4em; list-style: disc; }
        .ProseMirror ol { padding-left: 1.4em; list-style: decimal; }
        .ProseMirror li { margin: 2px 0; }
        .ProseMirror hr { border: none; border-top: 1px solid var(--border); margin: 14px 0; }
        .ProseMirror strong { font-weight: 700; }
        .ProseMirror em { font-style: italic; }
        .ProseMirror:focus-visible { outline: 2px solid var(--gold); outline-offset: -2px; border-radius: 0 0 var(--radius) var(--radius); }
      `}</style>
    </div>
  )
}

function ToolBtn({ active, onClick, title, children }: { active: boolean; onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      style={{
        padding: '4px 8px', minHeight: 30, border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        background: active ? 'var(--gold)' : 'var(--bg2)',
        color: active ? '#fff' : 'var(--white)',
        fontSize: '0.78rem', fontWeight: 600,
        cursor: 'pointer', fontFamily: 'var(--font-sans)',
        transition: 'var(--transition)',
      }}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <span style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 2px', display: 'inline-block' }} />
}
