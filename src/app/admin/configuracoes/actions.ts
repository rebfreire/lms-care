"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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

  const supabase = await createClient();
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

  const { error } = await supabase
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
