import { getUsuarioAtual } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import ConfiguracoesForm from "./ConfiguracoesForm";

export default async function ConfiguracoesPage() {
  const usuario = await getUsuarioAtual();
  const supabase = await createClient();

  const { data: empresa } = await supabase
    .from("empresas")
    .select("nome, logo_url, cor_primaria")
    .eq("id", usuario!.empresaId)
    .single();

  return (
    <div className="bg-surface rounded-card-lg p-8 shadow-soft max-w-md">
      <ConfiguracoesForm
        nomeAtual={empresa?.nome ?? ""}
        corAtual={empresa?.cor_primaria ?? "#4a7c59"}
        logoAtual={empresa?.logo_url ?? null}
      />
    </div>
  );
}
