"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export interface SidebarItem {
  href: string;
  label: string;
  icon: ReactNode;
}

interface SidebarProps {
  items: SidebarItem[];
  brandName?: string;
  brandSubtitle?: string;
}

export default function Sidebar({
  items,
  brandName = "Care",
  brandSubtitle = "Treinamentos",
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 flex flex-col p-4 z-40 bg-surface-bright/80 backdrop-blur-xl rounded-card-lg m-3 h-[calc(100vh-1.5rem)] w-64 shadow-soft-lg overflow-hidden">
      <div className="flex items-center gap-3 px-3 py-6 mb-2">
        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-on-primary font-headline font-bold">
          C
        </div>
        <div>
          <h1 className="text-xl font-headline font-bold tracking-tight leading-none text-on-surface">
            {brandName}
          </h1>
          <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">
            {brandSubtitle}
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-1 overflow-y-auto">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors duration-200 ${
                isActive
                  ? "bg-primary-container text-on-primary-container font-bold"
                  : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
              }`}
            >
              <span className="w-5 h-5 flex items-center justify-center">{item.icon}</span>
              <span className="text-sm tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
