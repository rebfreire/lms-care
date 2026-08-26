"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAtual } from "@/lib/supabase/auth";

export async function criarTrilha(_prevState: string | null, formData: FormData) {
  const usuario = await getUsuarioAtual();
  if (!usuario || usuario.papel !== "admin") return "Sem permissão.";

  const nome = String(formData.get("nome") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();

  if (!nome) return "Nome da trilha é obrigatório.";

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trilhas")
    .insert({ empresa_id: usuario.empresaId, nome, descricao })
    .select("id")
    .single();

  if (error || !data) return `Erro ao criar trilha: ${error?.message ?? "desconhecido"}`;

  redirect(`/admin/trilhas/${data.id}`);
}

export async function adicionarCursoNaTrilha(trilhaId: string, formData: FormData) {
  const cursoId = String(formData.get("curso_id") ?? "");
  if (!cursoId) return;

  const supabase = await createClient();

  const { count } = await supabase
    .from("trilhas_cursos")
    .select("curso_id", { count: "exact", head: true })
    .eq("trilha_id", trilhaId);

  await supabase.from("trilhas_cursos").insert({
    trilha_id: trilhaId,
    curso_id: cursoId,
    ordem: (count ?? 0) + 1,
    bloqueia_proximo: true,
  });

  revalidatePath(`/admin/trilhas/${trilhaId}`);
}

export async function removerCursoDaTrilha(trilhaId: string, cursoId: string) {
  const supabase = await createClient();
  await supabase
    .from("trilhas_cursos")
    .delete()
    .eq("trilha_id", trilhaId)
    .eq("curso_id", cursoId);

  revalidatePath(`/admin/trilhas/${trilhaId}`);
}

export async function alternarBloqueio(trilhaId: string, cursoId: string, valorAtual: boolean) {
  const supabase = await createClient();
  await supabase
    .from("trilhas_cursos")
    .update({ bloqueia_proximo: !valorAtual })
    .eq("trilha_id", trilhaId)
    .eq("curso_id", cursoId);

  revalidatePath(`/admin/trilhas/${trilhaId}`);
}

export async function moverCurso(
  trilhaId: string,
  cursoId: string,
  direcao: "cima" | "baixo",
  itens: { curso_id: string; ordem: number }[],
) {
  const index = itens.findIndex((i) => i.curso_id === cursoId);
  const alvo = direcao === "cima" ? index - 1 : index + 1;
  if (index === -1 || alvo < 0 || alvo >= itens.length) return;

  const supabase = await createClient();
  const atual = itens[index];
  const vizinho = itens[alvo];

  await Promise.all([
    supabase
      .from("trilhas_cursos")
      .update({ ordem: vizinho.ordem })
      .eq("trilha_id", trilhaId)
      .eq("curso_id", atual.curso_id),
    supabase
      .from("trilhas_cursos")
      .update({ ordem: atual.ordem })
      .eq("trilha_id", trilhaId)
      .eq("curso_id", vizinho.curso_id),
  ]);

  revalidatePath(`/admin/trilhas/${trilhaId}`);
}
