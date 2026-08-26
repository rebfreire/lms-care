"use client";

import { useReducer } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Link as LinkIcon,
  Undo,
  Redo,
} from "lucide-react";

interface RichTextEditorProps {
  name: string;
  label?: string;
  defaultValue?: string;
}

export default function RichTextEditor({ name, label, defaultValue = "" }: RichTextEditorProps) {
  const [, forceRender] = useReducer((x: number) => x + 1, 0);

  const editor = useEditor({
    extensions: [StarterKit, Link.configure({ openOnClick: false })],
    content: defaultValue,
    immediatelyRender: false,
    onUpdate: forceRender,
    onSelectionUpdate: forceRender,
  });

  function adicionarLink() {
    const url = window.prompt("URL do link:");
    if (url) editor?.chain().focus().setLink({ href: url }).run();
  }

  return (
    <div>
      {label && (
        <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
          {label}
        </label>
      )}
      <div className="rounded-2xl border border-outline-variant bg-surface overflow-hidden">
        <div className="flex flex-wrap items-center gap-1 border-b border-outline-variant px-2 py-1.5 bg-surface-container-low">
          {[
            { icon: Bold, action: () => editor?.chain().focus().toggleBold().run(), ativo: editor?.isActive("bold") },
            { icon: Italic, action: () => editor?.chain().focus().toggleItalic().run(), ativo: editor?.isActive("italic") },
            { icon: Strikethrough, action: () => editor?.chain().focus().toggleStrike().run(), ativo: editor?.isActive("strike") },
            { icon: List, action: () => editor?.chain().focus().toggleBulletList().run(), ativo: editor?.isActive("bulletList") },
            { icon: ListOrdered, action: () => editor?.chain().focus().toggleOrderedList().run(), ativo: editor?.isActive("orderedList") },
            { icon: LinkIcon, action: adicionarLink, ativo: editor?.isActive("link") },
          ].map(({ icon: Icon, action, ativo }, i) => (
            <button
              key={i}
              type="button"
              onClick={action}
              className={`p-1.5 rounded-lg ${ativo ? "bg-primary-container text-on-primary-container" : "text-on-surface-variant hover:bg-surface-container-high"}`}
            >
              <Icon size={15} />
            </button>
          ))}
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => editor?.chain().focus().undo().run()}
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high"
          >
            <Undo size={15} />
          </button>
          <button
            type="button"
            onClick={() => editor?.chain().focus().redo().run()}
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high"
          >
            <Redo size={15} />
          </button>
        </div>
        <EditorContent
          editor={editor}
          className="prose prose-sm max-w-none px-4 py-3 min-h-[140px] focus:outline-none [&_.ProseMirror]:outline-none"
        />
      </div>
      <input type="hidden" name={name} value={editor?.getHTML() ?? defaultValue} />
    </div>
  );
}
