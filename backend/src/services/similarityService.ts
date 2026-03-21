type SubmissionComparable = {
  id: string;
  cleanedText: string;
  extractedText: string;
};

export type MatchedPassage = {
  currentSnippet: string;
  matchedSnippet: string;
  overlapScore: number;
  commonTerms: string[];
};

function buildShingles(text: string, size = 3) {
  const tokens = text.split(" ").filter(Boolean);
  if (tokens.length < size) {
    return new Set(tokens);
  }

  const shingles = new Set<string>();
  for (let i = 0; i <= tokens.length - size; i += 1) {
    shingles.add(tokens.slice(i, i + size).join(" "));
  }
  return shingles;
}

function jaccardSimilarity(a: Set<string>, b: Set<string>) {
  if (a.size === 0 || b.size === 0) return 0;

  let intersectionCount = 0;
  for (const item of a) {
    if (b.has(item)) {
      intersectionCount += 1;
    }
  }

  const unionCount = a.size + b.size - intersectionCount;
  return unionCount === 0 ? 0 : intersectionCount / unionCount;
}

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter((token) => token.length > 2);
}

function splitIntoSentences(text: string) {
  return text
    .split(/(?<=[.!?])\s+|\n+/g)
    .map((line) => line.trim())
    .filter((line) => line.length >= 30);
}

function getMatchedPassages(currentText: string, matchedText: string): MatchedPassage[] {
  const currentSentences = splitIntoSentences(currentText).slice(0, 220);
  const matchedSentences = splitIntoSentences(matchedText).slice(0, 220);
  const results: MatchedPassage[] = [];

  for (const currentSentence of currentSentences) {
    const currentTokens = new Set(tokenize(currentSentence));
    if (currentTokens.size < 5) continue;

    let bestCandidate: MatchedPassage | null = null;
    for (const matchedSentence of matchedSentences) {
      const matchedTokens = new Set(tokenize(matchedSentence));
      if (matchedTokens.size < 5) continue;

      const overlap = jaccardSimilarity(currentTokens, matchedTokens);
      if (overlap < 0.34) continue;

      const commonTerms = [...currentTokens].filter((term) => matchedTokens.has(term)).slice(0, 10);
      const candidate: MatchedPassage = {
        currentSnippet: currentSentence,
        matchedSnippet: matchedSentence,
        overlapScore: Math.round(overlap * 100),
        commonTerms
      };

      if (!bestCandidate || candidate.overlapScore > bestCandidate.overlapScore) {
        bestCandidate = candidate;
      }
    }

    if (bestCandidate) {
      results.push(bestCandidate);
    }
  }

  return results.sort((a, b) => b.overlapScore - a.overlapScore).slice(0, 8);
}

export function compareAgainstStoredSubmissions(
  current: { cleanedText: string; extractedText: string },
  storedSubmissions: SubmissionComparable[]
) {
  const currentSet = buildShingles(current.cleanedText, 3);
  let bestScore = 0;
  let matchedSubmission: SubmissionComparable | undefined;

  for (const submission of storedSubmissions) {
    const candidateSet = buildShingles(submission.cleanedText, 3);
    const score = jaccardSimilarity(currentSet, candidateSet);
    if (score > bestScore) {
      bestScore = score;
      matchedSubmission = submission;
    }
  }

  const matchedPassages =
    matchedSubmission && bestScore > 0
      ? getMatchedPassages(current.extractedText, matchedSubmission.extractedText)
      : [];

  return {
    scorePercentage: Math.round(bestScore * 100),
    matchedSubmissionId: matchedSubmission?.id,
    matchedPassages
  };
}
