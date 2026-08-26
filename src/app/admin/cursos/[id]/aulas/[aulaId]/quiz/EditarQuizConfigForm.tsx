"use client";

import { useActionState, useState } from "react";
import { Settings } from "lucide-react";
import Button from "@/design-system/atoms/Button";
import FormField from "@/design-system/molecules/FormField";
import { atualizarQuizConfig } from "./actions";

interface EditarQuizConfigFormProps {
  quizId: string;
  cursoId: string;
  aulaId: string;
  nomeAtual: string;
  notaCorteAtual: number;
  tentativasAtual: number;
}

export default function EditarQuizConfigForm({
  quizId,
  cursoId,
  aulaId,
  nomeAtual,
  notaCorteAtual,
  tentativasAtual,
}: EditarQuizConfigFormProps) {
  const [aberto, setAberto] = useState(false);
  const [error, formAction, isPending] = useActionState(
    atualizarQuizConfig.bind(null, quizId, cursoId, aulaId),
    null,
  );

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant hover:text-primary mb-6"
      >
        <Settings size={16} /> Editar nota de corte e tentativas
      </button>
    );
  }

  return (
    <form action={formAction} className="bg-surface rounded-card-lg p-6 shadow-soft mb-6 space-y-4">
      <FormField id="nome" name="nome" label="Nome do quiz" defaultValue={nomeAtual} required />
      <div className="flex gap-4">
        <FormField
          id="nota_corte"
          name="nota_corte"
          type="number"
          min={0}
          max={100}
          defaultValue={notaCorteAtual}
          label="Nota de corte (%)"
          required
          className="flex-1"
        />
        <FormField
          id="tentativas_permitidas"
          name="tentativas_permitidas"
          type="number"
          min={1}
          defaultValue={tentativasAtual}
          label="Tentativas permitidas"
          required
          className="flex-1"
        />
      </div>
      {error && <p className="text-sm text-error bg-error-container/40 rounded-xl px-4 py-2">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Salvando..." : "Salvar"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setAberto(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
