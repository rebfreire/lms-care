"use client";

import { useActionState } from "react";
import Button from "@/design-system/atoms/Button";
import FormField from "@/design-system/molecules/FormField";
import { criarQuiz, type CriarQuizState } from "./actions";

interface CriarQuizFormProps {
  aulaId: string;
  cursoId: string;
}

const estadoInicial: CriarQuizState = { error: null, valores: null };

export default function CriarQuizForm({ aulaId, cursoId }: CriarQuizFormProps) {
  const [state, formAction, isPending] = useActionState(
    criarQuiz.bind(null, aulaId, cursoId),
    estadoInicial,
  );

  // A key força o remount dos campos não controlados com os valores digitados,
  // já que o React 19 reseta o form ao fim da action.
  const v = state.valores;
  const chave = v ? `${v.nome}|${v.nota_corte}|${v.tentativas_permitidas}|${state.error}` : "inicial";

  return (
    <form
      key={chave}
      action={formAction}
      className="bg-surface rounded-card-lg p-8 shadow-soft max-w-md space-y-5"
    >
      <FormField id="nome" name="nome" label="Nome do quiz" required defaultValue={v?.nome ?? "Avaliação"} />
      <FormField
        id="nota_corte"
        name="nota_corte"
        type="number"
        min={0}
        max={100}
        defaultValue={v?.nota_corte ?? 70}
        label="Nota de corte (%)"
        required
      />
      <FormField
        id="tentativas_permitidas"
        name="tentativas_permitidas"
        type="number"
        min={1}
        defaultValue={v?.tentativas_permitidas ?? 3}
        label="Tentativas permitidas"
        required
      />
      {state.error && (
        <p className="text-sm text-error bg-error-container/40 rounded-xl px-4 py-2">{state.error}</p>
      )}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Criando..." : "Criar quiz"}
      </Button>
    </form>
  );
}
