"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { logout } from "@/lib/supabase/actions";

export interface SidebarItem {
  href: string;
  label: string;
  icon: ReactNode;
}

interface SidebarProps {
  items: SidebarItem[];
  brandName?: string;
  brandSubtitle?: string;
  brandLogoUrl?: string | null;
  usuarioNome?: string;
}

export default function Sidebar({
  items,
  brandName = "Care",
  brandSubtitle = "Treinamentos",
  brandLogoUrl,
  usuarioNome,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 flex flex-col p-4 z-40 bg-surface-bright/80 backdrop-blur-xl rounded-card-lg m-3 h-[calc(100vh-1.5rem)] w-64 shadow-soft-lg overflow-hidden">
      {brandLogoUrl ? (
        <div className="flex flex-col items-center text-center px-3 py-6 mb-2 gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brandLogoUrl} alt={brandName} className="h-16 w-auto max-w-[80%] object-contain" />
          <div>
            <h1 className="text-lg font-headline font-bold tracking-tight leading-none text-on-surface">
              {brandName}
            </h1>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">
              {brandSubtitle}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 px-3 py-6 mb-2">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-on-primary font-headline font-bold flex-shrink-0">
            {brandName.charAt(0).toUpperCase()}
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
      )}

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

      <div className="mt-auto px-1 pt-4 border-t border-outline-variant space-y-1">
        {usuarioNome && (
          <p className="px-4 py-2 text-xs text-on-surface-variant truncate">{usuarioNome}</p>
        )}
        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-on-surface-variant hover:bg-error-container/40 hover:text-error transition-colors duration-200 text-sm text-left"
          >
            Sair
          </button>
        </form>
      </div>
    </aside>
  );
}
