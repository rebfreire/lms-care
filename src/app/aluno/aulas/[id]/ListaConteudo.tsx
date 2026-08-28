"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Lock, PlayCircle, Search } from "lucide-react";

interface AulaResumo {
  id: string;
  titulo: string;
  concluida: boolean;
  disponivel: boolean;
}

export default function ListaConteudo({ aulas, aulaAtualId }: { aulas: AulaResumo[]; aulaAtualId: string }) {
  const [busca, setBusca] = useState("");

  const aulasFiltradas = busca.trim()
    ? aulas.filter((a) => a.titulo.toLowerCase().includes(busca.trim().toLowerCase()))
    : aulas;

  return (
    <div>
      {aulas.length > 6 && (
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar conteúdo..."
            className="w-full rounded-full border border-outline-variant bg-surface-container-low pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
          />
        </div>
      )}

      <ul className="space-y-1">
        {aulasFiltradas.map((a) =>
          a.disponivel ? (
            <li key={a.id}>
              <Link
                href={`/aluno/aulas/${a.id}`}
                className={`flex items-center gap-2 text-sm py-2 px-2 rounded-lg ${
                  a.id === aulaAtualId
                    ? "bg-primary-container text-on-primary-container font-semibold"
                    : "text-on-surface-variant hover:bg-surface-container-low"
                }`}
              >
                {a.concluida ? (
                  <CheckCircle2 size={14} className="text-success flex-shrink-0" />
                ) : (
                  <PlayCircle size={14} className="flex-shrink-0" />
                )}
                {a.titulo}
              </Link>
            </li>
          ) : (
            <li key={a.id} className="flex items-center gap-2 text-sm py-2 px-2 rounded-lg text-outline">
              <Lock size={14} className="flex-shrink-0" />
              {a.titulo}
            </li>
          ),
        )}
        {aulasFiltradas.length === 0 && (
          <li className="text-sm text-on-surface-variant px-2 py-4 text-center">Nada encontrado.</li>
        )}
      </ul>
    </div>
  );
}
