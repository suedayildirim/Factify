'use client';

import { useEffect, useMemo, useState } from 'react';

type Finding = { title: string; explanation: string; excerpt?: string; severity?: number };
type AnalyzeResponse = {
  score: number;
  language: Finding[];
  logic: Finding[];
  context: Finding[];
};

function severityMeta(severity?: number) {
  const s = typeof severity === 'number' ? Math.min(3, Math.max(0, Math.round(severity))) : 1;
  if (s >= 3) return { label: 'Yüksek risk', impact: 'Skoru belirgin düşürür', cls: 'bg-rose-100 text-slate-900 ring-rose-300' };
  if (s === 2) return { label: 'Orta risk', impact: 'Skoru düşürür', cls: 'bg-amber-100 text-slate-900 ring-amber-300' };
  if (s === 1) return { label: 'Düşük risk', impact: 'Skoru biraz etkiler', cls: 'bg-sky-100 text-slate-900 ring-sky-300' };
  return { label: 'Bilgi', impact: 'Skoru etkilemeyebilir', cls: 'bg-slate-200 text-slate-900 ring-slate-300' };
}

function ScoreColor({ score }: { score: number }) {
  const colorClass =
    score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-lime-500' : score >= 35 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className="flex items-center gap-3">
      <div className="text-sm font-semibold tracking-tight text-slate-900">Güven Skoru</div>
      <div className="text-sm text-slate-900">{score}%</div>
      <div className="ml-auto h-2 w-40 rounded-full bg-slate-800">
        <div className={`h-2 rounded-full ${colorClass}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function FindingsList({ items, category }: { items: Finding[]; category: 'language' | 'logic' | 'context' }) {
  if (!items.length) {
    return <div className="text-sm text-slate-800">Uygun bulgu bulunamadı.</div>;
  }
  return (
    <div className="space-y-3">
      {items.map((f, idx) => (
        <div key={`${f.title}-${idx}`} className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-900">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-semibold text-slate-900">{f.title}</div>
            <span
              className={`ml-auto inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${severityMeta(
                f.severity
              ).cls}`}
            >
              {severityMeta(f.severity).label}
            </span>
          </div>

          {f.excerpt ? (
            <div className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-700 ring-1 ring-slate-200">
              “{f.excerpt}”
            </div>
          ) : null}

          <div className="mt-2 text-sm text-slate-800">{f.explanation}</div>

          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-700 ring-1 ring-slate-200">
              <div className="font-semibold text-slate-900">Skora etkisi</div>
              <div className="mt-0.5 text-slate-700">{severityMeta(f.severity).impact}</div>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-700 ring-1 ring-slate-200">
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
      if (typeof window === 'undefined') return [];
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setHistory(loadHistory());
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
        const currentHistory = loadHistory();
        const merged = [item, ...currentHistory].slice(0, 8);
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
        <h1 className="text-3xl font-bold text-slate-900">Factify</h1>
        <p className="mt-1 text-slate-900">
          Şüpheli bir haber/iddia metnini yapıştır, Factify dil, mantık ve bağlam uyumunu
          analiz ederek sana bir <span className="font-semibold text-slate-900">Güven Skoru</span>{' '}
          sunar.
        </p>
      </header>

      <section>
        <label className="mb-2 block text-sm font-semibold text-slate-900">Metin Girişi</label>
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Örneğin: 'Bu iddia şu sebeple kesinlikle doğrudur...' şeklinde şüpheli metni buraya yapıştır."
            className="min-h-40 w-full resize-none rounded-3xl bg-white p-3 text-sm text-slate-900 placeholder:text-slate-500 outline-none ring-1 ring-slate-300 focus:ring-slate-500"
            minLength={20}
            maxLength={10_000}
          />

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={onAnalyze}
              disabled={!canAnalyze}
              className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50 hover:bg-slate-800 active:scale-95"
            >
              {loading ? 'Analiz ediliyor...' : 'Analiz Başlat'}
            </button>
            {text.trim().length > 0 && text.trim().length < 20 ? (
              <div className="text-xs text-slate-600 italic">En az 20 karakter gir.</div>
            ) : null}
            {error ? <div className="ml-auto text-xs text-rose-700 font-medium">{error}</div> : null}
          </div>
        </div>
      </section>

      {result ? (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <ScoreColor score={score} />

          <div className="mt-5 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h2 className="mb-3 border-b border-slate-200 pb-1 text-sm font-semibold text-slate-900">
                Dil Analizi
              </h2>
              <FindingsList items={result.language} category="language" />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h2 className="mb-3 border-b border-slate-200 pb-1 text-sm font-semibold text-slate-900">
                Mantık Kontrolü
              </h2>
              <FindingsList items={result.logic} category="logic" />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h2 className="mb-3 border-b border-slate-200 pb-1 text-sm font-semibold text-slate-900">
                Bağlamsal Doğrulama
              </h2>
              <FindingsList items={result.context} category="context" />
            </div>
          </div>
        </section>
      ) : null}

      {history.length ? (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-900">Geçmiş Analizler</h2>
            <button
              className="ml-auto rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-900 ring-1 ring-slate-300 hover:bg-slate-200"
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
                className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:bg-slate-100"
                onClick={() => setText(h.text)}
              >
                <div className="flex items-center gap-2">
                  <div className="text-xs font-semibold text-slate-900">Skor: %{h.score}</div>
                  <div className="text-[10px] text-slate-500">
                    {new Date(h.at).toLocaleString('tr-TR')}
                  </div>
                </div>
                <div className="mt-1 line-clamp-1 text-xs text-slate-600">{h.preview}</div>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {loading ? (
        <div className="mt-4 animate-pulse rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-slate-900" />
            <div className="text-sm text-slate-900">
              Metin analiz ediliyor... i7 gücü devrede!
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
