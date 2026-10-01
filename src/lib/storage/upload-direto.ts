"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getUsuarioAtual } from "@/lib/supabase/auth";
import { BUCKETS, type BucketNome } from "./buckets";

function nomeSeguro(nome: string) {
  const limpo = nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return limpo.slice(-100) || "arquivo";
}

// Passo 1 do upload direto: só gera uma URL assinada de envio. O arquivo em si vai do
// navegador pro Storage (não passa pelo servidor, então não esbarra nos limites de corpo
// do Server Action/Vercel). Quem usa deve confirmar depois, numa action própria, que
// grava o caminho no banco — sem isso o arquivo fica órfão no bucket.
export async function iniciarUploadDireto(
  bucket: BucketNome,
  pasta: string,
  nomeOriginal: string,
): Promise<{ caminho: string; signedUrl: string } | { erro: string }> {
  const usuario = await getUsuarioAtual();
  if (!usuario || usuario.papel !== "admin") return { erro: "Sem permissão." };
  if (!(bucket in BUCKETS)) return { erro: "Destino de upload inválido." };
  if (!/^[\w-]+$/.test(pasta)) return { erro: "Pasta inválida." };

  const caminho = `${pasta}/${Date.now()}-${nomeSeguro(nomeOriginal)}`;
  const { data, error } = await createAdminClient().storage.from(bucket).createSignedUploadUrl(caminho);
  if (error || !data) return { erro: `Não foi possível preparar o envio: ${error?.message ?? "erro desconhecido"}` };

  return { caminho, signedUrl: data.signedUrl };
}
