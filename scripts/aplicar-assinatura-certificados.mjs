import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("=")).map((l) => {
    const i = l.indexOf("=");
    return [l.slice(0, i), l.slice(i + 1)];
  }),
);
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const caminhoAssinatura =
  "/Users/ricardofreire/Library/CloudStorage/GoogleDrive-rieller@gmail.com/My Drive/Clientes/Grupo-Care-Anestesia/Area de Cursos/assinatura-gabriel-oliveira.png";

const NOME = "Dr. Gabriel José Redondano Oliveira";
const REGISTRO = "RQE: 30533";
const CARGO = "Diretor Presidente GCA";

const { data: cursos } = await supabase.from("cursos").select("id, nome");

const bytes = fs.readFileSync(caminhoAssinatura);
const caminhoStorage = "assinante-padrao-gabriel-oliveira.png";

const { error: erroUpload } = await supabase.storage
  .from("assinaturas")
  .upload(caminhoStorage, bytes, { upsert: true, contentType: "image/png" });
if (erroUpload) {
  console.log("erro upload:", erroUpload.message);
  process.exit(1);
}

const assinaturaUrl = supabase.storage.from("assinaturas").getPublicUrl(caminhoStorage).data.publicUrl;
console.log("assinatura enviada:", assinaturaUrl);

for (const curso of cursos) {
  const { error } = await supabase
    .from("cursos")
    .update({
      certificado_assinante_nome: NOME,
      certificado_assinante_registro: REGISTRO,
      certificado_assinante_cargo: CARGO,
      certificado_assinatura_url: assinaturaUrl,
    })
    .eq("id", curso.id);
  console.log(curso.nome, error ? `erro: ${error.message}` : "ok");
}
