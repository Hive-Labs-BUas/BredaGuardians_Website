import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";

const TITLE = "Sign In or Create An Account — Breda Guardians";
const DESCRIPTION =
  "Sign in to manage your Breda Guardians membership, or create a free account to join the community.";

type Search = { redirect?: string | undefined };

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): Search => {
    const redirect = search["redirect"];
    return { redirect: typeof redirect === "string" ? redirect : undefined };
  },
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Auth,
});

const credentials = z.object({
  email: z.string().trim().email("Enter a valid email address").max(255),
  password: z.string().min(8, "Use at least 8 characters").max(72),
});

function safePath(value: string | undefined) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/account";
}

function Auth() {
  const { user, isStaff, loading } = useAuth();
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmNotice, setConfirmNotice] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      const storedRedirect = window.sessionStorage.getItem("auth_redirect") ?? undefined;
      window.sessionStorage.removeItem("auth_redirect");
      const fallback = isStaff ? "/admin" : "/account";
      void navigate({ to: safePath(redirect ?? storedRedirect ?? fallback), replace: true });
    }
  }, [loading, user, redirect, navigate, isStaff]);

  async function handleGoogleSignIn() {
    setError(null);
    setBusy(true);
    window.sessionStorage.setItem("auth_redirect", safePath(redirect));

    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
      extraParams: { prompt: "select_account" },
    });

    if (result.redirected) return;
    setBusy(false);
    if (result.error) {
      setError("Google sign-in could not be completed. Please try again.");
      return;
    }
    toast.success("Signed in with Google.");
  }

  async function handle(mode: "signin" | "signup", event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = credentials.safeParse({
      email: form.get("email"),
      password: form.get("password"),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your email and password.");
      return;
    }

    setError(null);
    setBusy(true);

    if (mode === "signup") {
      const displayName = String(form.get("display_name") ?? "").trim();
      const { data, error: signUpError } = await supabase.auth.signUp({
        ...parsed.data,
        options: {
          emailRedirectTo: window.location.origin,
          data: { display_name: displayName || parsed.data.email.split("@")[0] },
        },
      });
      setBusy(false);
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      if (!data.session) {
        setConfirmNotice(true);
        return;
      }
      toast.success("Account created — welcome in.");
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword(parsed.data);
    setBusy(false);
    if (signInError) {
      setError("That email and password combination didn't work.");
      return;
    }
    toast.success("Signed in.");
  }

  return (
    <section className="flex min-h-[85vh] items-center py-16">
      <div className="container-site max-w-md">
        <div className="surface-card bg-surface-2 p-7 md:p-9">
          <div>
            <p className="eyebrow">Members &amp; Staff</p>
            <h1 className="mt-3 text-4xl">Your Account</h1>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to manage your membership, or create an account in seconds. Staff accounts land straight in
            the control room.
          </p>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="mt-7 w-full bg-background text-foreground hover:bg-surface"
            disabled={busy}
            onClick={() => void handleGoogleSignIn()}
          >
            <span
              aria-hidden="true"
              className="grid size-6 place-items-center rounded-full bg-foreground font-sans text-sm font-bold text-background"
            >
              G
            </span>
            Continue with Google
          </Button>

          <div className="my-6 flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs font-semibold uppercase text-muted-foreground">or use email</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <Tabs defaultValue="signin">
            <TabsList className="grid h-auto w-full grid-cols-1 gap-1 bg-surface p-1 min-[420px]:grid-cols-2">
              <TabsTrigger value="signin" className="min-h-11 w-full whitespace-nowrap px-2 text-sm">
                Sign in
              </TabsTrigger>
              <TabsTrigger value="signup" className="min-h-11 w-full whitespace-nowrap px-2 text-sm">
                Create account
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-6">
              <form onSubmit={(e) => void handle("signin", e)} noValidate className="space-y-4">
                <div>
                  <Label htmlFor="si-email">Email</Label>
                  <Input id="si-email" name="email" type="email" className="mt-2 min-h-11" />
                </div>
                <div>
                  <Label htmlFor="si-password">Password</Label>
                  <Input
                    id="si-password"
                    name="password"
                    type="password"
                    className="mt-2 min-h-11"
                  />
                </div>
                <Button type="submit" size="lg" className="w-full" disabled={busy}>
                  {busy ? "Signing in…" : "Sign In"}
                </Button>

              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <form onSubmit={(e) => void handle("signup", e)} noValidate className="space-y-4">
                <div>
                  <Label htmlFor="su-name">Display name</Label>
                  <Input id="su-name" name="display_name" maxLength={60} className="mt-2 min-h-11" />
                </div>
                <div>
                  <Label htmlFor="su-email">Email</Label>
                  <Input id="su-email" name="email" type="email" className="mt-2 min-h-11" />
                </div>
                <div>
                  <Label htmlFor="su-password">Password</Label>
                  <Input
                    id="su-password"
                    name="password"
                    type="password"
                    className="mt-2 min-h-11"
                  />
                  <p className="mt-1.5 text-xs text-muted-foreground">At least 8 characters.</p>
                </div>
                <Button type="submit" size="lg" className="w-full" disabled={busy}>
                  {busy ? "Creating…" : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
          {confirmNotice && (
            <p className="mt-4 text-sm text-primary">
              Check your inbox and confirm your email address to finish signing up.
            </p>
          )}

          <p className="mt-6 text-xs text-muted-foreground">
            Staff and interns use this same sign-in — you'll land in the control room automatically.
          </p>

        </div>
      </div>
    </section>
  );
}
