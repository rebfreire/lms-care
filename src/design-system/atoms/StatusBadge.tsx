export type StatusVariant = "concluido" | "em_andamento" | "bloqueado" | "atrasado";

const LABELS: Record<StatusVariant, string> = {
  concluido: "Concluído",
  em_andamento: "Em andamento",
  bloqueado: "Bloqueado",
  atrasado: "Atrasado",
};

const STYLES: Record<StatusVariant, string> = {
  concluido: "bg-success-container text-success",
  em_andamento: "bg-primary-container text-on-primary-container",
  bloqueado: "bg-surface-container-high text-on-surface-variant",
  atrasado: "bg-warning-container text-warning",
};

interface StatusBadgeProps {
  status: StatusVariant;
  className?: string;
}

export default function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-pill px-3 py-1 text-xs font-bold uppercase tracking-widest ${STYLES[status]} ${className}`}
    >
      {LABELS[status]}
    </span>
  );
}
