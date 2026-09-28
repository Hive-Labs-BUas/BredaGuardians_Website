import { useServerFn } from "@tanstack/react-start";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitApplication } from "@/lib/applications.functions";

const schema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(100),
  email: z.string().trim().email("Enter a valid email address").max(255),
  motivation: z
    .string()
    .trim()
    .min(20, "Tell us at least a sentence or two (20+ characters)")
    .max(2000),
});

const MAX_BYTES = 6 * 1024 * 1024;

async function toPayload(file: File | undefined | null) {
  if (!file || file.size === 0) return null;
  if (file.size > MAX_BYTES) throw new Error(`${file.name} is larger than 6 MB.`);
  const buffer = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return { name: file.name, type: file.type || "application/octet-stream", data: btoa(binary) };
}

export function ApplyDialog({ position }: { position: string }) {
  const send = useServerFn(submitApplication);
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = schema.safeParse({
      name: form.get("name"),
      email: form.get("email"),
      motivation: form.get("motivation"),
    });

    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return;
    }

    setErrors({});
    setSending(true);
    try {
      const cv = await toPayload(form.get("cv") as File | null);
      const letter = await toPayload(form.get("letter") as File | null);
      await send({ data: { ...parsed.data, position, cv, letter } });
      toast.success("Application sent — we'll be in touch within two working days.");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="mt-7 w-full">
          Apply for this Position <ArrowRight />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto border-border bg-surface">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl">Apply: {position}</DialogTitle>
          <DialogDescription>
            Tell us who you are and why this role fits. The interns read every application.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="space-y-5">
          <div>
            <Label htmlFor={`name-${position}`}>Name</Label>
            <Input id={`name-${position}`} name="name" maxLength={100} className="mt-2 min-h-11" />
            {errors['name'] && <p className="mt-1.5 text-xs text-destructive">{errors['name']}</p>}
          </div>
          <div>
            <Label htmlFor={`email-${position}`}>Email</Label>
            <Input
              id={`email-${position}`}
              name="email"
              type="email"
              maxLength={255}
              className="mt-2 min-h-11"
            />
            {errors['email'] && <p className="mt-1.5 text-xs text-destructive">{errors['email']}</p>}
          </div>
          <div>
            <Label htmlFor={`motivation-${position}`}>Why this role?</Label>
            <Textarea
              id={`motivation-${position}`}
              name="motivation"
              rows={5}
              maxLength={2000}
              className="mt-2"
            />
            {errors['motivation'] && (
              <p className="mt-1.5 text-xs text-destructive">{errors['motivation']}</p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor={`cv-${position}`}>CV (optional)</Label>
              <Input
                id={`cv-${position}`}
                name="cv"
                type="file"
                accept=".pdf,.doc,.docx,.rtf,.txt"
                className="mt-2 min-h-11 py-2 text-xs"
              />
            </div>
            <div>
              <Label htmlFor={`letter-${position}`}>Motivation letter (optional)</Label>
              <Input
                id={`letter-${position}`}
                name="letter"
                type="file"
                accept=".pdf,.doc,.docx,.rtf,.txt"
                className="mt-2 min-h-11 py-2 text-xs"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">PDF or Word, up to 6 MB per file.</p>
          <Button type="submit" size="lg" disabled={sending} className="w-full">
            {sending ? "Sending…" : "Send Application"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
