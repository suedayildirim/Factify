import type { AnalyzeHistoryItem } from "@/types/analyze";
import { Clock, Trash2 } from "lucide-react";

interface AnalysisHistoryProps {
  history: AnalyzeHistoryItem[];
  onSelect: (item: AnalyzeHistoryItem) => void;
  onClear: () => void;
}

function getScoreTextColor(score: number) {
  if (score >= 80) return "text-score-high";
  if (score >= 60) return "text-score-mid-high";
  if (score >= 35) return "text-score-mid";
  return "text-score-low";
}

export default function AnalysisHistory({ history, onSelect, onClear }: AnalysisHistoryProps) {
  if (history.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-5" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Geçmiş Analizler
        </h3>
        <button
          onClick={onClear}
          className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
        >
          <Trash2 className="w-3 h-3" />
          Temizle
        </button>
      </div>
      <div className="space-y-2">
        {history.map((item, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(item)}
            className="w-full text-left rounded-lg border border-border/50 bg-secondary/20 hover:bg-secondary/40 transition-colors p-3 group"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-foreground/80 truncate flex-1">
                {item.preview}
              </p>
              <span className={`text-sm font-display font-bold ${getScoreTextColor(item.score)} shrink-0`}>
                {item.score}%
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {new Date(item.at).toLocaleString("tr-TR")}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
