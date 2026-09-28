import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageImagesEditor } from "@/components/admin/PageImagesEditor";
import { SocialsEditor } from "@/components/admin/SocialsEditor";
import { SiteSettingsEditor } from "@/components/admin/SiteSettingsEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { AdminOnly } from "@/components/admin/AdminOnly";
import { supabase } from "@/integrations/supabase/client";
import type { AdminData } from "@/lib/admin-data";

export function SiteContent({ data }: { data: AdminData | undefined }) {
  const queryClient = useQueryClient();
  const [faq, setFaq] = useState({ category: "General", question: "", answer: "" });

  async function refresh(keys: string[]): Promise<void> {
    await queryClient.invalidateQueries({ queryKey: ["admin-data"] });
    for (const key of keys) await queryClient.invalidateQueries({ queryKey: [key] });
  }

  async function remove(id: string): Promise<void> {
    if (!window.confirm("Delete this question?")) return;
    const { error } = await supabase.from("faqs").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refresh(["faqs"]);
  }

  return (
    <Tabs defaultValue="faqs" className="space-y-6">
      <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2 bg-surface p-2">
        <TabsTrigger value="faqs" className="min-h-11 px-5 text-sm">FAQ</TabsTrigger>
        <TabsTrigger value="pictures" className="min-h-11 px-5 text-sm">About page pictures</TabsTrigger>
        <TabsTrigger value="socials" className="min-h-11 px-5 text-sm">Socials</TabsTrigger>
        <TabsTrigger value="minecraft" className="min-h-11 px-5 text-sm">Minecraft</TabsTrigger>
      </TabsList>

      <TabsContent value="pictures">
        <PageImagesEditor exclude={["minecraft"]} />
      </TabsContent>

      <TabsContent value="socials">
        <SocialsEditor />
      </TabsContent>

      <TabsContent value="minecraft">
        <SiteSettingsEditor
          keys={["minecraft_server"]}
          intro="This address shows in the Minecraft section at the bottom of the About page, including the copy button."
        />
        <div className="mt-5">
          <PageImagesEditor
            only={["minecraft"]}
            intro="This picture shows next to the Minecraft server block on the About page. Leave it empty to use the standard picture."
          />
        </div>
      </TabsContent>

      <TabsContent value="faqs" className="space-y-5">
        <div className="surface-card grid gap-4 bg-surface-2 p-5 md:grid-cols-[12rem_1fr]">
          <div className="space-y-2">
            <Label htmlFor="faq-cat">Topic</Label>
            <Input id="faq-cat" value={faq.category} onChange={(e) => setFaq({ ...faq, category: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="faq-q">Question</Label>
            <Input id="faq-q" value={faq.question} onChange={(e) => setFaq({ ...faq, question: e.target.value })} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="faq-a">Answer</Label>
            <Textarea id="faq-a" rows={5} value={faq.answer} onChange={(e) => setFaq({ ...faq, answer: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Button
              onClick={async () => {
                if (!faq.question.trim() || !faq.answer.trim()) {
                  toast.error("Add a question and an answer.");
                  return;
                }
                const { error } = await supabase.from("faqs").insert({
                  category: faq.category.trim() || "General",
                  question: faq.question.trim(),
                  answer: faq.answer.trim(),
                  sort_order: (data?.faqs.length ?? 0) + 1,
                });
                if (error) {
                  toast.error(error.message);
                  return;
                }
                toast.success("Question added");
                setFaq({ category: faq.category, question: "", answer: "" });
                await refresh(["faqs"]);
              }}
            >
              <Plus className="size-4" /> Add question
            </Button>
          </div>
        </div>

        <ul className="space-y-3">
          {(data?.faqs ?? []).map((row) => (
            <li key={row.id} className="surface-card space-y-3 bg-surface-2 p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="eyebrow">{row.category}</p>
                <AdminOnly>
                  <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => void remove(row.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </AdminOnly>
              </div>
              <Input
                defaultValue={row.question}
                onBlur={(e) => void supabase.from("faqs").update({ question: e.target.value }).eq("id", row.id)}
              />
              <Textarea
                defaultValue={row.answer}
                rows={5}
                onBlur={(e) => void supabase.from("faqs").update({ answer: e.target.value }).eq("id", row.id)}
              />
            </li>
          ))}
        </ul>
      </TabsContent>
    </Tabs>
  );
}
