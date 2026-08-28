import { getUsuarioAtual } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import CertificadoGlobalForm from "./CertificadoGlobalForm";

export default async function CertificadoConfigPage() {
  const usuario = await getUsuarioAtual();
  const supabase = await createClient();

  const { data: empresa } = await supabase
    .from("empresas")
    .select("certificado_ativo, certificado_titulo, certificado_texto")
    .eq("id", usuario!.empresaId)
    .single();

  return (
    <div className="bg-surface rounded-card-lg p-8 shadow-soft max-w-2xl">
      <CertificadoGlobalForm
        ativoAtual={empresa?.certificado_ativo ?? true}
        tituloAtual={empresa?.certificado_titulo ?? ""}
        textoAtual={empresa?.certificado_texto ?? ""}
      />
    </div>
  );
}
