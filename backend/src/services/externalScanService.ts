import { ExternalScanStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { mapScoreToRisk } from "./scoreMappingService";
import { fetchExternalCandidateSources } from "./external/freeSourceClients";

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
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

type ChunkInfo = {
  text: string;
  tokens: Set<string>;
};

function splitSentences(text: string) {
  return text
    .split(/(?<=[.!?])\s+|\n+/g)
    .map((line) => line.trim())
    .filter((line) => line.length >= 20);
}

function buildChunkInfos(extractedText: string): ChunkInfo[] {
  const sentences = splitSentences(extractedText);
  const chunks: ChunkInfo[] = [];
  let currentParts: string[] = [];
  let currentWordCount = 0;

  for (const sentence of sentences) {
    const wordCount = sentence.split(/\s+/g).filter(Boolean).length;
    if (currentWordCount > 0 && currentWordCount + wordCount > 70) {
      const chunkText = currentParts.join(" ").trim();
      const tokens = new Set(tokenize(chunkText));
      if (tokens.size > 0) {
        chunks.push({ text: chunkText, tokens });
      }
      currentParts = [];
      currentWordCount = 0;
      if (chunks.length >= 120) break;
    }
    currentParts.push(sentence);
    currentWordCount += wordCount;
  }

  if (currentParts.length > 0 && chunks.length < 120) {
    const chunkText = currentParts.join(" ").trim();
    const tokens = new Set(tokenize(chunkText));
    if (tokens.size > 0) {
      chunks.push({ text: chunkText, tokens });
    }
  }

  if (chunks.length === 0) {
    const fallback = extractedText.slice(0, 500);
    const tokens = new Set(tokenize(fallback));
    if (tokens.size > 0) {
      chunks.push({ text: fallback, tokens });
    }
  }

  return chunks;
}

function calculateOverlap(currentTokens: Set<string>, candidateTokens: Set<string>) {
  const current = currentTokens;
  const candidate = candidateTokens;

  if (current.size === 0 || candidate.size === 0) {
    return { similarity: 0, matchedWords: 0 };
  }

  let intersection = 0;
  for (const token of current) {
    if (candidate.has(token)) {
      intersection += 1;
    }
  }

  const union = current.size + candidate.size - intersection;
  const similarity = union === 0 ? 0 : (intersection / union) * 100;
  return {
    similarity: clampScore(similarity),
    matchedWords: intersection
  };
}

function bestSourceSnippet(sourceText: string, referenceTokens: Set<string>) {
  const sentences = splitSentences(sourceText);
  if (sentences.length === 0) return sourceText.slice(0, 360);

  let best = "";
  let bestScore = 0;
  for (const sentence of sentences) {
    const sentenceTokens = new Set(tokenize(sentence));
    const overlap = calculateOverlap(referenceTokens, sentenceTokens);
    if (overlap.similarity > bestScore) {
      bestScore = overlap.similarity;
      best = sentence;
    }
  }
  return (best || sourceText).slice(0, 360);
}

function scoreCandidateAgainstChunks(chunkInfos: ChunkInfo[], sourceText: string) {
  const sourceTokens = new Set(tokenize(sourceText));
  if (sourceTokens.size === 0 || chunkInfos.length === 0) {
    return {
      similarity: 0,
      matchedWords: 0,
      bestChunk: "",
      sourceSnippet: sourceText.slice(0, 360)
    };
  }

  let bestSimilarity = 0;
  let bestMatchedWords = 0;
  let bestChunk = chunkInfos[0];
  for (const chunk of chunkInfos) {
    const overlap = calculateOverlap(chunk.tokens, sourceTokens);
    if (
      overlap.similarity > bestSimilarity ||
      (overlap.similarity === bestSimilarity && overlap.matchedWords > bestMatchedWords)
    ) {
      bestSimilarity = overlap.similarity;
      bestMatchedWords = overlap.matchedWords;
      bestChunk = chunk;
    }
  }

  return {
    similarity: bestSimilarity,
    matchedWords: bestMatchedWords,
    bestChunk: bestChunk.text.slice(0, 360),
    sourceSnippet: bestSourceSnippet(sourceText, bestChunk.tokens)
  };
}

function toPrismaJson(payload: Prisma.JsonValue): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (payload === null) {
    return Prisma.JsonNull;
  }
  return payload as Prisma.InputJsonValue;
}

export async function queueExternalScanIfEnabled(input: {
  submissionId: string;
  cleanedText: string;
  extractedText: string;
}) {
  if (!env.ENABLE_EXTERNAL_SCAN) {
    return null;
  }

  const externalScan = await prisma.externalScan.upsert({
    where: { submissionId: input.submissionId },
    update: {
      provider: "open-free-sources",
      providerScanId: input.submissionId,
      status: ExternalScanStatus.QUEUED,
      rawPayload: Prisma.JsonNull,
      errorMessage: null,
      completedAt: null
    },
    create: {
      submissionId: input.submissionId,
      provider: "open-free-sources",
      providerScanId: input.submissionId,
      status: ExternalScanStatus.QUEUED
    }
  });

  await prisma.externalSourceMatch.deleteMany({
    where: { externalScanId: externalScan.id }
  });

  // Fire-and-forget local aggregation over free/open APIs.
  void (async () => {
    try {
      await prisma.externalScan.update({
        where: { id: externalScan.id },
        data: {
          status: ExternalScanStatus.SUBMITTED
        }
      });

      const chunkInfos = buildChunkInfos(input.extractedText);
      const externalFetch = await fetchExternalCandidateSources(input.cleanedText);
      const allProvidersErrored =
        externalFetch.diagnostics.length > 0 &&
        externalFetch.diagnostics.every((item) => item.status === "error");
      if (allProvidersErrored) {
        throw new Error("All free-source providers failed during external scan");
      }

      const scoredMatches = externalFetch.sources
        .map((source) => {
          const comparison = scoreCandidateAgainstChunks(chunkInfos, source.text);
          return {
            sourceType: source.provider,
            title: source.title,
            url: source.url ?? null,
            similarity: comparison.similarity,
            matchedWords: comparison.matchedWords,
            snippet: comparison.bestChunk || null,
            sourceSnippet: comparison.sourceSnippet || null,
            metadata: source as Prisma.InputJsonValue
          };
        })
        .sort((a, b) => b.similarity - a.similarity || b.matchedWords - a.matchedWords);

      let rankedMatches = scoredMatches
        .filter((item) => item.similarity >= 4 || item.matchedWords >= 8)
        .slice(0, 20);

      if (rankedMatches.length === 0) {
        rankedMatches = scoredMatches.filter((item) => item.matchedWords >= 4).slice(0, 8);
      }

      const externalScore = rankedMatches.length > 0 ? rankedMatches[0].similarity : 0;
      const externalMapped = mapScoreToRisk(externalScore);

      await prisma.$transaction(async (tx) => {
        await tx.externalSourceMatch.deleteMany({
          where: { externalScanId: externalScan.id }
        });

        if (rankedMatches.length > 0) {
          await tx.externalSourceMatch.createMany({
            data: rankedMatches.map((item) => ({
              externalScanId: externalScan.id,
              sourceType: item.sourceType,
              title: item.title,
              url: item.url,
              matchedWords: item.matchedWords,
              similarity: item.similarity,
              snippet: item.snippet,
              sourceSnippet: item.sourceSnippet,
              metadata: item.metadata
            }))
          });
        }

        const current = await tx.result.findUnique({
          where: { submissionId: input.submissionId },
          select: { similarityScore: true }
        });

        const effectiveScore = Math.max(current?.similarityScore ?? 0, externalScore);
        const effectiveMapped = mapScoreToRisk(effectiveScore);

        await tx.result.update({
          where: { submissionId: input.submissionId },
          data: {
            similarityScore: effectiveMapped.similarityScore,
            colorIndicator: effectiveMapped.colorIndicator,
            riskLevel: effectiveMapped.riskLevel
          }
        });

        await tx.externalScan.update({
          where: { id: externalScan.id },
          data: {
            status: ExternalScanStatus.COMPLETED,
            rawPayload: toPrismaJson({
              provider: "open-free-sources",
              queryBasedScan: true,
              query: externalFetch.query,
              candidateCount: externalFetch.sources.length,
              providerDiagnostics: externalFetch.diagnostics,
              strongMatchCount: rankedMatches.length,
              matches: rankedMatches.map((item) => ({
                sourceType: item.sourceType,
                title: item.title,
                url: item.url,
                similarity: item.similarity,
                matchedWords: item.matchedWords
              })),
              externalMapped
            }),
            completedAt: new Date(),
            errorMessage:
              rankedMatches.length === 0
                ? "Scan completed, but no strong external scholarly matches were found."
                : null
          }
        });
      });
    } catch (error) {
      await prisma.externalScan.update({
        where: { id: externalScan.id },
        data: {
          status: ExternalScanStatus.FAILED,
          errorMessage: error instanceof Error ? error.message : "External scan submission failed"
        }
      });
    }
  })();

  return externalScan;
}
