"use client";

import { useActionState } from "react";
import Button from "@/design-system/atoms/Button";
import FormField from "@/design-system/molecules/FormField";
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

      <div>
        <label
          htmlFor="texto_apoio"
          className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2"
        >
          Texto de apoio
        </label>
        <textarea
          id="texto_apoio"
          name="texto_apoio"
          rows={6}
          defaultValue={textoApoioAtual}
          placeholder="Descrição, contexto ou instruções que aparecem junto do vídeo pro aluno."
          className="w-full rounded-2xl border border-outline-variant bg-surface px-4 py-3 text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
        />
      </div>

      {error && (
        <p className="text-sm text-error bg-error-container/40 rounded-xl px-4 py-2">{error}</p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
