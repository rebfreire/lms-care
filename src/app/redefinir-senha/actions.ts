"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAtual } from "@/lib/supabase/auth";

export async function definirNovaSenha(_prevState: string | null, formData: FormData) {
  const senha = String(formData.get("senha") ?? "");
  const confirmacao = String(formData.get("confirmacao") ?? "");

  if (senha.length < 8) return "A senha precisa ter pelo menos 8 caracteres.";
  if (senha !== confirmacao) return "As senhas não coincidem.";

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: senha });
  if (error) return `Não foi possível trocar a senha: ${error.message}`;

  const usuario = await getUsuarioAtual();
  redirect(usuario?.papel === "admin" ? "/admin" : "/aluno");
}
