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

export async function criarQuestao(
  quizId: string,
  cursoId: string,
  aulaId: string,
  formData: FormData,
) {
  const enunciado = String(formData.get("enunciado") ?? "").trim();
  const corretaIndex = Number(formData.get("correta") ?? -1);
  const alternativas = [0, 1, 2, 3]
    .map((i) => String(formData.get(`alternativa_${i}`) ?? "").trim())
    .filter((texto) => texto.length > 0);

  if (!enunciado || alternativas.length < 2 || corretaIndex < 0) return;

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

export async function removerQuestao(questaoId: string, cursoId: string, aulaId: string) {
  const supabase = await createClient();
  await supabase.from("questoes").delete().eq("id", questaoId);
  revalidatePath(`/admin/cursos/${cursoId}/aulas/${aulaId}/quiz`);
}
