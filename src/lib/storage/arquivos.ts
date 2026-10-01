import { createAdminClient } from "@/lib/supabase/admin";
import type { BucketNome } from "./buckets";

// Helpers só de servidor (não são Server Actions, então não ficam expostos ao navegador).

export function urlPublicaDoArquivo(bucket: BucketNome, caminho: string) {
  return createAdminClient().storage.from(bucket).getPublicUrl(caminho).data.publicUrl;
}

// A URL pública tem o formato .../storage/v1/object/public/<bucket>/<caminho>.
export function caminhoPelaUrl(bucket: BucketNome, url: string): string | null {
  const marcador = `/object/public/${bucket}/`;
  const i = url.indexOf(marcador);
  if (i === -1) return null;
  return decodeURIComponent(url.slice(i + marcador.length));
}

export async function arquivoExiste(bucket: BucketNome, caminho: string) {
  const { data } = await createAdminClient().storage.from(bucket).exists(caminho);
  return data === true;
}

// Best-effort: o registro no banco já foi atualizado, então falha aqui só deixa lixo no bucket.
export async function apagarArquivoPorUrl(bucket: BucketNome, url: string) {
  const caminho = caminhoPelaUrl(bucket, url);
  if (caminho) await createAdminClient().storage.from(bucket).remove([caminho]);
}
