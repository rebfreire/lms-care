"use server";

import { createClient } from "@/lib/supabase/server";

export async function solicitarRecuperacao(
  _prevState: string | null,
  formData: FormData,
): Promise<string> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return "Digite seu e-mail.";

  const supabase = await createClient();
  const origem = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origem}/auth/callback?next=/redefinir-senha`,
  });

  // Sempre responde ok, mesmo se o e-mail não existir — não dá pra confirmar
  // pra quem está tentando adivinhar e-mails cadastrados.
  return "ok";
}
