import type { Finding } from "@/types/analyze";

interface FindingsCardProps {
  title: string;
  icon: string;
  items: Finding[];
  category: "language" | "logic" | "context";
}

function severityClasses(severity?: number) {
  const s = typeof severity === "number" ? Math.min(3, Math.max(0, Math.round(severity))) : 1;
  if (s >= 3) return { label: "Yüksek risk", bg: "bg-[hsl(var(--severity-high-bg))]", text: "text-[hsl(var(--severity-high-text))]", ring: "ring-[hsl(var(--severity-high-ring))]" };
  if (s === 2) return { label: "Orta risk", bg: "bg-[hsl(var(--severity-mid-bg))]", text: "text-[hsl(var(--severity-mid-text))]", ring: "ring-[hsl(var(--severity-mid-ring))]" };
  if (s === 1) return { label: "Düşük risk", bg: "bg-[hsl(var(--severity-low-bg))]", text: "text-[hsl(var(--severity-low-text))]", ring: "ring-[hsl(var(--severity-low-ring))]" };
  return { label: "Bilgi", bg: "bg-[hsl(var(--severity-info-bg))]", text: "text-[hsl(var(--severity-info-text))]", ring: "ring-[hsl(var(--severity-info-ring))]" };
}

function getCategoryTip(category: "language" | "logic" | "context") {
  switch (category) {
    case "language":
      return "Aşırı kesinlik/abartı içeren ifadeleri nötrleştir; iddiayı somut veriyle destekle.";
    case "logic":
      return "Sonuç ile gerekçe arasındaki bağı kontrol et; genellemeleri ve \"ya hep ya hiç\" ifadelerini ara.";
    case "context":
      return "Kaynak/kanıt var mı bak; tarih, yer, birincil kaynak gibi doğrulanabilir detayları kontrol et.";
  }
}

export default function FindingsCard({ title, icon, items, category }: FindingsCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 animate-fade-up" style={{ boxShadow: "var(--shadow-card)", animationDelay: `${category === "language" ? 0.1 : category === "logic" ? 0.2 : 0.3}s`, animationFillMode: "backwards" }}>
      <h3 className="font-display text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
        <span className="text-lg">{icon}</span>
        {title}
      </h3>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">Uygun bulgu bulunamadı.</p>
      ) : (
        <div className="space-y-3">
          {items.map((f, idx) => {
            const sev = severityClasses(f.severity);
            return (
              <div key={idx} className="rounded-lg border border-border bg-secondary/30 p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-foreground leading-snug">{f.title}</p>
                  <span className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full ring-1 ${sev.bg} ${sev.text} ${sev.ring}`}>
                    {sev.label}
                  </span>
                </div>
                {f.excerpt && (
                  <blockquote className="text-xs text-muted-foreground border-l-2 border-primary/30 pl-3 italic">
                    "{f.excerpt}"
                  </blockquote>
                )}
                <p className="text-xs text-secondary-foreground leading-relaxed">{f.explanation}</p>
                <div className="pt-1 border-t border-border/50">
                  <p className="text-[10px] text-muted-foreground">
                    <span className="font-medium text-primary/70">💡 İpucu:</span>{" "}
                    {getCategoryTip(category)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
