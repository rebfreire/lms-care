"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
