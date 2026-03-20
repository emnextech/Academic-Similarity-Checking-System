type SubmissionComparable = {
  id: string;
  cleanedText: string;
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

export function compareAgainstStoredSubmissions(
  currentText: string,
  storedSubmissions: SubmissionComparable[]
) {
  const currentSet = buildShingles(currentText, 3);
  let bestScore = 0;
  let matchedSubmissionId: string | undefined;

  for (const submission of storedSubmissions) {
    const candidateSet = buildShingles(submission.cleanedText, 3);
    const score = jaccardSimilarity(currentSet, candidateSet);
    if (score > bestScore) {
      bestScore = score;
      matchedSubmissionId = submission.id;
    }
  }

  return {
    scorePercentage: Math.round(bestScore * 100),
    matchedSubmissionId
  };
}
