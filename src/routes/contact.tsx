import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ExternalLink, Mail, MapPin, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { PageHeader } from "@/components/site/Bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { SITE, SOCIAL_LINKS, SITE_URL } from "@/lib/site-data";

const TITLE = "Contact Breda Guardians — Apply, Partner or Ask";
const DESCRIPTION =
  "Get in touch with Breda Guardians: internship applications, partnership enquiries and community questions.";

export const Route = createFileRoute("/contact")({
  validateSearch: (search: Record<string, unknown>) => ({
    role: typeof search["role"] === "string" ? search["role"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:url", content: `${SITE_URL}/contact` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/contact` }],
  }),
  component: Contact,
});

const schema = z.object({
  name: z.string().trim().min(2, "Please tell us your name").max(100),
  email: z.string().trim().email("That email doesn't look right").max(255),
  subject: z.string().trim().min(2, "Add a short subject").max(150),
  message: z.string().trim().min(10, "Give us a little more detail").max(2000),
});

type Errors = Partial<Record<keyof z.infer<typeof schema>, string>>;

function Contact() {
  const { role } = Route.useSearch();
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = schema.safeParse({
      name: form.get("name"),
      email: form.get("email"),
      subject: form.get("subject"),
      message: form.get("message"),
    });

    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        next[issue.path[0] as keyof Errors] = issue.message;
      }
      setErrors(next);
      return;
    }

    setErrors({});
    setSending(true);
    const { error } = await supabase.from("contact_submissions").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      message: `${parsed.data.subject}\n\n${parsed.data.message}`,
    });
    setSending(false);

    if (error) {
      toast.error("We couldn't send that. Please try again.");
      return;
    }
    setSent(true);
    toast.success("Message sent — we'll reply within two working days.");
    event.currentTarget.reset();
  }

  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Say Hello"
        intro="Applying, partnering or just curious — this form reaches the interns directly."
      />

      <section className="section-y-first">
        <div className="container-site grid gap-8 lg:grid-cols-[1.3fr_1fr]">
          <form onSubmit={onSubmit} noValidate className="surface-card flex flex-col bg-surface-2 p-6 md:p-8">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" maxLength={100} aria-invalid={errors.name ? true : undefined} className="mt-2 min-h-11" />
                {errors.name && <p className="mt-1.5 text-xs text-destructive">{errors.name}</p>}
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  maxLength={255}
                  aria-invalid={errors.email ? true : undefined}
                  className="mt-2 min-h-11"
                />
                {errors.email && <p className="mt-1.5 text-xs text-destructive">{errors.email}</p>}
              </div>
            </div>
            <div className="mt-5">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" name="subject" maxLength={150} defaultValue={role ? `Application: ${role}` : ""} aria-invalid={errors.subject ? true : undefined} className="mt-2 min-h-11" />
              {errors.subject && (
                <p className="mt-1.5 text-xs text-destructive">{errors.subject}</p>
              )}
            </div>
            <div className="mt-5 flex flex-1 flex-col">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                name="message"
                rows={12}
                maxLength={2000}
                aria-invalid={errors.message ? true : undefined}
                className="mt-2 min-h-64 flex-1 resize-y"
              />
              {errors.message && (
                <p className="mt-1.5 text-xs text-destructive">{errors.message}</p>
              )}
            </div>
            <Button type="submit" size="lg" disabled={sending} className="mt-6 w-full">
              {sending ? "Sending…" : "Send Message"}
            </Button>
            {sent && (
              <p className="mt-4 text-sm text-primary">
                Thanks — your message is with the team. Expect a reply within two working days.
              </p>
            )}
          </form>

          <div className="space-y-6">
            <div className="surface-card hover-glow bg-surface-2 p-6">
              <h2 className="flex items-center gap-2 text-xl">
                <Mail className="size-5 text-primary" />
                Email
              </h2>
              <a
                href={`mailto:${SITE.email}`}
                className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-primary hover:underline"
              >
                {SITE.email}
              </a>
            </div>
            <div className="surface-card hover-glow relative overflow-hidden border-primary/35 bg-surface-2 p-6">
              <div aria-hidden className="absolute inset-y-0 right-0 w-24 bg-primary/8 [clip-path:polygon(55%_0,100%_0,100%_100%,0_100%)]" />
              <h2 className="relative flex items-center gap-2 text-xl">
                <MapPin className="size-5 text-primary" />
                Visit Us
              </h2>
              <address className="relative mt-4 not-italic text-sm leading-7 text-muted-foreground">
                Monseigneur Hopmansstraat 2<br />
                4817 JS Breda<br />
                The Hive, Room: Fe0.032 Frontier Building
              </address>
              <Button asChild variant="secondary" size="sm" className="relative mt-5">
                <a href="https://www.google.com/maps/search/?api=1&query=Monseigneur+Hopmansstraat+2%2C+4817+JS+Breda" target="_blank" rel="noopener noreferrer">
                  View on Map <ExternalLink className="size-4" />
                </a>
              </Button>
            </div>
            <div className="surface-card hover-glow bg-surface-2 p-6">
              <h2 className="flex items-center gap-2 text-xl">
                <MessageSquare className="size-5 text-primary" />
                Discord
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Fastest way to reach us. Join the Discord and open a ticket.
              </p>
              <Button asChild variant="secondary" size="sm" className="mt-4">
                <a href={SITE.discordUrl} target="_blank" rel="noopener noreferrer">
                  Open Discord
                </a>
              </Button>
            </div>
            <div className="surface-card hover-glow bg-surface-2 p-6">
              <h2 className="text-xl">Follow Breda Guardians</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Matches, clips and community nights across our channels.
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {SOCIAL_LINKS.filter((social) => social.platform !== "discord").map((social) => (
                  <li key={social.platform}>
                    <a
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground/85 transition-colors hover:border-primary/60 hover:text-primary"
                    >
                      {social.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </section>
    </>
  );
}
