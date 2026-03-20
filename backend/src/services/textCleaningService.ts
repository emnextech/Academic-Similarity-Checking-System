const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "that",
  "with",
  "this",
  "from",
  "are",
  "was",
  "were",
  "have",
  "has",
  "had",
  "your",
  "you",
  "our",
  "their",
  "but",
  "not",
  "into",
  "than",
  "then",
  "there",
  "here",
  "what",
  "when",
  "where"
]);

export function cleanText(rawText: string) {
  const normalized = rawText
    .toLowerCase()
    .replace(/\r/g, " ")
    .replace(/\n/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) return "";

  const tokens = normalized.split(" ").filter((word) => word.length > 2 && !STOPWORDS.has(word));
  return tokens.join(" ");
}
