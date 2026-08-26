import { createClient } from "@/lib/supabase/server";

export type Papel = "admin" | "aluno";

export interface UsuarioAtual {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
  empresaId: string;
}

export async function getUsuarioAtual(): Promise<UsuarioAtual | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("usuarios")
    .select("nome, email, papel, empresa_id")
    .eq("id", user.id)
    .single();

  if (!data) return null;

  return {
    id: user.id,
    nome: data.nome,
    email: data.email,
    papel: data.papel,
    empresaId: data.empresa_id,
  };
}
