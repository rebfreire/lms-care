"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUsuarioAtual } from "@/lib/supabase/auth";

export async function atualizarConfiguracoes(_prevState: string | null, formData: FormData) {
  const usuario = await getUsuarioAtual();
  if (!usuario || usuario.papel !== "admin") return "Sem permissão.";

  const nome = String(formData.get("nome") ?? "").trim();
  const corPrimaria = String(formData.get("cor_primaria") ?? "").trim();
  const logo = formData.get("logo") as File | null;

  if (!nome) return "Nome é obrigatório.";
  if (corPrimaria && !/^#[0-9a-fA-F]{6}$/.test(corPrimaria)) {
    return "Cor inválida.";
  }

  // empresas só tem policy de SELECT via RLS — update precisa do client admin
  // (a checagem de papel === admin acima já garante que só admin chega aqui).
  const admin = createAdminClient();

  let logoUrl: string | undefined;
  if (logo && logo.size > 0) {
    const caminho = `${usuario.empresaId}/logo-${Date.now()}.${logo.name.split(".").pop()}`;
    const { error: erroUpload } = await admin.storage
      .from("logos")
      .upload(caminho, logo, { upsert: true, contentType: logo.type });

    if (erroUpload) return `Erro ao enviar logo: ${erroUpload.message}`;

    logoUrl = admin.storage.from("logos").getPublicUrl(caminho).data.publicUrl;
  }

  const { error } = await admin
    .from("empresas")
    .update({
      nome,
      cor_primaria: corPrimaria || null,
      ...(logoUrl ? { logo_url: logoUrl } : {}),
    })
    .eq("id", usuario.empresaId);

  if (error) return `Erro ao salvar: ${error.message}`;

  revalidatePath("/", "layout");
  return null;
}

export async function atualizarCertificadoGlobal(_prevState: string | null, formData: FormData) {
  const usuario = await getUsuarioAtual();
  if (!usuario || usuario.papel !== "admin") return "Sem permissão.";

  const certificadoAtivo = formData.get("certificado_ativo") === "on";
  const titulo = String(formData.get("titulo") ?? "").trim();
  const texto = String(formData.get("texto") ?? "").trim();

  const admin = createAdminClient();
  const { error } = await admin
    .from("empresas")
    .update({
      certificado_ativo: certificadoAtivo,
      certificado_titulo: titulo || null,
      certificado_texto: texto || null,
    })
    .eq("id", usuario.empresaId);

  if (error) return `Erro ao salvar: ${error.message}`;

  revalidatePath("/admin/configuracoes/certificado");
  return null;
}
