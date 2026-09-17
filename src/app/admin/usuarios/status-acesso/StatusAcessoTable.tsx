"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, XCircle, MinusCircle, Search } from "lucide-react";
import type { StatusAcessoUsuario } from "../actions";

type Filtro = "todos" | "nao_logaram" | "nao_trocaram" | "nao_enviados";

function formatarData(iso: string | null) {
  return iso ? new Date(iso).toLocaleString("pt-BR") : null;
}

export default function StatusAcessoTable({ usuarios }: { usuarios: StatusAcessoUsuario[] }) {
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const totalEnviados = usuarios.filter((u) => u.ultimoEnvioOk === true).length;
  const totalLogaram = usuarios.filter((u) => u.primeiroAcessoEm).length;
  const totalTrocaram = usuarios.filter((u) => u.senhaAlteradaEm).length;

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return usuarios.filter((u) => {
      if (termo && !u.nome.toLowerCase().includes(termo) && !u.email.toLowerCase().includes(termo)) {
        return false;
      }
      if (filtro === "nao_logaram" && u.primeiroAcessoEm) return false;
      if (filtro === "nao_trocaram" && u.senhaAlteradaEm) return false;
      if (filtro === "nao_enviados" && u.ultimoEnvioOk === true) return false;
      return true;
    });
  }, [usuarios, busca, filtro]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface rounded-card-lg p-5 shadow-soft">
          <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            E-mail entregue
          </p>
          <p className="text-2xl font-headline font-bold text-on-surface">
            {totalEnviados}
            <span className="text-sm font-normal text-on-surface-variant"> / {usuarios.length}</span>
          </p>
        </div>
        <div className="bg-surface rounded-card-lg p-5 shadow-soft">
          <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            Já fizeram 1º acesso
          </p>
          <p className="text-2xl font-headline font-bold text-on-surface">
            {totalLogaram}
            <span className="text-sm font-normal text-on-surface-variant"> / {usuarios.length}</span>
          </p>
        </div>
        <div className="bg-surface rounded-card-lg p-5 shadow-soft">
          <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            Já trocaram a senha
          </p>
          <p className="text-2xl font-headline font-bold text-on-surface">
            {totalTrocaram}
            <span className="text-sm font-normal text-on-surface-variant"> / {usuarios.length}</span>
          </p>
        </div>
      </div>

      <div className="bg-surface rounded-card-lg shadow-soft overflow-hidden overflow-x-auto">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-6 py-4 border-b border-outline-variant">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome ou e-mail..."
              className="w-full rounded-xl border border-outline-variant bg-surface pl-9 pr-4 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
            />
          </div>

          <div className="flex gap-1 bg-surface-container-low rounded-xl p-1 flex-wrap">
            {(
              [
                { valor: "todos", label: "Todos" },
                { valor: "nao_enviados", label: "Sem e-mail entregue" },
                { valor: "nao_logaram", label: "Nunca logaram" },
                { valor: "nao_trocaram", label: "Não trocaram senha" },
              ] as { valor: Filtro; label: string }[]
            ).map((opcao) => (
              <button
                key={opcao.valor}
                type="button"
                onClick={() => setFiltro(opcao.valor)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filtro === opcao.valor
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
              <th className="px-6 py-3">Nome</th>
              <th className="px-6 py-3">E-mail</th>
              <th className="px-6 py-3">E-mail de acesso</th>
              <th className="px-6 py-3">1º acesso</th>
              <th className="px-6 py-3">Trocou a senha</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((u) => (
              <tr key={u.id} className="border-b border-outline-variant last:border-0">
                <td className="px-6 py-3 text-on-surface">{u.nome}</td>
                <td className="px-6 py-3 text-on-surface-variant">{u.email}</td>
                <td className="px-6 py-3">
                  {u.ultimoEnvioOk === null ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant">
                      <MinusCircle size={14} /> Nunca enviado
                    </span>
                  ) : u.ultimoEnvioOk ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-success">
                      <CheckCircle2 size={14} /> {formatarData(u.ultimoEnvioEm)}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs text-error">
                      <XCircle size={14} /> Falhou
                    </span>
                  )}
                </td>
                <td className="px-6 py-3">
                  {u.primeiroAcessoEm ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-success">
                      <CheckCircle2 size={14} /> {formatarData(u.primeiroAcessoEm)}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant">
                      <MinusCircle size={14} /> Nunca
                    </span>
                  )}
                </td>
                <td className="px-6 py-3">
                  {u.senhaAlteradaEm ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-success">
                      <CheckCircle2 size={14} /> {formatarData(u.senhaAlteradaEm)}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant">
                      <MinusCircle size={14} /> Não
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-on-surface-variant">
                  Nenhum resultado pra esse filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
