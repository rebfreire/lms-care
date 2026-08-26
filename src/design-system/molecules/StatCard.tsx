import type { ReactNode } from "react";

type Variant = "light" | "primary" | "accent";

const VARIANTS: Record<Variant, { card: string; iconWrap: string; label: string }> = {
  light: {
    card: "bg-surface border border-outline-variant shadow-soft text-on-surface",
    iconWrap: "bg-surface-container-low text-primary",
    label: "text-on-surface-variant",
  },
  primary: {
    card: "bg-primary text-on-primary shadow-soft-lg",
    iconWrap: "bg-white/15 text-on-primary border border-white/15",
    label: "text-primary-container",
  },
  accent: {
    card: "bg-secondary-container text-on-secondary-container border border-surface",
    iconWrap: "bg-white/50 text-secondary shadow-inner",
    label: "opacity-70",
  },
};

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  variant?: Variant;
  className?: string;
}

export default function StatCard({
  icon,
  label,
  value,
  variant = "light",
  className = "",
}: StatCardProps) {
  const styles = VARIANTS[variant];

  return (
    <div
      className={`p-6 rounded-card flex items-center gap-5 ${styles.card} ${className}`}
    >
      <div
        className={`h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${styles.iconWrap}`}
      >
        {icon}
      </div>
      <div>
        <p className={`text-[11px] font-bold uppercase tracking-widest ${styles.label}`}>
          {label}
        </p>
        <h4 className="text-2xl font-bold font-headline">{value}</h4>
      </div>
    </div>
  );
}
