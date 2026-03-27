import { NextResponse } from 'next/server';

import { computeScore, normalizeFindings, type AnalyzeResponse, type Finding, tryExtractJson } from '@/lib/analyze';

type ErrorResponse = { message: string };

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;
const MAX_INPUT_CHARS = 20_000;
const ipBuckets = new Map<string, number[]>();

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

function mockAnalyze(): AnalyzeResponse {
  return fallbackAnalyzeFromText(
    'Bu örnek metindir. Kaynak belirtilmeden kesinlik içeren bir iddia anlatımı vardır.',
    'Gemini anahtarı bulunamadı'
  );
}

function cleanText(input: string) {
  return input.trim().replace(/\s+/g, ' ');
}

function normalizeModelFindings(arr: Finding[]) {
  return arr.map((f) => ({
    title: String(f.title ?? '').trim().slice(0, 120) || 'Bulguyla ilgili bir detay',
    explanation:
      String(f.explanation ?? '')
        .trim()
        .slice(0, 420) || 'Açıklama bilgisi bulunamadı.',
    excerpt: f.excerpt
      ? String(f.excerpt)
          .trim()
          .slice(0, 160)
      : undefined,
    severity: f.severity,
  }));
}

function countMatches(text: string, list: string[]) {
  const lower = text.toLowerCase();
  return list.reduce((sum, word) => sum + (lower.includes(word) ? 1 : 0), 0);
}

function fallbackAnalyzeFromText(text: string, reason?: string): AnalyzeResponse {
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/).filter(Boolean);
  const length = lower.length;
  const avgWordLen = words.length ? words.join('').length / words.length : 0;

  const sensationalCount = countMatches(lower, [
    'şok',
    'inanılmaz',
    'kesin',
    'asla',
    'mutlaka',
    'kanıtlandı',
    'herkes',
    'hiç kimse',
  ]);
  const uncertaintyCount = countMatches(lower, [
    'belki',
    'sanırım',
    'duydum',
    'iddia',
    'muhtemelen',
    'olabilir',
  ]);
  const sourceCount = countMatches(lower, [
    'kaynak',
    'rapor',
    'araştırma',
    'veri',
    'istatistik',
    'makale',
    'resmi',
  ]);
  const logicFlagCount = countMatches(lower, ['çünkü', 'bu yüzden', 'dolayısıyla', 'demek ki']);
  const hasNumber = /\d/.test(lower);

  const languageSeverity = Math.min(3, Math.max(0, sensationalCount > 2 ? 3 : sensationalCount > 0 ? 2 : 1));
  const logicSeverity = Math.min(
    3,
    Math.max(0, logicFlagCount === 0 && words.length > 20 ? 2 : uncertaintyCount > 2 ? 2 : 1)
  );
  const contextSeverity = Math.min(
    3,
    Math.max(0, sourceCount === 0 ? 3 : sourceCount === 1 ? 2 : hasNumber ? 1 : 2)
  );

  const language: Finding[] = [
    {
      title: 'Dil sinyali değerlendirmesi',
      explanation:
        sensationalCount > 0
          ? `Metinde ${sensationalCount} adet abartı/kesinlik ifadesi tespit edildi. Bu tarz dil güven skorunu düşürür.`
          : 'Metinde belirgin manipülatif dil sinyali düşük görünüyor.',
      excerpt: words.slice(0, 18).join(' '),
      severity: languageSeverity,
    },
  ];
  const logic: Finding[] = [
    {
      title: 'Mantık akışı kontrolü',
      explanation:
        logicFlagCount === 0
          ? 'Neden-sonuç bağları zayıf veya açık değil; çıkarımların dayanağı netleşmedi.'
          : 'Neden-sonuç bağları mevcut ancak genelleme/tutarlılık riski sürüyor.',
      severity: logicSeverity,
    },
  ];
  const context: Finding[] = [
    {
      title: 'Bağlam ve kaynak kontrolü',
      explanation:
        sourceCount === 0
          ? 'Kaynak/kanıt ifadesi görülmediği için bağlamsal güven düşük değerlendirildi.'
          : `Kaynak sinyali (${sourceCount}) bulundu, fakat doğrulanabilirlik seviyesi orta riskte.`,
      severity: contextSeverity,
    },
  ];

  if (length < 60 || avgWordLen < 3) {
    context.push({
      title: 'Belirsiz metin uyarısı',
      explanation: 'Metin kısa veya fazla belirsiz olduğu için güven puanı konservatif hesaplandı.',
      severity: 2,
    });
  }

  if (reason) {
    logic.push({
      title: 'Fallback analizi devrede',
      explanation: `Model çıktısı güvenli parse edilemedi (${reason}). Skor metin sinyallerine göre hesaplandı.`,
      severity: 1,
    });
  }

  const score = computeScore({ language, logic, context });
  return { score, language, logic, context };
}

async function analyzeWithGemini(text: string): Promise<AnalyzeResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return fallbackAnalyzeFromText(text, 'API anahtarı yok');

  // Gemini REST request format: POST .../models/{model}:generateContent
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-pro';

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
- Her bulgu kısa ve açık olsun; title max 120, explanation max 420 karakter olsun.
- JSON dışında hiçbir metin döndürme.

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
        return fallbackAnalyzeFromText(text, `Gemini HTTP ${res.status}`);
      }

      const data = await res.json();
      const candidateText =
        data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text ?? '').join('') ?? '';

      const parsed = tryExtractJson(candidateText);
      if (!parsed) return fallbackAnalyzeFromText(text, 'JSON parse başarısız');

      const languageRaw = Array.isArray(parsed.language) ? parsed.language : [];
      const logicRaw = Array.isArray(parsed.logic) ? parsed.logic : [];
      const contextRaw = Array.isArray(parsed.context) ? parsed.context : [];

      const language = normalizeModelFindings(normalizeFindings(languageRaw));
      const logic = normalizeModelFindings(normalizeFindings(logicRaw));
      const context = normalizeModelFindings(normalizeFindings(contextRaw));

      const score = computeScore({ language, logic, context });

      return { score, language, logic, context };
    } catch {
      // Retry once on network/timeout errors.
      if (attempts < 2) {
        await new Promise((r) => setTimeout(r, 250));
        continue;
      }
      return fallbackAnalyzeFromText(text, 'Ağ/zaman aşımı hatası');
    } finally {
      clearTimeout(timeout);
    }
  }

  return fallbackAnalyzeFromText(text, 'Bilinmeyen fallback');
}

export async function POST(req: Request) {
  const startedAt = Date.now();
  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('application/json')) {
      return NextResponse.json<ErrorResponse>(
        { message: 'İçerik tipi application/json olmalı.' },
        { status: 415 }
      );
    }

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

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json<ErrorResponse>(
        { message: 'Geçersiz JSON formatı.' },
        { status: 400 }
      );
    }

    const text = String(body?.text ?? '');
    const normalized = cleanText(text);

    if (!normalized || normalized.length < 20) {
      return NextResponse.json<ErrorResponse>(
        { message: 'Metin en az 20 karakter olmalı.' },
        { status: 400 }
      );
    }

    // Hard limit to reduce token/cost risk.
    const input = normalized.slice(0, MAX_INPUT_CHARS);

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

