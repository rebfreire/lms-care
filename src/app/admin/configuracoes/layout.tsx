"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import PageHeader from "@/design-system/organisms/PageHeader";

const ABAS = [
  { href: "/admin/configuracoes", label: "Personalização" },
  { href: "/admin/configuracoes/certificado", label: "Certificado" },
];

export default function ConfiguracoesLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div>
      <PageHeader title="Configurações" description="Personalização do sistema e do certificado." />

      <div className="flex gap-1 border-b border-outline-variant mb-6">
        {ABAS.map((aba) => {
          const ativa = pathname === aba.href;
          return (
            <Link
              key={aba.href}
              href={aba.href}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                ativa
                  ? "text-primary border-primary"
                  : "text-on-surface-variant border-transparent hover:text-primary"
              }`}
            >
              {aba.label}
            </Link>
          );
        })}
      </div>

      {children}
    </div>
  );
}
