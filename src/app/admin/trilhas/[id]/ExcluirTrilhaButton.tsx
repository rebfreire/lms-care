"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { excluirTrilha } from "../actions";

export default function ExcluirTrilhaButton({ trilhaId, nome }: { trilhaId: string; nome: string }) {
  const [confirmando, setConfirmando] = useState(false);

  if (confirmando) {
    return (
      <div className="flex items-center gap-2 bg-error-container/30 rounded-pill pl-4 pr-2 py-1.5">
        <span className="text-xs text-on-surface">Excluir &quot;{nome}&quot;?</span>
        <form action={excluirTrilha.bind(null, trilhaId)}>
          <button
            type="submit"
            className="rounded-pill bg-error text-on-error px-3 py-1 text-xs font-semibold hover:opacity-90"
          >
            Confirmar
          </button>
        </form>
        <button
          type="button"
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
      className="inline-flex items-center gap-2 text-sm font-semibold text-error hover:underline"
    >
      <Trash2 size={16} /> Excluir trilha
    </button>
  );
}
