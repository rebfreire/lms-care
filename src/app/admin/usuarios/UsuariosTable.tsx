"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Users2, Pencil, Mail, CheckCircle2, XCircle } from "lucide-react";
import Button from "@/design-system/atoms/Button";
import { enviarEmailAcesso, type ResultadoEnvioEmail } from "./actions";

interface UsuarioLinha {
  id: string;
  nome: string;
  email: string;
  papel: string;
  turma: string;
}

export default function UsuariosTable({ usuarios }: { usuarios: UsuarioLinha[] }) {
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [resultados, setResultados] = useState<ResultadoEnvioEmail[] | null>(null);
  const [isPending, startTransition] = useTransition();

  const todosSelecionados = usuarios.length > 0 && selecionados.size === usuarios.length;

  function alternarTodos() {
    setSelecionados(todosSelecionados ? new Set() : new Set(usuarios.map((u) => u.id)));
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
          {usuarios.map((u) => (
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
          {usuarios.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-10 text-center text-on-surface-variant">
                <Users2 className="mx-auto mb-2 text-outline" size={24} />
                Nenhum usuário ainda — importe um CSV.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
