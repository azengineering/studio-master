// src/components/editor/RichTextEditor.tsx
'use client';

import { useEditor, EditorContent, type EditorEvents, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import UnderlineExtension from '@tiptap/extension-underline';
import LinkExtension from '@tiptap/extension-link';
import TextAlignExtension from '@tiptap/extension-text-align';
import PlaceholderExtension from '@tiptap/extension-placeholder';
import Toolbar from './Toolbar';
import { useEffect, useCallback } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (newContent: string) => void;
  onEditorInstance?: (editor: Editor | null) => void;
  placeholder?: string;
  editable?: boolean;
}

export default function RichTextEditor({
  content,
  onChange,
  onEditorInstance,
  placeholder = "Start writing...",
  editable = true,
}: RichTextEditorProps) {

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Heading levels configuration
        heading: {
          levels: [1, 2, 3],
        },
        // BulletList and OrderedList are part of StarterKit by default
        // Ensure they are not accidentally disabled if other StarterKit options are configured
        // For example, if you were doing:
        // bulletList: false, // This would disable it
        // orderedList: false, // This would disable it
      }),
      UnderlineExtension,
      LinkExtension.configure({
        openOnClick: false, 
        autolink: true,
        linkOnPaste: true,
      }),
      TextAlignExtension.configure({
        types: ['heading', 'paragraph'],
      }),
      PlaceholderExtension.configure({
        placeholder: placeholder,
      }),
    ],
    content: content,
    editable: editable,
    onUpdate: useCallback(({ editor: currentEditor }: EditorEvents['update']) => {
      onChange(currentEditor.getHTML());
    }, [onChange]),
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl min-h-[150px] w-full rounded-b-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 overflow-y-auto',
      },
    },
  });

  useEffect(() => {
    if (onEditorInstance) {
      onEditorInstance(editor);
    }
    return () => {
        if (onEditorInstance) {
            onEditorInstance(null); 
        }
    }
  }, [editor, onEditorInstance]);
  
  useEffect(() => {
    if (editor && !editor.isDestroyed && content !== editor.getHTML()) {
      const handler = setTimeout(() => {
        if (editor && !editor.isDestroyed) {
           editor.commands.setContent(content, false); 
        }
      }, 0);
      return () => clearTimeout(handler);
    }
  }, [content, editor]);


  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editable, editor]);


  return (
    <div className="flex flex-col">
      {editable && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}
