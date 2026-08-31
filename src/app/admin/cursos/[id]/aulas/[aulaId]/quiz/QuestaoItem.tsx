"use client";

import { useState } from "react";
import { CheckCircle2, Pencil, Trash2, Plus, X } from "lucide-react";
import Button from "@/design-system/atoms/Button";
import { editarQuestao, removerQuestao } from "./actions";

interface Alternativa {
  id: string;
  texto: string;
  correta: boolean;
}

interface QuestaoItemProps {
  questaoId: string;
  ordem: number;
  enunciado: string;
  alternativas: Alternativa[];
  cursoId: string;
  aulaId: string;
}

export default function QuestaoItem({
  questaoId,
  ordem,
  enunciado,
  alternativas,
  cursoId,
  aulaId,
}: QuestaoItemProps) {
  const [editando, setEditando] = useState(false);
  const [valores, setValores] = useState(alternativas.map((a) => a.texto));
  const [correta, setCorreta] = useState(alternativas.findIndex((a) => a.correta));

  const acaoEditar = editarQuestao.bind(null, questaoId, cursoId, aulaId);

  function adicionarAlternativa() {
    setValores((prev) => [...prev, ""]);
  }

  function removerAlternativa(index: number) {
    setValores((prev) => prev.filter((_, i) => i !== index));
    setCorreta((atual) => (atual === index ? 0 : atual > index ? atual - 1 : atual));
  }

  if (!editando) {
    return (
      <div className="bg-surface rounded-card-lg p-6 shadow-soft">
        <div className="flex items-start justify-between gap-4 mb-3">
          <p className="text-sm font-semibold text-on-surface">
            {ordem}. {enunciado}
          </p>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={() => setEditando(true)}
              className="text-on-surface-variant hover:text-primary"
            >
              <Pencil size={16} />
            </button>
            <form action={removerQuestao.bind(null, questaoId, cursoId, aulaId)}>
              <button type="submit" className="text-on-surface-variant hover:text-error">
                <Trash2 size={16} />
              </button>
            </form>
          </div>
        </div>
        <ul className="space-y-1">
          {alternativas.map((alt) => (
            <li
              key={alt.id}
              className={`text-sm px-3 py-1.5 rounded-lg flex items-center gap-2 ${
                alt.correta
                  ? "bg-success-container text-success font-semibold"
                  : "bg-surface-container-low text-on-surface-variant"
              }`}
            >
              {alt.correta && <CheckCircle2 size={14} />}
              {alt.texto}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <form
      action={acaoEditar}
      onSubmit={() => setTimeout(() => setEditando(false), 0)}
      className="bg-surface rounded-card-lg p-6 shadow-soft space-y-4"
    >
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
          Enunciado
        </label>
        <textarea
          name="enunciado"
          rows={2}
          defaultValue={enunciado}
          required
          className="w-full rounded-2xl border border-outline-variant bg-surface px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
          Alternativas (marque a correta)
        </label>
        {valores.map((valor, i) => (
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
                setValores((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))
              }
              placeholder={`Alternativa ${i + 1}`}
              required
              className="flex-1 rounded-2xl border border-outline-variant bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            />
            {valores.length > 2 && (
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

      <div className="flex gap-2">
        <Button type="submit" variant="primary" size="sm">
          Salvar questão
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setEditando(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
