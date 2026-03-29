import type { AnalyzeResponse, Finding, ScoreDetail } from "@/types/analyze";

// === PATTERN DICTIONARIES ===

const SENSATIONAL_WORDS = [
  "şok", "inanılmaz", "kesinlikle", "mutlaka", "son dakika", "bomba",
  "flaş", "dehşet", "korkunç", "müthiş", "skandal", "olay", "gizli",
  "sır", "herkes", "kimse", "asla", "daima", "her zaman", "hiçbir zaman",
  "acil", "resmen", "kıyamet", "felaket", "patlama", "yıkım", "panik",
  "kabus", "infial", "ayaklanma", "şok edici",
];

const CAPS_SENSATIONAL = [
  "KESİNLİKLE", "ASLA", "ŞOK", "MUTLAKA", "BOMBA", "ACİL", "FLAŞ",
];

const ACADEMIC_TONE_WORDS = [
  "hipotez", "değişken", "örneklem", "analiz edildiğinde", "bulgular",
  "sonuç olarak", "metodoloji", "istatistiksel olarak", "kontrol grubu",
  "korelasyon", "anlamlı fark", "p değeri", "güven aralığı",
  "sistematik derleme", "meta-analiz", "öte yandan", "bununla birlikte",
];

const LOGIC_FALLACY_PATTERNS = [
  "dolayısıyla", "bu yüzden", "kanıtlanmıştır", "kesin olarak",
  "tartışmasız", "şüphesiz", "apaçık", "ispatlanmış",
  "herkes biliyor ki", "doğal olarak", "elbette ki",
];

const WEAK_CAUSATION_PATTERNS = [
  /(\w+)\s+(yedi|içti|kullandı|sürdü|taktı).+?(iyileşti|yendi|kurtuldu|geçti|bitti)/i,
  /(\w+)\s+(sayesinde|ile)\s+.*(kanser|hastalık|virüs|ağrı).*(yenildi|bitti|geçti|kurtuldu)/i,
  /sadece\s+\w+\s+(yaparak|yiyerek|içerek).*(kurtul|iyileş|yendi)/i,
];

const STRONG_CAUSATION_SIGNALS = [
  "kontrollü çalışma", "randomize", "çift kör", "plasebo kontrollü",
  "meta-analiz sonuçları", "istatistiksel olarak anlamlı",
  "p < 0.05", "p<0.05", "güven aralığı", "etki büyüklüğü",
  "sistematik derleme", "kanıt düzeyi", "cochrane",
];

const RELIABLE_SOURCE_PATTERNS = [
  "sağlık bakanlığı", "unesco", "who", "tüik", "dünya sağlık örgütü",
  "birleşmiş milletler", "ema", "fda", "cdc", "avrupa birliği",
  "bakanlığı", "üniversitesi", "enstitüsü", "araştırma merkezi",
  "bilim akademisi", "tübitak", "nature", "lancet", "science",
  "new england journal", "british medical journal",
  "iea", "nasa", "eurostat", "oecd", "imf", "dünya bankası",
];

const CONTEXT_SIGNALS = [
  "kaynak:", "araştırma", "üniversite", "rapor", "istatistik", "veri",
  "bilimsel", "çalışma", "yayınla", "dergi", "makale", "doi",
];

const VAGUE_SOURCE_PATTERNS = [
  "bir grup bilim insanı", "whatsapp", "telegram", "internette gördüm",
  "duyduğuma göre", "söylentilere göre", "kulaktan kulağa",
  "bir arkadaşım söyledi", "facebook'ta paylaşıldı", "iddiaya göre",
  "birileri", "bazıları diyor ki", "gizli bilgilere göre",
  "devlet saklıyor", "medya göstermiyor", "gerçeği öğren",
];

// Emotion manipulation patterns
const FEAR_PANIC_PATTERNS = [
  "öleceksiniz", "hepimiz tehlikede", "çocuklarınız tehlikede", "çok geç olmadan",
  "hayatınızdan olabilirsiniz", "salgın yaklaşıyor", "felaket kapıda",
  "panik yapmayın ama", "korkunç gerçek", "dehşet verici", "kabus gibi",
  "yok olacağız", "son şansınız", "kıyamet", "ölümcül tehlike",
  "canınızı kurtarın", "acil durum", "alarm", "tehlike altında",
];

const MIRACLE_PATTERNS = [
  "mucize", "şifa", "kesin çözüm", "garanti tedavi", "tek çare",
  "doktorlar şaşkın", "bilim açıklayamıyor", "inanılmaz iyileşme",
  "sadece bunu yapın", "hemen deneyin", "anında etki", "sırrı ortaya çıktı",
  "gizlenen tedavi", "doğal mucize", "kimsenin bilmediği",
];

// Health misinformation patterns
const HEALTH_DISINFO_PATTERNS = [
  "tüm hastalıkları iyileştir", "tüm hastalıkları tedavi",
  "ilaç firmalarından gizlenen", "ilaç firmaları gizliyor",
  "gizlenen sır", "gizlenen tedavi", "mucizevi kurtuluş",
  "kanser tedavisi bulundu ama", "aşı zehir", "aşılar öldürüyor",
  "big pharma", "doktorlar size söylemiyor", "tıp dünyası saklıyor",
  "her hastalığa çare", "tek ilaç yeter", "tüm kanser türlerini",
  "kimyasal ilaçlara gerek yok", "doğal yollarla tüm hastalıklar",
  "tüm hastalıkları bitiren", "laboratuvardan kaçan virüs",
];

// Conspiracy theory patterns
const CONSPIRACY_PATTERNS = [
  "ilaç firmaları gizliyor", "sansür uygulanıyor", "devlet saklıyor",
  "medya göstermiyor", "gerçeği öğren", "gizli bilgilere göre",
  "dünya düzeni", "yeni dünya düzeni", "illuminati", "derin devlet",
  "halk kandırılıyor", "bize söylenmiyor", "sansürleniyor",
  "uyanın artık", "koyun gibi", "uyanan insanlar biliyor",
  "büyük oyun", "planlandı", "komplo değil gerçek",
  "gizlenen gerçekler", "sızan rapor", "sessiz kalan hükümetler",
  "sızan gizli rapor", "hükümetler saklıyor",
];

// Panic / call-to-action patterns
const PANIC_ACTION_PATTERNS = [
  "hemen stok yapın", "acil yayın", "paylaşın", "hemen paylaş",
  "stok yapın", "karantina geliyor", "bankalar kapanıyor",
  "acil duyuru", "herkes duysun", "yaymadan geçmeyin",
];

// TIME PRESSURE patterns (Zaman Baskısı)
const TIME_PRESSURE_PATTERNS = [
  "12 saat", "24 saat", "48 saat", "72 saat",
  "hemen", "acilen", "derhal", "vakit kaybetmeyin",
  "son şans", "son gün", "yarın çok geç", "zaman daralıyor",
  "bir an önce", "geç kalmayın", "süreniz doluyor",
];

// FAKE SCIENTIFIC TERMS (Bilimsel Safsata / Uydurma terimler)
const FAKE_SCIENCE_PATTERNS = [
  "nöro-düzenleyici", "lityum-x", "x virüsü", "bio-rezonatör",
  "kuantum şifa", "nano-detoks", "meta-hücre", "oksijen-x",
  "gen-blokör", "nöro-frekans", "plazma tedavisi evde",
  "anti-graviton", "süper-antioksidan-x", "karbon-negatif enerji",
  "dna aktivatörü", "hücre yenileyici serum",
];

// NAME TRAP: Trusted institution + discrediting verb in same sentence
const TRUSTED_INSTITUTIONS_FOR_TRAP = [
  "dünya sağlık örgütü", "who", "bakanlık", "sağlık bakanlığı",
  "unesco", "nasa", "tübitak", "fda", "cdc", "ema",
  "birleşmiş milletler", "avrupa birliği",
];
const DISCREDIT_VERBS = [
  "gizliyor", "saklıyor", "sessiz kalıyor", "sızdı", "sızan",
  "örtbas", "yalanlıyor", "engel oluyor", "baskılıyor",
];

// Specific date pattern (spesifik tarih: "2026 Mart ayında", "15.03.2026" etc.)
const SPECIFIC_DATE_REGEX = /(\d{1,2}[.\/]\d{1,2}[.\/]\d{2,4}|\d{4}\s*(yılında|yılı|tarihinde)|\b(ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık)\s+(\d{4}|\d{1,2}\s*,?\s*\d{4})|(\d{1,2})\s+(ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık))/i;
const VAGUE_DATE_PATTERNS = ["geçenlerde", "bir süre önce", "yakın zamanda", "son günlerde"];
const DATE_REGEX = SPECIFIC_DATE_REGEX;
const PLACE_REGEX = /(ankara|istanbul|izmir|türkiye|avrupa|amerika|japonya|çin|almanya|fransa|ingiltere|rusya|hindistan|brezilya)/i;

// === HELPERS ===

function countMatches(text: string, patterns: string[]): string[] {
  const lower = text.toLowerCase();
  return patterns.filter((p) => lower.includes(p.toLowerCase()));
}

function countCapsMatches(text: string, patterns: string[]): string[] {
  return patterns.filter((p) => text.includes(p));
}

function testRegexPatterns(text: string, patterns: RegExp[]): boolean {
  return patterns.some((r) => r.test(text));
}

function randBetween(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function generateFindings(text: string, matched: string[], category: string, extra?: Finding[]): Finding[] {
  const lower = text.toLowerCase();
  const findings: Finding[] = [];

  for (const p of matched) {
    const idx = lower.indexOf(p.toLowerCase());
    if (idx === -1) continue;
    const start = Math.max(0, idx - 25);
    const end = Math.min(text.length, idx + p.length + 25);
    const excerpt = text.slice(start, end);

    if (category === "language") {
      findings.push({
        title: `Manipülatif ifade: "${p}"`,
        explanation: `"${p}" ifadesi duygusal tepki uyandırmaya yönelik sansasyonel bir dil kalıbıdır.`,
        excerpt, severity: 2,
      });
    } else if (category === "logic") {
      findings.push({
        title: `Mantıksal atılma: "${p}"`,
        explanation: `"${p}" ifadesi kanıtsız bir kesinlik ima eder.`,
        excerpt, severity: 2,
      });
    } else if (category === "context-good") {
      findings.push({
        title: `Güvenilir kaynak: "${p}"`,
        explanation: `"${p}" referansı doğrulanabilir bir kaynağa işaret eder.`,
        excerpt, severity: 0,
      });
    } else if (category === "context-bad") {
      findings.push({
        title: `Belirsiz/güvenilmez kaynak: "${p}"`,
        explanation: `"${p}" doğrulanamayan, güvenilmez bir kaynaktır.`,
        excerpt, severity: 2,
      });
    } else if (category === "emotion-fear") {
      findings.push({
        title: `Korku/panik manipülasyonu: "${p}"`,
        explanation: `"${p}" ifadesi korku ve panik uyandırmaya yönelik duygusal manipülasyon içerir.`,
        excerpt, severity: 3,
      });
    } else if (category === "emotion-miracle") {
      findings.push({
        title: `Mucizevi vaat: "${p}"`,
        explanation: `"${p}" bilimsel dayanağı olmayan mucizevi bir kurtuluş vaat eder.`,
        excerpt, severity: 3,
      });
    }
  }

  if (extra) findings.push(...extra);

  if (findings.length === 0) {
    if (category === "language") {
      findings.push({ title: "Dil analizi tamamlandı", explanation: "Belirgin sansasyonel ifade tespit edilmedi.", severity: 0 });
    } else if (category === "logic") {
      findings.push({ title: "Mantık kontrolü tamamlandı", explanation: "Açık bir mantıksal hata tespit edilmedi.", severity: 0 });
    } else if (category === "emotion-fear" || category === "emotion-miracle") {
      findings.push({ title: "Duygu analizi tamamlandı", explanation: "Duygusal manipülasyon tespit edilmedi.", severity: 0 });
    } else {
      findings.push({ title: "Bağlam değerlendirmesi", explanation: "Doğrulanabilir kaynak bulunamadı.", severity: 2 });
    }
  }

  return findings.slice(0, 5);
}

// === MAIN SCORING ENGINE ===

export async function analyzeText(text: string): Promise<AnalyzeResponse> {
  await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));

  const lower = text.toLowerCase();
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const details: ScoreDetail[] = [];

  // --- 1) Language Analysis (Sansasyonel Dil: -10 ile -14 arası per match) ---
  const sensationalMatches = countMatches(text, SENSATIONAL_WORDS);
  const capsMatches = countCapsMatches(text, CAPS_SENSATIONAL);
  const academicMatches = countMatches(text, ACADEMIC_TONE_WORDS);

  // Language penalty with CAP at -30
  let langPenalty = 0;
  const allLangIssues: { label: string; pts: number }[] = [];

  if (sensationalMatches.length > 0) {
    const firstPts = randBetween(10, 14);
    const extraPts = Math.max(0, sensationalMatches.length - 1) * 2;
    const pts = firstPts + extraPts;
    allLangIssues.push({ label: `${sensationalMatches.length} sansasyonel ifade tespit edildi`, pts });
  }
  if (capsMatches.length > 0) {
    const firstPts = randBetween(12, 14);
    const extraPts = Math.max(0, capsMatches.length - 1) * 2;
    const pts = firstPts + extraPts;
    allLangIssues.push({ label: `${capsMatches.length} BÜYÜK HARF sansasyonel ifade`, pts });
  }

  // Highest penalty first, then symbolic -2 for rest — total capped at 30
  allLangIssues.sort((a, b) => b.pts - a.pts);
  for (let i = 0; i < allLangIssues.length; i++) {
    const issue = allLangIssues[i];
    const applicable = i === 0
      ? Math.min(issue.pts, 30 - langPenalty)
      : Math.min(2, 30 - langPenalty);
    if (applicable > 0) {
      langPenalty += applicable;
      details.push({ label: issue.label, points: -applicable });
    }
  }

  // Nötr Dil Kullanımı bonus: +10 ile +15 arası
  let langBonus = 0;
  const noEmotionalAdj = sensationalMatches.length === 0 && capsMatches.length === 0;
  if (noEmotionalAdj && academicMatches.length === 0 && wordCount > 15) {
    const pts = randBetween(10, 15);
    langBonus += pts;
    details.push({ label: "Nötr dil kullanımı tespit edildi", points: pts });
  }
  if (academicMatches.length >= 2) {
    langBonus += 29;
    details.push({ label: `Akademik/nötr dil tespit edildi (${academicMatches.length} ifade)`, points: 29 });
  }

  // --- 2) Emotion Analysis ---
  const fearMatches = countMatches(text, FEAR_PANIC_PATTERNS);
  const miracleMatches = countMatches(text, MIRACLE_PATTERNS);
  const panicActionMatches = countMatches(text, PANIC_ACTION_PATTERNS);

  let emotionPenalty = 0;
  if (fearMatches.length > 0) {
    const pts = Math.min(fearMatches.length * randBetween(15, 20), 40);
    emotionPenalty += pts;
    details.push({ label: `Korku/panik manipülasyonu tespit edildi (${fearMatches.length} ifade)`, points: -pts });
  }
  if (miracleMatches.length > 0) {
    const pts = Math.min(miracleMatches.length * 20, 40);
    emotionPenalty += pts;
    details.push({ label: `Mucizevi vaat tespit edildi (${miracleMatches.length} ifade)`, points: -pts });
  }

  // Panik ve Eyleme Çağrı: -18 ile -22 arası
  let panicActionPenalty = 0;
  if (panicActionMatches.length > 0) {
    const pts = randBetween(18, 22);
    panicActionPenalty = pts;
    details.push({ label: `Panik/eyleme çağrı ifadesi tespit edildi (${panicActionMatches.length} adet)`, points: -pts });
  }

  // --- 2b) Health Disinfo & Conspiracy Detection ---
  const healthDisinfoMatches = countMatches(text, HEALTH_DISINFO_PATTERNS);
  const conspiracyMatches = countMatches(text, CONSPIRACY_PATTERNS);
  const timePressureMatches = countMatches(text, TIME_PRESSURE_PATTERNS);
  const fakeScienceMatches = countMatches(text, FAKE_SCIENCE_PATTERNS);
  const isHealthDisinfo = healthDisinfoMatches.length > 0;
  const isConspiracy = conspiracyMatches.length > 0;
  const isPanicAction = panicActionMatches.length > 0;
  const isFakeScience = fakeScienceMatches.length > 0;

  // --- İSİM TUZAĞI (KRİTİK) ---
  let nameTrap = false;
  const sentences = text.split(/[.!?\n]+/);
  for (const sentence of sentences) {
    const sLower = sentence.toLowerCase();
    const hasInstitution = TRUSTED_INSTITUTIONS_FOR_TRAP.some(inst => sLower.includes(inst));
    const hasDiscredit = DISCREDIT_VERBS.some(verb => sLower.includes(verb));
    if (hasInstitution && hasDiscredit) {
      nameTrap = true;
      break;
    }
  }

  let nameTrapPenalty = 0;
  if (nameTrap) {
    nameTrapPenalty = 1; // flag — score will be forced to 20
    details.push({ label: "🚨 İSİM TUZAĞI: Güvenilir kurum adı + itibarsızlaştırma → skor 20'ye düşürüldü", points: -45 });
  }

  // --- ZAMAN BASKISI (-30 ile -40 arası) ---
  let timePressurePenalty = 0;
  if (timePressureMatches.length > 0) {
    timePressurePenalty = randBetween(30, 40);
    details.push({ label: `⏰ Zaman baskısı ifadesi tespit edildi (${timePressureMatches.length} adet)`, points: -timePressurePenalty });
  }

  // --- BİLİMSEL SAFSATA (Uydurma terimler: -10 puan) ---
  let fakeSciencePenalty = 0;
  if (isFakeScience) {
    fakeSciencePenalty = 10;
    details.push({ label: `🧪 Uydurma bilimsel terim tespit edildi: ${fakeScienceMatches.join(", ")}`, points: -fakeSciencePenalty });
  }

  // KIRMIZI ÇİZGİ: any of these disables logic protection
  const isRedLine = isHealthDisinfo || isConspiracy || isPanicAction || nameTrap;

  let healthDisinfoPenalty = 0;
  if (isHealthDisinfo) {
    const pts = randBetween(28, 32) * healthDisinfoMatches.length;
    healthDisinfoPenalty = Math.min(pts, 64);
    details.push({ label: `🚨 Sağlık dezenformasyonu tespit edildi (${healthDisinfoMatches.length} ifade)`, points: -healthDisinfoPenalty });
  }

  let conspiracyPenalty = 0;
  if (isConspiracy) {
    conspiracyPenalty = randBetween(23, 26);
    details.push({ label: `🕵️ Komplo teorisi ifadesi tespit edildi (${conspiracyMatches.length} adet)`, points: -conspiracyPenalty });
  }

  // --- 3) Context/Source Analysis ---
  const reliableSourceMatches = countMatches(text, RELIABLE_SOURCE_PATTERNS);
  const contextMatches = countMatches(text, CONTEXT_SIGNALS);
  const vagueSourceMatches = countMatches(text, VAGUE_SOURCE_PATTERNS);
  const hasSpecificDate = SPECIFIC_DATE_REGEX.test(text);
  const hasVagueDate = VAGUE_DATE_PATTERNS.some(p => lower.includes(p));
  const hasPlace = PLACE_REGEX.test(lower);

  let contextPenalty = 0;
  let contextBonus = 0;

  if (vagueSourceMatches.length > 0) {
    const pts = Math.min(vagueSourceMatches.length * 28, 56);
    contextPenalty += pts;
    details.push({ label: `Belirsiz/güvenilmez kaynak (${vagueSourceMatches.length} adet)`, points: -pts });
  }

  // Source sensitivity: soften if text uses neutral/academic tone
  if (!hasSpecificDate && !hasPlace && reliableSourceMatches.length === 0) {
    const isNeutralTone = academicMatches.length >= 1 && sensationalMatches.length === 0 && capsMatches.length === 0;
    const pts = isNeutralTone ? 10 : 15;
    contextPenalty += pts;
    details.push({ label: isNeutralTone ? "Kaynak bilgisi eksik (tarafsız dil nedeniyle hafif ceza)" : "Tarih, yer ve kurum bilgisi bulunamadı", points: -pts });
  }

  // Resmi Veri Onayı: +13 ile +17 arası per source
  if (reliableSourceMatches.length > 0) {
    const pts = reliableSourceMatches.length * randBetween(13, 17);
    contextBonus += pts;
    details.push({ label: `Resmi kurum/veri onayı (${reliableSourceMatches.length} adet)`, points: pts });
  }
  contextBonus += contextMatches.length * 3;

  // Tarih ve Yer Netliği: +14 ile +18 arası for specific date
  if (hasSpecificDate) {
    const pts = randBetween(14, 18);
    contextBonus += pts;
    details.push({ label: "Spesifik tarih bilgisi mevcut", points: pts });
  } else if (hasVagueDate) {
    details.push({ label: "Belirsiz tarih ifadesi ('geçenlerde' vb.)", points: -3 });
    contextPenalty += 3;
  }
  if (hasPlace) { contextBonus += 5; details.push({ label: "Yer bilgisi mevcut", points: 5 }); }

  // --- 4) Logic Analysis ---
  const logicFallacyMatches = countMatches(text, LOGIC_FALLACY_PATTERNS);
  const hasWeakCausation = testRegexPatterns(text, WEAK_CAUSATION_PATTERNS);
  const strongCausationMatches = countMatches(text, STRONG_CAUSATION_SIGNALS);

  let logicPenalty = 0;
  let forceMaxScore: number | null = null;
  let forceMinScore: number | null = null;

  if (logicFallacyMatches.length > 0) {
    const pts = logicFallacyMatches.length * 8;
    logicPenalty += pts;
    details.push({ label: `Mantıksal hata kalıbı (${logicFallacyMatches.length} adet)`, points: -pts });
  }

  if (hasWeakCausation) {
    forceMaxScore = 48;
    logicPenalty += 30;
    details.push({ label: "Zayıf sebep-sonuç ilişkisi → skor %49 altına çekildi", points: -30 });
  }

  // Mantıksal Tutarlılık: +30 ile +40 arası
  if (strongCausationMatches.length >= 2) {
    const pts = randBetween(30, 40);
    forceMinScore = 51;
    details.push({ label: "Kuvvetli sebep-sonuç kanıtları → skor %51 üzerinde tutuldu", points: pts });
  }

  // --- 5) Text Quality Signals ---
  let qualityMod = 0;
  if (wordCount < 10) { qualityMod -= 20; details.push({ label: "Çok kısa metin", points: -20 }); }
  else if (wordCount < 25) { qualityMod -= 10; details.push({ label: "Kısa metin", points: -10 }); }
  if (wordCount > 100) { qualityMod += 5; details.push({ label: "Yeterli uzunlukta metin", points: 5 }); }
  if (wordCount > 250) { qualityMod += 5; details.push({ label: "Detaylı ve kapsamlı metin", points: 5 }); }

  const exclamationCount = (text.match(/!/g) || []).length;
  const questionCount = (text.match(/\?/g) || []).length;
  if (exclamationCount >= 3) { qualityMod -= 12; details.push({ label: "Aşırı ünlem kullanımı", points: -12 }); }
  if (questionCount >= 4) { qualityMod -= 7; details.push({ label: "Aşırı soru işareti kullanımı", points: -7 }); }

  const repeatedWordMatch = text.match(/\b(\w{3,})\s+\1(\s+\1)*/gi);
  if (repeatedWordMatch) { qualityMod -= 15; details.push({ label: "Tekrarlanan kelime kalıbı", points: -15 }); }

  const capsRatio = text.replace(/[^A-ZÇĞİÖŞÜ]/g, "").length / Math.max(text.length, 1);
  if (capsRatio > 0.4 && text.length > 20) { qualityMod -= 18; details.push({ label: "Aşırı büyük harf kullanımı", points: -18 }); }

  // Positive: logic ok
  if (!hasWeakCausation && logicFallacyMatches.length === 0) {
    details.push({ label: "Mantıklı bir çıkarım yapılmış", points: 10 });
    qualityMod += 10;
  }

  // --- FINAL SCORE CALCULATION ---
  const baseScore = 65;
  let score = baseScore
    - langPenalty + langBonus
    - emotionPenalty
    - panicActionPenalty
    - healthDisinfoPenalty
    - conspiracyPenalty
    - timePressurePenalty
    - fakeSciencePenalty
    - contextPenalty + contextBonus
    - logicPenalty
    + qualityMod;

  // Clamp to 25-96
  score = Math.max(25, Math.min(96, Math.round(score)));

  // Force constraints
  if (forceMaxScore !== null) score = Math.min(score, forceMaxScore);
  if (forceMinScore !== null && !hasWeakCausation) score = Math.max(score, forceMinScore);

  // === İSİM TUZAĞI: Doğrudan 20'ye düşür ===
  if (nameTrap) {
    score = 20;
  }

  // === KIRMIZI ÇİZGİ: Health disinfo / conspiracy / panic action ===
  if (isRedLine) {
    if (isHealthDisinfo) {
      score = Math.min(score, 30);
      details.push({ label: "🚨 Sağlık dezenformasyonu → skor %30 ile sınırlandırıldı", points: 0 });
    }
    score = Math.max(10, score);
  } else if (!hasWeakCausation) {
    score = Math.max(score, 46);
  }

  // GRİ BÖLGE: dezenformasyon değil ama kanıt eksik → %49-65 bandı
  if (!isRedLine && !hasWeakCausation) {
    const hasNoEvidence = reliableSourceMatches.length === 0 && !hasSpecificDate && contextMatches.length < 2;
    const isNeutral = sensationalMatches.length === 0 && capsMatches.length === 0 && fearMatches.length === 0;
    if (hasNoEvidence && isNeutral && logicFallacyMatches.length === 0) {
      score = Math.max(49, Math.min(65, score));
    }
  }

  // Final dynamic range: 25-96
  score = Math.max(25, Math.min(96, score));

  // --- Risk Label ---
  let riskLabel: string | undefined;
  if (nameTrap) {
    riskLabel = "🚨 İSİM TUZAĞI — %100 YALAN";
  } else if (isFakeScience) {
    riskLabel = "🧪 UYDURMA — Sahte Bilimsel Terim Tespit Edildi";
  } else if (score < 50) {
    riskLabel = "⚠️ Yüksek Dezenformasyon Riski";
  }

  // --- Build Findings ---
  const allLangMatches = [...new Set([...sensationalMatches, ...capsMatches.map(c => c.toLowerCase())])];
  const langExtraFindings: Finding[] = [];
  if (academicMatches.length >= 2) {
    langExtraFindings.push({ title: "Akademik ton tespit edildi", explanation: `${academicMatches.length} akademik ifade bulundu.`, severity: 0 });
  }
  if (noEmotionalAdj && academicMatches.length === 0 && wordCount > 15) {
    langExtraFindings.push({ title: "Nötr dil kullanımı", explanation: "Metin duygusal sıfatlardan arınmış, tarafsız bir dil kullanıyor.", severity: 0 });
  }
  if (capsRatio > 0.4 && text.length > 20) {
    langExtraFindings.push({ title: "Aşırı büyük harf kullanımı", explanation: "Metnin büyük bölümü BÜYÜK HARFLERLE yazılmış.", severity: 2 });
  }
  if (repeatedWordMatch) {
    langExtraFindings.push({ title: "Tekrarlanan kelime kalıbı", explanation: "Aynı kelimenin art arda tekrarı tespit edildi.", severity: 2 });
  }

  const logicExtraFindings: Finding[] = [];
  if (hasWeakCausation) {
    logicExtraFindings.push({ title: "🚨 Sahte nedensellik tespit edildi", explanation: "Bilimsel dayanağı olmayan sebep-sonuç ilişkisi kurulmuş.", severity: 3 });
  }
  if (isHealthDisinfo) {
    logicExtraFindings.push({ title: "🚨 Sağlık dezenformasyonu", explanation: `Bilimsel temeli olmayan medikal iddialar tespit edildi: ${healthDisinfoMatches.join(", ")}`, severity: 3 });
  }
  if (isConspiracy) {
    logicExtraFindings.push({ title: "🕵️ Komplo teorisi tespit edildi", explanation: `Komplo teorisi ifadeleri bulundu: ${conspiracyMatches.join(", ")}`, severity: 3 });
  }
  if (nameTrap) {
    logicExtraFindings.push({ title: "🚨 İSİM TUZAĞI", explanation: "Güvenilir kurum adı, itibarsızlaştırma fiilleriyle aynı cümlede kullanılmış. Bu metin %100 yalandır.", severity: 3 });
  }
  if (isFakeScience) {
    logicExtraFindings.push({ title: "🧪 Uydurma bilimsel terim", explanation: `Gerçek bilimde karşılığı olmayan terimler tespit edildi: ${fakeScienceMatches.join(", ")}`, severity: 3 });
  }
  if (timePressureMatches.length > 0) {
    logicExtraFindings.push({ title: "⏰ Zaman baskısı manipülasyonu", explanation: `Aciliyet hissi yaratmaya yönelik ifadeler: ${timePressureMatches.join(", ")}`, severity: 2 });
  }
  if (strongCausationMatches.length >= 2) {
    logicExtraFindings.push({ title: "✅ Kuvvetli kanıt yapısı", explanation: "Metinde bilimsel yöntem ve istatistiksel kanıt referansları bulundu.", severity: 0 });
  }

  const contextExtraFindings: Finding[] = [];
  if (!hasSpecificDate && !hasPlace && reliableSourceMatches.length === 0) {
    contextExtraFindings.push({ title: "Tarih, yer ve kurum bilgisi yok", explanation: "Doğrulanabilir bağlam eksik.", severity: 2 });
  }
  if (hasSpecificDate) {
    contextExtraFindings.push({ title: "Spesifik tarih tespit edildi", explanation: "İçeriğin doğrulanabilirliğini önemli ölçüde artırır.", severity: 0 });
  }

  const language = generateFindings(text, allLangMatches, "language", langExtraFindings);
  const logic = generateFindings(text, logicFallacyMatches, "logic", logicExtraFindings);

  // Emotion findings
  const emotionFearFindings = generateFindings(text, fearMatches, "emotion-fear", []);
  const emotionMiracleFindings = miracleMatches.length > 0
    ? generateFindings(text, miracleMatches, "emotion-miracle", [])
    : [];
  const panicFindings = panicActionMatches.length > 0
    ? panicActionMatches.map(p => ({
        title: `Panik/eyleme çağrı: "${p}"`,
        explanation: `"${p}" ifadesi acil eylem çağrısı içeriyor.`,
        severity: 3 as const,
      } as Finding))
    : [];
  let emotion = [...emotionFearFindings, ...emotionMiracleFindings, ...panicFindings];
  if (emotion.length === 0 || (emotion.length === 1 && emotion[0].severity === 0 && miracleMatches.length === 0 && fearMatches.length === 0)) {
    emotion = [{ title: "Duygu analizi tamamlandı", explanation: "Duygusal manipülasyon tespit edilmedi.", severity: 0 }];
  }
  emotion = emotion.slice(0, 5);

  // Context findings
  const contextGoodFindings = generateFindings(text, reliableSourceMatches, "context-good", []);
  const contextBadFindings = vagueSourceMatches.length > 0
    ? generateFindings(text, vagueSourceMatches, "context-bad", [])
    : [];
  let context = [...contextBadFindings, ...contextGoodFindings, ...contextExtraFindings];
  if (context.length === 0) {
    context = [{ title: "Bağlam değerlendirmesi", explanation: "Doğrulanabilir kaynak bulunamadı.", severity: 2 }];
  }
  context = context.slice(0, 5);

  return { score, language, logic, context, emotion, details, riskLabel };
}
