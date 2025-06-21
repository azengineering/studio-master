// src/components/editor/Toolbar.tsx
'use client';

import type { Editor } from '@tiptap/react';
import {
  Bold, Italic, Underline, Strikethrough, Link as LinkIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify, Unlink, List, ListOrdered
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { useCallback, useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface ToolbarProps {
  editor: Editor | null;
}

export default function Toolbar({ editor }: ToolbarProps) {
  const [isLinkEditorOpen, setIsLinkEditorOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  // State for active text formatting buttons
  const [activeButtons, setActiveButtons] = useState({
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    link: false,
    alignLeft: false,
    alignCenter: false,
    alignRight: false,
    alignJustify: false,
    bulletList: false,
    orderedList: false,
  });

  useEffect(() => {
    if (!editor) return;

    const updateActiveButtons = () => {
      setActiveButtons({
        bold: editor.isActive('bold'),
        italic: editor.isActive('italic'),
        underline: editor.isActive('underline'),
        strike: editor.isActive('strike'),
        link: editor.isActive('link'),
        alignLeft: editor.isActive({ textAlign: 'left' }),
        alignCenter: editor.isActive({ textAlign: 'center' }),
        alignRight: editor.isActive({ textAlign: 'right' }),
        alignJustify: editor.isActive({ textAlign: 'justify' }),
        bulletList: editor.isActive('bulletList'),
        orderedList: editor.isActive('orderedList'),
      });
    };

    editor.on('transaction', updateActiveButtons);
    editor.on('selectionUpdate', updateActiveButtons);
    updateActiveButtons(); // Initial check

    return () => {
      editor.off('transaction', updateActiveButtons);
      editor.off('selectionUpdate', updateActiveButtons);
    };
  }, [editor]);


  const handleSetLink = useCallback(() => {
    if (!editor) return;
    let url = linkUrl.trim();

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      setIsLinkEditorOpen(false);
      setLinkUrl('');
      return;
    }

    if (url && !/^https?:\/\//i.test(url) && !/^mailto:/i.test(url)) {
      url = `https://${url}`;
    }
    
    try {
      new URL(url); 
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
      setIsLinkEditorOpen(false);
      setLinkUrl(''); 
    } catch (e) {
        alert("Please enter a valid URL."); 
    }

  }, [editor, linkUrl]);


  const handleOpenLinkEditor = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    setLinkUrl(previousUrl || '');
    setIsLinkEditorOpen(true);
  }, [editor]);


  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-1 border border-input rounded-t-md p-2 bg-muted/60 shadow-sm">
      <Toggle
        size="icon" // Using icon size
        pressed={activeButtons.bold}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
        title="Bold (Ctrl+B)"
        aria-label="Toggle bold"
        className={cn("data-[state=on]:bg-primary/20 data-[state=on]:text-primary", {'bg-primary/20 text-primary': activeButtons.bold})}
      >
        <Bold className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="icon"
        pressed={activeButtons.italic}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        title="Italic (Ctrl+I)"
        aria-label="Toggle italic"
        className={cn("data-[state=on]:bg-primary/20 data-[state=on]:text-primary", {'bg-primary/20 text-primary': activeButtons.italic})}
      >
        <Italic className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="icon"
        pressed={activeButtons.underline}
        onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
        title="Underline (Ctrl+U)"
        aria-label="Toggle underline"
        className={cn("data-[state=on]:bg-primary/20 data-[state=on]:text-primary", {'bg-primary/20 text-primary': activeButtons.underline})}
      >
        <Underline className="h-4 w-4" />
      </Toggle>
      
      <Popover open={isLinkEditorOpen} onOpenChange={setIsLinkEditorOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn("data-[state=open]:bg-primary/10", {'bg-primary/20 text-primary': activeButtons.link})}
            title="Set Link (Ctrl+K)"
            onClick={handleOpenLinkEditor}
            aria-pressed={activeButtons.link}
            aria-label="Set or edit link"
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-2">
          <div className="grid gap-2">
            <Input
              type="url"
              placeholder="https://example.com"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSetLink(); }}}
              aria-label="Link URL"
            />
            <div className="flex justify-end gap-2">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        editor.chain().focus().extendMarkRange('link').unsetLink().run();
                        setIsLinkEditorOpen(false);
                        setLinkUrl('');
                    }}
                    disabled={!activeButtons.link}
                >
                    <Unlink className="mr-1 h-4 w-4" /> Remove
                </Button>
                <Button type="button" size="sm" onClick={handleSetLink}>Set Link</Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Toggle
        size="icon"
        pressed={activeButtons.bulletList}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
        title="Bulleted List"
        aria-label="Toggle bulleted list"
        className={cn("data-[state=on]:bg-primary/20 data-[state=on]:text-primary", {'bg-primary/20 text-primary': activeButtons.bulletList})}
      >
        <List className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="icon"
        pressed={activeButtons.orderedList}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
        title="Numbered List"
        aria-label="Toggle numbered list"
        className={cn("data-[state=on]:bg-primary/20 data-[state=on]:text-primary", {'bg-primary/20 text-primary': activeButtons.orderedList})}
      >
        <ListOrdered className="h-4 w-4" />
      </Toggle>
      
      <Toggle
        size="icon"
        pressed={activeButtons.alignLeft}
        onPressedChange={() => editor.chain().focus().setTextAlign('left').run()}
        title="Align Left"
        aria-label="Align text left"
        className={cn("data-[state=on]:bg-primary/20 data-[state=on]:text-primary", {'bg-primary/20 text-primary': activeButtons.alignLeft})}
      >
        <AlignLeft className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="icon"
        pressed={activeButtons.alignCenter}
        onPressedChange={() => editor.chain().focus().setTextAlign('center').run()}
        title="Align Center"
        aria-label="Align text center"
        className={cn("data-[state=on]:bg-primary/20 data-[state=on]:text-primary", {'bg-primary/20 text-primary': activeButtons.alignCenter})}
      >
        <AlignCenter className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="icon"
        pressed={activeButtons.alignRight}
        onPressedChange={() => editor.chain().focus().setTextAlign('right').run()}
        title="Align Right"
        aria-label="Align text right"
        className={cn("data-[state=on]:bg-primary/20 data-[state=on]:text-primary", {'bg-primary/20 text-primary': activeButtons.alignRight})}
      >
        <AlignRight className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="icon"
        pressed={activeButtons.alignJustify}
        onPressedChange={() => editor.chain().focus().setTextAlign('justify').run()}
        title="Align Justify"
        aria-label="Justify text"
        className={cn("data-[state=on]:bg-primary/20 data-[state=on]:text-primary", {'bg-primary/20 text-primary': activeButtons.alignJustify})}
      >
        <AlignJustify className="h-4 w-4" />
      </Toggle>

      <Toggle
        size="icon"
        pressed={activeButtons.strike}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
        title="Strikethrough (Ctrl+Shift+X)"
        aria-label="Toggle strikethrough"
        className={cn("data-[state=on]:bg-primary/20 data-[state=on]:text-primary", {'bg-primary/20 text-primary': activeButtons.strike})}
      >
        <Strikethrough className="h-4 w-4" />
      </Toggle>
    </div>
  );
}
