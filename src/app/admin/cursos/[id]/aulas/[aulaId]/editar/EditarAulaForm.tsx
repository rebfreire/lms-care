"use client";

import { useActionState } from "react";
import Button from "@/design-system/atoms/Button";
import FormField from "@/design-system/molecules/FormField";
import RichTextEditor from "@/design-system/molecules/RichTextEditor";
import { editarAula } from "../../../../actions";

interface EditarAulaFormProps {
  cursoId: string;
  aulaId: string;
  tituloAtual: string;
  textoApoioAtual: string;
}

export default function EditarAulaForm({ cursoId, aulaId, tituloAtual, textoApoioAtual }: EditarAulaFormProps) {
  const [error, formAction, isPending] = useActionState(editarAula.bind(null, cursoId, aulaId), null);

  return (
    <form action={formAction} className="space-y-5">
      <FormField id="titulo" name="titulo" label="Título da aula" defaultValue={tituloAtual} required autoFocus />

      <RichTextEditor name="texto_apoio" label="Texto de apoio" defaultValue={textoApoioAtual} />

      {error && (
        <p className="text-sm text-error bg-error-container/40 rounded-xl px-4 py-2">{error}</p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
