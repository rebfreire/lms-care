import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/design-system/organisms/PageHeader";
import CriarQuizForm from "./CriarQuizForm";
import NovaQuestaoForm from "./NovaQuestaoForm";
import EditarQuizConfigForm from "./EditarQuizConfigForm";
import QuestaoItem from "./QuestaoItem";

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
    .order("id")
    .limit(1)
    .maybeSingle();

  if (!quiz) {
    return (
      <div>
        <PageHeader title={`Quiz — ${aula.titulo}`} description="Ainda não existe quiz para essa aula." />
        <CriarQuizForm aulaId={aulaId} cursoId={cursoId} />
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

      <EditarQuizConfigForm
        quizId={quiz.id}
        cursoId={cursoId}
        aulaId={aulaId}
        nomeAtual={quiz.nome}
        notaCorteAtual={quiz.nota_corte}
        tentativasAtual={quiz.tentativas_permitidas}
      />

      <div className="space-y-4 mb-6">
        {questoes?.map((q, i) => (
          <QuestaoItem
            key={q.id}
            questaoId={q.id}
            ordem={i + 1}
            enunciado={q.enunciado}
            alternativas={q.alternativas as { id: string; texto: string; correta: boolean }[]}
            cursoId={cursoId}
            aulaId={aulaId}
          />
        ))}
        {(!questoes || questoes.length === 0) && (
          <p className="text-on-surface-variant">Nenhuma questão ainda — adicione abaixo.</p>
        )}
      </div>

      <NovaQuestaoForm quizId={quiz.id} cursoId={cursoId} aulaId={aulaId} />
    </div>
  );
}
