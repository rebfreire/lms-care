"use client";

import { useActionState, useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { excluirModulo, renomearModulo } from "../actions";

export default function ModuloHeader({
  moduloId,
  cursoId,
  nome,
}: {
  moduloId: string;
  cursoId: string;
  nome: string;
}) {
  const [editando, setEditando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [pendente, startTransition] = useTransition();
  const [erro, renomear, renomeando] = useActionState(
    async (prev: string | null, formData: FormData) => {
      const resultado = await renomearModulo(moduloId, cursoId, prev, formData);
      if (!resultado) setEditando(false);
      return resultado;
    },
    null,
  );

  if (editando) {
    return (
      <form action={renomear} className="flex flex-wrap items-center gap-2 mb-4">
        <input
          name="nome"
          defaultValue={nome}
          required
          autoFocus
          className="flex-1 min-w-[180px] rounded-2xl border border-outline-variant bg-surface px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
        />
        <button
          type="submit"
          disabled={renomeando}
          className="rounded-pill bg-primary text-on-primary px-3 py-1 text-xs font-semibold hover:opacity-90 disabled:opacity-60"
        >
          Salvar
        </button>
        <button
          type="button"
          onClick={() => setEditando(false)}
          className="text-xs font-semibold text-on-surface-variant hover:underline"
        >
          Cancelar
        </button>
        {erro && <span className="text-xs text-error w-full">{erro}</span>}
      </form>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <h3 className="text-lg font-headline font-bold text-on-surface flex-1 min-w-0">{nome}</h3>
      {confirmando ? (
        <div className="flex flex-wrap items-center gap-2 bg-error-container/30 rounded-2xl px-4 py-2 w-full basis-full">
          <span className="text-xs text-on-surface">
            Excluir o módulo &quot;{nome}&quot; e todas as aulas? Vídeos, materiais, progresso e
            tentativas dos alunos serão apagados.
          </span>
          <button
            type="button"
            disabled={pendente}
            onClick={() => startTransition(() => excluirModulo(moduloId, cursoId))}
            className="rounded-pill bg-error text-on-error px-3 py-1 text-xs font-semibold hover:opacity-90 disabled:opacity-60"
          >
            {pendente ? "Excluindo..." : "Confirmar"}
          </button>
          <button
            type="button"
            disabled={pendente}
            onClick={() => setConfirmando(false)}
            className="text-xs font-semibold text-on-surface-variant hover:underline"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setEditando(true)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-on-surface-variant hover:text-primary"
          >
            <Pencil size={14} /> Renomear
          </button>
          <button
            type="button"
            onClick={() => setConfirmando(true)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-error hover:underline"
          >
            <Trash2 size={14} /> Excluir módulo
          </button>
        </>
      )}
    </div>
  );
}
