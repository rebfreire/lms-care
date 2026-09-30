// Define uma senha padrão única pra quem nunca acessou a plataforma.
// "Nunca acessou" = sem last_sign_in_at no Auth, sem eventos_acesso e sem senha_alterada_em.
// A senha vem da variável de ambiente SENHA_PADRAO (não fica no repositório).
//
// Uso:
//   SENHA_PADRAO='...' node scripts/senha-padrao-sem-acesso.mjs            # simulação (não altera nada)
//   SENHA_PADRAO='...' node scripts/senha-padrao-sem-acesso.mjs --aplicar  # aplica de verdade

import { readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

for (const linha of readFileSync(path.resolve(process.cwd(), ".env.local"), "utf-8").split("\n")) {
  const m = linha.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] ??= m[2].trim();
}

const SENHA_PADRAO = process.env.SENHA_PADRAO;
if (!SENHA_PADRAO || SENHA_PADRAO.length < 8) {
  console.error("Defina SENHA_PADRAO com pelo menos 8 caracteres.");
  process.exit(1);
}
const aplicar = process.argv.includes("--aplicar");
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const authUsers = [];
for (let page = 1; ; page++) {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
  if (error) throw error;
  authUsers.push(...data.users);
  if (data.users.length < 200) break;
}

const [{ data: usuarios }, { data: eventos }] = await Promise.all([
  supabase.from("usuarios").select("id, nome, email, papel, senha_alterada_em"),
  supabase.from("eventos_acesso").select("usuario_id"),
]);
const comEvento = new Set((eventos ?? []).map((e) => e.usuario_id));
const authPorId = new Map(authUsers.map((u) => [u.id, u]));

const alvos = (usuarios ?? []).filter((u) => {
  const a = authPorId.get(u.id);
  return a && !a.last_sign_in_at && !comEvento.has(u.id) && !u.senha_alterada_em;
});

console.log(`${usuarios?.length} usuários no total, ${alvos.length} nunca acessaram.\n`);
let falhas = 0;
for (const u of alvos) {
  if (!aplicar) {
    console.log(`${u.email.padEnd(45)} ${u.papel}`);
    continue;
  }
  const { error } = await supabase.auth.admin.updateUserById(u.id, { password: SENHA_PADRAO });
  if (error) falhas++;
  console.log(`${error ? "ERRO" : "ok  "} ${u.email} ${error ? error.message : ""}`);
}
console.log(aplicar ? `\nConcluído, ${falhas} falha(s).` : "\nSimulação: nada foi alterado. Rode com --aplicar.");
