"use client";

import { useEffect, useState } from "react";
import { 
  getLatestReleaseNote, 
  hasSeenReleaseNote, 
  markReleaseNoteAsSeen 
} from "@/lib/admin-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { Sparkles, X, ExternalLink } from "lucide-react";

import { usePathname } from "next/navigation";

export function ReleaseNotesPopup() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [note, setNote] = useState<any>(null);

  useEffect(() => {
    // Only show on / or /home
    if (pathname !== "/" && pathname !== "/home") return;

    let timer: NodeJS.Timeout;

    const checkNote = async () => {
      const latest = await getLatestReleaseNote();
      if (!latest) return;

      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
      const now = Date.now();
      const isExpired = now - latest.publishedAt > sevenDaysInMs;

      if (!isExpired && !hasSeenReleaseNote(latest._id || "")) {
        setNote(latest);
        // Small delay for better UX
        timer = setTimeout(() => setIsOpen(true), 1500);
      }
    };

    checkNote();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [pathname]);

  const handleClose = () => {
    if (note?._id) {
      markReleaseNoteAsSeen(note._id);
    }
    setIsOpen(false);
  };

  if (!note) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl gap-0 p-0 overflow-hidden rounded-3xl border-none bg-card shadow-2xl">
        <div className="relative h-32 bg-gradient-to-br from-primary via-primary/80 to-primary/60 p-8 flex items-center justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
              <Sparkles className="h-3 w-3" /> New Update
            </div>
            <DialogTitle className="text-2xl font-bold text-white">What's New in Plexi</DialogTitle>
            <p className="sr-only">Detailed release notes for the latest Plexi update.</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleClose}
            className="absolute top-4 right-4 h-8 w-8 rounded-full text-white/70 hover:text-white hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-8 max-h-[60vh] overflow-y-auto">
          <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:mb-4 prose-p:leading-relaxed">
            <ReactMarkdown>{note.content}</ReactMarkdown>
          </div>
          {note.buttonText && (
            <div className="mt-8 pt-6 border-t border-border">
              <Button 
                variant="outline" 
                className="w-full rounded-xl gap-2 border-primary/20 hover:border-primary/50 hover:bg-primary/5"
                asChild
              >
                <a href={note.buttonUrl || "#"} target="_blank" rel="noopener noreferrer">
                  {note.buttonText}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="p-6 border-t border-border bg-muted/30">
          <Button onClick={handleClose} className="w-full rounded-xl h-12 text-base font-semibold">
            Got it, thanks!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
