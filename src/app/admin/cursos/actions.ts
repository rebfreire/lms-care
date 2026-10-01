"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apagarArquivoPorUrl, arquivoExiste, urlPublicaDoArquivo } from "@/lib/storage/arquivos";
import { getUsuarioAtual } from "@/lib/supabase/auth";
import { createDirectUpload, deleteVideo } from "@/lib/cloudflare/stream";

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
  const certificadoAtivo = formData.get("certificado_ativo") === "on";
  const assinanteNome = String(formData.get("assinante_nome") ?? "").trim();
  const assinanteRegistro = String(formData.get("assinante_registro") ?? "").trim();
  const assinanteCargo = String(formData.get("assinante_cargo") ?? "").trim();
  if (!nome) return "Nome do curso é obrigatório.";

  const capaHorizontal = formData.get("capa_horizontal") as File | null;
  const capaVertical = formData.get("capa_vertical") as File | null;
  const assinaturaArquivo = formData.get("assinatura") as File | null;

  // Storage tem RLS própria — usa admin pra essa escrita, mesma checagem de
  // papel === admin acima já garante quem chega aqui.
  const admin = createAdminClient();
  const atualizacao: Record<string, string | boolean | null> = {
    nome,
    descricao,
    certificado_ativo: certificadoAtivo,
    certificado_assinante_nome: assinanteNome || null,
    certificado_assinante_registro: assinanteRegistro || null,
    certificado_assinante_cargo: assinanteCargo || null,
  };

  if (capaHorizontal && capaHorizontal.size > 0) {
    const caminho = `${cursoId}/horizontal-${Date.now()}.${capaHorizontal.name.split(".").pop()}`;
    const { error: erroUpload } = await admin.storage
      .from("capas")
      .upload(caminho, capaHorizontal, { upsert: true, contentType: capaHorizontal.type });
    if (erroUpload) return `Erro ao enviar capa horizontal: ${erroUpload.message}`;
    atualizacao.capa_url = admin.storage.from("capas").getPublicUrl(caminho).data.publicUrl;
  }

  if (capaVertical && capaVertical.size > 0) {
    const caminho = `${cursoId}/vertical-${Date.now()}.${capaVertical.name.split(".").pop()}`;
    const { error: erroUpload } = await admin.storage
      .from("capas")
      .upload(caminho, capaVertical, { upsert: true, contentType: capaVertical.type });
    if (erroUpload) return `Erro ao enviar capa vertical: ${erroUpload.message}`;
    atualizacao.capa_vertical_url = admin.storage.from("capas").getPublicUrl(caminho).data.publicUrl;
  }

  if (assinaturaArquivo && assinaturaArquivo.size > 0) {
    const caminho = `${cursoId}.${assinaturaArquivo.name.split(".").pop()}`;
    const { error: erroUpload } = await admin.storage
      .from("assinaturas")
      .upload(caminho, assinaturaArquivo, { upsert: true, contentType: assinaturaArquivo.type });
    if (erroUpload) return `Erro ao enviar assinatura: ${erroUpload.message}`;
    atualizacao.certificado_assinatura_url = admin.storage.from("assinaturas").getPublicUrl(caminho).data.publicUrl;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("cursos")
    .update(atualizacao)
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

// Só cria a URL de upload no Cloudflare — a aula só passa a apontar pro vídeo novo
// em confirmarUploadVideo, depois que o navegador terminou de enviar. Assim um upload
// que falha no meio (ou é cancelado) não deixa a aula sem o vídeo antigo.
export async function iniciarUploadVideo() {
  const usuario = await getUsuarioAtual();
  if (!usuario || usuario.papel !== "admin") throw new Error("Sem permissão.");

  return createDirectUpload();
}

export async function confirmarUploadVideo(aulaId: string, cursoId: string, uid: string) {
  const usuario = await getUsuarioAtual();
  if (!usuario || usuario.papel !== "admin") throw new Error("Sem permissão.");

  const supabase = await createClient();
  const { data: aula } = await supabase
    .from("aulas")
    .select("video_id_cloudflare")
    .eq("id", aulaId)
    .single();

  const { error } = await supabase
    .from("aulas")
    .update({ video_id_cloudflare: uid })
    .eq("id", aulaId);

  if (error) throw new Error(error.message);

  const anterior = aula?.video_id_cloudflare;
  if (anterior && anterior !== uid) await deleteVideo(anterior);

  revalidatePath(`/admin/cursos/${cursoId}`);
  revalidatePath(`/admin/cursos/${cursoId}/aulas/${aulaId}/editar`);
}

export async function removerVideo(aulaId: string, cursoId: string) {
  const usuario = await getUsuarioAtual();
  if (!usuario || usuario.papel !== "admin") return;

  const supabase = await createClient();
  const { data: aula } = await supabase
    .from("aulas")
    .select("video_id_cloudflare")
    .eq("id", aulaId)
    .single();

  const { error } = await supabase
    .from("aulas")
    .update({ video_id_cloudflare: null })
    .eq("id", aulaId);

  if (error) return;

  if (aula?.video_id_cloudflare) await deleteVideo(aula.video_id_cloudflare);

  revalidatePath(`/admin/cursos/${cursoId}`);
  revalidatePath(`/admin/cursos/${cursoId}/aulas/${aulaId}/editar`);
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

// O arquivo já foi enviado direto pro Storage pelo navegador (ver lib/storage/upload-direto);
// aqui só confirmamos que ele existe e registramos no banco.
export async function confirmarMaterialArquivo(
  aulaId: string,
  cursoId: string,
  caminho: string,
  nome: string,
): Promise<string | null> {
  const usuario = await getUsuarioAtual();
  if (!usuario || usuario.papel !== "admin") return "Sem permissão.";

  const erroCaminho = await validarCaminhoMaterial(aulaId, caminho);
  if (erroCaminho) return erroCaminho;

  const { error } = await (await createClient()).from("aula_materiais").insert({
    aula_id: aulaId,
    tipo: "arquivo",
    nome: nome.trim() || "Arquivo",
    url: urlPublicaDoArquivo("materiais", caminho),
  });
  if (error) return `Erro ao salvar o material: ${error.message}`;

  revalidatePath(`/admin/cursos/${cursoId}/aulas/${aulaId}/editar`);
  return null;
}

async function validarCaminhoMaterial(aulaId: string, caminho: string) {
  if (!caminho.startsWith(`${aulaId}/`) || caminho.includes("..")) return "Arquivo inválido.";
  if (!(await arquivoExiste("materiais", caminho))) return "O arquivo não chegou ao armazenamento. Tente enviar de novo.";
  return null;
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

export async function editarMaterial(
  materialId: string,
  cursoId: string,
  aulaId: string,
  _prevState: string | null,
  formData: FormData,
) {
  const usuario = await getUsuarioAtual();
  if (!usuario || usuario.papel !== "admin") return "Sem permissão.";

  const supabase = await createClient();
  const { data: material } = await supabase
    .from("aula_materiais")
    .select("tipo, url")
    .eq("id", materialId)
    .single();
  if (!material) return "Material não encontrado.";

  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) return "Nome é obrigatório.";

  const atualizacao: { nome: string; url?: string } = { nome };

  if (material.tipo === "link") {
    const url = String(formData.get("url") ?? "").trim();
    if (!url) return "URL é obrigatória.";
    atualizacao.url = url;
  } else {
    // Arquivo novo (opcional): o navegador já enviou direto pro Storage e manda só o caminho.
    const caminhoNovo = String(formData.get("caminho_novo") ?? "").trim();
    if (caminhoNovo) {
      const erroCaminho = await validarCaminhoMaterial(aulaId, caminhoNovo);
      if (erroCaminho) return erroCaminho;
      atualizacao.url = urlPublicaDoArquivo("materiais", caminhoNovo);
    }
  }

  const { error } = await supabase.from("aula_materiais").update(atualizacao).eq("id", materialId);
  if (error) return `Erro ao salvar: ${error.message}`;

  if (material.tipo === "arquivo" && atualizacao.url) await apagarArquivoPorUrl("materiais", material.url);

  revalidatePath(`/admin/cursos/${cursoId}/aulas/${aulaId}/editar`);
  return null;
}

export async function removerMaterial(materialId: string, cursoId: string, aulaId: string) {
  const usuario = await getUsuarioAtual();
  if (!usuario || usuario.papel !== "admin") return;

  const supabase = await createClient();
  const { data: material } = await supabase
    .from("aula_materiais")
    .select("tipo, url")
    .eq("id", materialId)
    .single();

  const { error } = await supabase.from("aula_materiais").delete().eq("id", materialId);
  if (error) return;

  if (material?.tipo === "arquivo") await apagarArquivoPorUrl("materiais", material.url);

  revalidatePath(`/admin/cursos/${cursoId}/aulas/${aulaId}/editar`);
}
