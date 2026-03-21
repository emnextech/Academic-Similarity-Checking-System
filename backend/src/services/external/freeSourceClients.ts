import axios from "axios";
import { env } from "../../config/env";

export type ExternalCandidateSource = {
  provider: "openalex" | "crossref" | "semanticscholar";
  title: string;
  url?: string;
  text: string;
};

export type ExternalFetchDiagnostic = {
  provider: "openalex" | "crossref" | "semanticscholar";
  status: "ok" | "error";
  count: number;
  errorMessage?: string;
};

export type ExternalFetchResult = {
  query: string;
  sources: ExternalCandidateSource[];
  diagnostics: ExternalFetchDiagnostic[];
};

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function stripHtml(value: string) {
  return normalizeWhitespace(value.replace(/<[^>]*>/g, " "));
}

function buildQuery(cleanedText: string) {
  const frequencies = new Map<string, number>();
  for (const token of cleanedText.split(" ")) {
    if (!token || token.length < 5) continue;
    frequencies.set(token, (frequencies.get(token) ?? 0) + 1);
  }

  return [...frequencies.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([term]) => term)
    .join(" ");
}

function invertOpenAlexAbstract(index: Record<string, number[]> | null | undefined) {
  if (!index) return "";

  let maxPosition = 0;
  for (const positions of Object.values(index)) {
    for (const pos of positions) {
      if (pos > maxPosition) maxPosition = pos;
    }
  }

  const words = new Array<string>(maxPosition + 1).fill("");
  for (const [word, positions] of Object.entries(index)) {
    for (const pos of positions) {
      words[pos] = word;
    }
  }

  return normalizeWhitespace(words.join(" "));
}

async function fetchOpenAlex(query: string): Promise<ExternalCandidateSource[]> {
  const params: Record<string, string | number> = {
    search: query,
    "per-page": 10
  };
  if (env.OPENALEX_API_KEY) {
    params.api_key = env.OPENALEX_API_KEY;
  }

  const response = await axios.get("https://api.openalex.org/works", {
    params,
    timeout: env.EXTERNAL_SCAN_TIMEOUT_MS
  });

  const results = response.data?.results;
  if (!Array.isArray(results)) return [];

  const out: ExternalCandidateSource[] = [];
  for (const item of results as Record<string, unknown>[]) {
    const title = normalizeWhitespace(String(item.display_name ?? ""));
    const abstract = invertOpenAlexAbstract(
      (item.abstract_inverted_index as Record<string, number[]> | undefined) ?? null
    );
    const text = normalizeWhitespace(`${title} ${abstract}`);
    if (!title || !text) continue;

    const doi = item.doi ? String(item.doi) : undefined;
    const id = item.id ? String(item.id) : undefined;
    out.push({
      provider: "openalex",
      title,
      url: doi ?? id,
      text
    });
  }
  return out;
}

async function fetchCrossref(query: string): Promise<ExternalCandidateSource[]> {
  const response = await axios.get("https://api.crossref.org/works", {
    params: {
      "query.bibliographic": query,
      rows: 10
    },
    timeout: env.EXTERNAL_SCAN_TIMEOUT_MS,
    headers: {
      "User-Agent": "AcademicSimilarityChecker/1.0 (mailto:admin@university.edu)"
    }
  });

  const items = response.data?.message?.items;
  if (!Array.isArray(items)) return [];

  const out: ExternalCandidateSource[] = [];
  for (const item of items as Record<string, unknown>[]) {
    const titleArray = Array.isArray(item.title) ? item.title : [];
    const title = normalizeWhitespace(String(titleArray[0] ?? ""));
    const abstractRaw = typeof item.abstract === "string" ? item.abstract : "";
    const abstract = stripHtml(abstractRaw);
    const text = normalizeWhitespace(`${title} ${abstract}`);
    if (!title || !text) continue;

    const doi = typeof item.DOI === "string" ? `https://doi.org/${item.DOI}` : undefined;
    out.push({
      provider: "crossref",
      title,
      url: doi,
      text
    });
  }
  return out;
}

async function fetchSemanticScholar(query: string): Promise<ExternalCandidateSource[]> {
  const response = await axios.get("https://api.semanticscholar.org/graph/v1/paper/search", {
    params: {
      query,
      limit: 10,
      fields: "title,abstract,url"
    },
    timeout: env.EXTERNAL_SCAN_TIMEOUT_MS,
    headers: env.SEMANTIC_SCHOLAR_API_KEY
      ? {
          "x-api-key": env.SEMANTIC_SCHOLAR_API_KEY
        }
      : undefined
  });

  const items = response.data?.data;
  if (!Array.isArray(items)) return [];

  const out: ExternalCandidateSource[] = [];
  for (const item of items as Record<string, unknown>[]) {
    const title = normalizeWhitespace(String(item.title ?? ""));
    const abstract = normalizeWhitespace(String(item.abstract ?? ""));
    const text = normalizeWhitespace(`${title} ${abstract}`);
    if (!title || !text) continue;

    out.push({
      provider: "semanticscholar",
      title,
      url: typeof item.url === "string" ? item.url : undefined,
      text
    });
  }
  return out;
}

export async function fetchExternalCandidateSources(cleanedText: string) {
  const query = buildQuery(cleanedText);
  if (!query) {
    return {
      query,
      sources: [],
      diagnostics: []
    } satisfies ExternalFetchResult;
  }

  const providerTasks = [
    { provider: "openalex" as const, task: fetchOpenAlex(query) },
    { provider: "crossref" as const, task: fetchCrossref(query) },
    { provider: "semanticscholar" as const, task: fetchSemanticScholar(query) }
  ];

  const settled = await Promise.allSettled(providerTasks.map((item) => item.task));
  const merged: ExternalCandidateSource[] = [];
  const diagnostics: ExternalFetchDiagnostic[] = [];
  for (let i = 0; i < settled.length; i += 1) {
    const provider = providerTasks[i].provider;
    const taskResult = settled[i];
    if (taskResult.status === "fulfilled") {
      merged.push(...taskResult.value);
      diagnostics.push({
        provider,
        status: "ok",
        count: taskResult.value.length
      });
    } else {
      diagnostics.push({
        provider,
        status: "error",
        count: 0,
        errorMessage: taskResult.reason instanceof Error ? taskResult.reason.message : String(taskResult.reason)
      });
    }
  }

  const dedup = new Map<string, ExternalCandidateSource>();
  for (const source of merged) {
    const key = `${source.provider}::${source.url ?? source.title.toLowerCase()}`;
    if (!dedup.has(key)) {
      dedup.set(key, source);
    }
  }

  return {
    query,
    sources: [...dedup.values()].slice(0, 40),
    diagnostics
  } satisfies ExternalFetchResult;
}
