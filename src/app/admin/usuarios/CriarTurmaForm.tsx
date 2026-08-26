"use client";

import { useActionState } from "react";
import Button from "@/design-system/atoms/Button";
import { criarTurma } from "./actions";

export default function CriarTurmaForm() {
  const [error, formAction, isPending] = useActionState(criarTurma, null);

  return (
    <form action={formAction} className="flex gap-2">
      <input
        name="nome"
        placeholder="Nome da turma"
        required
        className="flex-1 rounded-2xl border border-outline-variant bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
      />
      <Button type="submit" size="sm" variant="secondary" disabled={isPending}>
        {isPending ? "..." : "Criar"}
      </Button>
      {error && <p className="text-xs text-error">{error}</p>}
    </form>
  );
}
