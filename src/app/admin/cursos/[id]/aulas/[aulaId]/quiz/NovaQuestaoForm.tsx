"use client";

import { useState } from "react";
import Button from "@/design-system/atoms/Button";
import { criarQuestao } from "./actions";

interface NovaQuestaoFormProps {
  quizId: string;
  cursoId: string;
  aulaId: string;
}

export default function NovaQuestaoForm({ quizId, cursoId, aulaId }: NovaQuestaoFormProps) {
  const [correta, setCorreta] = useState(0);
  const acao = criarQuestao.bind(null, quizId, cursoId, aulaId);

  return (
    <form action={acao} className="bg-surface-container-low rounded-card-lg p-6 space-y-4">
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
          Enunciado
        </label>
        <textarea
          name="enunciado"
          rows={2}
          required
          className="w-full rounded-2xl border border-outline-variant bg-surface px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
          Alternativas (marque a correta)
        </label>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="radio"
              name="correta"
              value={i}
              checked={correta === i}
              onChange={() => setCorreta(i)}
              className="accent-primary"
            />
            <input
              name={`alternativa_${i}`}
              placeholder={`Alternativa ${i + 1}${i < 2 ? " (obrigatória)" : " (opcional)"}`}
              required={i < 2}
              className="flex-1 rounded-2xl border border-outline-variant bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            />
          </div>
        ))}
      </div>

      <Button type="submit" variant="primary" size="sm">
        Adicionar questão
      </Button>
    </form>
  );
}
