import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

// Pré-login (tela de login não tem sessão, então RLS bloqueia a leitura
// normal). Nome/logo não são sensíveis, então usa o client admin só pra
// isso. Enquanto for 1 empresa só, pega a primeira; multi-tenant futuro
// vai precisar resolver por subdomínio/slug antes de chamar isso.
export async function getEmpresaBrandingPublica(): Promise<EmpresaBranding | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("empresas")
    .select("nome, logo_url, cor_primaria")
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return { nome: data.nome, logoUrl: data.logo_url, corPrimaria: data.cor_primaria };
}
