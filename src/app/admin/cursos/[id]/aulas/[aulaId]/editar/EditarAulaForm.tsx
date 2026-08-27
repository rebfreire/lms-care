"use client";

import { useActionState } from "react";
import Link from "next/link";
import Button from "@/design-system/atoms/Button";
import FormField from "@/design-system/molecules/FormField";
import RichTextEditor from "@/design-system/molecules/RichTextEditor";
import { editarAula } from "../../../../actions";

interface EditarAulaFormProps {
  cursoId: string;
  aulaId: string;
  tituloAtual: string;
  textoApoioAtual: string;
  liberacaoAtual: string;
  turmaIdAtual: string;
  turmas: { id: string; nome: string }[];
}

export default function EditarAulaForm({
  cursoId,
  aulaId,
  tituloAtual,
  textoApoioAtual,
  liberacaoAtual,
  turmaIdAtual,
  turmas,
}: EditarAulaFormProps) {
  const [error, formAction, isPending] = useActionState(editarAula.bind(null, cursoId, aulaId), null);

  return (
    <form action={formAction} className="space-y-5">
      <FormField id="titulo" name="titulo" label="Título da aula" defaultValue={tituloAtual} required autoFocus />

      <RichTextEditor name="texto_apoio" label="Texto de apoio" defaultValue={textoApoioAtual} />

      <div className="border-t border-outline-variant pt-5">
        <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">
          Liberação agendada (opcional)
        </p>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label
              htmlFor="liberacao_agendada_em"
              className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2"
            >
              Data/hora de liberação
            </label>
            <input
              id="liberacao_agendada_em"
              name="liberacao_agendada_em"
              type="datetime-local"
              defaultValue={liberacaoAtual}
              className="w-full rounded-2xl border border-outline-variant bg-surface px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label
              htmlFor="turma_id"
              className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2"
            >
              Só pra essa turma
            </label>
            <select
              id="turma_id"
              name="turma_id"
              defaultValue={turmaIdAtual}
              className="w-full rounded-2xl border border-outline-variant bg-surface px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            >
              <option value="">Todas as turmas</option>
              {turmas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-xs text-on-surface-variant mt-2">
          Deixe a data em branco pra liberar imediatamente. Se escolher uma turma, só ela fica
          esperando a data — as outras veem a aula desde já.
        </p>
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
