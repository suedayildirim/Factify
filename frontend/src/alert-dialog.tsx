interface TrustMeterProps {
  score: number;
  riskLabel?: string;
}

function getScoreColor(score: number) {
  if (score >= 80) return "bg-score-high";
  if (score >= 60) return "bg-score-mid-high";
  if (score >= 35) return "bg-score-mid";
  return "bg-score-low";
}

function getScoreLabel(score: number) {
  if (score >= 80) return "Yüksek güven";
  if (score >= 60) return "Orta-yüksek güven";
  if (score >= 35) return "Dikkatli yaklaş";
  return "Düşük güven";
}

function getScoreTextColor(score: number) {
  if (score >= 80) return "text-score-high";
  if (score >= 60) return "text-score-mid-high";
  if (score >= 35) return "text-score-mid";
  return "text-score-low";
}

export default function TrustMeter({ score, riskLabel }: TrustMeterProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 animate-fade-up" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Güven Skoru
        </h3>
        <span className={`font-display text-4xl font-bold ${getScoreTextColor(score)}`}>
          {score}%
        </span>
      </div>

      <div className="mb-3">
        <div className="h-3 rounded-full bg-secondary overflow-hidden">
          <div
            className={`h-full rounded-full ${getScoreColor(score)} animate-meter-fill`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>0</span>
        <span className={`text-sm font-medium ${getScoreTextColor(score)}`}>
          {getScoreLabel(score)}
        </span>
        <span>100</span>
      </div>

      {riskLabel && (
        <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-center animate-fade-up">
          <span className="text-sm font-display font-bold text-destructive">
            {riskLabel}
          </span>
        </div>
      )}
    </div>
  );
}
