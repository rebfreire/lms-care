import { createClient } from "@/lib/supabase/server";
import { getUsuarioAtual } from "@/lib/supabase/auth";
import PageHeader from "@/design-system/organisms/PageHeader";
import NovoUsuarioForm from "./NovoUsuarioForm";

export default async function NovoUsuarioPage() {
  const usuario = await getUsuarioAtual();
  const supabase = await createClient();

  const { data: turmas } = await supabase
    .from("turmas")
    .select("id, nome")
    .eq("empresa_id", usuario!.empresaId)
    .order("nome");

  return (
    <div>
      <PageHeader title="Novo usuário" description="Cadastro manual — cria a conta com senha temporária." />
      <div className="bg-surface rounded-card-lg p-8 shadow-soft max-w-md">
        <NovoUsuarioForm turmas={turmas ?? []} />
      </div>
    </div>
  );
}
