"use client";

import { useActionState } from "react";
import Button from "@/design-system/atoms/Button";
import FormField from "@/design-system/molecules/FormField";
import { login } from "./actions";

export default function LoginForm() {
  const [error, formAction, isPending] = useActionState(login, null);

  return (
    <form action={formAction} className="space-y-5">
      <FormField id="email" name="email" type="email" label="E-mail" required autoFocus />
      <FormField id="senha" name="senha" type="password" label="Senha" required />

      {error && (
        <p className="text-sm text-error bg-error-container/40 rounded-xl px-4 py-2">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
