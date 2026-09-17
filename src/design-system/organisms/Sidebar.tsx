"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Menu, X } from "lucide-react";
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
  const [aberto, setAberto] = useState(false);
  const [pathnameAnterior, setPathnameAnterior] = useState(pathname);

  // Fecha o menu sozinho ao trocar de página (só importa no mobile, onde o
  // menu é um drawer que cobre a tela — no desktop ele já fica sempre visível).
  // Ajusta o estado direto no render (em vez de useEffect) seguindo o padrão
  // recomendado do React pra "resetar estado quando uma prop muda".
  if (pathname !== pathnameAnterior) {
    setPathnameAnterior(pathname);
    setAberto(false);
  }

  return (
    <>
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-surface-bright/90 backdrop-blur-xl border-b border-outline-variant">
        <div className="flex items-center gap-2 min-w-0">
          {brandLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brandLogoUrl} alt={brandName} className="h-8 w-auto max-w-[120px] object-contain" />
          ) : (
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-on-primary font-headline font-bold flex-shrink-0 text-sm">
              {brandName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="font-headline font-bold text-on-surface truncate">{brandName}</span>
        </div>
        <button
          type="button"
          onClick={() => setAberto(true)}
          aria-label="Abrir menu"
          className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container-low flex-shrink-0"
        >
          <Menu size={22} />
        </button>
      </header>

      {aberto && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-on-background/40"
          onClick={() => setAberto(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex flex-col p-4 h-screen w-72 bg-surface-bright shadow-soft-lg overflow-hidden transition-transform duration-200 lg:h-[calc(100vh-1.5rem)] lg:w-64 lg:m-3 lg:rounded-card-lg lg:bg-surface-bright/80 lg:backdrop-blur-xl lg:translate-x-0 ${
          aberto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          type="button"
          onClick={() => setAberto(false)}
          aria-label="Fechar menu"
          className="lg:hidden self-end p-2 -mr-2 -mt-1 rounded-xl text-on-surface-variant hover:bg-surface-container-low"
        >
          <X size={20} />
        </button>

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
          <Link
            href="/redefinir-senha"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors duration-200 text-sm"
          >
            Trocar senha
          </Link>
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
    </>
  );
}
