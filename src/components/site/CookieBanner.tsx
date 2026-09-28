import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";

const KEY = "bg-cookie-choice";

export function CookieBanner() {
  const t = useT();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(KEY)) setVisible(true);
  }, []);

  function choose(choice: "accepted" | "rejected") {
    localStorage.setItem(KEY, choice);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-3 bottom-4 z-40 animate-fade-up lg:inset-x-auto lg:bottom-6 lg:left-6 lg:max-w-md">
      <div className="surface-card p-5 shadow-surface">
        <h2 className="text-xl">{t("Cookies")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("We use functional cookies to keep you logged in and anonymous analytics to understand what people read. Nothing is sold or shared.")}{" "}
          <Link to="/privacy" className="font-semibold text-primary underline-offset-4 hover:underline">
            {t("Privacy Policy")}
          </Link>
        </p>
        <div className="mt-4 flex gap-2">
          <Button onClick={() => choose("accepted")} className="flex-1">
            {t("Accept")}
          </Button>
          <Button variant="secondary" onClick={() => choose("rejected")} className="flex-1">
            {t("Reject")}
          </Button>
        </div>
      </div>
    </div>
  );
}
