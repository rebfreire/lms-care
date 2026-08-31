"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAtual } from "@/lib/supabase/auth";

export async function criarQuiz(aulaId: string, cursoId: string, formData: FormData) {
  const usuario = await getUsuarioAtual();
  if (!usuario || usuario.papel !== "admin") return;

  const nome = String(formData.get("nome") ?? "").trim();
  const notaCorte = Number(formData.get("nota_corte") ?? 70);
  const tentativas = Number(formData.get("tentativas_permitidas") ?? 3);
  if (!nome) return;

  const supabase = await createClient();
  await supabase.from("quizzes").insert({
    aula_id: aulaId,
    nome,
    nota_corte: notaCorte,
    tentativas_permitidas: tentativas,
  });

  revalidatePath(`/admin/cursos/${cursoId}/aulas/${aulaId}/quiz`);
}

export async function atualizarQuizConfig(
  quizId: string,
  cursoId: string,
  aulaId: string,
  _prevState: string | null,
  formData: FormData,
) {
  const usuario = await getUsuarioAtual();
  if (!usuario || usuario.papel !== "admin") return "Sem permissão.";

  const nome = String(formData.get("nome") ?? "").trim();
  const notaCorte = Number(formData.get("nota_corte") ?? 70);
  const tentativas = Number(formData.get("tentativas_permitidas") ?? 3);
  if (!nome) return "Nome é obrigatório.";

  const supabase = await createClient();
  const { error } = await supabase
    .from("quizzes")
    .update({ nome, nota_corte: notaCorte, tentativas_permitidas: tentativas })
    .eq("id", quizId);

  if (error) return `Erro ao salvar: ${error.message}`;

  revalidatePath(`/admin/cursos/${cursoId}/aulas/${aulaId}/quiz`);
  return null;
}

export async function criarQuestao(
  quizId: string,
  cursoId: string,
  aulaId: string,
  formData: FormData,
) {
  const enunciado = String(formData.get("enunciado") ?? "").trim();
  const corretaIndex = Number(formData.get("correta") ?? -1);
  // Não filtra vazios aqui: o form garante todas as alternativas visíveis
  // preenchidas, e o índice de "correta" precisa bater com a posição no array.
  const alternativas = formData.getAll("alternativa").map((v) => String(v).trim());

  if (!enunciado || alternativas.length < 2 || alternativas.some((a) => !a) || corretaIndex < 0) {
    return;
  }

  const supabase = await createClient();

  const { count } = await supabase
    .from("questoes")
    .select("id", { count: "exact", head: true })
    .eq("quiz_id", quizId);

  const { data: questao, error } = await supabase
    .from("questoes")
    .insert({ quiz_id: quizId, enunciado, ordem: (count ?? 0) + 1 })
    .select("id")
    .single();

  if (error || !questao) return;

  await supabase.from("alternativas").insert(
    alternativas.map((texto, i) => ({
      questao_id: questao.id,
      texto,
      correta: i === corretaIndex,
    })),
  );

  revalidatePath(`/admin/cursos/${cursoId}/aulas/${aulaId}/quiz`);
}

export async function editarQuestao(
  questaoId: string,
  cursoId: string,
  aulaId: string,
  formData: FormData,
) {
  const usuario = await getUsuarioAtual();
  if (!usuario || usuario.papel !== "admin") return;

  const enunciado = String(formData.get("enunciado") ?? "").trim();
  const corretaIndex = Number(formData.get("correta") ?? -1);
  const alternativas = formData.getAll("alternativa").map((v) => String(v).trim());

  if (!enunciado || alternativas.length < 2 || alternativas.some((a) => !a) || corretaIndex < 0) {
    return;
  }

  const supabase = await createClient();
  await supabase.from("questoes").update({ enunciado }).eq("id", questaoId);

  // Mais simples reconstruir as alternativas do que tentar casar as
  // existentes por posição — o form já garante o índice da correta.
  await supabase.from("alternativas").delete().eq("questao_id", questaoId);
  await supabase.from("alternativas").insert(
    alternativas.map((texto, i) => ({
      questao_id: questaoId,
      texto,
      correta: i === corretaIndex,
    })),
  );

  revalidatePath(`/admin/cursos/${cursoId}/aulas/${aulaId}/quiz`);
}

export async function removerQuestao(questaoId: string, cursoId: string, aulaId: string) {
  const supabase = await createClient();
  await supabase.from("questoes").delete().eq("id", questaoId);
  revalidatePath(`/admin/cursos/${cursoId}/aulas/${aulaId}/quiz`);
}
