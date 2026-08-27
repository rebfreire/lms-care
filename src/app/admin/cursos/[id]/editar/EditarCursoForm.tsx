"use client";

import { useActionState } from "react";
import Link from "next/link";
import Button from "@/design-system/atoms/Button";
import FormField from "@/design-system/molecules/FormField";
import { editarCurso } from "../../actions";

interface EditarCursoFormProps {
  cursoId: string;
  nomeAtual: string;
  descricaoAtual: string;
}

export default function EditarCursoForm({ cursoId, nomeAtual, descricaoAtual }: EditarCursoFormProps) {
  const [error, formAction, isPending] = useActionState(editarCurso.bind(null, cursoId), null);

  return (
    <form action={formAction} className="space-y-5">
      <FormField id="nome" name="nome" label="Nome do curso" defaultValue={nomeAtual} required autoFocus />

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
          defaultValue={descricaoAtual}
          className="w-full rounded-2xl border border-outline-variant bg-surface px-4 py-3 text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
        />
      </div>

      {error && (
        <p className="text-sm text-error bg-error-container/40 rounded-xl px-4 py-2">{error}</p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvando..." : "Salvar"}
        </Button>
        <Link href={`/admin/cursos/${cursoId}`}>
          <Button type="button" variant="ghost">
            Cancelar
          </Button>
        </Link>
      </div>
    </form>
  );
}
