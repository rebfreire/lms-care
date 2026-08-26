// Importa <VIDEOS_DIR>/<N- Nome do Curso>/*.mp4 para o Supabase + Cloudflare
// Stream: cria o curso (se não existir), um módulo único, uma aula por vídeo,
// sobe o arquivo via Direct Creator Upload e salva o uid do Cloudflare.
//
// Uso: node scripts/importar-conteudo.mjs
// Aponta por padrão para a pasta original do cliente (fora do repo) — os
// vídeos nunca ficam duplicados dentro do projeto.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function carregarEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  const conteudo = readFileSync(envPath, "utf-8");
  for (const linha of conteudo.split("\n")) {
    const match = linha.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) process.env[match[1]] ??= match[2].trim();
  }
}

carregarEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CF_ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID;
const CF_TOKEN = process.env.CLOUDFLARE_STREAM_API_TOKEN;

if (!SUPABASE_URL || !SERVICE_ROLE || !CF_ACCOUNT || !CF_TOKEN) {
  console.error("Faltam variáveis em .env.local (Supabase e/ou Cloudflare).");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
const VIDEOS_DIR =
  process.env.VIDEOS_DIR ??
  path.resolve(
    process.cwd(),
    "../Grupo-Care-Anestesia/videos",
  );
const EXTENSOES_VIDEO = [".mp4", ".mov"];

async function obterEmpresaId() {
  const { data, error } = await supabase.from("empresas").select("id").limit(1).single();
  if (error || !data) throw new Error("Nenhuma empresa encontrada — rode o seed-admin.sql primeiro.");
  return data.id;
}

async function obterOuCriarCurso(empresaId, nome) {
  const { data: existente } = await supabase
    .from("cursos")
    .select("id")
    .eq("empresa_id", empresaId)
    .ilike("nome", nome)
    .maybeSingle();
  if (existente) return existente.id;

  const { data, error } = await supabase
    .from("cursos")
    .insert({ empresa_id: empresaId, nome })
    .select("id")
    .single();
  if (error) throw error;
  console.log(`  + curso criado: ${nome}`);
  return data.id;
}

async function obterOuCriarModulo(cursoId) {
  const { data: existente } = await supabase
    .from("modulos")
    .select("id")
    .eq("curso_id", cursoId)
    .limit(1)
    .maybeSingle();
  if (existente) return existente.id;

  const { data, error } = await supabase
    .from("modulos")
    .insert({ curso_id: cursoId, nome: "Conteúdo", ordem: 1 })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function aulaJaExiste(moduloId, titulo) {
  const { data } = await supabase
    .from("aulas")
    .select("id, video_id_cloudflare")
    .eq("modulo_id", moduloId)
    .eq("titulo", titulo)
    .maybeSingle();
  return data;
}

async function criarUploadCloudflare() {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT}/stream/direct_upload`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ maxDurationSeconds: 7200, requireSignedURLs: false }),
    },
  );
  const json = await res.json();
  if (!json.success) throw new Error(JSON.stringify(json.errors));
  return json.result;
}

async function subirVideo(filePath, uploadURL) {
  const buffer = await readFile(filePath);
  const blob = new Blob([buffer]);
  const formData = new FormData();
  formData.append("file", blob, path.basename(filePath));

  const res = await fetch(uploadURL, { method: "POST", body: formData });
  if (!res.ok) throw new Error(`Upload falhou (${res.status}) para ${filePath}`);
}

async function main() {
  const empresaId = await obterEmpresaId();
  const pastas = readdirSync(VIDEOS_DIR).filter((nome) => {
    const full = path.join(VIDEOS_DIR, nome);
    return statSync(full).isDirectory();
  });

  for (const pasta of pastas.sort()) {
    const nomeCurso = pasta.replace(/^\d+-\s*/, "").trim();
    console.log(`\nCurso: ${nomeCurso}`);

    const cursoId = await obterOuCriarCurso(empresaId, nomeCurso);
    const moduloId = await obterOuCriarModulo(cursoId);

    const pastaCompleta = path.join(VIDEOS_DIR, pasta);
    const arquivos = readdirSync(pastaCompleta).filter((f) =>
      EXTENSOES_VIDEO.includes(path.extname(f).toLowerCase()),
    );

    for (const [index, arquivo] of arquivos.sort().entries()) {
      const titulo = path.basename(arquivo, path.extname(arquivo));
      const existente = await aulaJaExiste(moduloId, titulo);

      if (existente?.video_id_cloudflare) {
        console.log(`  = já enviado: ${titulo}`);
        continue;
      }

      console.log(`  ↑ enviando: ${titulo}...`);
      const { uid, uploadURL } = await criarUploadCloudflare();
      await subirVideo(path.join(pastaCompleta, arquivo), uploadURL);

      if (existente) {
        await supabase.from("aulas").update({ video_id_cloudflare: uid }).eq("id", existente.id);
      } else {
        await supabase.from("aulas").insert({
          modulo_id: moduloId,
          titulo,
          ordem: index + 1,
          video_id_cloudflare: uid,
        });
      }
      console.log(`  ✓ enviado: ${titulo} (uid ${uid})`);
    }
  }

  console.log("\nImportação concluída.");
}

main().catch((err) => {
  console.error("Erro:", err);
  process.exit(1);
});
