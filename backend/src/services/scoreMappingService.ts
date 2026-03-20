export type SimilarityRiskResult = {
  similarityScore: number;
  colorIndicator: "grey" | "green" | "yellow" | "orange" | "red";
  riskLevel:
    | "Minimal Similarity"
    | "Low Similarity"
    | "Moderate Similarity"
    | "High Similarity"
    | "Critical Similarity";
};

export function mapScoreToRisk(score: number): SimilarityRiskResult {
  const similarityScore = Math.max(0, Math.min(100, Math.round(score)));

  if (similarityScore <= 9) {
    return { similarityScore, colorIndicator: "grey", riskLevel: "Minimal Similarity" };
  }
  if (similarityScore <= 24) {
    return { similarityScore, colorIndicator: "green", riskLevel: "Low Similarity" };
  }
  if (similarityScore <= 39) {
    return { similarityScore, colorIndicator: "yellow", riskLevel: "Moderate Similarity" };
  }
  if (similarityScore <= 59) {
    return { similarityScore, colorIndicator: "orange", riskLevel: "High Similarity" };
  }

  return { similarityScore, colorIndicator: "red", riskLevel: "Critical Similarity" };
}
