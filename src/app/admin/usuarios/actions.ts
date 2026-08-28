"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUsuarioAtual } from "@/lib/supabase/auth";
import { parseCsv, gerarSenhaTemporaria } from "@/lib/csv";

export interface ResultadoCriacao {
  status: "criado";
  emailConvite: string;
}

export interface LinhaImportacao {
  email: string;
  nome: string;
  turma: string | null;
  status: "criado" | "erro";
  senhaTemporaria?: string;
  erro?: string;
}

export async function criarTurma(_prevState: string | null, formData: FormData) {
  const usuario = await getUsuarioAtual();
  if (!usuario || usuario.papel !== "admin") return "Sem permissão.";

  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) return "Nome da turma é obrigatório.";

  const supabase = await createClient();
  const { error } = await supabase
    .from("turmas")
    .insert({ empresa_id: usuario.empresaId, nome });

  if (error) return `Erro ao criar turma: ${error.message}`;

  revalidatePath("/admin/usuarios");
  return null;
}

async function obterOuCriarTurma(
  nome: string,
  empresaId: string,
  cache: Map<string, string>,
): Promise<string> {
  const chave = nome.toLowerCase();
  if (cache.has(chave)) return cache.get(chave)!;

  const supabase = await createClient();
  const { data: existente } = await supabase
    .from("turmas")
    .select("id")
    .eq("empresa_id", empresaId)
    .ilike("nome", nome)
    .maybeSingle();

  if (existente) {
    cache.set(chave, existente.id);
    return existente.id;
  }

  const { data: nova, error } = await supabase
    .from("turmas")
    .insert({ empresa_id: empresaId, nome })
    .select("id")
    .single();

  if (error || !nova) throw new Error(`Falha ao criar turma "${nome}": ${error?.message}`);

  cache.set(chave, nova.id);
  return nova.id;
}

export async function importarUsuariosCsv(
  _prevState: LinhaImportacao[] | null,
  formData: FormData,
): Promise<LinhaImportacao[]> {
  const usuario = await getUsuarioAtual();
  if (!usuario || usuario.papel !== "admin") return [];

  const csvTexto = String(formData.get("csv") ?? "");
  const linhas = parseCsv(csvTexto);

  const supabase = await createClient();
  const admin = createAdminClient();
  const turmaCache = new Map<string, string>();
  const resultados: LinhaImportacao[] = [];

  for (const linha of linhas) {
    const email = linha.email?.trim();
    const nome = (linha.nome || linha.name)?.trim();
    const turmaNome = (linha.turma || linha.class)?.trim() || null;

    if (!email || !nome) {
      resultados.push({
        email: email || "(sem e-mail)",
        nome: nome || "(sem nome)",
        turma: turmaNome,
        status: "erro",
        erro: "Linha sem nome ou e-mail.",
      });
      continue;
    }

    const senhaTemporaria = gerarSenhaTemporaria();

    const { data: novoAuth, error: erroAuth } = await admin.auth.admin.createUser({
      email,
      password: senhaTemporaria,
      email_confirm: true,
    });

    if (erroAuth || !novoAuth.user) {
      resultados.push({
        email,
        nome,
        turma: turmaNome,
        status: "erro",
        erro: erroAuth?.message ?? "Falha ao criar usuário.",
      });
      continue;
    }

    const { error: erroUsuario } = await supabase.from("usuarios").insert({
      id: novoAuth.user.id,
      empresa_id: usuario.empresaId,
      nome,
      email,
      papel: "aluno",
    });

    if (erroUsuario) {
      resultados.push({ email, nome, turma: turmaNome, status: "erro", erro: erroUsuario.message });
      continue;
    }

    if (turmaNome) {
      try {
        const turmaId = await obterOuCriarTurma(turmaNome, usuario.empresaId, turmaCache);
        await supabase.from("usuarios_turmas").insert({
          usuario_id: novoAuth.user.id,
          turma_id: turmaId,
        });
      } catch (e) {
        resultados.push({
          email,
          nome,
          turma: turmaNome,
          status: "erro",
          erro: e instanceof Error ? e.message : "Falha ao vincular turma.",
        });
        continue;
      }
    }

    resultados.push({ email, nome, turma: turmaNome, status: "criado", senhaTemporaria });
  }

  revalidatePath("/admin/usuarios");
  return resultados;
}

export async function atribuirTrilhaATurma(formData: FormData) {
  const trilhaId = String(formData.get("trilha_id") ?? "");
  const turmaId = String(formData.get("turma_id") ?? "");
  if (!trilhaId || !turmaId) return;

  const supabase = await createClient();
  await supabase
    .from("atribuicoes_trilha")
    .upsert({ trilha_id: trilhaId, turma_id: turmaId }, { onConflict: "trilha_id,turma_id" });

  revalidatePath("/admin/usuarios");
}

export async function atribuirTrilhaAUsuario(formData: FormData) {
  const trilhaId = String(formData.get("trilha_id") ?? "");
  const usuarioId = String(formData.get("usuario_id") ?? "");
  if (!trilhaId || !usuarioId) return;

  const supabase = await createClient();
  await supabase
    .from("atribuicoes_trilha")
    .upsert({ trilha_id: trilhaId, usuario_id: usuarioId }, { onConflict: "trilha_id,usuario_id" });

  revalidatePath("/admin/usuarios");
}

export async function removerAtribuicao(atribuicaoId: string) {
  const supabase = await createClient();
  await supabase.from("atribuicoes_trilha").delete().eq("id", atribuicaoId);
  revalidatePath("/admin/usuarios");
}

export async function criarUsuarioManual(
  _prevState: string | ResultadoCriacao | null,
  formData: FormData,
): Promise<string | ResultadoCriacao> {
  const usuario = await getUsuarioAtual();
  if (!usuario || usuario.papel !== "admin") return "Sem permissão.";

  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const papel = String(formData.get("papel") ?? "aluno") === "admin" ? "admin" : "aluno";
  const turmaId = String(formData.get("turma_id") ?? "").trim();

  if (!nome || !email) return "Nome e e-mail são obrigatórios.";

  const admin = createAdminClient();
  // Senha aleatória e descartada — o aluno nunca chega a saber dela, define
  // a própria senha pelo link de e-mail enviado logo abaixo.
  const senhaInicial = gerarSenhaTemporaria();

  const { data: novoAuth, error: erroAuth } = await admin.auth.admin.createUser({
    email,
    password: senhaInicial,
    email_confirm: true,
  });

  if (erroAuth || !novoAuth.user) {
    return erroAuth?.message ?? "Falha ao criar usuário.";
  }

  const supabase = await createClient();
  const { error: erroUsuario } = await supabase.from("usuarios").insert({
    id: novoAuth.user.id,
    empresa_id: usuario.empresaId,
    nome,
    email,
    papel,
  });

  if (erroUsuario) {
    await admin.auth.admin.deleteUser(novoAuth.user.id);
    return `Erro ao criar usuário: ${erroUsuario.message}`;
  }

  if (turmaId) {
    await supabase.from("usuarios_turmas").insert({ usuario_id: novoAuth.user.id, turma_id: turmaId });
  }

  const origem = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origem}/auth/callback?next=/redefinir-senha`,
  });

  revalidatePath("/admin/usuarios");
  return { status: "criado", emailConvite: email };
}

export async function editarUsuario(
  usuarioId: string,
  _prevState: string | null,
  formData: FormData,
) {
  const usuarioAtual = await getUsuarioAtual();
  if (!usuarioAtual || usuarioAtual.papel !== "admin") return "Sem permissão.";

  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const papel = String(formData.get("papel") ?? "aluno") === "admin" ? "admin" : "aluno";
  const turmaId = String(formData.get("turma_id") ?? "").trim();

  if (!nome || !email) return "Nome e e-mail são obrigatórios.";

  const admin = createAdminClient();
  const { error: erroAuth } = await admin.auth.admin.updateUserById(usuarioId, { email });
  if (erroAuth) return `Erro ao atualizar e-mail: ${erroAuth.message}`;

  const supabase = await createClient();
  const { error } = await supabase
    .from("usuarios")
    .update({ nome, email, papel })
    .eq("id", usuarioId);

  if (error) return `Erro ao salvar: ${error.message}`;

  await supabase.from("usuarios_turmas").delete().eq("usuario_id", usuarioId);
  if (turmaId) {
    await supabase.from("usuarios_turmas").insert({ usuario_id: usuarioId, turma_id: turmaId });
  }

  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios");
}

export async function resetarSenha(
  usuarioId: string,
  _prevState: string | null,
): Promise<string> {
  const usuarioAtual = await getUsuarioAtual();
  if (!usuarioAtual || usuarioAtual.papel !== "admin") return "Sem permissão.";

  const novaSenha = gerarSenhaTemporaria();
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(usuarioId, { password: novaSenha });

  if (error) return `Erro: ${error.message}`;

  return novaSenha;
}

export async function removerUsuario(usuarioId: string) {
  const usuarioAtual = await getUsuarioAtual();
  if (!usuarioAtual || usuarioAtual.papel !== "admin") return;

  const admin = createAdminClient();
  await admin.auth.admin.deleteUser(usuarioId);

  const supabase = await createClient();
  await supabase.from("usuarios").delete().eq("id", usuarioId);

  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios");
}
