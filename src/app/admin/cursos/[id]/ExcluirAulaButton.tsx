"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { excluirAula } from "../actions";

export default function ExcluirAulaButton({
  aulaId,
  cursoId,
  titulo,
}: {
  aulaId: string;
  cursoId: string;
  titulo: string;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const [pendente, startTransition] = useTransition();

  if (confirmando) {
    return (
      <div className="flex flex-wrap items-center gap-2 bg-error-container/30 rounded-2xl px-4 py-2 w-full basis-full">
        <span className="text-xs text-on-surface">
          Excluir &quot;{titulo}&quot;? Vídeo, materiais, progresso e tentativas dos alunos serão apagados.
        </span>
        <button
          type="button"
          disabled={pendente}
          onClick={() => startTransition(() => excluirAula(aulaId, cursoId))}
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
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirmando(true)}
      className="text-[10px] font-bold uppercase tracking-widest text-error bg-error-container/30 px-2 py-1 rounded-pill flex items-center gap-1 flex-shrink-0 hover:opacity-80"
    >
      <Trash2 size={12} /> excluir
    </button>
  );
}
