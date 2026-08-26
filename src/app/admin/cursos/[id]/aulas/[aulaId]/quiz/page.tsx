import { notFound } from "next/navigation";
import { CheckCircle2, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/design-system/organisms/PageHeader";
import Button from "@/design-system/atoms/Button";
import FormField from "@/design-system/molecules/FormField";
import { criarQuiz, removerQuestao } from "./actions";
import NovaQuestaoForm from "./NovaQuestaoForm";

export default async function QuizAulaPage({
  params,
}: {
  params: Promise<{ id: string; aulaId: string }>;
}) {
  const { id: cursoId, aulaId } = await params;
  const supabase = await createClient();

  const { data: aula } = await supabase
    .from("aulas")
    .select("id, titulo")
    .eq("id", aulaId)
    .single();

  if (!aula) notFound();

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id, nome, nota_corte, tentativas_permitidas")
    .eq("aula_id", aulaId)
    .maybeSingle();

  if (!quiz) {
    return (
      <div>
        <PageHeader title={`Quiz — ${aula.titulo}`} description="Ainda não existe quiz para essa aula." />
        <form
          action={criarQuiz.bind(null, aulaId, cursoId)}
          className="bg-surface rounded-card-lg p-8 shadow-soft max-w-md space-y-5"
        >
          <FormField id="nome" name="nome" label="Nome do quiz" required defaultValue="Avaliação" />
          <FormField
            id="nota_corte"
            name="nota_corte"
            type="number"
            min={0}
            max={100}
            defaultValue={70}
            label="Nota de corte (%)"
            required
          />
          <FormField
            id="tentativas_permitidas"
            name="tentativas_permitidas"
            type="number"
            min={1}
            defaultValue={3}
            label="Tentativas permitidas"
            required
          />
          <Button type="submit">Criar quiz</Button>
        </form>
      </div>
    );
  }

  const { data: questoes } = await supabase
    .from("questoes")
    .select("id, enunciado, ordem, alternativas(id, texto, correta)")
    .eq("quiz_id", quiz.id)
    .order("ordem");

  return (
    <div>
      <PageHeader
        title={quiz.nome}
        description={`${aula.titulo} — nota de corte ${quiz.nota_corte}% · ${quiz.tentativas_permitidas} tentativa(s)`}
      />

      <div className="space-y-4 mb-6">
        {questoes?.map((q, i) => (
          <div key={q.id} className="bg-surface rounded-card-lg p-6 shadow-soft">
            <div className="flex items-start justify-between gap-4 mb-3">
              <p className="text-sm font-semibold text-on-surface">
                {i + 1}. {q.enunciado}
              </p>
              <form action={removerQuestao.bind(null, q.id, cursoId, aulaId)}>
                <button type="submit" className="text-on-surface-variant hover:text-error flex-shrink-0">
                  <Trash2 size={16} />
                </button>
              </form>
            </div>
            <ul className="space-y-1">
              {(q.alternativas as { id: string; texto: string; correta: boolean }[])?.map((alt) => (
                <li
                  key={alt.id}
                  className={`text-sm px-3 py-1.5 rounded-lg flex items-center gap-2 ${
                    alt.correta
                      ? "bg-success-container text-success font-semibold"
                      : "bg-surface-container-low text-on-surface-variant"
                  }`}
                >
                  {alt.correta && <CheckCircle2 size={14} />}
                  {alt.texto}
                </li>
              ))}
            </ul>
          </div>
        ))}
        {(!questoes || questoes.length === 0) && (
          <p className="text-on-surface-variant">Nenhuma questão ainda — adicione abaixo.</p>
        )}
      </div>

      <NovaQuestaoForm quizId={quiz.id} cursoId={cursoId} aulaId={aulaId} />
    </div>
  );
}
