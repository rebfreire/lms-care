"use client";

import { Trash2 } from "lucide-react";
import { excluirTrilha } from "../actions";

export default function ExcluirTrilhaButton({ trilhaId, nome }: { trilhaId: string; nome: string }) {
  return (
    <form
      action={excluirTrilha.bind(null, trilhaId)}
      onSubmit={(e) => {
        if (!window.confirm(`Excluir a trilha "${nome}"? Isso remove as atribuições dela pros alunos. Essa ação não pode ser desfeita.`)) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="inline-flex items-center gap-2 text-sm font-semibold text-error hover:underline"
      >
        <Trash2 size={16} /> Excluir trilha
      </button>
    </form>
  );
}
