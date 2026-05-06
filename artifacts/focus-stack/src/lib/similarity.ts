const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'my',
  'this', 'that', 'is', 'it', 'be', 'as', 'do', 'so',
]);

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
}

function tokens(text: string): string[] {
  return normalize(text).split(/\s+/).filter(t => t.length > 1 && !STOP_WORDS.has(t));
}

function bigrams(text: string): Set<string> {
  const s = normalize(text).replace(/\s+/g, '');
  const result = new Set<string>();
  for (let i = 0; i < s.length - 1; i++) result.add(s.slice(i, i + 2));
  return result;
}

function jaccardSet<T>(a: Set<T>, b: Set<T>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let shared = 0;
  a.forEach(v => { if (b.has(v)) shared++; });
  return shared / (a.size + b.size - shared);
}

export function similarityScore(a: string, b: string): number {
  const tokA = new Set(tokens(a));
  const tokB = new Set(tokens(b));
  const biA = bigrams(a);
  const biB = bigrams(b);

  const tokenScore = jaccardSet(tokA, tokB);
  const bigramScore = jaccardSet(biA, biB);

  return 0.55 * tokenScore + 0.45 * bigramScore;
}

export const SIMILARITY_THRESHOLD = 0.42;

export interface SimilarMatch {
  id: string;
  title: string;
  score: number;
}

export function findSimilar(
  newTitle: string,
  existing: Array<{ id: string; title: string; status?: string }>,
  threshold = SIMILARITY_THRESHOLD,
): SimilarMatch | null {
  if (newTitle.trim().length < 4) return null;

  let best: SimilarMatch | null = null;
  for (const item of existing) {
    if (item.status === 'completed' || item.status === 'dropped') continue;
    const score = similarityScore(newTitle, item.title);
    if (score >= threshold && (!best || score > best.score)) {
      best = { id: item.id, title: item.title, score };
    }
  }
  return best;
}
