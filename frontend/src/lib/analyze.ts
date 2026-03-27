export type Finding = {
  title: string;
  explanation: string;
  excerpt?: string;
  severity?: number; // 0-3 (0: bilgi, 3: yüksek risk)
};

export type AnalyzeResponse = {
  score: number; // 0-100
  language: Finding[];
  logic: Finding[];
  context: Finding[];
};

export function clampScore(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}

export function toSeverity(n: unknown) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 1;
  return Math.min(3, Math.max(0, Math.round(v)));
}

export function normalizeFindings(arr: any[]): Finding[] {
  return arr
    .filter(Boolean)
    .slice(0, 6)
    .map((f) => ({
      title: String(f.title ?? 'Bulguyla ilgili bir detay'),
      explanation: String(f.explanation ?? f.explanationText ?? 'Açıklama bilgisi bulunamadı.'),
      excerpt: f.excerpt ? String(f.excerpt) : undefined,
      severity: f.severity === undefined ? undefined : toSeverity(f.severity),
    }));
}

export function computeScore(input: { language: Finding[]; logic: Finding[]; context: Finding[] }) {
  // Weighted risk model. Higher severity => higher penalty => lower score.
  const weights = { language: 0.25, logic: 0.45, context: 0.3 };

  const bucketRisk = (items: Finding[]) => {
    if (!items.length) return 0;
    const severities = items.map((f) => toSeverity(f.severity ?? 1));
    // Normalize to 0..1 (average severity / 3)
    const avg = severities.reduce((a, b) => a + b, 0) / severities.length;
    // Add small factor for many findings (caps at +0.15)
    const countFactor = Math.min(0.15, Math.max(0, (items.length - 2) * 0.03));
    return Math.min(1, avg / 3 + countFactor);
  };

  const languageRisk = bucketRisk(input.language);
  const logicRisk = bucketRisk(input.logic);
  const contextRisk = bucketRisk(input.context);

  const totalRisk =
    languageRisk * weights.language + logicRisk * weights.logic + contextRisk * weights.context;

  const raw = 100 * (1 - totalRisk);
  return clampScore(raw);
}

export function tryExtractJson(text: string): any | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  // Sometimes models wrap JSON in ```json ... ```
  const fenceMatch = trimmed.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fenceMatch?.[1]) {
    try {
      return JSON.parse(fenceMatch[1]);
    } catch {
      // fall through
    }
  }

  // Or they might just return raw JSON.
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

