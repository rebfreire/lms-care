import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumb({ items, className = "" }: BreadcrumbProps) {
  return (
    <nav aria-label="Caminho de navegação" className={`min-w-0 ${className}`}>
      <ol className="flex items-center gap-1 text-sm text-on-surface-variant min-w-0">
        {items.map((item, i) => {
          const ultimo = i === items.length - 1;
          return (
            <li
              key={`${i}-${item.label}`}
              className={`flex items-center gap-1 min-w-0 ${ultimo ? "flex-1" : "flex-shrink"}`}
            >
              {i > 0 && <ChevronRight size={14} className="flex-shrink-0 opacity-60" aria-hidden />}
              {item.href && !ultimo ? (
                <Link
                  href={item.href}
                  title={item.label}
                  className="truncate max-w-[10rem] sm:max-w-[16rem] hover:text-primary hover:underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  title={item.label}
                  aria-current={ultimo ? "page" : undefined}
                  className={`truncate ${ultimo ? "font-semibold text-on-surface" : ""}`}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
