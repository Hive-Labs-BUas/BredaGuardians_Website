/** Small helpers shared by the research archive and study pages. */

export function readingMinutes(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function formatFileSize(bytes: number | null | undefined): string | null {
  if (!bytes || bytes < 1) return null;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
}

/**
 * Pulls up to three takeaway sentences straight out of a study's own summary —
 * preferring sentences that carry numbers or findings language. Nothing is invented.
 */
export function takeaways(summary: string, limit = 3) {
  const sentences = summary
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 45);

  if (sentences.length < 2) return [];

  const scored = sentences
    .map((sentence, index) => {
      let score = 0;
      if (/\d/.test(sentence)) score += 3;
      if (/%|percent/i.test(sentence)) score += 2;
      if (/(found|shows?|showed|reported|suggests?|increase|decrease|improv|prefer|most|majority)/i.test(sentence))
        score += 2;
      if (index > 0) score += 1;
      return { sentence, score, index };
    })
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .sort((a, b) => a.index - b.index);

  return scored.map((item) => item.sentence);
}
