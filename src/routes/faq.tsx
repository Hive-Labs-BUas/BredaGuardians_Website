import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";

import { PageHeader } from "@/components/site/Bits";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { useFaqs } from "@/lib/queries";
import { getPublicFaqs } from "@/lib/public-content.functions";
import { SITE_URL } from "@/lib/site-data";

const TITLE = "FAQ — Joining, Membership & The Hive | Breda Guardians";
const DESCRIPTION =
  "Answers about joining Breda Guardians, membership tiers, tryouts, the Hive and our community rules.";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:url", content: `${SITE_URL}/faq` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/faq` }],
  }),
  loader: () => getPublicFaqs(),
  component: Faq,
});

const slugify = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function Faq() {
  const { data } = useFaqs(Route.useLoaderData());
  const isLoading = false;

  const grouped = useMemo(() => {
    const map = new Map<string, typeof data>();
    for (const item of data ?? []) {
      const list = map.get(item.category) ?? [];
      map.set(item.category, [...(list ?? []), item] as typeof data);
    }
    return Array.from(map.entries());
  }, [data]);

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: (data ?? []).map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <>
      {(data ?? []).length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      )}
      <PageHeader
        eyebrow="FAQ"
        title="Questions, Answered"
        intro="The things people ask us most, grouped by topic."
      />

      <section className="section-y-first">
        <div className="container-site">
          {isLoading ? (
            <div className="space-y-4">
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-14 rounded-lg bg-surface" />
              ))}
            </div>
          ) : (
            <div className="space-y-16">
              <nav aria-label="FAQ topics" className="flex flex-wrap gap-2.5">
                {grouped.map(([category]) => (
                  <a
                    key={category}
                    href={`#${slugify(category)}`}
                    className="inline-flex min-h-11 items-center rounded-full border border-primary/30 bg-surface-2/70 px-5 text-sm font-semibold uppercase tracking-wider text-foreground/85 transition-colors hover:border-primary hover:text-primary"
                  >
                    {category}
                  </a>
                ))}
              </nav>

              {grouped.map(([category, items]) => (
                <div key={category} id={slugify(category)} className="scroll-mt-28">
                  <h2 className="text-3xl text-primary">{category}</h2>
                  <Accordion type="single" collapsible className="mt-6 flex flex-col gap-3">
                    {(items ?? []).map((item) => (
                      <AccordionItem
                        key={item.id}
                        value={item.id}
                        className="panel-gradient hover-glow h-fit overflow-hidden px-5 data-[state=open]:border-primary/45"
                      >
                        <AccordionTrigger className="min-h-16 text-left text-lg hover:text-primary hover:no-underline md:text-xl [&>svg]:size-5 [&>svg]:text-primary">
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent className="pb-5 text-base leading-relaxed text-muted-foreground">
                          {item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
