"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { AlunoRelatorio } from "@/lib/relatorios";

const ENGAJAMENTO_ESTILO: Record<AlunoRelatorio["engajamento"], string> = {
  ativo: "bg-success-container text-success",
  inativo: "bg-warning-container text-warning",
  "não iniciado": "bg-surface-container-high text-on-surface-variant",
};

const LIMITE_COLAPSADO = 5;

export default function TabelaAlunos({ alunos }: { alunos: AlunoRelatorio[] }) {
  const [expandido, setExpandido] = useState(false);
  const visiveis = expandido ? alunos : alunos.slice(0, LIMITE_COLAPSADO);

  return (
    <div className="bg-surface rounded-card-lg shadow-soft overflow-hidden overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] font-bold uppercase tracking-widest text-on-surface-variant border-b border-outline-variant">
            <th className="px-6 py-3">Nome</th>
            <th className="px-6 py-3">Turma</th>
            <th className="px-6 py-3">Progresso</th>
            <th className="px-6 py-3">Último acesso</th>
            <th className="px-6 py-3">Engajamento</th>
          </tr>
        </thead>
        <tbody>
          {visiveis.map((a) => (
            <tr key={a.id} className="border-b border-outline-variant last:border-0">
              <td className="px-6 py-3">
                <Link href={`/admin/relatorios/${a.id}`} className="text-on-surface hover:text-primary font-medium">
                  {a.nome}
                </Link>
                <p className="text-xs text-on-surface-variant">{a.email}</p>
              </td>
              <td className="px-6 py-3 text-on-surface-variant">{a.turma ?? "—"}</td>
              <td className="px-6 py-3 text-on-surface-variant">
                {a.totalAulas > 0 ? `${a.aulasConcluidas}/${a.totalAulas} (${a.percentual}%)` : "sem trilha"}
              </td>
              <td className="px-6 py-3 text-on-surface-variant">
                {a.ultimoAcesso ? new Date(a.ultimoAcesso).toLocaleDateString("pt-BR") : "nunca"}
              </td>
              <td className="px-6 py-3">
                <span
                  className={`inline-flex items-center rounded-pill px-3 py-1 text-xs font-bold uppercase tracking-widest ${ENGAJAMENTO_ESTILO[a.engajamento]}`}
                >
                  {a.engajamento}
                </span>
              </td>
            </tr>
          ))}
          {alunos.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-10 text-center text-on-surface-variant">
                Nenhum aluno ainda.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {alunos.length > LIMITE_COLAPSADO && (
        <button
          type="button"
          onClick={() => setExpandido((v) => !v)}
          className="w-full flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-widest text-primary hover:bg-surface-container-low border-t border-outline-variant"
        >
          {expandido ? (
            <>
              <ChevronUp size={14} /> Mostrar menos
            </>
          ) : (
            <>
              <ChevronDown size={14} /> Mostrar todos ({alunos.length})
            </>
          )}
        </button>
      )}
    </div>
  );
}
