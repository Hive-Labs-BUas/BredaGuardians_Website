import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  MousePointerClick,
  Quote,
  Redo2,
  Share2,
  Undo2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { SOCIAL_LINKS } from "@/lib/site-data";

type Props = {
  value: string;
  onChange: (next: string) => void;
  folder: string;
  label?: string;
  minHeight?: string;
  /** Lets the parent form insert extra blocks (e.g. a social link) into the story. */
  onReady?: (api: { insertHtml: (html: string) => void }) => void;
};


function ToolButton({
  title,
  active,
  onClick,
  children,
}: {
  title: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`grid size-9 place-items-center rounded-md border text-sm transition-colors ${
        active
          ? "border-primary/60 bg-primary/15 text-primary"
          : "border-border bg-surface text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * Article body editor: formatting, links, buttons, social links, and images
 * placed anywhere in the text. Used for news, research and Hall of Fame.
 */
export function RichTextEditor({
  value,
  onChange,
  folder,
  label = "Article body",
  minHeight = "18rem",
  onReady,
}: Props) {
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Link.configure({ openOnClick: false, autolink: false }),
      Image.configure({ inline: false }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "rich-text min-h-40 focus:outline-none",
      },
    },
    onUpdate: ({ editor: current }) => onChange(current.getHTML()),
    immediatelyRender: false,
  });

  // Load an existing article body once the editor is mounted.
  useEffect(() => {
    if (!editor) return;
    if (value && value !== editor.getHTML()) editor.commands.setContent(value);
    onReady?.({ insertHtml: (html) => editor.chain().focus().insertContent(html).run() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);


  if (!editor) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="rounded-lg border border-border bg-surface p-4 text-sm text-muted-foreground">
          Loading editor…
        </div>
      </div>
    );
  }

  async function uploadImage(file: File): Promise<void> {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("That picture is larger than 10 MB.");
      return;
    }
    setBusy(true);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${folder}/body/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, file, {
      cacheControl: "31536000",
      upsert: false,
      contentType: file.type || "application/octet-stream",
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    editor!.chain().focus().setImage({ src: `/api/public/media/${path}`, alt: file.name }).run();
  }

  function addLink(): void {
    const url = window.prompt("Link address (https://…)")?.trim();
    if (!url) return;
    editor!.chain().focus().extendMarkRange("link").setLink({ href: url, target: "_blank" }).run();
  }

  function addButton(): void {
    const text = window.prompt("Button text", "Read more")?.trim();
    if (!text) return;
    const url = window.prompt("Where should the button go? (https://…)")?.trim();
    if (!url) return;
    editor!
      .chain()
      .focus()
      .insertContent(
        `<p><a class="rich-button" href="${url}" target="_blank" rel="noreferrer">${text}</a></p>`,
      )
      .run();
  }

  function addSocials(): void {
    const links = SOCIAL_LINKS.map(
      (social) => `<a href="${social.url}" target="_blank" rel="noreferrer">${social.label}</a>`,
    ).join(" · ");
    editor!.chain().focus().insertContent(`<p>${links}</p>`).run();
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="overflow-hidden rounded-lg border border-border bg-surface-2">
        <div className="flex flex-wrap gap-1.5 border-b border-border bg-surface/60 p-2">
          <ToolButton title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
            <Bold className="size-4" />
          </ToolButton>
          <ToolButton title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <Italic className="size-4" />
          </ToolButton>
          <ToolButton
            title="Heading"
            active={editor.isActive("heading", { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 className="size-4" />
          </ToolButton>
          <ToolButton
            title="Sub-heading"
            active={editor.isActive("heading", { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            <Heading3 className="size-4" />
          </ToolButton>
          <ToolButton title="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <List className="size-4" />
          </ToolButton>
          <ToolButton title="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <ListOrdered className="size-4" />
          </ToolButton>
          <ToolButton title="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            <Quote className="size-4" />
          </ToolButton>
          <span className="mx-1 w-px self-stretch bg-border" aria-hidden />
          <ToolButton title="Add link" active={editor.isActive("link")} onClick={addLink}>
            <Link2 className="size-4" />
          </ToolButton>
          <ToolButton title="Add button" onClick={addButton}>
            <MousePointerClick className="size-4" />
          </ToolButton>
          <ToolButton title="Add our social links" onClick={addSocials}>
            <Share2 className="size-4" />
          </ToolButton>
          <ToolButton title="Add picture" onClick={() => fileRef.current?.click()}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
          </ToolButton>
          <span className="mx-1 w-px self-stretch bg-border" aria-hidden />
          <ToolButton title="Undo" onClick={() => editor.chain().focus().undo().run()}>
            <Undo2 className="size-4" />
          </ToolButton>
          <ToolButton title="Redo" onClick={() => editor.chain().focus().redo().run()}>
            <Redo2 className="size-4" />
          </ToolButton>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void uploadImage(file);
            event.target.value = "";
          }}
        />
        <div className="max-h-[32rem] overflow-y-auto p-4" style={{ minHeight }}>
          <EditorContent editor={editor} />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Write as long as you like. Pictures, buttons and links you add here show up inside the article.
      </p>
    </div>
  );
}

/** Small helper so admin previews can show plain text from rich content. */
export function richTextToPlain(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}


