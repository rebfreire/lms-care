import { notFound, redirect } from "next/navigation";
import PageHeader from "@/design-system/organisms/PageHeader";
import { getUsuarioAtual } from "@/lib/supabase/auth";
import { getAulaComContexto } from "@/lib/trilha";
import { createClient } from "@/lib/supabase/server";
import QuizForm from "./QuizForm";

export default async function QuizAlunoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: aulaId } = await params;
  const usuario = await getUsuarioAtual();
  if (!usuario) redirect("/login");

  const contexto = await getAulaComContexto(usuario.id, aulaId);
  if (!contexto) notFound();
  if (contexto.curso.bloqueado || !contexto.aula.disponivel) redirect("/aluno");

  const supabase = await createClient();

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id, nome, nota_corte, tentativas_permitidas")
    .eq("aula_id", aulaId)
    .maybeSingle();

  if (!quiz) notFound();

  const { count: tentativasFeitas } = await supabase
    .from("tentativas_quiz")
    .select("id", { count: "exact", head: true })
    .eq("quiz_id", quiz.id)
    .eq("usuario_id", usuario.id);

  const { data: questoesRaw } = await supabase
    .from("questoes")
    .select("id, enunciado, ordem, alternativas(id, texto)")
    .eq("quiz_id", quiz.id)
    .order("ordem");

  const questoes = (questoesRaw ?? []).map((q) => ({
    id: q.id,
    enunciado: q.enunciado,
    alternativas: q.alternativas as { id: string; texto: string }[],
  }));

  const semTentativas = (tentativasFeitas ?? 0) >= quiz.tentativas_permitidas;

  return (
    <div>
      <PageHeader
        title={quiz.nome}
        description={`${contexto.aula.titulo} — nota de corte ${quiz.nota_corte}%`}
      />

      {semTentativas ? (
        <div className="bg-surface rounded-card-lg p-10 shadow-soft text-center text-on-surface-variant">
          Você já usou todas as {quiz.tentativas_permitidas} tentativa(s) permitidas.
        </div>
      ) : (
        <QuizForm quizId={quiz.id} notaCorte={quiz.nota_corte} questoes={questoes} aulaId={aulaId} />
      )}
    </div>
  );
}
