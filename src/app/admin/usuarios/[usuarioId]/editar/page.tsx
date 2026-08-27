import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAtual } from "@/lib/supabase/auth";
import PageHeader from "@/design-system/organisms/PageHeader";
import EditarUsuarioForm from "./EditarUsuarioForm";

export default async function EditarUsuarioPage({
  params,
}: {
  params: Promise<{ usuarioId: string }>;
}) {
  const { usuarioId } = await params;
  const usuarioAtual = await getUsuarioAtual();
  const supabase = await createClient();

  const [{ data: alvo }, { data: turmaAtual }, { data: turmas }] = await Promise.all([
    supabase.from("usuarios").select("id, nome, email, papel").eq("id", usuarioId).single(),
    supabase.from("usuarios_turmas").select("turma_id").eq("usuario_id", usuarioId).maybeSingle(),
    supabase.from("turmas").select("id, nome").eq("empresa_id", usuarioAtual!.empresaId).order("nome"),
  ]);

  if (!alvo) notFound();

  return (
    <div>
      <PageHeader title={`Editar: ${alvo.nome}`} />
      <div className="bg-surface rounded-card-lg p-8 shadow-soft max-w-md">
        <EditarUsuarioForm
          usuarioId={alvo.id}
          nomeAtual={alvo.nome}
          emailAtual={alvo.email}
          papelAtual={alvo.papel}
          turmaIdAtual={turmaAtual?.turma_id ?? ""}
          turmas={turmas ?? []}
        />
      </div>
    </div>
  );
}
