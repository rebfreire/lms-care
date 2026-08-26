"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUsuarioAtual } from "@/lib/supabase/auth";
import { createDirectUpload } from "@/lib/cloudflare/stream";

export async function criarCurso(_prevState: string | null, formData: FormData) {
  const usuario = await getUsuarioAtual();
  if (!usuario || usuario.papel !== "admin") return "Sem permissão.";

  const nome = String(formData.get("nome") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();

  if (!nome) return "Nome do curso é obrigatório.";

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cursos")
    .insert({ empresa_id: usuario.empresaId, nome, descricao })
    .select("id")
    .single();

  if (error || !data) return `Erro ao criar curso: ${error?.message ?? "desconhecido"}`;

  redirect(`/admin/cursos/${data.id}`);
}

export async function editarCurso(cursoId: string, _prevState: string | null, formData: FormData) {
  const usuario = await getUsuarioAtual();
  if (!usuario || usuario.papel !== "admin") return "Sem permissão.";

  const nome = String(formData.get("nome") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();
  if (!nome) return "Nome do curso é obrigatório.";

  const supabase = await createClient();
  const { error } = await supabase
    .from("cursos")
    .update({ nome, descricao })
    .eq("id", cursoId);

  if (error) return `Erro ao salvar: ${error.message}`;

  revalidatePath(`/admin/cursos/${cursoId}`);
  redirect(`/admin/cursos/${cursoId}`);
}

export async function editarAula(
  cursoId: string,
  aulaId: string,
  _prevState: string | null,
  formData: FormData,
) {
  const usuario = await getUsuarioAtual();
  if (!usuario || usuario.papel !== "admin") return "Sem permissão.";

  const titulo = String(formData.get("titulo") ?? "").trim();
  const textoApoio = String(formData.get("texto_apoio") ?? "").trim();
  const liberacaoData = String(formData.get("liberacao_agendada_em") ?? "").trim();
  const turmaId = String(formData.get("turma_id") ?? "").trim();
  if (!titulo) return "Título é obrigatório.";

  const supabase = await createClient();
  const { error } = await supabase
    .from("aulas")
    .update({
      titulo,
      texto_apoio: textoApoio || null,
      liberacao_agendada_em: liberacaoData ? new Date(liberacaoData).toISOString() : null,
      turma_id: turmaId || null,
    })
    .eq("id", aulaId);

  if (error) return `Erro ao salvar: ${error.message}`;

  revalidatePath(`/admin/cursos/${cursoId}`);
  redirect(`/admin/cursos/${cursoId}`);
}

export async function criarModulo(cursoId: string, formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) return;

  const supabase = await createClient();

  const { count } = await supabase
    .from("modulos")
    .select("id", { count: "exact", head: true })
    .eq("curso_id", cursoId);

  await supabase.from("modulos").insert({
    curso_id: cursoId,
    nome,
    ordem: (count ?? 0) + 1,
  });

  revalidatePath(`/admin/cursos/${cursoId}`);
}

export async function iniciarUploadVideo(aulaId: string, cursoId: string) {
  const usuario = await getUsuarioAtual();
  if (!usuario || usuario.papel !== "admin") throw new Error("Sem permissão.");

  const { uid, uploadURL } = await createDirectUpload();

  const supabase = await createClient();
  const { error } = await supabase
    .from("aulas")
    .update({ video_id_cloudflare: uid })
    .eq("id", aulaId);

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/cursos/${cursoId}`);
  return uploadURL;
}

export async function criarAula(cursoId: string, moduloId: string, formData: FormData) {
  const titulo = String(formData.get("titulo") ?? "").trim();
  const textoApoio = String(formData.get("texto_apoio") ?? "").trim();
  if (!titulo) return;

  const supabase = await createClient();

  const { count } = await supabase
    .from("aulas")
    .select("id", { count: "exact", head: true })
    .eq("modulo_id", moduloId);

  await supabase.from("aulas").insert({
    modulo_id: moduloId,
    titulo,
    texto_apoio: textoApoio || null,
    ordem: (count ?? 0) + 1,
  });

  revalidatePath(`/admin/cursos/${cursoId}`);
}

export async function adicionarMaterialArquivo(
  aulaId: string,
  cursoId: string,
  formData: FormData,
) {
  const usuario = await getUsuarioAtual();
  if (!usuario || usuario.papel !== "admin") return;

  const arquivo = formData.get("arquivo") as File | null;
  if (!arquivo || arquivo.size === 0) return;

  const admin = createAdminClient();
  const caminho = `${aulaId}/${Date.now()}-${arquivo.name}`;

  const { error: erroUpload } = await admin.storage
    .from("materiais")
    .upload(caminho, arquivo, { contentType: arquivo.type });

  if (erroUpload) return;

  const url = admin.storage.from("materiais").getPublicUrl(caminho).data.publicUrl;

  const supabase = await createClient();
  await supabase.from("aula_materiais").insert({
    aula_id: aulaId,
    tipo: "arquivo",
    nome: arquivo.name,
    url,
  });

  revalidatePath(`/admin/cursos/${cursoId}/aulas/${aulaId}/editar`);
}

export async function adicionarMaterialLink(aulaId: string, cursoId: string, formData: FormData) {
  const usuario = await getUsuarioAtual();
  if (!usuario || usuario.papel !== "admin") return;

  const nome = String(formData.get("nome") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  if (!nome || !url) return;

  const supabase = await createClient();
  await supabase.from("aula_materiais").insert({
    aula_id: aulaId,
    tipo: "link",
    nome,
    url,
  });

  revalidatePath(`/admin/cursos/${cursoId}/aulas/${aulaId}/editar`);
}

export async function removerMaterial(materialId: string, cursoId: string, aulaId: string) {
  const supabase = await createClient();
  await supabase.from("aula_materiais").delete().eq("id", materialId);
  revalidatePath(`/admin/cursos/${cursoId}/aulas/${aulaId}/editar`);
}
