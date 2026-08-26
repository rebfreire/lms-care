"use client";

import { useActionState } from "react";
import Button from "@/design-system/atoms/Button";
import FormField from "@/design-system/molecules/FormField";
import { criarTrilha } from "../actions";

export default function NovaTrilhaForm() {
  const [error, formAction, isPending] = useActionState(criarTrilha, null);

  return (
    <form action={formAction} className="space-y-5">
      <FormField id="nome" name="nome" label="Nome da trilha" required autoFocus />

      <div>
        <label
          htmlFor="descricao"
          className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2"
        >
          Descrição
        </label>
        <textarea
          id="descricao"
          name="descricao"
          rows={4}
          className="w-full rounded-2xl border border-outline-variant bg-surface px-4 py-3 text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
        />
      </div>

      {error && (
        <p className="text-sm text-error bg-error-container/40 rounded-xl px-4 py-2">
          {error}
        </p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Criando..." : "Criar trilha"}
      </Button>
    </form>
  );
}
