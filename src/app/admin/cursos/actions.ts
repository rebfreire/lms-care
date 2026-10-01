"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apagarArquivoPorUrl, arquivoExiste, urlPublicaDoArquivo } from "@/lib/storage/arquivos";
import { getUsuarioAtual } from "@/lib/supabase/auth";
import { createDirectUpload, deleteVideo } from "@/lib/cloudflare/stream";

// Não redireciona: o formulário sobe as capas (upload direto) com o id devolvido
// e só então navega pro curso.
export async function criarCurso(
  nome: string,
  descricao: string,
): Promise<{ id: string } | { erro: string }> {
  const usuario = await getUsuarioAtual();
  if (!usuario || usuario.papel !== "admin") return { erro: "Sem permissão." };

  nome = nome.trim();
  descricao = descricao.trim();
  if (!nome) return { erro: "Nome do curso é obrigatório." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cursos")
    .insert({ empresa_id: usuario.empresaId, nome, descricao })
    .select("id")
    .single();

  if (error || !data) return { erro: `Erro ao criar curso: ${error?.message ?? "desconhecido"}` };

  revalidatePath("/admin/cursos");
  return { id: data.id };
}

type TipoCapa = "horizontal" | "vertical";
const COLUNA_CAPA = { horizontal: "capa_url", vertical: "capa_vertical_url" } as const;

// Confirmação do upload direto: o arquivo já está no bucket `capas`; aqui só aponta
// a coluna pra ele e apaga o arquivo anterior (senão fica órfão no bucket).
export async function definirCapaCurso(
  cursoId: string,
  tipo: TipoCapa,
  caminho: string,
): Promise<{ url: string } | { erro: string }> {
  const usuario = await getUsuarioAtual();
  if (!usuario || usuario.papel !== "admin") return { erro: "Sem permissão." };
  if (!caminho.startsWith(`${cursoId}/`)) return { erro: "Caminho de capa inválido." };

  const coluna = COLUNA_CAPA[tipo];
  const supabase = await createClient();
  const { data: curso } = await supabase.from("cursos").select(coluna).eq("id", cursoId).single();
  if (!curso) {
    await apagarArquivoPorUrl("capas", urlPublicaDoArquivo("capas", caminho));
    return { erro: "Curso não encontrado." };
  }
  const anterior = (curso as Record<string, string | null>)[coluna];

  const url = urlPublicaDoArquivo("capas", caminho);
  const { error } = await supabase.from("cursos").update({ [coluna]: url }).eq("id", cursoId);
  if (error) {
    await apagarArquivoPorUrl("capas", url);
    return { erro: `Erro ao salvar capa: ${error.message}` };
  }

  if (anterior && anterior !== url) await apagarArquivoPorUrl("capas", anterior);

  revalidarCurso(cursoId);
  return { url };
}

export async function removerCapaCurso(
  cursoId: string,
  tipo: TipoCapa,
): Promise<{ ok: true } | { erro: string }> {
  const usuario = await getUsuarioAtual();
  if (!usuario || usuario.papel !== "admin") return { erro: "Sem permissão." };

  const coluna = COLUNA_CAPA[tipo];
  const supabase = await createClient();
  const { data: curso } = await supabase.from("cursos").select(coluna).eq("id", cursoId).single();
  if (!curso) return { erro: "Curso não encontrado." };
  const anterior = (curso as Record<string, string | null>)[coluna];

  const { error } = await supabase.from("cursos").update({ [coluna]: null }).eq("id", cursoId);
  if (error) return { erro: `Erro ao remover capa: ${error.message}` };

  if (anterior) await apagarArquivoPorUrl("capas", anterior);

  revalidarCurso(cursoId);
  return { ok: true };
}

function revalidarCurso(cursoId: string) {
  revalidatePath("/admin/cursos");
  revalidatePath(`/admin/cursos/${cursoId}`);
  revalidatePath(`/admin/cursos/${cursoId}/editar`);
  revalidatePath("/aluno");
  revalidatePath(`/aluno/cursos/${cursoId}`);
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

  // max+1 (não count+1): depois de excluir, count deixaria a ordem duplicada.
  const { data: ultimo } = await supabase
    .from("modulos")
    .select("ordem")
    .eq("curso_id", cursoId)
    .order("ordem", { ascending: false })
    .limit(1)
    .maybeSingle();

  await supabase.from("modulos").insert({
    curso_id: cursoId,
    nome,
    ordem: (ultimo?.ordem ?? 0) + 1,
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

  const { data: ultima } = await supabase
    .from("aulas")
    .select("ordem")
    .eq("modulo_id", moduloId)
    .order("ordem", { ascending: false })
    .limit(1)
    .maybeSingle();

  await supabase.from("aulas").insert({
    modulo_id: moduloId,
    titulo,
    texto_apoio: textoApoio || null,
    ordem: (ultima?.ordem ?? 0) + 1,
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

export async function renomearModulo(
  moduloId: string,
  cursoId: string,
  _prevState: string | null,
  formData: FormData,
) {
  const usuario = await getUsuarioAtual();
  if (!usuario || usuario.papel !== "admin") return "Sem permissão.";

  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) return "Nome é obrigatório.";

  const supabase = await createClient();
  const { error } = await supabase.from("modulos").update({ nome }).eq("id", moduloId);
  if (error) return `Erro ao salvar: ${error.message}`;

  revalidatePath(`/admin/cursos/${cursoId}`);
  return null;
}

// O cascade do banco apaga aulas, materiais, progresso e tentativas, mas não o vídeo
// no Cloudflare nem os arquivos do bucket — então listamos antes e limpamos depois
// do delete (se o delete falhar, nada foi perdido).
async function limparRecursosDasAulas(aulaIds: string[]) {
  if (aulaIds.length === 0) return null;
  const supabase = await createClient();

  const [{ data: aulas }, { data: materiais }] = await Promise.all([
    supabase.from("aulas").select("video_id_cloudflare").in("id", aulaIds),
    supabase.from("aula_materiais").select("url").in("aula_id", aulaIds).eq("tipo", "arquivo"),
  ]);

  return {
    videos: (aulas ?? []).map((a) => a.video_id_cloudflare).filter((v): v is string => !!v),
    arquivos: (materiais ?? []).map((m) => m.url),
  };
}

async function apagarRecursos(recursos: { videos: string[]; arquivos: string[] } | null) {
  if (!recursos) return;
  await Promise.allSettled([
    ...recursos.videos.map((uid) => deleteVideo(uid)),
    ...recursos.arquivos.map((url) => apagarArquivoMaterial(url)),
  ]);
}

export async function excluirAula(aulaId: string, cursoId: string) {
  const usuario = await getUsuarioAtual();
  if (!usuario || usuario.papel !== "admin") return;

  const recursos = await limparRecursosDasAulas([aulaId]);

  const supabase = await createClient();
  const { data, error } = await supabase.from("aulas").delete().eq("id", aulaId).select("id");
  if (error || !data?.length) return;

  await apagarRecursos(recursos);

  revalidatePath(`/admin/cursos/${cursoId}`);
}

export async function excluirModulo(moduloId: string, cursoId: string) {
  const usuario = await getUsuarioAtual();
  if (!usuario || usuario.papel !== "admin") return;

  const supabase = await createClient();
  const { data: aulas } = await supabase.from("aulas").select("id").eq("modulo_id", moduloId);
  const recursos = await limparRecursosDasAulas((aulas ?? []).map((a) => a.id));

  const { data, error } = await supabase.from("modulos").delete().eq("id", moduloId).select("id");
  if (error || !data?.length) return;

  await apagarRecursos(recursos);

  revalidatePath(`/admin/cursos/${cursoId}`);
}
