"use client";

import { useActionState, useState } from "react";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { editarTurma, excluirTurma } from "./actions";

export default function TurmaItem({ turmaId, nome }: { turmaId: string; nome: string }) {
  const [editando, setEditando] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [error, formAction, isPending] = useActionState(editarTurma.bind(null, turmaId), null);

  if (editando) {
    return (
      <li>
        <form
          action={formAction}
          onSubmit={() => setTimeout(() => setEditando(false), 0)}
          className="flex items-center gap-1"
        >
          <input
            name="nome"
            defaultValue={nome}
            required
            autoFocus
            className="flex-1 rounded-lg border border-outline-variant bg-surface px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
          />
          <button type="submit" disabled={isPending} className="p-1.5 text-success hover:bg-success-container/40 rounded-lg">
            <Check size={14} />
          </button>
          <button
            type="button"
            onClick={() => setEditando(false)}
            className="p-1.5 text-on-surface-variant hover:bg-surface-container-high rounded-lg"
          >
            <X size={14} />
          </button>
        </form>
        {error && <p className="text-xs text-error mt-1">{error}</p>}
      </li>
    );
  }

  if (confirmandoExclusao) {
    return (
      <li className="rounded-lg bg-error-container/30 px-3 py-2">
        <p className="text-xs text-on-surface mb-2">
          Excluir <strong>{nome}</strong>? Remove os alunos dela e qualquer trilha atribuída por
          turma.
        </p>
        <div className="flex items-center gap-2">
          <form action={excluirTurma.bind(null, turmaId)}>
            <button
              type="submit"
              className="rounded-pill bg-error text-on-error px-3 py-1 text-xs font-semibold hover:opacity-90"
            >
              Confirmar exclusão
            </button>
          </form>
          <button
            type="button"
            onClick={() => setConfirmandoExclusao(false)}
            className="text-xs font-semibold text-on-surface-variant hover:underline"
          >
            Cancelar
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-2 text-sm text-on-surface px-3 py-1.5 rounded-lg bg-surface-container-low group">
      <span className="flex-1 truncate">{nome}</span>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={() => setEditando(true)}
          className="p-1 text-on-surface-variant hover:text-primary"
        >
          <Pencil size={13} />
        </button>
        <button
          type="button"
          onClick={() => setConfirmandoExclusao(true)}
          className="p-1 text-on-surface-variant hover:text-error"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </li>
  );
}
