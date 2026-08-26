import { createClient } from "@/lib/supabase/server";

export interface EmpresaBranding {
  nome: string;
  logoUrl: string | null;
  corPrimaria: string | null;
}

export async function getEmpresaBranding(empresaId: string): Promise<EmpresaBranding | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("empresas")
    .select("nome, logo_url, cor_primaria")
    .eq("id", empresaId)
    .single();

  if (!data) return null;
  return { nome: data.nome, logoUrl: data.logo_url, corPrimaria: data.cor_primaria };
}
