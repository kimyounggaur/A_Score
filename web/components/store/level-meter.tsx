import { cn } from "@/lib/utils";

type LevelMeterProps = {
  rhythm: number | null;
  technique: number | null;
  className?: string;
};

function symbols(symbol: string, value: number) {
  return Array.from({ length: 5 }, (_, index) => (index < value ? symbol : "○")).join("");
}

export function LevelMeter({ rhythm, technique, className }: LevelMeterProps) {
  if (rhythm == null && technique == null) return null;

  const rhythmValue = rhythm ?? 0;
  const techniqueValue = technique ?? 0;
  const legend = [
    rhythm == null ? null : `리듬 ${rhythm}/5`,
    technique == null ? null : `기법 ${technique}/5`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className={cn("space-y-1", className)} aria-label={legend}>
      {rhythm != null ? (
        <div aria-hidden="true" className="tracking-wider text-brand-700">
          <span className="mr-2 text-xs font-medium text-ink-600">리듬</span>
          {symbols("★", rhythmValue)}
        </div>
      ) : null}
      {technique != null ? (
        <div aria-hidden="true" className="tracking-wider text-ink-700">
          <span className="mr-2 text-xs font-medium text-ink-600">기법</span>
          {symbols("●", techniqueValue)}
        </div>
      ) : null}
      <p className="text-xs text-text-muted">{legend}</p>
    </div>
  );
}
