"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(_prevState: string | null, formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const senha = String(formData.get("senha") ?? "");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });

  if (error || !data.user) {
    return "E-mail ou senha inválidos.";
  }

  const { data: usuario, error: usuarioError } = await supabase
    .from("usuarios")
    .select("papel")
    .eq("id", data.user.id)
    .single();

  if (usuarioError || !usuario) {
    return `Login ok, mas sem registro em "usuarios": ${usuarioError?.message ?? "não encontrado"}`;
  }

  await supabase.from("eventos_acesso").insert({ usuario_id: data.user.id });

  redirect(usuario.papel === "admin" ? "/admin" : "/aluno");
}
