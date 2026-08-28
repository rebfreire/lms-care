import { notFound } from "next/navigation";
import { ArrowUp, ArrowDown, Lock, LockOpen, X } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/design-system/organisms/PageHeader";
import Button from "@/design-system/atoms/Button";
import {
  adicionarCursoNaTrilha,
  removerCursoDaTrilha,
  alternarBloqueio,
  moverCurso,
} from "../actions";

export default async function TrilhaDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: trilha } = await supabase
    .from("trilhas")
    .select("id, nome, descricao")
    .eq("id", id)
    .single();

  if (!trilha) notFound();

  const { data: trilhaCursos } = await supabase
    .from("trilhas_cursos")
    .select("ordem, bloqueia_proximo, curso_id, cursos(id, nome)")
    .eq("trilha_id", id)
    .order("ordem");

  const itens = (trilhaCursos ?? []).map((tc) => ({ curso_id: tc.curso_id, ordem: tc.ordem }));
  const idsNaTrilha = itens.map((i) => i.curso_id);

  const { data: cursosDisponiveis } = await supabase
    .from("cursos")
    .select("id, nome")
    .order("nome");

  const opcoes = (cursosDisponiveis ?? []).filter((c) => !idsNaTrilha.includes(c.id));

  return (
    <div>
      <PageHeader title={trilha.nome} description={trilha.descricao ?? undefined} />

      <div className="bg-surface rounded-card-lg p-6 shadow-soft space-y-3 mb-6">
        {trilhaCursos?.length === 0 && (
          <p className="text-on-surface-variant text-sm">
            Nenhum curso nessa trilha ainda — adicione abaixo.
          </p>
        )}

        {trilhaCursos?.map((tc, index) => (
          <div
            key={tc.curso_id}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-surface-container-low"
          >
            <span className="text-xs font-bold text-outline w-5">{index + 1}.</span>
            <span className="text-sm text-on-surface flex-1">
              {(tc.cursos as unknown as { nome: string })?.nome}
            </span>

            <form action={moverCurso.bind(null, id, tc.curso_id, "cima", itens)}>
              <button
                type="submit"
                disabled={index === 0}
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high disabled:opacity-30"
              >
                <ArrowUp size={14} />
              </button>
            </form>
            <form action={moverCurso.bind(null, id, tc.curso_id, "baixo", itens)}>
              <button
                type="submit"
                disabled={index === (trilhaCursos?.length ?? 0) - 1}
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high disabled:opacity-30"
              >
                <ArrowDown size={14} />
              </button>
            </form>

            <form action={alternarBloqueio.bind(null, id, tc.curso_id, tc.bloqueia_proximo)}>
              <button
                type="submit"
                title={tc.bloqueia_proximo ? "Bloqueia o próximo até concluir" : "Livre, sem bloqueio"}
                className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1.5 rounded-pill flex items-center gap-1 ${
                  tc.bloqueia_proximo
                    ? "bg-primary-container text-on-primary-container"
                    : "bg-surface-container-high text-on-surface-variant"
                }`}
              >
                {tc.bloqueia_proximo ? <Lock size={12} /> : <LockOpen size={12} />}
                {tc.bloqueia_proximo ? "bloqueia" : "livre"}
              </button>
            </form>

            <form action={removerCursoDaTrilha.bind(null, id, tc.curso_id)}>
              <button
                type="submit"
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-error-container/40 hover:text-error"
              >
                <X size={14} />
              </button>
            </form>
          </div>
        ))}
      </div>

      {opcoes.length > 0 && (
        <form
          action={adicionarCursoNaTrilha.bind(null, id)}
          className="bg-surface-container-low rounded-card-lg p-6 flex flex-wrap gap-2 items-center"
        >
          <select
            name="curso_id"
            required
            className="flex-1 min-w-[200px] rounded-2xl border border-outline-variant bg-surface px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
          >
            <option value="">Selecione um curso...</option>
            {opcoes.map((curso) => (
              <option key={curso.id} value={curso.id}>
                {curso.nome}
              </option>
            ))}
          </select>
          <Button type="submit" variant="primary" size="sm">
            Adicionar à trilha
          </Button>
        </form>
      )}
    </div>
  );
}
