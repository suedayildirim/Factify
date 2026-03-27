'use client';

import { useMemo, useState } from 'react';

type Finding = { title: string; explanation: string; excerpt?: string; severity?: number };
type AnalyzeResponse = {
  score: number;
  language: Finding[];
  logic: Finding[];
  context: Finding[];
};

function severityMeta(severity?: number) {
  const s = typeof severity === 'number' ? Math.min(3, Math.max(0, Math.round(severity))) : 1;
  if (s >= 3) return { label: 'Yüksek risk', impact: 'Skoru belirgin düşürür', cls: 'bg-rose-500/15 text-rose-200 ring-rose-500/30' };
  if (s === 2) return { label: 'Orta risk', impact: 'Skoru düşürür', cls: 'bg-amber-500/15 text-amber-200 ring-amber-500/30' };
  if (s === 1) return { label: 'Düşük risk', impact: 'Skoru biraz etkiler', cls: 'bg-sky-500/15 text-sky-200 ring-sky-500/30' };
  return { label: 'Bilgi', impact: 'Skoru etkilemeyebilir', cls: 'bg-slate-500/15 text-slate-200 ring-slate-500/30' };
}

function ScoreColor({ score }: { score: number }) {
  const colorClass =
    score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-lime-500' : score >= 35 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className="flex items-center gap-3">
      <div className="text-sm font-semibold tracking-tight text-white">Güven Skoru</div>
      <div className="text-sm text-white">{score}%</div>
      <div className="ml-auto h-2 w-40 rounded-full bg-slate-800">
        <div className={`h-2 rounded-full ${colorClass}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function FindingsList({ items, category }: { items: Finding[]; category: 'language' | 'logic' | 'context' }) {
  if (!items.length) {
    return <div className="text-sm text-white/70">Uygun bulgu bulunamadı.</div>;
  }
  return (
    <div className="space-y-3">
      {items.map((f, idx) => (
        <div key={`${f.title}-${idx}`} className="rounded-2xl border border-white/15 bg-white p-4 text-slate-900">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-semibold">{f.title}</div>
            <span
              className={`ml-auto inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${severityMeta(
                f.severity
              ).cls}`}
            >
              {severityMeta(f.severity).label}
            </span>
          </div>

          {f.excerpt ? (
            <div className="mt-2 rounded-xl bg-slate-950/5 px-3 py-2 text-xs text-slate-700 ring-1 ring-slate-200">
              “{f.excerpt}”
            </div>
          ) : null}

          <div className="mt-2 text-sm text-slate-800">{f.explanation}</div>

          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <div className="rounded-xl bg-slate-950/5 px-3 py-2 text-xs text-slate-700 ring-1 ring-slate-200">
              <div className="font-semibold text-slate-900">Skora etkisi</div>
              <div className="mt-0.5 text-slate-700">{severityMeta(f.severity).impact}</div>
            </div>
            <div className="rounded-xl bg-slate-950/5 px-3 py-2 text-xs text-slate-700 ring-1 ring-slate-200">
              <div className="font-semibold text-slate-900">Ne yapabilirsin?</div>
              <div className="mt-0.5 text-slate-700">
                {category === 'language'
                  ? 'Aşırı kesinlik/abartı içeren ifadeleri nötrleştir; iddiayı somut veriyle destekle.'
                  : category === 'logic'
                    ? 'Sonuç ile gerekçe arasındaki bağı kontrol et; genellemeleri ve “ya hep ya hiç” ifadelerini ara.'
                    : 'Kaynak/kanıt var mı bak; tarih, yer, birincil kaynak gibi doğrulanabilir detayları kontrol et.'}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [history, setHistory] = useState<{ at: number; score: number; preview: string; text: string }[]>([]);

  const canAnalyze = useMemo(() => text.trim().length >= 20 && !loading, [text, loading]);

  function loadHistory() {
    try {
      const raw = localStorage.getItem('factify.history');
      const parsed = raw ? (JSON.parse(raw) as any[]) : [];
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter(Boolean)
        .slice(0, 8)
        .map((x) => ({
          at: Number(x.at) || Date.now(),
          score: Number(x.score) || 0,
          preview: String(x.preview || ''),
          text: String(x.text || ''),
        }));
    } catch {
      return [];
    }
  }

  // lazy init after first render (client only)
  useMemo(() => {
    if (typeof window === 'undefined') return null;
    setHistory(loadHistory());
    return null;
  }, []);

  async function onAnalyze() {
    setError(null);
    setResult(null);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);

    setLoading(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.message ?? 'Analiz sırasında hata oluştu.');
        return;
      }

      const next = data as AnalyzeResponse;
      setResult(next);

      if (typeof window !== 'undefined') {
        const item = {
          at: Date.now(),
          score: next.score ?? 0,
          preview: text.trim().slice(0, 90),
          text,
        };
        const merged = [item, ...loadHistory()].slice(0, 8);
        localStorage.setItem('factify.history', JSON.stringify(merged));
        setHistory(merged);
      }
    } catch {
      setError('İstek zaman aşımına uğradı ya da bağlantı kesildi.');
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }

  const score = result?.score ?? 0;

  return (
    <main className="mx-auto max-w-3xl p-6">
      <header className="mb-5">
        <h1 className="text-3xl font-bold text-white">Factify</h1>
        <p className="mt-1 text-white">
          Şüpheli bir haber/iddia metnini yapıştır, Factify dil, mantık ve bağlam uyumunu
          analiz ederek sana bir <span className="font-semibold text-white">Güven Skoru</span>{' '}
          sunar.
        </p>
      </header>

      <section className="rounded-3xl border border-white bg-white p-5">
        <label className="mb-2 block text-sm font-semibold text-slate-900">Metin Girişi</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Örneğin: 'Bu iddia şu sebeple kesinlikle doğrudur...' şeklinde şüpheli metni buraya yapıştır."
          className="min-h-40 w-full resize-none rounded-3xl bg-[#06162b] p-3 text-sm text-white placeholder:text-white/60 outline-none ring-2 ring-white/70 focus:ring-white"
          minLength={20}
          maxLength={10_000}
        />

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={onAnalyze}
            disabled={!canAnalyze}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 hover:bg-indigo-500"
          >
            {loading ? 'Analiz ediliyor...' : 'Analiz Başlat'}
          </button>
          {text.trim().length > 0 && text.trim().length < 20 ? (
            <div className="text-xs text-slate-700">En az 20 karakter gir.</div>
          ) : null}
          {error ? <div className="ml-auto text-xs text-rose-700">{error}</div> : null}
        </div>
      </section>

      {result ? (
        <section className="mt-6 rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur">
          <ScoreColor score={score} />

          <div className="mt-5 grid gap-4 md:grid-cols-1">
            <div>
              <h2 className="mb-3 text-sm font-semibold text-white">Dil Analizi</h2>
              <FindingsList items={result.language} category="language" />
            </div>
            <div>
              <h2 className="mb-3 mt-2 text-sm font-semibold text-white">Mantık Kontrolü</h2>
              <FindingsList items={result.logic} category="logic" />
            </div>
            <div>
              <h2 className="mb-3 mt-2 text-sm font-semibold text-white">Bağlamsal Doğrulama</h2>
              <FindingsList items={result.context} category="context" />
            </div>
          </div>
        </section>
      ) : null}

      {history.length ? (
        <section className="mt-6 rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-white">Geçmiş</h2>
            <button
              className="ml-auto rounded-md bg-black/20 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/10 hover:bg-black/30"
              onClick={() => {
                localStorage.removeItem('factify.history');
                setHistory([]);
              }}
            >
              Temizle
            </button>
          </div>
          <div className="mt-3 grid gap-2">
            {history.map((h) => (
              <button
                key={h.at}
                className="rounded-xl border border-white/10 bg-black/10 p-3 text-left hover:bg-black/20"
                onClick={() => setText(h.text)}
              >
                <div className="flex items-center gap-2">
                  <div className="text-xs font-semibold text-white">Skor: {h.score}%</div>
                  <div className="text-xs text-white/50">
                    {new Date(h.at).toLocaleString('tr-TR')}
                  </div>
                </div>
                <div className="mt-1 line-clamp-2 text-xs text-white/80">{h.preview}</div>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {loading ? (
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/20 p-4">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 animate-pulse rounded-full bg-indigo-400" />
            <div className="text-sm text-slate-200">
              Metin analiz ediliyor... (hedef: {'<'} 5 saniye)
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

