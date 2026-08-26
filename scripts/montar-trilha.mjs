// Monta a trilha de treinamentos com os 9 cursos importados, cria uma turma
// com todos os alunos existentes e atribui a trilha a essa turma.
//
// Uso: node scripts/montar-trilha.mjs

import { readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function carregarEnvLocal() {
  const conteudo = readFileSync(path.resolve(process.cwd(), ".env.local"), "utf-8");
  for (const linha of conteudo.split("\n")) {
    const match = linha.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) process.env[match[1]] ??= match[2].trim();
  }
}
carregarEnvLocal();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// Ordem original das pastas de vídeo (o número do prefixo se perde ao virar
// nome de curso, então fixamos a ordem aqui).
const ORDEM_CURSOS = [
  "Via Aérea Dificil",
  "BIS",
  "TOF",
  "Assepsia e Higiene das Mãos",
  "Bomba de Infusão",
  "Cuidados com Cateter Central e Periférico",
  "Treinamento de Isolamento e Precaução Geral",
  "Cardioversor",
  "Intoxicação por anestésico local",
];

async function main() {
  const { data: empresa } = await supabase.from("empresas").select("id").limit(1).single();
  const empresaId = empresa.id;

  const { data: cursos } = await supabase.from("cursos").select("id, nome").eq("empresa_id", empresaId);
  const cursoPorNome = new Map(cursos.map((c) => [c.nome.normalize("NFC"), c.id]));

  const { data: trilhaExistente } = await supabase
    .from("trilhas")
    .select("id")
    .eq("empresa_id", empresaId)
    .ilike("nome", "Treinamentos Obrigatórios")
    .maybeSingle();

  let trilhaId = trilhaExistente?.id;
  if (!trilhaId) {
    const { data: novaTrilha, error } = await supabase
      .from("trilhas")
      .insert({
        empresa_id: empresaId,
        nome: "Treinamentos Obrigatórios",
        descricao: "Treinamentos de segurança e equipamentos — módulos independentes.",
      })
      .select("id")
      .single();
    if (error) throw error;
    trilhaId = novaTrilha.id;
    console.log(`Trilha criada: ${trilhaId}`);
  } else {
    console.log("Trilha já existia, reaproveitando.");
  }

  for (const [index, nomeCurso] of ORDEM_CURSOS.entries()) {
    const cursoId = cursoPorNome.get(nomeCurso.normalize("NFC"));
    if (!cursoId) {
      console.log(`  ✗ curso não encontrado: ${nomeCurso}`);
      continue;
    }

    const { data: existente } = await supabase
      .from("trilhas_cursos")
      .select("curso_id")
      .eq("trilha_id", trilhaId)
      .eq("curso_id", cursoId)
      .maybeSingle();

    if (existente) {
      console.log(`  = já na trilha: ${nomeCurso}`);
      continue;
    }

    await supabase.from("trilhas_cursos").insert({
      trilha_id: trilhaId,
      curso_id: cursoId,
      ordem: index + 1,
      bloqueia_proximo: false, // módulos independentes, sem pré-requisito entre si
    });
    console.log(`  + adicionado: ${nomeCurso}`);
  }

  const { data: turmaExistente } = await supabase
    .from("turmas")
    .select("id")
    .eq("empresa_id", empresaId)
    .ilike("nome", "Equipe Médica")
    .maybeSingle();

  let turmaId = turmaExistente?.id;
  if (!turmaId) {
    const { data: novaTurma, error } = await supabase
      .from("turmas")
      .insert({ empresa_id: empresaId, nome: "Equipe Médica" })
      .select("id")
      .single();
    if (error) throw error;
    turmaId = novaTurma.id;
    console.log(`\nTurma criada: Equipe Médica`);
  } else {
    console.log("\nTurma já existia, reaproveitando.");
  }

  const { data: alunos } = await supabase.from("usuarios").select("id").eq("papel", "aluno");
  let vinculados = 0;
  for (const aluno of alunos ?? []) {
    const { data: jaVinculado } = await supabase
      .from("usuarios_turmas")
      .select("usuario_id")
      .eq("usuario_id", aluno.id)
      .eq("turma_id", turmaId)
      .maybeSingle();
    if (jaVinculado) continue;
    await supabase.from("usuarios_turmas").insert({ usuario_id: aluno.id, turma_id: turmaId });
    vinculados++;
  }
  console.log(`${vinculados} aluno(s) vinculado(s) à turma (${(alunos ?? []).length} no total).`);

  const { data: atribuicaoExistente } = await supabase
    .from("atribuicoes_trilha")
    .select("id")
    .eq("trilha_id", trilhaId)
    .eq("turma_id", turmaId)
    .maybeSingle();

  if (!atribuicaoExistente) {
    await supabase.from("atribuicoes_trilha").insert({ trilha_id: trilhaId, turma_id: turmaId });
    console.log("Trilha atribuída à turma.");
  } else {
    console.log("Trilha já estava atribuída à turma.");
  }

  console.log("\nConcluído.");
}

main().catch((err) => {
  console.error("Erro:", err);
  process.exit(1);
});
