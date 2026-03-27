import { NextResponse } from 'next/server';

type Finding = {
  title: string;
  explanation: string;
  excerpt?: string;
};

type AnalyzeResponse = {
  score: number; // 0-100
  language: Finding[];
  logic: Finding[];
  context: Finding[];
};

function clampScore(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
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

function mockAnalyze(): AnalyzeResponse {
  return {
    score: 58,
    language: [
      {
        title: 'Manipülatif dil sinyalleri olabilir',
        explanation:
          'Metinde kesinlik artıran/abartılı ifadeler tespit edilirse güven düşebilir. Bu örnek analiz, API anahtarı olmadan çalıştırılan bir “taslak” yanıttır.',
      },
    ],
    logic: [
      {
        title: 'Mantık kontrolü tamamlanamadı (taslak)',
        explanation:
          'Gerçek değerlendirme Gemini çıktısına dayanır. Şu an API anahtarı eklenmediği için örnek kartlar gösterilir.',
      },
    ],
    context: [
      {
        title: 'Bağlamsal doğrulama (taslak)',
        explanation:
          'İddianın kaynağı ve destekleyici kanıtlar analiz edilerek puan etkilenir. Bu yanıt, entegrasyonun ekran tarafını doğrulamak için mock’tur.',
      },
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
- Sadece geçerli JSON döndür.
- Şu şemayı birebir kullan:
{
  "score": 0-100,
  "language": [{"title": string, "explanation": string, "excerpt"?: string}],
  "logic": [{"title": string, "explanation": string, "excerpt"?: string}],
  "context": [{"title": string, "explanation": string, "excerpt"?: string}]
}

Metin:
${text}`;

  const controller = new AbortController();
  const timeoutMs = 10_000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!res.ok) {
      // In production you'd likely log more, but avoid leaking details to client.
      return mockAnalyze();
    }

    const data = await res.json();
    const candidateText =
      data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text ?? '').join('') ??
      '';

    const parsed = tryExtractJson(candidateText);
    if (!parsed) return mockAnalyze();

    const score = clampScore(Number(parsed.score));

    const language = Array.isArray(parsed.language) ? parsed.language : [];
    const logic = Array.isArray(parsed.logic) ? parsed.logic : [];
    const context = Array.isArray(parsed.context) ? parsed.context : [];

    const normalizeFindings = (arr: any[]): Finding[] =>
      arr
        .filter(Boolean)
        .slice(0, 6)
        .map((f) => ({
          title: String(f.title ?? 'Bulguyla ilgili bir detay'),
          explanation: String(
            f.explanation ?? f.explanationText ?? 'Açıklama bilgisi bulunamadı.'
          ),
          excerpt: f.excerpt ? String(f.excerpt) : undefined,
        }));

    return {
      score,
      language: normalizeFindings(language),
      logic: normalizeFindings(logic),
      context: normalizeFindings(context),
    };
  } catch {
    return mockAnalyze();
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text = String(body?.text ?? '');
    const normalized = text.trim().replace(/\s+/g, ' ');

    if (!normalized || normalized.length < 20) {
      return NextResponse.json(
        { message: 'Metin en az 20 karakter olmalı.' },
        { status: 400 }
      );
    }

    // Hard limit to reduce token/cost risk.
    const input = normalized.slice(0, 20_000);

    const result = await analyzeWithGemini(input);
    return NextResponse.json(result, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: 'İstek işlenirken bir hata oluştu.' },
      { status: 500 }
    );
  }
}

