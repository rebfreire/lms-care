interface ProgressBarProps {
  value: number;
  label?: string;
  className?: string;
}

export default function ProgressBar({ value, label, className = "" }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={className}>
      {label && (
        <div className="flex justify-between text-[11px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">
          <span>{label}</span>
          <span>{clamped}%</span>
        </div>
      )}
      <div className="w-full h-2 bg-surface-container-high rounded-pill overflow-hidden">
        <div
          className="h-full bg-primary rounded-pill transition-all duration-700"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
