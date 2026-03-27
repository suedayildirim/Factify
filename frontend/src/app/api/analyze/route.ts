import { NextResponse } from 'next/server';

type Finding = {
  title: string;
  explanation: string;
  excerpt?: string;
  severity?: number; // 0-3 (0: bilgi, 3: yüksek risk)
};

type AnalyzeResponse = {
  score: number; // 0-100
  language: Finding[];
  logic: Finding[];
  context: Finding[];
};

type ErrorResponse = { message: string };

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;
const ipBuckets = new Map<string, number[]>();

function clampScore(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}

function getClientIp(req: Request) {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]?.trim() || 'unknown';
  return req.headers.get('x-real-ip')?.trim() || 'unknown';
}

function checkRateLimit(ip: string) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const prev = ipBuckets.get(ip) ?? [];
  const recent = prev.filter((t) => t >= windowStart);
  if (recent.length >= RATE_LIMIT_MAX) return false;
  recent.push(now);
  ipBuckets.set(ip, recent);
  return true;
}

function tryExtractJson(text: string): any | null {
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

function toSeverity(n: unknown) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 1;
  return Math.min(3, Math.max(0, Math.round(v)));
}

function normalizeFindings(arr: any[]): Finding[] {
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

function computeScore(input: { language: Finding[]; logic: Finding[]; context: Finding[] }) {
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

  // Map risk to score (0..100). Keep a small floor so UI isn't always 0.
  const raw = 100 * (1 - totalRisk);
  return clampScore(raw);
}

function mockAnalyze(): AnalyzeResponse {
  const language = [
    {
      title: 'Manipülatif dil sinyalleri olabilir',
      explanation:
        'Metinde kesinlik artıran/abartılı ifadeler tespit edilirse güven düşebilir. Bu örnek analiz, API anahtarı olmadan çalıştırılan bir “taslak” yanıttır.',
      severity: 2,
    },
  ];
  const logic = [
    {
      title: 'Mantık kontrolü tamamlanamadı (taslak)',
      explanation:
        'Gerçek değerlendirme Gemini çıktısına dayanır. Şu an API anahtarı eklenmediği için örnek kartlar gösterilir.',
      severity: 1,
    },
  ];
  const context = [
    {
      title: 'Bağlamsal doğrulama (taslak)',
      explanation:
        'İddianın kaynağı ve destekleyici kanıtlar analiz edilerek puan etkilenir. Bu yanıt, entegrasyonun ekran tarafını doğrulamak için mock’tur.',
      severity: 1,
    },
  ];

  return {
    score: computeScore({ language, logic, context }),
    language: [
      ...language,
    ],
    logic: [
      ...logic,
    ],
    context: [
      ...context,
    ],
  };
}

async function analyzeWithGemini(text: string): Promise<AnalyzeResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return mockAnalyze();

  // Gemini REST request format: POST .../models/{model}:generateContent
  const model = 'gemini-1.5-pro';

  const prompt = `Aşağıdaki metni Factify kriterlerine göre değerlendir:

Dil analizi:
- Duygu sömürüsü / abartı
- Clickbait veya tıklamaya teşvik eden manipülatif dil

Mantık kontrolü:
- Safsata (logical fallacies)
- Tutarsız önerme / çelişki

Bağlamsal doğrulama:
- Genel güvenilirlik standartlarıyla uyum
- Kanıt/ kaynak tutarlılığı (metinde belirgin değilse bunu belirt)

ÇIKTI ŞARTI:
- Sadece geçerli JSON döndür. Markdown, açıklama, kod bloğu, ekstra alan YAZMA.
- Şu şemayı birebir kullan (alan adlarını değiştirme):
{
  "language": [{"title": string, "explanation": string, "excerpt"?: string, "severity": 0|1|2|3}],
  "logic": [{"title": string, "explanation": string, "excerpt"?: string, "severity": 0|1|2|3}],
  "context": [{"title": string, "explanation": string, "excerpt"?: string, "severity": 0|1|2|3}]
}
- excerpt: Metinden 10-140 karakterlik KISA bir alıntı (bulgu metne dayanıyorsa).
- severity: 0=bilgi, 1=düşük risk, 2=orta risk, 3=yüksek risk.
- Her kategori için 0-6 bulgu üret. Uydurma alıntı verme; emin değilsen excerpt alanını boş bırak.

Metin:
${text}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2,
      // keep output small for speed/cost; findings are capped anyway
      maxOutputTokens: 768,
    },
  });

  let attempts = 0;
  for (const timeoutMs of [6500, 4500]) {
    attempts += 1;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body,
      });

      if (!res.ok) {
        // Retry once for transient errors (rate limits / server errors).
        if (attempts < 2 && (res.status === 429 || res.status >= 500)) {
          await new Promise((r) => setTimeout(r, 250));
          continue;
        }
        return mockAnalyze();
      }

      const data = await res.json();
      const candidateText =
        data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text ?? '').join('') ?? '';

      const parsed = tryExtractJson(candidateText);
      if (!parsed) return mockAnalyze();

      const languageRaw = Array.isArray(parsed.language) ? parsed.language : [];
      const logicRaw = Array.isArray(parsed.logic) ? parsed.logic : [];
      const contextRaw = Array.isArray(parsed.context) ? parsed.context : [];

      const language = normalizeFindings(languageRaw);
      const logic = normalizeFindings(logicRaw);
      const context = normalizeFindings(contextRaw);

      const score = computeScore({ language, logic, context });

      return { score, language, logic, context };
    } catch {
      // Retry once on network/timeout errors.
      if (attempts < 2) {
        await new Promise((r) => setTimeout(r, 250));
        continue;
      }
      return mockAnalyze();
    } finally {
      clearTimeout(timeout);
    }
  }

  return mockAnalyze();
}

export async function POST(req: Request) {
  const startedAt = Date.now();
  try {
    const ip = getClientIp(req);
    if (!checkRateLimit(ip)) {
      return NextResponse.json<ErrorResponse>(
        { message: 'Çok fazla istek gönderildi. Lütfen biraz bekleyip tekrar dene.' },
        {
          status: 429,
          headers: { 'x-factify-rate-limit': `${RATE_LIMIT_MAX}/${RATE_LIMIT_WINDOW_MS}` },
        }
      );
    }

    const contentLength = Number(req.headers.get('content-length') ?? '0');
    if (Number.isFinite(contentLength) && contentLength > 250_000) {
      return NextResponse.json<ErrorResponse>(
        { message: 'İstek çok büyük. Lütfen daha kısa bir metin gönder.' },
        { status: 413 }
      );
    }

    const body = await req.json();
    const text = String(body?.text ?? '');
    const normalized = text.trim().replace(/\s+/g, ' ');

    if (!normalized || normalized.length < 20) {
      return NextResponse.json<ErrorResponse>(
        { message: 'Metin en az 20 karakter olmalı.' },
        { status: 400 }
      );
    }

    // Hard limit to reduce token/cost risk.
    const input = normalized.slice(0, 20_000);

    const result = await analyzeWithGemini(input);
    // PII-free operational log (no raw text, no IP).
    console.log('[factify] analyze', {
      ms: Date.now() - startedAt,
      inputChars: input.length,
      usedMock: !process.env.GEMINI_API_KEY,
    });
    return NextResponse.json(result, {
      status: 200,
      headers: { 'x-factify-ms': String(Date.now() - startedAt) },
    });
  } catch {
    return NextResponse.json<ErrorResponse>(
      { message: 'İstek işlenirken bir hata oluştu.' },
      { status: 500 }
    );
  }
}

