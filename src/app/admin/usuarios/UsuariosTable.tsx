"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Users2, Pencil, Mail, CheckCircle2, XCircle, Search, ChevronLeft, ChevronRight } from "lucide-react";
import Button from "@/design-system/atoms/Button";
import { enviarEmailAcesso, type ResultadoEnvioEmail } from "./actions";

interface UsuarioLinha {
  id: string;
  nome: string;
  email: string;
  papel: string;
  turma: string;
}

const POR_PAGINA = 15;

export default function UsuariosTable({ usuarios }: { usuarios: UsuarioLinha[] }) {
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [resultados, setResultados] = useState<ResultadoEnvioEmail[] | null>(null);
  const [isPending, startTransition] = useTransition();
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return usuarios;
    return usuarios.filter(
      (u) =>
        u.nome.toLowerCase().includes(termo) ||
        u.email.toLowerCase().includes(termo) ||
        u.turma.toLowerCase().includes(termo),
    );
  }, [usuarios, busca]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const pagina_de = filtrados.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA);

  const todosSelecionados =
    filtrados.length > 0 && filtrados.every((u) => selecionados.has(u.id));

  function atualizarBusca(valor: string) {
    setBusca(valor);
    setPagina(1);
  }

  function alternarTodos() {
    setSelecionados((prev) => {
      if (todosSelecionados) {
        const novo = new Set(prev);
        filtrados.forEach((u) => novo.delete(u.id));
        return novo;
      }
      const novo = new Set(prev);
      filtrados.forEach((u) => novo.add(u.id));
      return novo;
    });
  }

  function alternarUm(id: string) {
    setSelecionados((prev) => {
      const novo = new Set(prev);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  function enviar() {
    setResultados(null);
    startTransition(async () => {
      const resultado = await enviarEmailAcesso([...selecionados]);
      setResultados(resultado);
      setSelecionados(new Set());
    });
  }

  return (
    <div className="bg-surface rounded-card-lg shadow-soft overflow-hidden">
      {selecionados.size > 0 && (
        <div className="flex items-center justify-between gap-4 px-6 py-3 bg-primary-container border-b border-outline-variant">
          <span className="text-sm font-semibold text-on-primary-container">
            {selecionados.size} selecionado(s)
          </span>
          <Button
            size="sm"
            onClick={enviar}
            disabled={isPending}
            className="inline-flex items-center gap-2"
          >
            <Mail size={14} /> {isPending ? "Enviando..." : "Enviar e-mail de acesso"}
          </Button>
        </div>
      )}

      {resultados && (
        <div className="px-6 py-4 bg-surface-container-low border-b border-outline-variant space-y-1">
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
            Resultado do envio
          </p>
          {resultados.map((r) => (
            <div key={r.usuarioId} className="flex items-center gap-2 text-sm">
              {r.ok ? (
                <CheckCircle2 size={14} className="text-success flex-shrink-0" />
              ) : (
                <XCircle size={14} className="text-error flex-shrink-0" />
              )}
              <span className="text-on-surface">{r.nome}</span>
              <span className="text-on-surface-variant text-xs">({r.email})</span>
              {!r.ok && <span className="text-error text-xs">— {r.erro}</span>}
            </div>
          ))}
        </div>
      )}

      <div className="px-6 py-4 border-b border-outline-variant">
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            value={busca}
            onChange={(e) => atualizarBusca(e.target.value)}
            placeholder="Buscar por nome, e-mail ou turma..."
            className="w-full rounded-xl border border-outline-variant bg-surface pl-9 pr-4 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
          />
        </div>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] font-bold uppercase tracking-widest text-on-surface-variant border-b border-outline-variant">
            <th className="px-6 py-3 w-10">
              <input
                type="checkbox"
                checked={todosSelecionados}
                onChange={alternarTodos}
                className="h-4 w-4 rounded border-outline-variant accent-primary"
              />
            </th>
            <th className="px-6 py-3">Nome</th>
            <th className="px-6 py-3">E-mail</th>
            <th className="px-6 py-3">Turma</th>
            <th className="px-6 py-3">Papel</th>
            <th className="px-6 py-3" />
          </tr>
        </thead>
        <tbody>
          {pagina_de.map((u) => (
            <tr key={u.id} className="border-b border-outline-variant last:border-0">
              <td className="px-6 py-3">
                <input
                  type="checkbox"
                  checked={selecionados.has(u.id)}
                  onChange={() => alternarUm(u.id)}
                  className="h-4 w-4 rounded border-outline-variant accent-primary"
                />
              </td>
              <td className="px-6 py-3 text-on-surface">{u.nome}</td>
              <td className="px-6 py-3 text-on-surface-variant">{u.email}</td>
              <td className="px-6 py-3 text-on-surface-variant">{u.turma || "—"}</td>
              <td className="px-6 py-3 text-on-surface-variant capitalize">{u.papel}</td>
              <td className="px-6 py-3">
                <Link
                  href={`/admin/usuarios/${u.id}/editar`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-on-surface-variant hover:text-primary"
                >
                  <Pencil size={12} /> editar
                </Link>
              </td>
            </tr>
          ))}
          {filtrados.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-10 text-center text-on-surface-variant">
                <Users2 className="mx-auto mb-2 text-outline" size={24} />
                {usuarios.length === 0 ? "Nenhum usuário ainda — importe um CSV." : "Nenhum resultado pra essa busca."}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {filtrados.length > 0 && (
        <div className="flex items-center justify-between px-6 py-3 border-t border-outline-variant">
          <span className="text-xs text-on-surface-variant">
            {filtrados.length} usuário(s) — página {paginaAtual} de {totalPaginas}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={paginaAtual === 1}
              className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              disabled={paginaAtual === totalPaginas}
              className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
