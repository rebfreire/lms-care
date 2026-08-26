// Importa content/alunos/*.csv (exportação Hotmart: name;email;class;...) para
// o Supabase: cria a conta de auth com senha temporária, a linha em `usuarios`
// e, se houver turma, vincula/cria a turma.
//
// Uso: node scripts/importar-alunos.mjs [caminho-do-csv]

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
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

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error("Faltam variáveis do Supabase em .env.local.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

function parseCsv(texto) {
  const linhas = texto
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (linhas.length === 0) return [];

  const separador = linhas[0].includes(";") ? ";" : ",";
  const parseLinha = (linha) =>
    linha.split(separador).map((campo) => campo.trim().replace(/^"|"$/g, ""));

  const cabecalho = parseLinha(linhas[0]).map((h) => h.toLowerCase());
  return linhas.slice(1).map((linha) => {
    const valores = parseLinha(linha);
    const registro = {};
    cabecalho.forEach((chave, i) => (registro[chave] = valores[i] ?? ""));
    return registro;
  });
}

function gerarSenhaTemporaria() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let senha = "";
  for (let i = 0; i < 10; i++) senha += chars[Math.floor(Math.random() * chars.length)];
  return senha;
}

async function obterEmpresaId() {
  const { data, error } = await supabase.from("empresas").select("id").limit(1).single();
  if (error || !data) throw new Error("Nenhuma empresa encontrada.");
  return data.id;
}

const turmaCache = new Map();
async function obterOuCriarTurma(nome, empresaId) {
  const chave = nome.toLowerCase();
  if (turmaCache.has(chave)) return turmaCache.get(chave);

  const { data: existente } = await supabase
    .from("turmas")
    .select("id")
    .eq("empresa_id", empresaId)
    .ilike("nome", nome)
    .maybeSingle();
  if (existente) {
    turmaCache.set(chave, existente.id);
    return existente.id;
  }

  const { data, error } = await supabase
    .from("turmas")
    .insert({ empresa_id: empresaId, nome })
    .select("id")
    .single();
  if (error) throw error;
  turmaCache.set(chave, data.id);
  return data.id;
}

async function main() {
  const csvPath =
    process.argv[2] ??
    path.join(
      process.cwd(),
      "content/alunos",
      readdirSync(path.join(process.cwd(), "content/alunos")).find((f) => f.endsWith(".csv")),
    );

  console.log(`Lendo: ${csvPath}`);
  const buffer = readFileSync(csvPath);
  let texto = new TextDecoder("utf-8").decode(buffer);
  if (texto.includes("�")) texto = new TextDecoder("iso-8859-1").decode(buffer);

  const linhas = parseCsv(texto);
  const empresaId = await obterEmpresaId();
  const resultados = [];

  for (const linha of linhas) {
    const email = linha.email?.trim().toLowerCase();
    const nome = (linha.nome || linha.name)?.trim();
    const turmaNome = (linha.turma || linha.class)?.trim() || null;

    if (!email || !nome) {
      resultados.push({ email: email || "", nome: nome || "", turma: turmaNome, status: "erro", detalhe: "sem nome ou email" });
      continue;
    }

    const senha = gerarSenhaTemporaria();
    const { data: novoAuth, error: erroAuth } = await supabase.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
    });

    if (erroAuth || !novoAuth.user) {
      resultados.push({ email, nome, turma: turmaNome, status: "erro", detalhe: erroAuth?.message ?? "falha ao criar" });
      console.log(`  ✗ ${email}: ${erroAuth?.message ?? "falha ao criar"}`);
      continue;
    }

    const { error: erroUsuario } = await supabase.from("usuarios").insert({
      id: novoAuth.user.id,
      empresa_id: empresaId,
      nome,
      email,
      papel: "aluno",
    });

    if (erroUsuario) {
      resultados.push({ email, nome, turma: turmaNome, status: "erro", detalhe: erroUsuario.message });
      console.log(`  ✗ ${email}: ${erroUsuario.message}`);
      continue;
    }

    if (turmaNome) {
      const turmaId = await obterOuCriarTurma(turmaNome, empresaId);
      await supabase.from("usuarios_turmas").insert({ usuario_id: novoAuth.user.id, turma_id: turmaId });
    }

    resultados.push({ email, nome, turma: turmaNome, status: "criado", detalhe: senha });
    console.log(`  ✓ ${nome} <${email}>`);
  }

  const criados = resultados.filter((r) => r.status === "criado").length;
  const erros = resultados.filter((r) => r.status === "erro").length;

  const saidaPath = path.join(process.cwd(), "content/alunos/resultado-importacao.csv");
  const linhasSaida = [
    "nome;email;turma;status;senha_ou_erro",
    ...resultados.map((r) => `${r.nome};${r.email};${r.turma ?? ""};${r.status};${r.detalhe}`),
  ];
  writeFileSync(saidaPath, linhasSaida.join("\n"), "utf-8");

  console.log(`\n${criados} criados, ${erros} com erro.`);
  console.log(`Senhas temporárias salvas em: ${saidaPath}`);
}

main().catch((err) => {
  console.error("Erro:", err);
  process.exit(1);
});
