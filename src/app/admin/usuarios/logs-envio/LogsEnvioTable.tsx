"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, XCircle, Search } from "lucide-react";
import type { LogEnvioEmail } from "../actions";

type FiltroStatus = "todos" | "sucesso" | "erro";

export default function LogsEnvioTable({ logs }: { logs: LogEnvioEmail[] }) {
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState<FiltroStatus>("todos");

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return logs.filter((l) => {
      if (status === "sucesso" && !l.ok) return false;
      if (status === "erro" && l.ok) return false;
      if (termo && !l.nome.toLowerCase().includes(termo) && !l.email.toLowerCase().includes(termo)) {
        return false;
      }
      return true;
    });
  }, [logs, busca, status]);

  const totalErros = logs.filter((l) => !l.ok).length;

  return (
    <div className="bg-surface rounded-card-lg shadow-soft overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-6 py-4 border-b border-outline-variant">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
          />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou e-mail..."
            className="w-full rounded-xl border border-outline-variant bg-surface pl-9 pr-4 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
          />
        </div>

        <div className="flex gap-1 bg-surface-container-low rounded-xl p-1">
          {(
            [
              { valor: "todos", label: "Todos" },
              { valor: "sucesso", label: "Sucesso" },
              { valor: "erro", label: `Erro${totalErros > 0 ? ` (${totalErros})` : ""}` },
            ] as { valor: FiltroStatus; label: string }[]
          ).map((opcao) => (
            <button
              key={opcao.valor}
              type="button"
              onClick={() => setStatus(opcao.valor)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                status === opcao.valor
                  ? "bg-primary-container text-on-primary-container"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {opcao.label}
            </button>
          ))}
        </div>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] font-bold uppercase tracking-widest text-on-surface-variant border-b border-outline-variant">
            <th className="px-6 py-3 w-8" />
            <th className="px-6 py-3">Nome</th>
            <th className="px-6 py-3">E-mail</th>
            <th className="px-6 py-3">Quando</th>
            <th className="px-6 py-3">Erro</th>
          </tr>
        </thead>
        <tbody>
          {filtrados.map((l) => (
            <tr key={l.id} className="border-b border-outline-variant last:border-0">
              <td className="px-6 py-3">
                {l.ok ? (
                  <CheckCircle2 size={14} className="text-success" />
                ) : (
                  <XCircle size={14} className="text-error" />
                )}
              </td>
              <td className="px-6 py-3 text-on-surface">{l.nome}</td>
              <td className="px-6 py-3 text-on-surface-variant">{l.email}</td>
              <td className="px-6 py-3 text-on-surface-variant">
                {new Date(l.criadoEm).toLocaleString("pt-BR")}
              </td>
              <td className="px-6 py-3 text-error text-xs">{l.erro ?? ""}</td>
            </tr>
          ))}
          {filtrados.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-10 text-center text-on-surface-variant">
                {logs.length === 0 ? "Nenhum envio registrado ainda." : "Nenhum resultado pra esse filtro."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
