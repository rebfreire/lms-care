"use client";

import { useActionState } from "react";
import Button from "@/design-system/atoms/Button";
import FormField from "@/design-system/molecules/FormField";
import { definirNovaSenha } from "./actions";

export default function RedefinirSenhaForm() {
  const [error, formAction, isPending] = useActionState(definirNovaSenha, null);

  return (
    <form action={formAction} className="space-y-5">
      <FormField id="senha" name="senha" type="password" label="Nova senha" required autoFocus minLength={8} />
      <FormField id="confirmacao" name="confirmacao" type="password" label="Confirme a senha" required minLength={8} />

      {error && (
        <p className="text-sm text-error bg-error-container/40 rounded-xl px-4 py-2">{error}</p>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Salvando..." : "Salvar nova senha"}
      </Button>
    </form>
  );
}
