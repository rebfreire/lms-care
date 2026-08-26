import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export default function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-8">
      <div>
        <h2 className="text-3xl font-headline font-bold text-on-surface tracking-tight">
          {title}
        </h2>
        {description && (
          <p className="text-on-surface-variant mt-1">{description}</p>
        )}
      </div>
      {actions}
    </div>
  );
}
