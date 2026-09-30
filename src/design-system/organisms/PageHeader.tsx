import type { ReactNode } from "react";
import Breadcrumb, { type BreadcrumbItem } from "@/design-system/molecules/Breadcrumb";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumb?: BreadcrumbItem[];
}

export default function PageHeader({ title, description, actions, breadcrumb }: PageHeaderProps) {
  return (
    <div className="mb-8">
      {breadcrumb && breadcrumb.length > 0 && <Breadcrumb items={breadcrumb} className="mb-3" />}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-2xl sm:text-3xl font-headline font-bold text-on-surface tracking-tight">
          {title}
        </h2>
        {description && (
          <p className="text-on-surface-variant mt-1">{description}</p>
        )}
      </div>
      {actions}
      </div>
    </div>
  );
}
