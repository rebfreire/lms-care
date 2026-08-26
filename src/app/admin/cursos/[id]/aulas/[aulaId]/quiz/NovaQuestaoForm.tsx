"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import Button from "@/design-system/atoms/Button";
import { criarQuestao } from "./actions";

interface NovaQuestaoFormProps {
  quizId: string;
  cursoId: string;
  aulaId: string;
}

export default function NovaQuestaoForm({ quizId, cursoId, aulaId }: NovaQuestaoFormProps) {
  const [alternativas, setAlternativas] = useState(["", ""]);
  const [correta, setCorreta] = useState(0);
  const acao = criarQuestao.bind(null, quizId, cursoId, aulaId);

  function adicionarAlternativa() {
    setAlternativas((prev) => [...prev, ""]);
  }

  function removerAlternativa(index: number) {
    setAlternativas((prev) => prev.filter((_, i) => i !== index));
    setCorreta((atual) => (atual === index ? 0 : atual > index ? atual - 1 : atual));
  }

  return (
    <form
      action={acao}
      onSubmit={() => setTimeout(() => setAlternativas(["", ""]), 0)}
      className="bg-surface-container-low rounded-card-lg p-6 space-y-4"
    >
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
        {alternativas.map((valor, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="radio"
              name="correta"
              value={i}
              checked={correta === i}
              onChange={() => setCorreta(i)}
              className="accent-primary flex-shrink-0"
            />
            <input
              name="alternativa"
              value={valor}
              onChange={(e) =>
                setAlternativas((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))
              }
              placeholder={`Alternativa ${i + 1}`}
              required
              className="flex-1 rounded-2xl border border-outline-variant bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            />
            {alternativas.length > 2 && (
              <button
                type="button"
                onClick={() => removerAlternativa(i)}
                className="text-on-surface-variant hover:text-error flex-shrink-0"
              >
                <X size={16} />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={adicionarAlternativa}
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          <Plus size={14} /> Adicionar alternativa
        </button>
      </div>

      <Button type="submit" variant="primary" size="sm">
        Adicionar questão
      </Button>
    </form>
  );
}
