"use client";

import React, { useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { 
  Bold, 
  Italic, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  Video, 
  Code, 
  Heading1, 
  Heading2, 
  List, 
  Quote 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave?: () => void;
  placeholder?: string;
  className?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  onSave,
  placeholder = "Write your markdown here...",
  className,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertText = (beforeText: string, afterText: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    const before = text.substring(0, start);
    const after = text.substring(end);

    const newValue = `${before}${beforeText}${selected}${afterText}${after}`;
    onChange(newValue);

    // Reset selection
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + beforeText.length + selected.length + afterText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (!file) continue;

        // Convert to base64 for direct embedding (simple way for this case)
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target?.result as string;
          insertText(`\n![Pasted Image](${base64})\n`);
        };
        reader.readAsDataURL(file);
        return;
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Save: Ctrl + S
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      onSave?.();
    }

    // Bold: Ctrl + B
    if ((e.ctrlKey || e.metaKey) && e.key === "b") {
      e.preventDefault();
      insertText("**", "**");
    }

    // Italic: Ctrl + I
    if ((e.ctrlKey || e.metaKey) && e.key === "i") {
      e.preventDefault();
      insertText("*", "*");
    }

    // Undo/Redo are handled natively by Textarea
    // but we can add handlers if we had a custom state stack.
    // For now, let's keep it native as it's more reliable.

    // Tab support
    if (e.key === "Tab") {
      e.preventDefault();
      insertText("  ");
    }
  };

  const ToolbarButton = ({ onClick, icon: Icon, title }: { onClick: () => void, icon: any, title: string }) => (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
      title={title}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );

  return (
    <div className={cn("flex flex-col rounded-xl border border-border bg-background overflow-hidden", className)}>
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/30 p-1.5">
        <ToolbarButton onClick={() => insertText("**", "**")} icon={Bold} title="Bold (Ctrl+B)" />
        <ToolbarButton onClick={() => insertText("*", "*")} icon={Italic} title="Italic (Ctrl+I)" />
        <div className="w-px h-4 bg-border mx-1" />
        <ToolbarButton onClick={() => insertText("# ", "")} icon={Heading1} title="Heading 1" />
        <ToolbarButton onClick={() => insertText("## ", "")} icon={Heading2} title="Heading 2" />
        <div className="w-px h-4 bg-border mx-1" />
        <ToolbarButton onClick={() => insertText("> ", "")} icon={Quote} title="Quote" />
        <ToolbarButton onClick={() => insertText("- ", "")} icon={List} title="List" />
        <ToolbarButton onClick={() => insertText("`", "`")} icon={Code} title="Code" />
        <div className="w-px h-4 bg-border mx-1" />
        <ToolbarButton onClick={() => insertText("[", "](url)")} icon={LinkIcon} title="Link" />
        <ToolbarButton onClick={() => insertText("![", "](url)")} icon={ImageIcon} title="Image (or Paste)" />
        <ToolbarButton onClick={() => insertText("\n<video src='", "' controls width='100%' />\n")} icon={Video} title="Video" />
      </div>
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder={placeholder}
        className="flex-1 border-none focus-visible:ring-0 rounded-none resize-none min-h-[200px] p-4 bg-transparent"
      />
    </div>
  );
}
