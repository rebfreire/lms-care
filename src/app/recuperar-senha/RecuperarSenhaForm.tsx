"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import Button from "@/design-system/atoms/Button";
import FormField from "@/design-system/molecules/FormField";
import { solicitarRecuperacao } from "./actions";

export default function RecuperarSenhaForm() {
  const [resultado, formAction, isPending] = useActionState(solicitarRecuperacao, null);

  if (resultado === "ok") {
    return (
      <div className="bg-success-container text-success rounded-card-lg p-6 flex items-start gap-3">
        <CheckCircle2 size={20} className="flex-shrink-0 mt-0.5" />
        <p className="text-sm">
          Se esse e-mail estiver cadastrado, você vai receber um link pra criar uma senha nova.
          Confira também a caixa de spam.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <FormField id="email" name="email" type="email" label="E-mail" required autoFocus />

      {resultado && resultado !== "ok" && (
        <p className="text-sm text-error bg-error-container/40 rounded-xl px-4 py-2">{resultado}</p>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Enviando..." : "Enviar link de recuperação"}
      </Button>
    </form>
  );
}
